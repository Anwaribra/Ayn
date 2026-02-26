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
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    events = await db.platformevent.find_many(
        where={"userId": user_id},
        order={"timestamp": "desc"},
        take=limit
    )
    return [
        {
            "id": e.id,
            "type": e.type,
            "user_id": e.userId,
            "entity_id": e.entityId,
            "metadata": e.metadata,
            "timestamp": e.timestamp,
        }
        for e in events
    ]

@router.get("/workflows")
async def get_workflows(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get system workflows status."""
    from datetime import datetime, timezone
    
    # helper for time ago
    def time_ago(dt):
        if not dt: return "Never"
        # dt is likely timezone aware (Prisma), so make 'now' aware
        now = datetime.now(timezone.utc) if dt.tzinfo else datetime.utcnow()
        diff = now - dt
        seconds = diff.total_seconds()
        if seconds < 60: return "Just now"
        if seconds < 3600: return f"{int(seconds // 60)} mins ago"
        if seconds < 86400: return f"{int(seconds // 3600)} hours ago"
        return f"{int(seconds // 86400)} days ago"

    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    # Fetch latest activities to determine "last run"
    last_file = await db.platformfile.find_first(
        where={"userId": user_id},
        order={"createdAt": "desc"}
    )
    
    last_evidence = await db.evidence.find_first(
        where={"uploadedById": user_id},
        order={"updatedAt": "desc"}
    )
    
    last_gap = await db.platformgap.find_first(
        where={"userId": user_id},
        order={"createdAt": "desc"}
    )
    
    return [
        {
            "id": "wf-001",
            "name": "Evidence Compliance Sync",
            "description": "Sync evidence files to cloud storage and update indices",
            "status": "active",
            "trigger": "On Upload",
            "lastRun": time_ago(last_file.createdAt) if last_file else "Never",
            "icon": "Zap",
            "color": "text-amber-500",
            "bg": "bg-amber-500/10"
        },
        {
            "id": "wf-002",
            "name": "Evidence Sync Pipeline",
            "description": "Daily synchronization of institutional evidence assets",
            "status": "active",
            "trigger": "Daily at 02:00",
            "lastRun": time_ago(last_evidence.updatedAt) if last_evidence else "6 hours ago",
            "icon": "Activity",
            "color": "text-blue-500",
            "bg": "bg-blue-500/10"
        },
        {
            "id": "wf-003",
            "name": "Alignment Report Generator",
            "description": "Generate weekly framework alignment summary reports",
            "status": "paused",
            "trigger": "Weekly on Monday",
            "lastRun": time_ago(last_gap.createdAt) if last_gap else "5 days ago",
            "icon": "Workflow",
            "color": "text-emerald-500",
            "bg": "bg-emerald-500/10"
        },
        {
            "id": "wf-004",
            "name": "Notification Digest",
            "description": "Send daily notification digest to inactive users",
            "status": "draft",
            "trigger": "Manual",
            "lastRun": "Never",
            "icon": "Clock",
            "color": "text-purple-500",
            "bg": "bg-purple-500/10"
        },
    ]
