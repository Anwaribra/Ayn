import uuid
from datetime import datetime, date
from sqlalchemy import String, ForeignKey, DateTime, Date, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from v2.core.database import Base

class V2HorusWorkflow(Base):
    __tablename__ = "v2_horus_workflows"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_name: Mapped[str] = mapped_column(String(255), nullable=False)
    trigger_event: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    conditions_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    actions_json: Mapped[dict] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    action_logs: Mapped[list["V2HorusActionLog"]] = relationship("V2HorusActionLog", back_populates="workflow")


class V2HorusActionLog(Base):
    __tablename__ = "v2_horus_action_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    correlation_id: Mapped[str] = mapped_column(String(100), index=True)
    triggering_event: Mapped[str] = mapped_column(String(100))
    reasoning_summary: Mapped[str] = mapped_column(String, nullable=False)
    recommended_action: Mapped[str] = mapped_column(String(100), nullable=False)
    executed_action: Mapped[str] = mapped_column(String(100), nullable=False)
    action_payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    policy_result: Mapped[str] = mapped_column(String(50))
    workflow_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("v2_horus_workflows.id", ondelete="SET NULL"), nullable=True, index=True)
    execution_status: Mapped[str] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    workflow: Mapped["V2HorusWorkflow"] = relationship("V2HorusWorkflow", back_populates="action_logs")


class V2HorusApprovalRequest(Base):
    __tablename__ = "v2_horus_approval_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    request_type: Mapped[str] = mapped_column(String(100), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    status: Mapped[str] = mapped_column(String(50), default="PENDING", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class V2HorusBriefing(Base):
    __tablename__ = "v2_horus_briefings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    summary_content: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class V2MockAudit(Base):
    __tablename__ = "v2_mock_audits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    standard_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    simulation_status: Mapped[str] = mapped_column(String(50), default="RUNNING")
    report_payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
