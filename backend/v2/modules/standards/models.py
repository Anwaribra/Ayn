import uuid
import enum
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Enum, Float, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from v2.core.database import Base, InvalidStateTransitionError

class RequirementStatus(str, enum.Enum):
    NOT_ASSESSED = "NOT_ASSESSED"
    PARTIALLY_COVERED = "PARTIALLY_COVERED"
    COVERED = "COVERED"
    FULLY_COVERED = "FULLY_COVERED"


class Standard(Base):
    """
    V2 Standard Model.
    """
    __tablename__ = "v2_standards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    weight: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    criteria: Mapped[list["Criterion"]] = relationship("Criterion", back_populates="standard", cascade="all, delete-orphan")


class Criterion(Base):
    """
    V2 Criterion Model.
    """
    __tablename__ = "v2_criteria"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    standard_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_standards.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    weight: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    standard: Mapped["Standard"] = relationship("Standard", back_populates="criteria")
    requirements: Mapped[list["Requirement"]] = relationship("Requirement", back_populates="criterion", cascade="all, delete-orphan")


class Requirement(Base):
    """
    V2 Requirement Model. Holds the deterministic rule engine validation DSL.
    """
    __tablename__ = "v2_requirements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    criterion_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_criteria.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    weight: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    rule_definition: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    criterion: Mapped["Criterion"] = relationship("Criterion", back_populates="requirements")


class CampusStandard(Base):
    """
    V2 Standard-Entity Link tracking aggregated campus readiness score.
    """
    __tablename__ = "v2_campus_standards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_campuses.id"), nullable=False)
    standard_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_standards.id"), nullable=False)
    
    readiness_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    last_calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    campus: Mapped["Campus"] = relationship("Campus")
    standard: Mapped["Standard"] = relationship("Standard")


class CampusRequirement(Base):
    """
    V2 Requirement coverage tracking at entity/campus level.
    """
    __tablename__ = "v2_campus_requirements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_campuses.id"), nullable=False)
    requirement_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_requirements.id"), nullable=False)
    
    status: Mapped[RequirementStatus] = mapped_column(
        Enum(RequirementStatus, name="v2_requirement_status_enum", create_type=False),
        default=RequirementStatus.NOT_ASSESSED,
        nullable=False
    )
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    last_calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    campus: Mapped["Campus"] = relationship("Campus")
    requirement: Mapped["Requirement"] = relationship("Requirement")

    def transition_to(self, target_status: RequirementStatus):
        """
        Enforce strict state machine transitions for Requirement coverage status.
        """
        allowed = {
            RequirementStatus.NOT_ASSESSED: {RequirementStatus.PARTIALLY_COVERED, RequirementStatus.COVERED, RequirementStatus.FULLY_COVERED},
            RequirementStatus.PARTIALLY_COVERED: {RequirementStatus.NOT_ASSESSED, RequirementStatus.COVERED, RequirementStatus.FULLY_COVERED},
            RequirementStatus.COVERED: {RequirementStatus.NOT_ASSESSED, RequirementStatus.PARTIALLY_COVERED, RequirementStatus.FULLY_COVERED},
            RequirementStatus.FULLY_COVERED: {RequirementStatus.NOT_ASSESSED, RequirementStatus.PARTIALLY_COVERED, RequirementStatus.COVERED}
        }
        
        if target_status == self.status:
            return
            
        if target_status not in allowed.get(self.status, set()):
            raise InvalidStateTransitionError(
                f"Illegal state transition from {self.status} to {target_status} for CampusRequirement {self.id}"
            )
            
        self.status = target_status


class DailyReadinessSnapshot(Base):
    """
    V2 Daily Readiness Snapshot Model for historical compliance trends.
    """
    __tablename__ = "v2_daily_readiness_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_campuses.id"), nullable=False, index=True)
    standard_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_standards.id"), nullable=False, index=True)
    readiness_score: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, index=True) # YYYY-MM-DD
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    campus: Mapped["Campus"] = relationship("Campus")
    standard: Mapped["Standard"] = relationship("Standard")
