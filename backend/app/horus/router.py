"""
Horus AI API Router

Conversational AI with full platform awareness.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from app.auth.dependencies import get_current_user
from app.core.db import get_db, Prisma
from .service import HorusService, Observation
from app.platform_state.models import PlatformStateManager
import traceback

router = APIRouter(prefix="/horus", tags=["horus"])


def get_user_id(current_user):
    """Safely extract user_id from current_user."""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if isinstance(current_user, dict):
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user data")
        return user_id
    # Object with id attribute
    if hasattr(current_user, 'id'):
        return current_user.id
    raise HTTPException(status_code=401, detail="Invalid user format")


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
    try:
        user_id = get_user_id(current_user)
        state_manager = PlatformStateManager(db)
        horus = HorusService(state_manager)
        
        return await horus.chat(
            user_id=user_id,
            message=query
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Horus error: {e}")
        print(traceback.format_exc())
        return Observation(
            content=f"⚠️ I encountered an error: {str(e)}",
            timestamp=__import__('datetime').datetime.utcnow(),
            state_hash="error"
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
    try:
        user_id = get_user_id(current_user)
        state_manager = PlatformStateManager(db)
        horus = HorusService(state_manager)
        
        return await horus.chat(
            user_id=user_id,
            message=query
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Horus error: {e}")
        print(traceback.format_exc())
        return Observation(
            content=f"⚠️ I encountered an error: {str(e)}",
            timestamp=__import__('datetime').datetime.utcnow(),
            state_hash="error"
        )


@router.get("/state/files")
async def get_files_detailed_state(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed files state breakdown."""
    user_id = get_user_id(current_user)
    state_manager = PlatformStateManager(db)
    horus = HorusService(state_manager)
    
    return await horus.get_files_state(user_id)


@router.get("/state/gaps")
async def get_gaps_detailed_state(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed gaps state breakdown."""
    user_id = get_user_id(current_user)
    state_manager = PlatformStateManager(db)
    horus = HorusService(state_manager)
    
    return await horus.get_gaps_state(user_id)


@router.get("/state/evidence")
async def get_evidence_detailed_state(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed evidence state breakdown."""
    user_id = get_user_id(current_user)
    state_manager = PlatformStateManager(db)
    horus = HorusService(state_manager)
    
    return await horus.get_evidence_state(user_id)
