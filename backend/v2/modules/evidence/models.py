import uuid
import enum
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Enum, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from v2.core.database import Base, PGVector, InvalidStateTransitionError

class EvidenceStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    EXTRACTED = "EXTRACTED"
    ANALYZED = "ANALYZED"
    VALIDATED = "VALIDATED"
    FAILED = "FAILED"

class Evidence(Base):
    """
    V2 Evidence model representing document uploads.
    """
    __tablename__ = "v2_evidence"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_campuses.id"), nullable=False)
    
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    
    status: Mapped[EvidenceStatus] = mapped_column(
        Enum(EvidenceStatus, name="v2_evidence_status_enum", create_type=False),
        default=EvidenceStatus.UPLOADED,
        nullable=False
    )
    
    correlation_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    chunks: Mapped[list["EvidenceChunk"]] = relationship("EvidenceChunk", back_populates="evidence", cascade="all, delete-orphan")
    validations: Mapped[list["EvidenceValidation"]] = relationship("EvidenceValidation", back_populates="evidence", cascade="all, delete-orphan")

    def transition_to(self, target_status: EvidenceStatus):
        """
        State machine transition logic.
        """
        allowed = {
            EvidenceStatus.UPLOADED: {EvidenceStatus.PROCESSING, EvidenceStatus.FAILED},
            EvidenceStatus.PROCESSING: {EvidenceStatus.EXTRACTED, EvidenceStatus.FAILED},
            EvidenceStatus.EXTRACTED: {EvidenceStatus.ANALYZED, EvidenceStatus.FAILED},
            EvidenceStatus.ANALYZED: {EvidenceStatus.VALIDATED, EvidenceStatus.FAILED},
            EvidenceStatus.VALIDATED: {EvidenceStatus.PROCESSING, EvidenceStatus.FAILED}, # Allowed to re-process
            EvidenceStatus.FAILED: {EvidenceStatus.PROCESSING, EvidenceStatus.UPLOADED}
        }
        
        if target_status == self.status:
            return
            
        if target_status not in allowed.get(self.status, set()):
            raise InvalidStateTransitionError(
                f"Illegal state transition from {self.status} to {target_status} for Evidence {self.id}"
            )
            
        self.status = target_status


class EvidenceChunk(Base):
    """
    V2 Chunks of extracted text from evidence PDFs.
    """
    __tablename__ = "v2_evidence_chunks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evidence_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_evidence.id"), nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(String, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    evidence: Mapped["Evidence"] = relationship("Evidence", back_populates="chunks")
    embedding: Mapped["EvidenceEmbedding | None"] = relationship("EvidenceEmbedding", back_populates="chunk", uselist=False, cascade="all, delete-orphan")


class EvidenceEmbedding(Base):
    """
    V2 Embeddings for individual text chunks.
    """
    __tablename__ = "v2_evidence_embeddings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chunk_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_evidence_chunks.id"), nullable=False)
    
    embedding: Mapped[list[float]] = mapped_column(PGVector(768), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    chunk: Mapped["EvidenceChunk"] = relationship("EvidenceChunk", back_populates="embedding")


class EvidenceValidation(Base):
    """
    V2 Validation Engine outputs for evidence mapping.
    """
    __tablename__ = "v2_evidence_validations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evidence_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_evidence.id"), nullable=False)
    requirement_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_requirements.id"), nullable=False)
    
    status: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. COVERED, PARTIALLY_COVERED, NOT_COVERED, NEEDS_REVIEW
    confidence: Mapped[float] = mapped_column(nullable=False)
    
    # Store structured reasoning and explanations
    explainability_metadata: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    evidence: Mapped["Evidence"] = relationship("Evidence", back_populates="validations")
    requirement: Mapped["Requirement"] = relationship("Requirement")
