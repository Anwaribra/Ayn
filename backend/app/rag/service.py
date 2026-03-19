"""
RAG Service - Semantic Search and Document Indexing
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.ai.service import get_gemini_client
from app.core.db import db as prisma_client

logger = logging.getLogger(__name__)

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

        for i, chunk in enumerate(chunks):
            try:
                # 1. Generate Embedding
                embedding = await self.ai_client.create_embedding(chunk)
                
                # 2. Insert into pgvector with user/institution scoping
                embedding_str = "[" + ",".join(map(str, embedding)) + "]"
                
                query = """
                INSERT INTO "VectorDocument" ("id", "content", "embedding", "documentId", "standardId", "chunkIndex", "userId", "institutionId", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2::vector, $3, $4, $5, $6, $7, NOW())
                """
                await prisma_client.execute_raw(
                    query,
                    chunk,
                    embedding_str,
                    document_id,
                    standard_id,
                    i,
                    user_id,
                    institution_id,
                )
                
            except Exception as e:
                logger.error(f"RAG: Failed to index chunk {i} for document {document_id}: {str(e)}")


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
    ) -> str:
        """Embeds a query, searches the vector DB, and returns relevant text chunks.
        Scoped by user_id and/or institution_id when provided for multi-tenant security."""
        try:
            # 1. Generate query embedding (requires Gemini; OpenRouter-only has no embeddings)
            try:
                query_embedding = await self.ai_client.create_embedding(query)
            except NotImplementedError:
                logger.warning("RAG: Embeddings unavailable (Gemini not configured). Skipping retrieval.")
                return ""
            embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
            
            # 2. Build WHERE clause for scoping (user/institution for row-level security)
            where_parts = []
            params: List[Any] = [embedding_str]
            param_idx = 2
            if document_id:
                where_parts.append(f'"documentId" = ${param_idx}')
                params.append(document_id)
                param_idx += 1
            if user_id:
                where_parts.append(f'("userId" = ${param_idx} OR "userId" IS NULL)')
                params.append(user_id)
                param_idx += 1
            if institution_id:
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
                        select={"originalFilename": True}
                    )
                    if ev and ev.originalFilename:
                        s["title"] = ev.originalFilename
                    else:
                        s["title"] = f"Document {s['document_id'][:8]}..."
                except Exception:
                    s["title"] = s["title"] or f"Source {len(sources)}"
                
            combined_context = "\n...[Document Chunk]...\n".join(context_blocks)
            return f"\n[RELEVANT RETRIEVED KNOWLEDGE]\n{combined_context}\n", sources
            
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
