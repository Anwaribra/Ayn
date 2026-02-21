from fastapi import APIRouter, status, Depends, File, UploadFile, BackgroundTasks, HTTPException
from app.db.session import get_db
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
from app.standards.mapping_service import analyze_standard_criteria
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
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin)
):
    """
    Import a standard from a PDF file (AI-assisted, Admin only).
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


class CoverageResponse(BaseModel):
    standardId: str
    totalCriteria: int
    coveredCriteria: int
    coveragePct: float


@router.get("/{standard_id}/coverage", response_model=CoverageResponse)
async def get_standard_coverage(
    standard_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get criteria vs. evidence coverage for a standard.
    Returns the number of criteria that have at least one evidence item linked.
    """
    return await StandardService.get_coverage(standard_id, current_user)

# ==================== Map / Analyze Endpoints ====================

@router.post("/{standard_id}/analyze")
async def start_standard_analysis(
    standard_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Start background AI analysis for criteria mapping."""
    institution_id = current_user.get("institutionId")
    if not institution_id:
        raise HTTPException(status_code=400, detail="User does not have an institution associated.")
        
    # We ideally want to validate standard exists, but mapping_service will handle it.
    background_tasks.add_task(analyze_standard_criteria, standard_id, institution_id)
    return {"status": "analyzing", "message": "Analysis started"}

@router.get("/{standard_id}/mappings")
async def get_standard_mappings(
    standard_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all criteria mappings for a standard for the current institution."""
    institution_id = current_user.get("institutionId")
    if not institution_id:
        raise HTTPException(status_code=400, detail="User does not have an institution associated.")
        
    async for db in get_db():
        standard = await db.standard.find_unique(where={"id": standard_id}, include={"criteria": True})
        if not standard:
            raise HTTPException(status_code=404, detail="Standard not found")
            
        mappings = await db.criteriamapping.find_many(
            where={
                "standardId": standard_id,
                "institutionId": institution_id
            },
            include={"criterion": True}
        )
        
        total = len(standard.criteria) if standard.criteria else 0
        mapped_count = len(mappings)
        met = sum(1 for m in mappings if m.status == "met")
        partial = sum(1 for m in mappings if m.status == "partial")
        gap = sum(1 for m in mappings if m.status == "gap")
        
        mapping_results = []
        for m in mappings:
            # We already expect criteria title to contain code [code] title
            code = m.criterion.title.split(']')[0].replace('[', '') if m.criterion and '[' in m.criterion.title else "N/A"
            title = m.criterion.title.split(']')[1].strip() if m.criterion and ']' in m.criterion.title else (m.criterion.title if m.criterion else "")
            
            mapping_results.append({
                "criterion_id": m.criterionId,
                "criterion_code": code,
                "criterion_title": title,
                "status": m.status,
                "confidence_score": m.confidenceScore,
                "ai_reasoning": m.aiReasoning,
                "evidence_id": m.evidenceId
            })
            
        return {
            "standard_id": standard_id,
            "standard_name": standard.title,
            "total_criteria": total,
            "mapped": mapped_count,
            "met": met,
            "partial": partial,
            "gap": gap,
            "mappings": mapping_results
        }

@router.get("/{standard_id}/mappings/status")
async def get_mapping_status(
    standard_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get just the counts/status of analysis for polling."""
    institution_id = current_user.get("institutionId")
    if not institution_id:
        raise HTTPException(status_code=400, detail="User does not have an institution associated.")
        
    async for db in get_db():
        # Using prisma to count mappings
        mappings = await db.criteriamapping.find_many(
            where={
                "standardId": standard_id,
                "institutionId": institution_id
            }
        )
        
        standard = await db.standard.find_unique(where={"id": standard_id}, include={"criteria": True})
        if not standard:
            raise HTTPException(status_code=404, detail="Standard not found")
            
        total = len(standard.criteria) if standard.criteria else 0
        mapped_count = len(mappings)
        
        # Check GapAnalysis mapping for this standard/institution to indicate completeness
        gap_record = await db.gapanalysis.find_first(
            where={
                "standardId": standard_id,
                "institutionId": institution_id
            },
            order={"createdAt": "desc"}
        )
        
        if mapped_count == 0:
            status_val = "not_started"
        elif gap_record and len(mappings) > 0 and (mapped_count >= total):
            status_val = "complete"
        elif mapped_count > 0 and mapped_count < total:
             # In progress or incomplete
             status_val = "analyzing"
        else:
            status_val = "complete" if gap_record else "analyzing"
            
        return {
            "status": status_val,
            "mapped": mapped_count,
            "total": total
        }
