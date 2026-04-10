"""Experimental API endpoints for DeepAgents-powered research."""

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.core.db import Prisma, get_db
from app.deepagents.models import DeepResearchRequest, DeepResearchResponse
from app.deepagents.service import DeepAgentsService

router = APIRouter(prefix="/deepagents", tags=["DeepAgents"])


def _get_current_user_id(current_user) -> str:
    if isinstance(current_user, dict):
        return current_user["id"]
    return current_user.id


def _get_current_institution_id(current_user) -> str | None:
    if isinstance(current_user, dict):
        return current_user.get("institutionId")
    return getattr(current_user, "institutionId", None)


@router.get("/status", response_model=DeepResearchResponse)
async def deepagents_status(
    current_user=Depends(get_current_user),
):
    """Safe readiness check for the optional DeepAgents integration."""
    _ = _get_current_user_id(current_user)
    return DeepAgentsService.preview_configuration()


@router.post("/research", response_model=DeepResearchResponse)
async def deepagents_research(
    payload: DeepResearchRequest,
    db: Prisma = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Run an experimental DeepAgents research pass with read-only Ayn context."""
    user_id = _get_current_user_id(current_user)
    institution_id = _get_current_institution_id(current_user)
    return await DeepAgentsService.run_research(
        prompt=payload.prompt,
        db=db,
        user_id=user_id,
        institution_id=institution_id,
    )
