"""Notifications service."""
from fastapi import HTTPException, status
from typing import List
from app.core.db import get_db
from app.notifications.models import (
    NotificationCreateRequest,
    NotificationResponse,
    MarkReadResponse
)
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    """Service for notifications business logic."""
    
    @staticmethod
    async def create_notification(request: NotificationCreateRequest, admin_email: str) -> NotificationResponse:
        """Create a notification for a user."""
        db = get_db()
        if not await db.user.find_unique(where={"id": request.userId}):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
            
        try:
            notification = await db.notification.create(
                data={
                    "userId": request.userId,
                    "title": request.title,
                    "body": request.body,
                    "read": False,
                }
            )
            logger.info(f"Admin {admin_email} created notification {notification.id}")
            return NotificationResponse.model_validate(notification)
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create notification")

    @staticmethod
    async def list_notifications(user_id: str) -> List[NotificationResponse]:
        """List notifications for a user."""
        db = get_db()
        try:
            notifications = await db.notification.find_many(
                where={"userId": user_id},
                order={"createdAt": "desc"}
            )
            return [NotificationResponse.model_validate(n) for n in notifications]
        except Exception as e:
            logger.error(f"Error listing: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch notifications")

    @staticmethod
    async def mark_read(notification_id: str, current_user: dict) -> MarkReadResponse:
        """Mark notification as read."""
        db = get_db()
        notification = await db.notification.find_unique(where={"id": notification_id})
        if not notification:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
            
        if current_user["role"] != "ADMIN" and notification.userId != current_user["id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
        if notification.read:
            return MarkReadResponse(message="Already read", notificationId=notification_id, read=True)
            
        try:
            updated = await db.notification.update(where={"id": notification_id}, data={"read": True})
            return MarkReadResponse(message="Marked as read", notificationId=notification_id, read=updated.read)
        except Exception as e:
            logger.error(f"Error marking read: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to mark read")

    @staticmethod
    async def get_unread(user_id: str) -> List[NotificationResponse]:
        """Get unread notifications."""
        db = get_db()
        try:
            notifications = await db.notification.find_many(
                where={"userId": user_id, "read": False},
                order={"createdAt": "desc"}
            )
            return [NotificationResponse.model_validate(n) for n in notifications]
        except Exception as e:
            logger.error(f"Error fetching unread: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch unread")
