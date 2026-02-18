from fastapi import APIRouter, status, Depends, File, UploadFile
from typing import List
from pydantic import BaseModel
from app.core.middlewares import get_current_user
from app.auth.dependencies import require_admin
from app.standards.models import (
    StandardCreateRequest,
    StandardUpdateRequest,
    StandardResponse,
    CriterionCreateRequest,
    CriterionUpdateRequest,
    CriterionResponse
)
from app.standards.service import StandardService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ==================== Standards Endpoints ====================

@router.get("", response_model=List[StandardResponse])
async def list_standards(
    current_user: dict = Depends(get_current_user)
):
    """
    List all standards.
    """
    return await StandardService.list_standards()


@router.post("", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_standard(
    request: StandardCreateRequest,
    current_user: dict = Depends(require_admin)
):
    """
    Create a new standard.
    """
    return await StandardService.create_standard(request, current_user["email"])


@router.put("/{standard_id}", response_model=StandardResponse)
async def update_standard(
    standard_id: str,
    request: StandardUpdateRequest,
    current_user: dict = Depends(require_admin)
):
    """
    Update a standard.
    """
    return await StandardService.update_standard(standard_id, request, current_user["email"])


@router.get("/{standard_id}", response_model=StandardResponse)
async def get_standard(
    standard_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a standard by ID.
    """
    return await StandardService.get_standard(standard_id)


class ImportRequest(BaseModel):
    text: str

@router.post("/import", response_model=StandardResponse)
async def import_standard(
    request: ImportRequest,
    current_user: dict = Depends(require_admin)
):
    """
    Import a standard from document text (AI-assisted).
    """
    return await StandardService.import_standard_from_document(request.text, current_user["email"])

@router.post("/import-pdf", response_model=StandardResponse)
async def import_standard_pdf(
    file: UploadFile = File(...)
):
    """
    Import a standard from a PDF file (AI-assisted, Public).
    """
    file_bytes = await file.read()
    return await StandardService.import_standard_from_pdf(file_bytes, file.filename)


# ==================== Criteria Endpoints ====================

@router.get("/{standard_id}/criteria", response_model=List[CriterionResponse])
async def list_criteria_for_standard(
    standard_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    List all criteria for a specific standard.
    """
    return await StandardService.list_criteria(standard_id)


@router.post("/{standard_id}/criteria", response_model=CriterionResponse, status_code=status.HTTP_201_CREATED)
async def create_criterion(
    standard_id: str,
    request: CriterionCreateRequest,
    current_user: dict = Depends(require_admin)
):
    """
    Create a new criterion for a standard.
    """
    return await StandardService.create_criterion(standard_id, request, current_user["email"])


@router.put("/criteria/{criterion_id}", response_model=CriterionResponse)
async def update_criterion(
    criterion_id: str,
    request: CriterionUpdateRequest,
    current_user: dict = Depends(require_admin)
):
    """
    Update a criterion.
    """
    return await StandardService.update_criterion(criterion_id, request, current_user["email"])
