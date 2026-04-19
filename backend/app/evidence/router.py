import csv
import io
from fastapi import APIRouter, status, Depends, UploadFile, File, Request, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from typing import List
from app.core.middlewares import get_current_user
from app.core.rate_limit import limiter
from app.evidence.models import (
    EvidenceResponse,
    UploadEvidenceResponse,
    AttachEvidenceRequest,
    AttachEvidenceResponse
)
from app.evidence.service import EvidenceService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload", response_model=UploadEvidenceResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def upload_evidence(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload evidence file.
    """
    return await EvidenceService.upload_evidence(file, current_user, background_tasks)


@router.get("/export/csv")
async def export_evidence_csv(current_user: dict = Depends(get_current_user)):
    """Export evidence list as CSV."""
    evidence_list = await EvidenceService.list_evidence(current_user, page=1, limit=1000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Title", "Document Type", "Status", "Confidence Score", "Original Filename", "Created At"])
    for ev in evidence_list:
        writer.writerow([
            ev.id, ev.title or "", ev.documentType or "", ev.status,
            ev.confidenceScore or 0, ev.originalFilename or "", 
            ev.createdAt.isoformat() if ev.createdAt else ""
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ayn-evidence-export.csv"}
    )


@router.delete("/{evidence_id}", status_code=status.HTTP_200_OK)
async def delete_evidence(
    evidence_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete evidence file.
    """
    return await EvidenceService.delete_evidence(evidence_id, current_user)


@router.post("/{evidence_id}/attach", response_model=AttachEvidenceResponse, status_code=status.HTTP_200_OK)
async def attach_evidence_to_criterion(
    evidence_id: str,
    request: AttachEvidenceRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Attach evidence to a criterion.
    """
    return await EvidenceService.attach_evidence(evidence_id, request, current_user)


@router.get("/{evidence_id}", response_model=EvidenceResponse)
async def get_evidence(
    evidence_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get evidence by ID.
    """
    return await EvidenceService.get_evidence(evidence_id)


@router.get("", response_model=List[EvidenceResponse])
async def list_evidence(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)")
):
    """
    List evidence files with pagination.
    """
    return await EvidenceService.list_evidence(current_user, page=page, limit=limit)


@router.get("/archive/list", status_code=status.HTTP_200_OK)
async def list_archived_evidence(current_user: dict = Depends(get_current_user)):
    """List deleted evidence snapshots for archive view."""
    return await EvidenceService.list_archived_evidence(current_user)
