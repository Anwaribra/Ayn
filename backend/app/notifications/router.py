"""Notifications router."""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.core.db import get_db
from app.core.middlewares import get_current_user
from app.auth.dependencies import require_admin
from app.notifications.models import (
    NotificationCreateRequest,
    NotificationResponse,
    MarkReadResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    request: NotificationCreateRequest,
    current_user: dict = require_admin
):
    """
    Create a notification.
    
    **Admin only** - Requires ADMIN role.
    
    Creates a notification for a specific user.
    
    - **userId**: User ID to send notification to
    - **title**: Notification title
    - **body**: Notification message/body
    """
    db = get_db()
    
    # Verify user exists
    user = await db.user.find_unique(where={"id": request.userId})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    try:
        notification = await db.notification.create(
            data={
                "userId": request.userId,
                "title": request.title,
                "body": request.body,
                "read": False,
            }
        )
        
        logger.info(f"Admin {current_user['email']} created notification {notification.id} for user {request.userId}")
        
        return NotificationResponse(
            id=notification.id,
            userId=notification.userId,
            title=notification.title,
            body=notification.body,
            read=notification.read,
            createdAt=notification.createdAt,
            updatedAt=notification.updatedAt
        )
    except Exception as e:
        logger.error(f"Error creating notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create notification"
        )


@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    current_user: dict = Depends(get_current_user)
):
    """
    List notifications for the current user.
    
    Returns all notifications for the authenticated user, ordered by creation date (newest first).
    """
    db = get_db()
    
    try:
        notifications = await db.notification.find_many(
            where={"userId": current_user["id"]},
            order={"createdAt": "desc"}
        )
        
        return [
            NotificationResponse(
                id=notif.id,
                userId=notif.userId,
                title=notif.title,
                body=notif.body,
                read=notif.read,
                createdAt=notif.createdAt,
                updatedAt=notif.updatedAt
            )
            for notif in notifications
        ]
    except Exception as e:
        logger.error(f"Error listing notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch notifications"
        )


@router.put("/{notification_id}", response_model=MarkReadResponse)
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark a notification as read.
    
    Updates the notification's read status to true.
    
    Users can only mark their own notifications as read.
    """
    db = get_db()
    
    # Get notification
    notification = await db.notification.find_unique(where={"id": notification_id})
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Check if user owns this notification (unless admin)
    if current_user["role"] != "ADMIN" and notification.userId != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only mark your own notifications as read"
        )
    
    # If already read, just return success
    if notification.read:
        return MarkReadResponse(
            message="Notification already marked as read",
            notificationId=notification_id,
            read=True
        )
    
    try:
        updated_notification = await db.notification.update(
            where={"id": notification_id},
            data={"read": True}
        )
        
        logger.info(f"User {current_user['email']} marked notification {notification_id} as read")
        
        return MarkReadResponse(
            message="Notification marked as read",
            notificationId=notification_id,
            read=updated_notification.read
        )
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notification as read"
        )


@router.get("/unread", response_model=List[NotificationResponse])
async def get_unread_notifications(
    current_user: dict = Depends(get_current_user)
):
    """
    Get unread notifications for the current user.
    
    Returns only unread notifications, ordered by creation date (newest first).
    """
    db = get_db()
    
    try:
        notifications = await db.notification.find_many(
            where={
                "userId": current_user["id"],
                "read": False
            },
            order={"createdAt": "desc"}
        )
        
        return [
            NotificationResponse(
                id=notif.id,
                userId=notif.userId,
                title=notif.title,
                body=notif.body,
                read=notif.read,
                createdAt=notif.createdAt,
                updatedAt=notif.updatedAt
            )
            for notif in notifications
        ]
    except Exception as e:
        logger.error(f"Error fetching unread notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch unread notifications"
        )
