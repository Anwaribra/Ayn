from fastapi import APIRouter, status, Depends, UploadFile, File, Request
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
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload evidence file.
    """
    return await EvidenceService.upload_evidence(file, current_user)


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


@router.get("/", response_model=List[EvidenceResponse])
async def list_evidence(
    current_user: dict = Depends(get_current_user)
):
    """
    List evidence files.
    """
    return await EvidenceService.list_evidence(current_user)
