"""
RAG Service - Semantic Search and Document Indexing
"""

import logging
import asyncio
import hashlib
import json
from typing import List, Dict, Any, Optional, Tuple
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.ai.service import get_gemini_client
from app.core.db import db as prisma_client
from app.core.redis import redis_client
from app.core.jobs import enqueue_job, register_job_handler

logger = logging.getLogger(__name__)

_VECTOR_DOCUMENT_COLUMNS: Optional[set[str]] = None
RAG_CACHE_TTL_SECONDS = 5 * 60
RAG_CACHE_PREFIX = "rag:ctx:"
_LOCAL_RAG_CACHE: dict[str, tuple[str, list[dict[str, Any]]]] = {}

class RagService:
    """Handles Vector Embeddings, Chunking, and Retrieval for Horus AI."""
    
    def __init__(self):
        self.ai_client = get_gemini_client()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            is_separator_regex=False,
        )

    async def _get_vector_document_columns(self) -> set[str]:
        global _VECTOR_DOCUMENT_COLUMNS
        if _VECTOR_DOCUMENT_COLUMNS is not None:
            return _VECTOR_DOCUMENT_COLUMNS

        rows = await prisma_client.query_raw(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'VectorDocument'
            """
        )
        _VECTOR_DOCUMENT_COLUMNS = {
            str((row.get("column_name") or "")).strip()
            for row in (rows or [])
            if row.get("column_name")
        }
        return _VECTOR_DOCUMENT_COLUMNS

    async def index_document(
        self,
        content: str,
        document_id: Optional[str] = None,
        standard_id: Optional[str] = None,
        user_id: Optional[str] = None,
        institution_id: Optional[str] = None,
    ):
        """Splits a document into chunks, embeds them, and saves to PostgreSQL."""
        if not content.strip():
            logger.warning(f"RAG: Empty content provided for indexing (doc_id={document_id})")
            return

        chunks = self.text_splitter.split_text(content)
        logger.info(f"RAG: Split document into {len(chunks)} chunks for embedding.")
        columns = await self._get_vector_document_columns()

        async def embed_chunk(i: int, chunk: str):
            try:
                embedding = await self.ai_client.create_embedding(chunk)
                if not embedding:
                    logger.warning(f"RAG: Empty embedding returned for document {document_id}, chunk {i}. Skipping chunk.")
                    return None
                return i, chunk, "[" + ",".join(map(str, embedding)) + "]"
            except Exception as e:
                logger.error(f"RAG: Failed to index chunk {i} for document {document_id}: {str(e)}")
                return None

        semaphore = asyncio.Semaphore(6)

        async def bounded_embed(i: int, chunk: str):
            async with semaphore:
                return await embed_chunk(i, chunk)

        embedded = await asyncio.gather(*(bounded_embed(i, chunk) for i, chunk in enumerate(chunks)))
        rows = [row for row in embedded if row is not None]
        if not rows:
            return

        for i, chunk, embedding_str in rows:
            insert_columns = ['"id"', '"content"', '"embedding"', '"documentId"', '"standardId"', '"chunkIndex"', '"updatedAt"']
            insert_values = ["gen_random_uuid()", "$1", "$2::vector", "$3", "$4", "$5", "NOW()"]
            params: List[Any] = [chunk, embedding_str, document_id, standard_id, i]
            param_idx = 6

            if "userId" in columns:
                insert_columns.append('"userId"')
                insert_values.append(f"${param_idx}")
                params.append(user_id)
                param_idx += 1
            if "institutionId" in columns:
                insert_columns.append('"institutionId"')
                insert_values.append(f"${param_idx}")
                params.append(institution_id)

            query = f"""
            INSERT INTO "VectorDocument" ({", ".join(insert_columns)})
            VALUES ({", ".join(insert_values)})
            """
            await prisma_client.execute_raw(query, *params)


    async def delete_document(self, document_id: str):
        """Remove all chunks for a document from the vector store."""
        try:
            await prisma_client.execute_raw(
                'DELETE FROM "VectorDocument" WHERE "documentId" = $1',
                document_id
            )
            logger.info(f"RAG: Deleted all chunks for document {document_id}")
        except Exception as e:
            logger.error(f"RAG: Failed to delete document {document_id}: {e}")

    async def retrieve_context(
        self,
        query: str,
        limit: int = 4,
        document_id: Optional[str] = None,
        user_id: Optional[str] = None,
        institution_id: Optional[str] = None,
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """Embeds a query, searches the vector DB, and returns relevant text chunks.
        Scoped by user_id and/or institution_id when provided for multi-tenant security."""
        try:
            cache_key = self._retrieve_cache_key(query, limit, document_id, user_id, institution_id)
            cached = redis_client.get(cache_key)
            if cached:
                try:
                    raw = json.loads(cached)
                    return raw.get("context", ""), raw.get("sources", [])
                except json.JSONDecodeError:
                    pass
            if cache_key in _LOCAL_RAG_CACHE:
                return _LOCAL_RAG_CACHE[cache_key]
            # 1. Generate query embedding (requires Gemini; OpenRouter-only has no embeddings)
            try:
                query_embedding = await self.ai_client.create_embedding(query)
            except NotImplementedError:
                logger.warning("RAG: Embeddings unavailable (Gemini not configured). Skipping retrieval.")
                return "", []
            if not query_embedding:
                logger.warning("RAG: Empty query embedding returned. Skipping retrieval.")
                return "", []
            embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
            columns = await self._get_vector_document_columns()
            
            # 2. Build WHERE clause for scoping (user/institution for row-level security)
            where_parts = []
            params: List[Any] = [embedding_str]
            param_idx = 2
            if document_id:
                where_parts.append(f'"documentId" = ${param_idx}')
                params.append(document_id)
                param_idx += 1
            if user_id and "userId" in columns:
                where_parts.append(f'("userId" = ${param_idx} OR "userId" IS NULL)')
                params.append(user_id)
                param_idx += 1
            if institution_id and "institutionId" in columns:
                where_parts.append(f'("institutionId" = ${param_idx} OR "institutionId" IS NULL)')
                params.append(institution_id)
                param_idx += 1
            where_sql = " AND ".join(where_parts) if where_parts else "1=1"
            params.append(limit)
            limit_param = f"${param_idx}"
            
            sql_query = f"""
                SELECT "content", "documentId", 1 - ("embedding" <=> $1::vector) AS similarity
                FROM "VectorDocument"
                WHERE {where_sql}
                ORDER BY "embedding" <=> $1::vector
                LIMIT {limit_param}
            """
            results = await prisma_client.query_raw(sql_query, *params)
                
            if not results:
                return "", []
                
            # 3. Format into context string and build sources
            context_blocks = []
            sources: List[Dict[str, Any]] = []
            seen_doc_ids: set = set()
            for idx, item in enumerate(results):
                if item.get("similarity", 0) <= 0.6:
                    continue
                context_blocks.append(item["content"])
                doc_id = item.get("documentId")
                if doc_id and doc_id not in seen_doc_ids:
                    seen_doc_ids.add(doc_id)
                    excerpt = (item.get("content") or "")[:200].replace("\n", " ")
                    sources.append({
                        "document_id": doc_id,
                        "title": None,  # Fetched below if needed
                        "excerpt": excerpt,
                        "similarity": round(item.get("similarity", 0), 2),
                    })
                    
            if not context_blocks:
                return "", []
            
            # Resolve titles from Evidence when documentId is evidence id
            for s in sources:
                try:
                    ev = await prisma_client.evidence.find_unique(
                        where={"id": s["document_id"]},
                    )
                    if ev and ev.originalFilename:
                        s["title"] = ev.originalFilename
                    else:
                        s["title"] = f"Document {s['document_id'][:8]}..."
                except Exception:
                    s["title"] = s["title"] or f"Source {len(sources)}"
                
            combined_context = "\n...[Document Chunk]...\n".join(context_blocks)
            response = f"\n[RELEVANT RETRIEVED KNOWLEDGE]\n{combined_context}\n", sources
            redis_client.set(cache_key, json.dumps({"context": response[0], "sources": response[1]}), ex=RAG_CACHE_TTL_SECONDS)
            _LOCAL_RAG_CACHE[cache_key] = response
            return response
            
        except Exception as e:
            logger.error(f"RAG Retrieval failed: {e}")
            return "", []  # Caller should handle empty; horus injects note when needed

    async def retrieve_context_with_sources(
        self,
        query: str,
        limit: int = 4,
        document_id: Optional[str] = None,
        user_id: Optional[str] = None,
        institution_id: Optional[str] = None,
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """Same as retrieve_context but returns (context_str, sources) for citation UI."""
        return await self.retrieve_context(query, limit, document_id, user_id, institution_id)

    @staticmethod
    def _retrieve_cache_key(
        query: str,
        limit: int,
        document_id: Optional[str],
        user_id: Optional[str],
        institution_id: Optional[str],
    ) -> str:
        normalized = " ".join((query or "").lower().split())
        digest = hashlib.sha256(
            json.dumps(
                {
                    "q": normalized,
                    "limit": limit,
                    "document_id": document_id,
                    "user_id": user_id,
                    "institution_id": institution_id,
                },
                sort_keys=True,
            ).encode("utf-8")
        ).hexdigest()
        return f"{RAG_CACHE_PREFIX}{digest}"

    @staticmethod
    async def index_document_job(payload: dict):
        rag = RagService()
        await rag.index_document(
            payload.get("content") or "",
            document_id=payload.get("document_id"),
            standard_id=payload.get("standard_id"),
            user_id=payload.get("user_id"),
            institution_id=payload.get("institution_id"),
        )

    @staticmethod
    async def enqueue_index_document(
        content: str,
        *,
        document_id: Optional[str] = None,
        standard_id: Optional[str] = None,
        user_id: Optional[str] = None,
        institution_id: Optional[str] = None,
    ) -> str:
        return await enqueue_job(
            "rag.index_document",
            {
                "content": content,
                "document_id": document_id,
                "standard_id": standard_id,
                "user_id": user_id,
                "institution_id": institution_id,
            },
            priority=80,
        )


register_job_handler("rag.index_document", RagService.index_document_job)
