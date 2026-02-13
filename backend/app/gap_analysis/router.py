"""Gap analysis router - AI-powered gap report generation and management."""
from fastapi import APIRouter, status, Depends
from typing import List
import logging
from app.core.middlewares import get_current_user
from app.gap_analysis.models import (
    GapAnalysisRequest,
    GapAnalysisResponse,
    GapAnalysisListItem,
    ArchiveRequest,
)
from app.gap_analysis.service import GapAnalysisService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate", response_model=GapAnalysisResponse, status_code=status.HTTP_201_CREATED)
async def generate_gap_analysis_report(
    request: GapAnalysisRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate a new AI-powered gap analysis report.
    """
    return await GapAnalysisService.generate_report(request, current_user)


@router.get("", response_model=List[GapAnalysisListItem])
async def list_gap_analyses(
    current_user: dict = Depends(get_current_user),
):
    """List all gap analysis reports for the user's institution."""
    return await GapAnalysisService.list_reports(current_user, archived=False)


@router.get("/archived/list", response_model=List[GapAnalysisListItem])
async def list_archived_gap_analyses(
    current_user: dict = Depends(get_current_user),
):
    """List all archived gap analysis reports for the user's institution."""
    return await GapAnalysisService.list_reports(current_user, archived=True)


@router.get("/{gap_analysis_id}", response_model=GapAnalysisResponse)
async def get_gap_analysis(
    gap_analysis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a specific gap analysis report by ID."""
    return await GapAnalysisService.get_report(gap_analysis_id, current_user)


@router.delete("/{gap_analysis_id}", status_code=status.HTTP_200_OK)
async def delete_gap_analysis(
    gap_analysis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a gap analysis report."""
    await GapAnalysisService.delete_report(gap_analysis_id, current_user)
    return {"message": "Gap analysis deleted successfully"}


@router.post("/{gap_analysis_id}/archive", status_code=status.HTTP_200_OK)
async def archive_gap_analysis(
    gap_analysis_id: str,
    request: ArchiveRequest,
    current_user: dict = Depends(get_current_user),
):
    """Archive or unarchive a gap analysis report."""
    await GapAnalysisService.archive_report(gap_analysis_id, request.archived, current_user)
    action = "archived" if request.archived else "unarchived"
    return {"message": f"Gap analysis {action} successfully"}
