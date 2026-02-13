"""Notifications router."""
from fastapi import APIRouter, status, Depends
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


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    request: NotificationCreateRequest,
    current_user: dict = require_admin
):
    """
    Create a notification.
    """
    return await NotificationService.create_notification(request, current_user["email"])


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    current_user: dict = Depends(get_current_user)
):
    """
    List notifications for the current user.
    """
    return await NotificationService.list_notifications(current_user["id"])


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
