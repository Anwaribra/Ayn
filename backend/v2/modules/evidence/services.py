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
                extracted_text = "\n".join([page.extract_text() or "" for page in pdf_reader.pages])
                
                # Scanned PDF check: if the extracted text is extremely sparse, try OCR
                if len(extracted_text.strip()) < 50:
                    logger.info("PDF text is empty or very sparse. Attempting scanned PDF OCR fallback...")
                    try:
                        import pytesseract
                        from pdf2image import convert_from_bytes
                        # Convert PDF bytes to PIL images (limit to first 5 pages for performance)
                        images = convert_from_bytes(file_data, first_page=1, last_page=5)
                        ocr_pages = []
                        for img in images:
                            txt = pytesseract.image_to_string(img, lang="ara+eng")
                            ocr_pages.append(txt)
                        ocr_text = "\n".join(ocr_pages).strip()
                        if ocr_text:
                            extracted_text = ocr_text
                            logger.info("Successfully extracted text from scanned PDF via OCR.")
                    except ImportError:
                        logger.warning("Scanned PDF detected but pytesseract or pdf2image is not installed. Skipping OCR.")
                    except Exception as ocr_err:
                        logger.error(f"OCR processing failed: {ocr_err}")
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
            
            # Store Chunks and generate real embeddings
            from v2.modules.ai_signals.client import AISignalsClient
            ai_client = AISignalsClient()
            
            for idx, chunk_content in enumerate(chunks):
                chunk = EvidenceChunk(
                    evidence_id=evidence_id,
                    chunk_index=idx,
                    content=chunk_content
                )
                db.add(chunk)
                await db.flush() # Flush to generate chunk.id
                
                # Generate real embedding vector
                vector = ai_client.generate_embedding(chunk_content)
                embedding = EvidenceEmbedding(
                    chunk_id=chunk.id,
                    embedding=vector
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
