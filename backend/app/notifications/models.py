"""Pydantic models for notifications."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Request Models
class NotificationCreateRequest(BaseModel):
    """Request model for creating a notification."""
    userId: str = Field(..., description="User ID to send notification to")
    title: str = Field(..., min_length=1, max_length=200, description="Notification title")
    body: str = Field(..., min_length=1, max_length=1000, description="Notification message/body")

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "user-uuid",
                "title": "Alignment Review Generated",
                "body": "Your framework alignment analysis has been generated."
            }
        }


# Response Models
class NotificationResponse(BaseModel):
    """Notification information response."""
    id: str
    userId: str
    title: str
    body: str
    read: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class MarkReadResponse(BaseModel):
    """Response for marking notification as read."""
    message: str
    notificationId: str
    read: bool


