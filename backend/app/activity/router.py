from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from app.auth.dependencies import get_current_user
from app.activity.service import ActivityService

router = APIRouter(prefix="/activities", tags=["activities"])

@router.get("/")
async def list_activities(
    skip: int = 0,
    take: int = 20,
    current_user = Depends(get_current_user)
):
    """List recent activities for the current user."""
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await ActivityService.list_activities(user_id, skip=skip, take=take)

@router.get("/recent")
async def get_recent_activities(
    limit: int = 5,
    current_user = Depends(get_current_user)
):
    """Get the most recent activities."""
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await ActivityService.get_recent_activities(user_id, limit=limit)
