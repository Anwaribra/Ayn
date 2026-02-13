"""Pydantic models for notifications."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Request Models
class NotificationCreateRequest(BaseModel):
    """Request model for creating a notification."""
    userId: str = Field(..., description="User ID to send notification to")
    type: str = Field(..., description="Type: info, success, warning, error")
    title: str = Field(..., min_length=1, max_length=200, description="Notification title")
    message: str = Field(..., min_length=1, max_length=1000, description="Notification message/body")
    relatedEntityId: Optional[str] = None
    relatedEntityType: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "user-uuid",
                "type": "success",
                "title": "Evidence Analyzed",
                "message": "Your file 'Policy.pdf' has been successfully analyzed.",
                "relatedEntityId": "ev-123",
                "relatedEntityType": "evidence"
            }
        }


# Response Models
class NotificationResponse(BaseModel):
    """Notification information response."""
    id: str
    userId: str
    type: str
    title: str
    message: str
    relatedEntityId: Optional[str] = None
    relatedEntityType: Optional[str] = None
    isRead: bool
    createdAt: datetime

    class Config:
        from_attributes = True


class MarkReadResponse(BaseModel):
    """Response for marking notification as read."""
    message: str
    notificationId: str
    read: bool


