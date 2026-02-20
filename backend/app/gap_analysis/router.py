"""Gap analysis router - AI-powered gap report generation and management."""
import io
from fastapi import APIRouter, status, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
from typing import List
import logging
from app.core.middlewares import get_current_user
from app.gap_analysis.models import (
    GapAnalysisRequest,
    GapAnalysisResponse,
    GapAnalysisListItem,
    ArchiveRequest,
    UserDTO,
)
from app.gap_analysis.service import GapAnalysisService
from app.gap_analysis.pdf_export import generate_pdf_report

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_gap_analysis_report(
    request: GapAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """
    Queue a new AI-powered gap analysis report.
    Returns 202 immediately with a jobId.
    The analysis runs in the background and notifies the user when done.
    """
    user_dto = UserDTO(**current_user)
    job = await GapAnalysisService.queue_report(request, user_dto)
    background_tasks.add_task(
        GapAnalysisService.run_report_background,
        job_id=job["jobId"],
        user_id=user_dto.id,
        institution_id=user_dto.institutionId,
        standard_id=request.standardId,
        current_user=user_dto,
    )
    return JSONResponse(status_code=202, content=job)


@router.get("", response_model=List[GapAnalysisListItem])
async def list_gap_analyses(
    current_user: dict = Depends(get_current_user),
):
    """List all gap analysis reports for the user's institution."""
    return await GapAnalysisService.list_reports(UserDTO(**current_user), archived=False)


@router.get("/archived/list", response_model=List[GapAnalysisListItem])
async def list_archived_gap_analyses(
    current_user: dict = Depends(get_current_user),
):
    """List all archived gap analysis reports for the user's institution."""
    return await GapAnalysisService.list_reports(UserDTO(**current_user), archived=True)


@router.get("/{gap_analysis_id}/export")
async def export_gap_analysis_pdf(
    gap_analysis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Export a gap analysis report as a downloadable PDF.
    Returns a StreamingResponse with Content-Disposition: attachment.
    """
    report = await GapAnalysisService.get_report(gap_analysis_id, UserDTO(**current_user))
    pdf_bytes = generate_pdf_report(report)
    filename = f"gap-analysis-{gap_analysis_id[:8]}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{gap_analysis_id}", response_model=GapAnalysisResponse)
async def get_gap_analysis(
    gap_analysis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a specific gap analysis report by ID."""
    return await GapAnalysisService.get_report(gap_analysis_id, UserDTO(**current_user))


@router.delete("/{gap_analysis_id}", status_code=status.HTTP_200_OK)
async def delete_gap_analysis(
    gap_analysis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a gap analysis report."""
    await GapAnalysisService.delete_report(gap_analysis_id, UserDTO(**current_user))
    return {"message": "Gap analysis deleted successfully"}


@router.post("/{gap_analysis_id}/archive", status_code=status.HTTP_200_OK)
async def archive_gap_analysis(
    gap_analysis_id: str,
    request: ArchiveRequest,
    current_user: dict = Depends(get_current_user),
):
    """Archive or unarchive a gap analysis report."""
    await GapAnalysisService.archive_report(gap_analysis_id, request.archived, UserDTO(**current_user))
    action = "archived" if request.archived else "unarchived"
    return {"message": f"Gap analysis {action} successfully"}
