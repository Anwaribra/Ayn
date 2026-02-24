"""
RAG Service - Semantic Search and Document Indexing
"""

import logging
from typing import List, Dict, Any, Optional
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

    async def index_document(self, content: str, document_id: Optional[str] = None, standard_id: Optional[str] = None):
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
                
                # 2. Insert into pgvector via raw SQL (Prisma client py doesn't fully native-support inserts yet)
                # Prisma's `execute_raw` allows parameterization.
                # However, array formatting can be tricky, so we format the float array to a string.
                embedding_str = "[" + ",".join(map(str, embedding)) + "]"
                
                query = """
                INSERT INTO "VectorDocument" ("id", "content", "embedding", "documentId", "standardId", "chunkIndex", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2::vector, $3, $4, $5, NOW())
                """
                await prisma_client.execute_raw(
                    query, 
                    chunk, 
                    embedding_str, 
                    document_id, 
                    standard_id, 
                    i
                )
                
            except Exception as e:
                logger.error(f"RAG: Failed to index chunk {i} for document {document_id}: {str(e)}")


    async def retrieve_context(self, query: str, limit: int = 4, document_id: Optional[str] = None) -> str:
        """Embeds a query, searches the vector DB, and returns relevant text chunks."""
        try:
            # 1. Generate query embedding
            query_embedding = await self.ai_client.create_embedding(query)
            embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
            
            # 2. Run Cosine Similarity Search (<=>)
            # If constrained by document_id, apply WHERE clause
            
            if document_id:
                sql_query = """
                SELECT "content", 1 - ("embedding" <=> $1::vector) AS similarity
                FROM "VectorDocument"
                WHERE "documentId" = $2
                ORDER BY "embedding" <=> $1::vector
                LIMIT $3
                """
                results = await prisma_client.query_raw(sql_query, embedding_str, document_id, limit)
            else:
                sql_query = """
                SELECT "content", 1 - ("embedding" <=> $1::vector) AS similarity
                FROM "VectorDocument"
                ORDER BY "embedding" <=> $1::vector
                LIMIT $2
                """
                results = await prisma_client.query_raw(sql_query, embedding_str, limit)
                
            if not results:
                return ""
                
            # 3. Format into a single context string
            context_blocks = []
            for item in results:
                # We only want chunks with a reasonable similarity (optional filter)
                if item.get("similarity", 0) > 0.6: 
                    context_blocks.append(item["content"])
                    
            if not context_blocks:
                return ""
                
            combined_context = "\n...[Document Chunk]...\n".join(context_blocks)
            return f"\n[RELEVANT RETRIEVED KNOWLEDGE]\n{combined_context}\n"
            
        except Exception as e:
            logger.error(f"RAG Retrieval failed: {e}")
            return ""
