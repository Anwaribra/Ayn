"""
Horus AI API Router

Conversational AI with full platform awareness.
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.auth.dependencies import get_current_user
from app.core.db import get_db, Prisma
from .service import HorusService, Observation
from app.platform_state.models import PlatformStateManager

router = APIRouter(prefix="/horus", tags=["horus"])


@router.get("/observe", response_model=Observation)
async def horus_chat(
    query: Optional[str] = Query(None, description="User message to Horus"),
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Chat with Horus AI.
    
    Horus is a conversational AI with full platform awareness.
    - Talk naturally like ChatGPT
    - Horus always sees platform state
    - Ask for help/suggestions anytime
    - Request actions when needed
    """
    state_manager = PlatformStateManager(db)
    horus = HorusService(state_manager)
    
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    return await horus.chat(
        user_id=user_id,
        message=query
    )


@router.post("/chat", response_model=Observation)
async def horus_chat_post(
    query: Optional[str] = Query(None, description="User message to Horus"),
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Chat with Horus AI (POST method for longer messages).
    """
    state_manager = PlatformStateManager(db)
    horus = HorusService(state_manager)
    
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    return await horus.chat(
        user_id=user_id,
        message=query
    )


@router.get("/state/files")
async def get_files_detailed_state(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed files state breakdown."""
    state_manager = PlatformStateManager(db)
    horus = HorusService(state_manager)
    
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await horus.get_files_state(user_id)


@router.get("/state/gaps")
async def get_gaps_detailed_state(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed gaps state breakdown."""
    state_manager = PlatformStateManager(db)
    horus = HorusService(state_manager)
    
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await horus.get_gaps_state(user_id)


@router.get("/state/evidence")
async def get_evidence_detailed_state(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed evidence state breakdown."""
    state_manager = PlatformStateManager(db)
    horus = HorusService(state_manager)
    
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await horus.get_evidence_state(user_id)
