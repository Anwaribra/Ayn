import uuid
import enum
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Enum, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from v2.core.database import Base, InvalidStateTransitionError

class NotificationStatus(str, enum.Enum):
    UNREAD = "UNREAD"
    READ = "READ"

class NotificationChannel(str, enum.Enum):
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"
    WEBHOOK = "WEBHOOK"

class Notification(Base):
    """
    V2 Notification model tracking messages sent to users.
    """
    __tablename__ = "v2_notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("v2_users.id"), nullable=True)
    campus_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("v2_campuses.id"), nullable=True)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(String(1000), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. "TASK_CREATED", "RISK_DETECTED"
    
    status: Mapped[NotificationStatus] = mapped_column(
        Enum(NotificationStatus, name="v2_notification_status_enum", create_type=False),
        default=NotificationStatus.UNREAD,
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def transition_to(self, target_status: NotificationStatus):
        """
        Enforce strict state machine transitions for Notifications.
        """
        allowed = {
            NotificationStatus.UNREAD: {NotificationStatus.READ},
            NotificationStatus.READ: set() # Cannot mark unread in this implementation
        }
        
        if target_status == self.status:
            return
            
        if target_status not in allowed.get(self.status, set()):
            raise InvalidStateTransitionError(
                f"Illegal state transition from {self.status} to {target_status} for Notification {self.id}"
            )
            
        self.status = target_status
        if target_status == NotificationStatus.READ:
            self.read_at = func.now()


class NotificationPreference(Base):
    """
    V2 User notification configuration for email, webhooks, and severity filters.
    """
    __tablename__ = "v2_notification_preferences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("v2_users.id"), nullable=False)
    
    channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel, name="v2_notification_channel_enum", create_type=False),
        nullable=False
    )
    
    # Store minimum severity allowed (LOW, MEDIUM, HIGH, CRITICAL)
    min_severity: Mapped[str] = mapped_column(String(20), default="LOW", nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped["User"] = relationship("User")
