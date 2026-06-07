import uuid
import enum
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Enum, Float, Integer, LargeBinary, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from v2.core.database import Base, InvalidStateTransitionError

class RiskSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class RiskStatus(str, enum.Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"

class Risk(Base):
    """
    V2 Risk Model representing gaps, insufficient evidence, or compliance failures.
    """
    __tablename__ = "v2_risks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_campuses.id"), nullable=False)
    
    type: Mapped[str] = mapped_column(String(50), nullable=False) # MISSING_EVIDENCE, EXPIRED_DOCUMENT, etc.
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    
    severity: Mapped[RiskSeverity] = mapped_column(
        Enum(RiskSeverity, name="v2_risk_severity_enum", create_type=False),
        default=RiskSeverity.MEDIUM,
        nullable=False
    )
    status: Mapped[RiskStatus] = mapped_column(
        Enum(RiskStatus, name="v2_risk_status_enum", create_type=False),
        default=RiskStatus.OPEN,
        nullable=False
    )

    reference_type: Mapped[str | None] = mapped_column(String(50), nullable=True) # e.g. "requirement", "evidence"
    reference_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def transition_to(self, target_status: RiskStatus):
        """
        Enforce strict state machine transitions for Risks.
        """
        allowed = {
            RiskStatus.OPEN: {RiskStatus.RESOLVED},
            RiskStatus.RESOLVED: {RiskStatus.OPEN}
        }
        
        if target_status == self.status:
            return
            
        if target_status not in allowed.get(self.status, set()):
            raise InvalidStateTransitionError(
                f"Illegal state transition from {self.status} to {target_status} for Risk {self.id}"
            )
            
        self.status = target_status


class AISignalLog(Base):
    """
    V2 AI Signal Logging Model. Isolates raw prompts, JSON strings, token usage, 
    and model costs to keep operational tables clean.
    """
    __tablename__ = "v2_ai_signal_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    correlation_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    
    prompt: Mapped[str] = mapped_column(String, nullable=False)
    raw_response: Mapped[str] = mapped_column(String, nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    token_usage: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict) # {"input_tokens": 12, "output_tokens": 15}
    estimated_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AISignalLogArchive(Base):
    """
    V2 Archived AI Signal Logging Model. Stores zlib-compressed prompt and response.
    """
    __tablename__ = "v2_ai_signal_logs_archive"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    correlation_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    token_usage: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    estimated_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    compressed_prompt: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    compressed_raw_response: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    archived_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FailedEventClassification(str, enum.Enum):
    TRANSIENT = "TRANSIENT"
    PERMANENT = "PERMANENT"
    VALIDATION = "VALIDATION"
    EXTERNAL_PROVIDER = "EXTERNAL_PROVIDER"
    TIMEOUT = "TIMEOUT"
    RATE_LIMIT = "RATE_LIMIT"


class FailedEvent(Base):
    """
    V2 Failed Events logging. Acts as a base database DLQ (Dead Letter Queue)
    for operational auditing, failure tracking, and replay.
    """
    __tablename__ = "v2_failed_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    correlation_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    worker_name: Mapped[str] = mapped_column(String(100), nullable=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    exception: Mapped[str] = mapped_column(String, nullable=False)
    classification: Mapped[FailedEventClassification] = mapped_column(
        Enum(FailedEventClassification, name="v2_failed_event_classification_enum", create_type=False),
        default=FailedEventClassification.PERMANENT,
        nullable=False
    )
    
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AIUsageAggregate(Base):
    """
    V2 AI Usage aggregation table for billing, quotas, analytics, and enterprise reporting.
    """
    __tablename__ = "v2_ai_usage_aggregates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, index=True) # YYYY-MM-DD
    organization_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("v2_organizations.id"), nullable=True, index=True)
    campus_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("v2_campuses.id"), nullable=True, index=True)
    feature: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. "ocr", "validation", "horus"
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estimated_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    request_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
