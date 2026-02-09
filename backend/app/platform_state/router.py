"""
Platform State API Router

Endpoints:
- POST /state/files - Record file upload (modules write)
- POST /state/files/{id}/analyze - Record file analysis (modules write)
- POST /state/evidence - Record evidence creation (modules write)
- POST /state/gaps - Record gap definition (modules write)
- POST /state/metrics - Record metric update (modules write)

- GET /state/summary - Get state summary (Horus reads)
- GET /state/files - List files
- GET /state/evidence - List evidence
- GET /state/gaps - List gaps
- GET /state/metrics - List metrics
- GET /state/events - Get event log
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from app.auth.dependencies import get_current_user
from app.core.db import get_db, Prisma
from .service import StateService
from .models import PlatformFile, PlatformEvidence, PlatformGap, PlatformMetric, StateSummary

router = APIRouter(prefix="/state", tags=["platform-state"])


# ═══════════════════════════════════════════════════════════════════════════════
# WRITE ENDPOINTS (Modules call these)
# ═══════════════════════════════════════════════════════════════════════════════

class FileUploadRequest(BaseModel):
    fileId: str
    name: str
    file_type: str
    size: int

@router.post("/files", response_model=PlatformFile)
async def record_file_upload(
    request: FileUploadRequest,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record a file upload. Called by file upload handlers."""
    service = StateService(db)
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await service.record_file_upload(
        user_id=user_id,
        file_id=request.fileId,
        name=request.name,
        file_type=request.file_type,
        size=request.size
    )


class FileAnalysisRequest(BaseModel):
    standards: List[str]
    document_type: Optional[str] = None
    clauses: List[str] = []
    confidence: float = 0

@router.post("/files/{file_id}/analyze", response_model=PlatformFile)
async def record_file_analysis(
    file_id: str,
    request: FileAnalysisRequest,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record file analysis results."""
    service = StateService(db)
    return await service.record_file_analysis(
        file_id=file_id,
        standards=request.standards,
        document_type=request.document_type,
        clauses=request.clauses,
        confidence=request.confidence
    )


class EvidenceRequest(BaseModel):
    evidence_id: str
    title: str
    ev_type: str
    criteria_refs: List[str] = []

@router.post("/evidence", response_model=PlatformEvidence)
async def record_evidence_created(
    request: EvidenceRequest,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record evidence scope creation."""
    service = StateService(db)
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await service.record_evidence_created(
        user_id=user_id,
        evidence_id=request.evidence_id,
        title=request.title,
        ev_type=request.ev_type,
        criteria_refs=request.criteria_refs
    )


class EvidenceLinkRequest(BaseModel):
    file_ids: List[str]

@router.post("/evidence/{evidence_id}/link")
async def record_evidence_linked(
    evidence_id: str,
    request: EvidenceLinkRequest,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record evidence linked to files."""
    service = StateService(db)
    await service.record_evidence_linked(evidence_id, request.file_ids)
    return {"status": "ok"}


class GapRequest(BaseModel):
    gap_id: str
    standard: str
    clause: str
    description: str
    severity: str = "medium"

@router.post("/gaps", response_model=PlatformGap)
async def record_gap_defined(
    request: GapRequest,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record gap definition."""
    service = StateService(db)
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await service.record_gap_defined(
        user_id=user_id,
        gap_id=request.gap_id,
        standard=request.standard,
        clause=request.clause,
        description=request.description,
        severity=request.severity
    )


class GapAddressRequest(BaseModel):
    evidence_id: str

@router.post("/gaps/{gap_id}/address")
async def record_gap_addressed(
    gap_id: str,
    request: GapAddressRequest,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record gap addressed by evidence."""
    service = StateService(db)
    await service.record_gap_addressed(gap_id, request.evidence_id)
    return {"status": "ok"}


@router.post("/gaps/{gap_id}/close")
async def record_gap_closed(
    gap_id: str,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record gap closure."""
    service = StateService(db)
    await service.record_gap_closed(gap_id)
    return {"status": "ok"}


class MetricRequest(BaseModel):
    metric_id: str
    name: str
    value: float
    source_module: str

@router.post("/metrics", response_model=PlatformMetric)
async def record_metric_update(
    request: MetricRequest,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record metric update."""
    service = StateService(db)
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await service.record_metric_update(
        user_id=user_id,
        metric_id=request.metric_id,
        name=request.name,
        value=request.value,
        source_module=request.source_module
    )
        metric_id=metric_id,
        name=name,
        value=value,
        source_module=source_module
    )


# ═══════════════════════════════════════════════════════════════════════════════
# READ ENDPOINTS (Horus and frontend call these)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/summary", response_model=StateSummary)
async def get_state_summary(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get current platform state summary."""
    service = StateService(db)
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await service.get_current_state(user_id)


@router.get("/files", response_model=List[PlatformFile])
async def list_files(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all files for user."""
    manager = StateService(db).manager
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await manager.get_files_by_user(user_id)


@router.get("/evidence", response_model=List[PlatformEvidence])
async def list_evidence(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all evidence for user."""
    manager = StateService(db).manager
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await manager.get_evidence_by_user(user_id)


@router.get("/gaps", response_model=List[PlatformGap])
async def list_gaps(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all gaps for user."""
    manager = StateService(db).manager
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await manager.get_gaps_by_user(user_id)


@router.get("/metrics", response_model=List[PlatformMetric])
async def list_metrics(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all metrics for user."""
    manager = StateService(db).manager
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await manager.get_metrics_by_user(user_id)


@router.get("/events")
async def get_events(
    limit: int = 50,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get recent events."""
    manager = StateService(db).manager
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    return await manager.get_recent_events(user_id, limit)
