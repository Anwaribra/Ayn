"""
Horus API Router

Read-only endpoints for platform intelligence.
Horus observes state and produces observations.
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.auth.dependencies import get_current_user
from app.core.db import get_db, Prisma
from .service import HorusService, Observation
from app.platform_state.models import PlatformStateManager

router = APIRouter(prefix="/horus", tags=["horus"])


@router.get("/observe", response_model=Observation)
async def observe_state(
    query: Optional[str] = Query(None, description="Optional query context"),
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get a state observation from Horus.
    
    Returns current platform state description.
    Never recommendations or actions.
    """
    state_manager = PlatformStateManager(db)
    horus = HorusService(state_manager)
    
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await horus.observe(
        user_id=user_id,
        query=query
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
