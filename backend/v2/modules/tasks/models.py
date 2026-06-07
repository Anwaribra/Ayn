import uuid
from datetime import datetime, UTC
from sqlalchemy import String, ForeignKey, DateTime, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum

from v2.core.database import Base

class TaskStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    VERIFIED = "VERIFIED"

class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Task(Base):
    """
    V2 Task system. Converting risks, gaps, and missing evidence into operational workflows.
    """
    __tablename__ = "v2_tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_campuses.id"), nullable=False)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus, name="v2_task_status_enum", create_type=False), default=TaskStatus.OPEN, nullable=False)
    priority: Mapped[TaskPriority] = mapped_column(Enum(TaskPriority, name="v2_task_priority_enum", create_type=False), default=TaskPriority.MEDIUM, nullable=False)
    
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("v2_users.id"), nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Generic references to the object this task is about (e.g., standard requirement, evidence ID)
    reference_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reference_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
