import io
import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from v2.modules.evidence.models import Evidence, EvidenceChunk, EvidenceEmbedding, EvidenceStatus
from v2.core.logging import setup_logger

logger = setup_logger("v2.modules.evidence.services")

class EvidenceService:
    @staticmethod
    async def create_evidence(
        db: AsyncSession,
        campus_id: uuid.UUID,
        filename: str,
        file_url: str,
        content_type: str,
        correlation_id: str
    ) -> Evidence:
        """
        Record uploaded evidence details in the DB.
        """
        evidence = Evidence(
            campus_id=campus_id,
            filename=filename,
            file_url=file_url,
            content_type=content_type,
            status=EvidenceStatus.UPLOADED,
            correlation_id=correlation_id
        )
        db.add(evidence)
        await db.commit()
        await db.refresh(evidence)
        logger.info(f"Registered evidence record {evidence.id} in UPLOADED status.")
        return evidence

    @staticmethod
    async def extract_and_chunk_text(
        db: AsyncSession,
        evidence_id: uuid.UUID,
        file_data: bytes | None = None
    ) -> list[str]:
        """
        Executes OCR/Text extraction and chunking. Enforces strict state transitions.
        """
        stmt = select(Evidence).where(Evidence.id == evidence_id)
        result = await db.execute(stmt)
        evidence = result.scalar_one_or_none()
        
        if not evidence:
            raise ValueError(f"Evidence {evidence_id} not found")
            
        # Update status: UPLOADED -> PROCESSING
        evidence.transition_to(EvidenceStatus.PROCESSING)
        await db.commit()
        
        try:
            extracted_text = ""
            # If actual PDF data is provided, parse it
            if file_data and evidence.content_type == "application/pdf":
                pdf_reader = PdfReader(io.BytesIO(file_data))
                extracted_text = "\n".join([page.extract_text() for page in pdf_reader.pages])
            else:
                # Mock text fallback for dev/testing
                extracted_text = (
                    "Standard Compliance Document.\n"
                    "Policy 1.1: Quality Assurance procedures are reviewed annually.\n"
                    "Evidence: Annual reviews are documented and approved by the campus director."
                )
                
            # Chunking text
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
            chunks = text_splitter.split_text(extracted_text)
            
            # Store Chunks and mock embeddings (since Gemini embedding API calls are mocked or generated later)
            for idx, chunk_content in enumerate(chunks):
                chunk = EvidenceChunk(
                    evidence_id=evidence_id,
                    chunk_index=idx,
                    content=chunk_content
                )
                db.add(chunk)
                await db.flush() # Flush to generate chunk.id
                
                # Mocking a 768-dimension float vector for testing
                mock_vector = [0.1] * 768
                embedding = EvidenceEmbedding(
                    chunk_id=chunk.id,
                    embedding=mock_vector
                )
                db.add(embedding)
                
            evidence.transition_to(EvidenceStatus.EXTRACTED)
            await db.commit()
            logger.info(f"Text extracted and split into {len(chunks)} chunks for evidence {evidence_id}.")
            return chunks
            
        except Exception as e:
            logger.error(f"Failed extracting text for evidence {evidence_id}: {e}", exc_info=True)
            evidence.transition_to(EvidenceStatus.FAILED)
            await db.commit()
            raise
