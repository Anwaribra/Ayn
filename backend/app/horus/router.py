"""
Horus AI API Router - Global Brain Refactor

Conversational AI with streaming, persistence, and platform awareness.
"""

import logging
import traceback
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query, HTTPException, File, UploadFile, Form, BackgroundTasks
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

from app.auth.dependencies import get_current_user
from app.core.db import get_db, Prisma
from app.horus.service import HorusService
from app.platform_state.service import StateService
from app.chat.service import ChatService

router = APIRouter(prefix="/horus", tags=["horus"])


class Observation(BaseModel):
    """A response from Horus."""
    content: str
    chat_id: str
    timestamp: datetime
    state_hash: str
    structured: Optional[dict] = None
    suggested_actions: List[dict] = []


def get_user_id(current_user):
    """Safely extract user_id from current_user."""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if isinstance(current_user, dict):
        return current_user.get("id")
    if hasattr(current_user, 'id'):
        return current_user.id
    raise HTTPException(status_code=401, detail="Invalid user format")


@router.post("/chat", response_model=Observation)
async def horus_chat_post(
    background_tasks: BackgroundTasks,
    message: str = Form(...),
    chat_id: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Standard chat with Horus. Returns full response.
    """
    try:
        user_id = get_user_id(current_user)
        state_service = StateService(db)
        horus_service = HorusService(state_service)
        
        return await horus_service.chat(
            user_id=user_id,
            message=message,
            chat_id=chat_id,
            files=files,
            background_tasks=background_tasks,
            db=db,
            current_user=current_user
        )
    except Exception as e:
        logger.error(f"Horus Chat Error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def horus_chat_stream(
    background_tasks: BackgroundTasks,
    message: str = Form(...),
    chat_id: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Streaming chat with Horus.
    """
    user_id = get_user_id(current_user)
    state_service = StateService(db)
    horus_service = HorusService(state_service)
    
    async def event_generator():
        async for chunk in horus_service.stream_chat(
            user_id=user_id,
            message=message,
            chat_id=chat_id,
            files=files,
            background_tasks=background_tasks,
            db=db,
            current_user=current_user
        ):
            yield chunk

    return StreamingResponse(event_generator(), media_type="text/plain")


@router.get("/history")
async def get_chat_history(
    current_user = Depends(get_current_user)
):
    """Get user's chat history/archives."""
    user_id = get_user_id(current_user)
    return await ChatService.list_chats(user_id)


@router.get("/history/{chat_id}")
async def get_chat_messages(
    chat_id: str,
    current_user = Depends(get_current_user)
):
    """Get messages for a specific chat."""
    user_id = get_user_id(current_user)
    chat = await ChatService.get_chat(chat_id, user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.delete("/history/{chat_id}")
async def delete_chat(
    chat_id: str,
    current_user = Depends(get_current_user)
):
    """Delete a chat conversation."""
    user_id = get_user_id(current_user)
    await ChatService.delete_chat(chat_id, user_id)
    return {"status": "deleted"}
