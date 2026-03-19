"""
Horus AI API Router - Global Brain Refactor

Conversational AI with streaming, persistence, and platform awareness.
"""

import logging
import traceback
from datetime import datetime, timezone
from typing import Optional, List
from uuid import uuid4
from pydantic import BaseModel
import json
import asyncio
from fastapi import APIRouter, Depends, Query, HTTPException, File, UploadFile, Form, BackgroundTasks
import io
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

from app.auth.dependencies import get_current_user
from app.core.db import get_db, Prisma
from app.horus.service import HorusService
from app.horus.agent_tools import build_tool_manifest, requires_explicit_confirmation
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


class GoalUpdateRequest(BaseModel):
    goal: str
    chat_id: Optional[str] = None


class GoalResponse(BaseModel):
    chat_id: str
    goal: Optional[str] = None
    goal_updated_at: Optional[datetime] = None


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
    correlation_id = str(uuid4())
    logger.info("Horus chat/stream request", extra={"correlation_id": correlation_id, "user_id": user_id})
    state_service = StateService(db)
    horus_service = HorusService(state_service)
    
    async def event_generator():
        try:
            async for chunk in horus_service.stream_chat(
                user_id=user_id,
                message=message,
                chat_id=chat_id,
                files=files,
                background_tasks=background_tasks,
                db=db,
                current_user=current_user,
                correlation_id=correlation_id,
            ):
                yield chunk
        except Exception as e:
            logger.error(f"Horus stream error: {e}", exc_info=True, extra={"correlation_id": correlation_id})
            yield f"__STREAM_ERROR__:{str(e)[:200]}\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/plain; charset=utf-8",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.get("/events")
async def horus_events_stream(
    current_user = Depends(get_current_user)
):
    """
    Real-time platform event stream (SSE).
    Horus uses this to push system messages and global notifications.
    """
    user_id = get_user_id(current_user)
    
    async def event_generator():
        from app.core.events import event_bus
        queue = await event_bus.subscribe(user_id)
        try:
            # Initial heartbeat/sync
            yield f"data: {json.dumps({'type': 'sync', 'status': 'connected'})}\n\n"
            
            while True:
                event = await queue.get()
                yield f"data: {json.dumps(event)}\n\n"
        except asyncio.CancelledError:
            from app.core.events import event_bus
            event_bus.unsubscribe(user_id, queue)
            raise
        except Exception as e:
            logger.error(f"SSE Error: {e}")
            from app.core.events import event_bus
            event_bus.unsubscribe(user_id, queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/observe")
async def horus_observe(
    query: Optional[str] = Query(None),
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Lightweight state observation endpoint for legacy clients.
    """
    user_id = get_user_id(current_user)
    state_service = StateService(db)
    summary = await state_service.get_state_summary(user_id)
    content = (
        f"Platform snapshot: {summary.total_files} files, "
        f"{summary.total_evidence} evidence items, "
        f"{summary.total_gaps} gaps, score {summary.total_score:.1f}%."
    )
    if query:
        content += f" Query focus: {query}"
    return {
        "content": content,
        "timestamp": datetime.now(timezone.utc).timestamp(),
        "state_hash": f"{summary.total_files}:{summary.total_evidence}:{summary.total_gaps}",
    }


@router.get("/state/files")
async def horus_state_files(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user),
):
    user_id = get_user_id(current_user)
    manager = StateService(db).manager
    return await manager.get_files_by_user(user_id)


@router.get("/state/evidence")
async def horus_state_evidence(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user),
):
    user_id = get_user_id(current_user)
    manager = StateService(db).manager
    return await manager.get_evidence_by_user(user_id)


@router.get("/state/gaps")
async def horus_state_gaps(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user),
):
    user_id = get_user_id(current_user)
    manager = StateService(db).manager
    return await manager.get_gaps_by_user(user_id)


@router.get("/history/last")
async def get_last_chat(
    current_user = Depends(get_current_user)
):
    """Get the last active chat session for auto-resume."""
    user_id = get_user_id(current_user)
    chat = await ChatService.get_last_chat(user_id)
    if not chat:
        # No chat found, return null instead of 404 to let frontend handle it
        return None
    return chat


@router.get("/history")
async def get_chat_history(
    current_user = Depends(get_current_user)
):
    """Get user's chat history/archives."""
    user_id = get_user_id(current_user)
    return await ChatService.list_chats(user_id)


@router.get("/goal", response_model=GoalResponse)
async def get_goal(
    chat_id: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
):
    user_id = get_user_id(current_user)
    chat = await ChatService.get_goal(user_id, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return GoalResponse(
        chat_id=chat.id,
        goal=getattr(chat, "goal", None),
        goal_updated_at=getattr(chat, "goalUpdatedAt", None),
    )


@router.post("/goal", response_model=GoalResponse)
async def set_goal(
    body: GoalUpdateRequest,
    current_user = Depends(get_current_user),
):
    user_id = get_user_id(current_user)
    if not body.goal or not body.goal.strip():
        raise HTTPException(status_code=400, detail="Goal is required")
    chat = await ChatService.set_goal(user_id, body.goal.strip(), body.chat_id)
    return GoalResponse(
        chat_id=chat.id,
        goal=getattr(chat, "goal", None),
        goal_updated_at=getattr(chat, "goalUpdatedAt", None),
    )


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


@router.get("/agent/capabilities")
async def get_agent_capabilities(
    current_user = Depends(get_current_user)
):
    """Expose Horus tool manifest for UI/clients."""
    _ = get_user_id(current_user)
    tools = build_tool_manifest()
    return {
        "agent_mode": "planner_executor",
        "tool_count": len(tools),
        "tools": [
            {
                **t,
                "requires_confirmation": requires_explicit_confirmation(t["name"]),
            }
            for t in tools
        ],
    }


@router.delete("/history/{chat_id}")
async def delete_chat(
    chat_id: str,
    current_user = Depends(get_current_user)
):
    """Delete a chat conversation."""
    user_id = get_user_id(current_user)
    await ChatService.delete_chat(chat_id, user_id)
    return {"status": "deleted"}


# ─── Feedback ─────────────────────────────────────────────────────────────────

class MessageFeedback(BaseModel):
    message_id: str
    chat_id: str | None = None
    rating: str  # "up" | "down"
    category: str | None = None  # "Inaccurate" | "Not relevant" | "Incomplete" | "Harmful" (tiered feedback)
    comment: str | None = None  # Optional "Tell us more" free text


@router.post("/feedback")
async def submit_message_feedback(
    body: MessageFeedback,
    current_user = Depends(get_current_user)
):
    """Record thumbs-up / thumbs-down feedback for a Horus response. Persisted to DB via Activity."""
    user_id = get_user_id(current_user)
    desc = body.comment or ""
    if body.category:
        desc = f"{body.category}" + (f"\n\n{desc}" if desc else "")
    try:
        from app.activity.service import ActivityService
        await ActivityService.log_activity(
            user_id=user_id,
            type="horus_feedback",
            title=f"Feedback: {body.rating}",
            description=desc,
            entity_id=body.message_id,
            entity_type="message",
            metadata={
                "message_id": body.message_id,
                "chat_id": body.chat_id,
                "rating": body.rating,
                "category": body.category,
            },
        )
    except Exception as e:
        logger.warning(f"Failed to persist Horus feedback: {e}")
    return {"status": "ok", "message_id": body.message_id}

