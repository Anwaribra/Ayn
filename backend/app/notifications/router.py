"""Notifications router."""
import asyncio
import json
from fastapi import APIRouter, status, Depends
from fastapi.responses import StreamingResponse
from typing import List
from app.core.middlewares import get_current_user
from app.auth.dependencies import require_admin
from app.notifications.models import (
    NotificationCreateRequest,
    NotificationResponse,
    MarkReadResponse
)
from app.notifications.service import NotificationService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/stream")
async def stream_notifications(current_user: dict = Depends(get_current_user)):
    """SSE stream for real-time notifications."""
    async def event_generator():
        last_count = await NotificationService.get_unread_count(current_user["id"])
        yield f"data: {json.dumps({'type': 'init', 'unreadCount': last_count})}\n\n"
        
        while True:
            await asyncio.sleep(5)
            try:
                current_count = await NotificationService.get_unread_count(current_user["id"])
                if current_count != last_count:
                    notifications = await NotificationService.get_unread(current_user["id"])
                    yield f"data: {json.dumps({'type': 'update', 'unreadCount': current_count, 'notifications': [{'id': n.id, 'type': n.type, 'title': n.title, 'message': n.message} for n in notifications[:5]]})}\n\n"
                    last_count = current_count
                else:
                    yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
            except Exception:
                break
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    request: NotificationCreateRequest,
    current_user: dict = Depends(require_admin) # Keep admin check for manual creation
):
    """
    Create a notification manually (Admin only).
    """
    # Service no longer takes admin_email
    return await NotificationService.create_notification(request)


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    include_read: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """
    List notifications for the current user.
    """
    return await NotificationService.list_notifications(current_user["id"], include_read)


@router.put("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user)
):
    """
    Mark all notifications as read for the current user.
    """
    count = await NotificationService.mark_all_read(current_user["id"])
    return {"message": "All notifications marked as read", "count": count}


@router.put("/{notification_id}", response_model=MarkReadResponse)
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark a notification as read.
    """
    return await NotificationService.mark_read(notification_id, current_user)


@router.get("/unread", response_model=List[NotificationResponse])
async def get_unread_notifications(
    current_user: dict = Depends(get_current_user)
):
    """
    Get unread notifications for the current user.
    """
    return await NotificationService.get_unread(current_user["id"])
