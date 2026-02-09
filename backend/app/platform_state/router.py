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
from app.auth.dependencies import get_current_user
from app.core.db import get_db, Prisma
from .service import StateService
from .models import PlatformFile, PlatformEvidence, PlatformGap, PlatformMetric, StateSummary

router = APIRouter(prefix="/state", tags=["platform-state"])


# ═══════════════════════════════════════════════════════════════════════════════
# WRITE ENDPOINTS (Modules call these)
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/files", response_model=PlatformFile)
async def record_file_upload(
    file_id: str,
    name: str,
    file_type: str,
    size: int,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record a file upload. Called by file upload handlers."""
    service = StateService(db)
    return await service.record_file_upload(
        user_id=current_user.id,
        file_id=file_id,
        name=name,
        file_type=file_type,
        size=size
    )


@router.post("/files/{file_id}/analyze", response_model=PlatformFile)
async def record_file_analysis(
    file_id: str,
    standards: List[str],
    document_type: Optional[str] = None,
    clauses: List[str] = [],
    confidence: float = 0,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record file analysis results."""
    service = StateService(db)
    return await service.record_file_analysis(
        file_id=file_id,
        standards=standards,
        document_type=document_type,
        clauses=clauses,
        confidence=confidence
    )


@router.post("/evidence", response_model=PlatformEvidence)
async def record_evidence_created(
    evidence_id: str,
    title: str,
    ev_type: str,
    criteria_refs: List[str] = [],
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record evidence scope creation."""
    service = StateService(db)
    return await service.record_evidence_created(
        user_id=current_user.id,
        evidence_id=evidence_id,
        title=title,
        ev_type=ev_type,
        criteria_refs=criteria_refs
    )


@router.post("/evidence/{evidence_id}/link")
async def record_evidence_linked(
    evidence_id: str,
    file_ids: List[str],
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record evidence linked to files."""
    service = StateService(db)
    await service.record_evidence_linked(evidence_id, file_ids)
    return {"status": "ok"}


@router.post("/gaps", response_model=PlatformGap)
async def record_gap_defined(
    gap_id: str,
    standard: str,
    clause: str,
    description: str,
    severity: str = "medium",
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record gap definition."""
    service = StateService(db)
    return await service.record_gap_defined(
        user_id=current_user.id,
        gap_id=gap_id,
        standard=standard,
        clause=clause,
        description=description,
        severity=severity
    )


@router.post("/gaps/{gap_id}/address")
async def record_gap_addressed(
    gap_id: str,
    evidence_id: str,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record gap addressed by evidence."""
    service = StateService(db)
    await service.record_gap_addressed(gap_id, evidence_id)
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


@router.post("/metrics", response_model=PlatformMetric)
async def record_metric_update(
    metric_id: str,
    name: str,
    value: float,
    source_module: str,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record metric update."""
    service = StateService(db)
    return await service.record_metric_update(
        user_id=current_user.id,
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
    return await service.get_current_state(current_user.id)


@router.get("/files", response_model=List[PlatformFile])
async def list_files(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all files for user."""
    manager = StateService(db).manager
    return await manager.get_files_by_user(current_user.id)


@router.get("/evidence", response_model=List[PlatformEvidence])
async def list_evidence(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all evidence for user."""
    manager = StateService(db).manager
    return await manager.get_evidence_by_user(current_user.id)


@router.get("/gaps", response_model=List[PlatformGap])
async def list_gaps(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all gaps for user."""
    manager = StateService(db).manager
    return await manager.get_gaps_by_user(current_user.id)


@router.get("/metrics", response_model=List[PlatformMetric])
async def list_metrics(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all metrics for user."""
    manager = StateService(db).manager
    return await manager.get_metrics_by_user(current_user.id)


@router.get("/events")
async def get_events(
    limit: int = 50,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get recent events."""
    manager = StateService(db).manager
    return await manager.get_recent_events(current_user.id, limit)
