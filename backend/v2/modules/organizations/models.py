import uuid
from datetime import datetime, UTC
from sqlalchemy import String, ForeignKey, DateTime, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from v2.core.database import Base

class RoleEnum(str, enum.Enum):
    GLOBAL_ADMIN = "GLOBAL_ADMIN"
    ENTITY_ADMIN = "ENTITY_ADMIN"
    REVIEWER = "REVIEWER"
    CONTRIBUTOR = "CONTRIBUTOR"
    AUDITOR = "AUDITOR"

class Organization(Base):
    __tablename__ = "v2_organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    campuses: Mapped[list["Campus"]] = relationship("Campus", back_populates="organization")


class Campus(Base):
    __tablename__ = "v2_campuses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="campuses")
    user_roles: Mapped[list["UserCampusRole"]] = relationship("UserCampusRole", back_populates="campus")


class User(Base):
    __tablename__ = "v2_users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    campus_roles: Mapped[list["UserCampusRole"]] = relationship("UserCampusRole", back_populates="user")


class UserCampusRole(Base):
    __tablename__ = "v2_user_campus_roles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_users.id"), nullable=False)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_campuses.id"), nullable=False)
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum, name="v2_role_enum", create_type=False), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="campus_roles")
    campus: Mapped["Campus"] = relationship("Campus", back_populates="user_roles")
