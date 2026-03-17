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

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
from pydantic import BaseModel
from app.auth.dependencies import get_current_user
from app.core.db import get_db, Prisma
from .service import StateService
from .models import (
    PlatformFile,
    PlatformEvidence,
    PlatformGap,
    PlatformMetric,
    StateSummary,
    WorkflowDefinition,
    WorkflowCreateRequest,
    WorkflowUpdateRequest,
)
from app.activity.service import ActivityService

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

def _workflow_time_ago(dt):
    if not dt:
        return "Never"
    now = datetime.now(timezone.utc) if dt.tzinfo else datetime.now(timezone.utc).replace(tzinfo=None)
    diff = now - dt
    seconds = diff.total_seconds()
    if seconds < 60:
        return "Just now"
    if seconds < 3600:
        return f"{int(seconds // 60)} mins ago"
    if seconds < 86400:
        return f"{int(seconds // 3600)} hours ago"
    return f"{int(seconds // 86400)} days ago"


def _workflow_payload(raw: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": raw["id"],
        "name": raw.get("name", ""),
        "description": raw.get("description", "") or "Custom workflow",
        "status": raw.get("status", "draft"),
        "trigger": raw.get("trigger", "manual"),
        "lastRun": raw.get("last_run", "Never"),
        "icon": raw.get("icon", "Workflow"),
        "color": raw.get("color", "text-primary"),
        "bg": raw.get("bg", "bg-primary/10"),
    }


async def _load_workflow_definitions_raw(db: Prisma, user_id: str) -> Dict[str, Dict[str, Any]]:
    events = await db.activity.find_many(
        where={
            "userId": user_id,
            "entityType": "workflow_definition",
            "type": {"in": ["workflow_definition_created", "workflow_definition_updated", "workflow_definition_archived"]},
        },
        order={"createdAt": "asc"},
        take=5000,
    )
    definitions: Dict[str, Dict[str, Any]] = {}
    for evt in events:
        if not evt.entityId:
            continue
        meta = evt.metadata or {}
        if evt.type == "workflow_definition_created":
            data = meta.get("workflow", {})
            if data:
                definitions[evt.entityId] = data
        elif evt.type == "workflow_definition_updated":
            patch = meta.get("patch", {})
            if evt.entityId in definitions:
                definitions[evt.entityId].update(patch)
                definitions[evt.entityId]["updated_at"] = evt.createdAt
        elif evt.type == "workflow_definition_archived":
            if evt.entityId in definitions:
                definitions[evt.entityId]["status"] = "archived"
    return definitions


async def _load_workflow_definitions(db: Prisma, user_id: str) -> List[Dict[str, Any]]:
    raw = await _load_workflow_definitions_raw(db, user_id)
    return [
        _workflow_payload(WorkflowDefinition(**d).model_dump())
        for d in raw.values()
        if d.get("status") != "archived"
    ]


async def _load_last_runs(db: Prisma, user_id: str) -> Dict[str, Any]:
    events = await db.activity.find_many(
        where={"userId": user_id, "type": {"in": ["workflow_run_started", "workflow_run_updated"]}},
        order={"createdAt": "desc"},
        take=2000,
    )
    last_run: Dict[str, Any] = {}
    for evt in events:
        meta = evt.metadata or {}
        run = meta.get("run") or {}
        name = run.get("workflowName")
        if name and name not in last_run:
            last_run[name] = evt.createdAt
    return last_run


@router.get("/workflows")
async def get_workflows(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get data-backed workflow status for system pipelines."""
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    institution_id = current_user.get("institutionId") if isinstance(current_user, dict) else getattr(current_user, "institutionId", None)
    since_24h = datetime.now(timezone.utc) - timedelta(hours=24)

    last_file = await db.platformfile.find_first(where={"userId": user_id}, order={"createdAt": "desc"})
    last_evidence = await db.evidence.find_first(where={"uploadedById": user_id}, order={"updatedAt": "desc"})
    last_gap = await db.platformgap.find_first(where={"userId": user_id}, order={"createdAt": "desc"})
    last_report = await db.gapanalysis.find_first(
        where={"institutionId": institution_id} if institution_id else {"id": "__none__"},
        order={"createdAt": "desc"}
    )
    last_notification = await db.notification.find_first(where={"userId": user_id}, order={"createdAt": "desc"})

    uploads_24h = await db.platformfile.count(where={"userId": user_id, "createdAt": {"gte": since_24h}})
    processing_evidence = await db.evidence.count(where={"uploadedById": user_id, "status": "processing"})
    reports_running = await db.gapanalysis.count(
        where={"institutionId": institution_id, "status": {"in": ["pending", "running"]}}
    ) if institution_id else 0
    unread_notifications = await db.notification.count(where={"userId": user_id, "isRead": False})

    sync_status = "active" if (uploads_24h > 0 or processing_evidence > 0) else "paused"
    evidence_status = "active" if last_evidence else "draft"
    report_status = "active" if reports_running > 0 else ("paused" if last_report else "draft")
    digest_status = "active" if unread_notifications > 0 else "draft"

    system_workflows = [
        {
            "id": "wf-001",
            "name": "Evidence Compliance Sync",
            "description": "Sync evidence files to cloud storage and update indices",
            "status": sync_status,
            "trigger": "On Upload",
            "lastRun": _workflow_time_ago(last_file.createdAt) if last_file else "Never",
            "icon": "Zap",
            "color": "text-amber-500",
            "bg": "bg-amber-500/10"
        },
        {
            "id": "wf-002",
            "name": "Evidence Sync Pipeline",
            "description": "Synchronize institutional evidence assets",
            "status": evidence_status,
            "trigger": "On Evidence Update",
            "lastRun": _workflow_time_ago(last_evidence.updatedAt) if last_evidence else "Never",
            "icon": "Activity",
            "color": "text-blue-500",
            "bg": "bg-blue-500/10"
        },
        {
            "id": "wf-003",
            "name": "Alignment Report Generator",
            "description": "Generate alignment and gap reports from latest evidence",
            "status": report_status,
            "trigger": "On Analysis Request",
            "lastRun": _workflow_time_ago(last_report.createdAt) if last_report else (_workflow_time_ago(last_gap.createdAt) if last_gap else "Never"),
            "icon": "Workflow",
            "color": "text-emerald-500",
            "bg": "bg-emerald-500/10"
        },
        {
            "id": "wf-004",
            "name": "Notification Digest",
            "description": "Deliver notification digest for pending platform events",
            "status": digest_status,
            "trigger": "On New Notifications",
            "lastRun": _workflow_time_ago(last_notification.createdAt) if last_notification else "Never",
            "icon": "Clock",
            "color": "text-purple-500",
            "bg": "bg-purple-500/10"
        },
    ]

    custom = await _load_workflow_definitions(db, user_id)
    last_runs = await _load_last_runs(db, user_id)
    for wf in custom:
        wf["lastRun"] = _workflow_time_ago(last_runs.get(wf["name"]))
    return system_workflows + custom


@router.post("/workflows")
async def create_workflow(
    body: WorkflowCreateRequest,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    now = datetime.now(timezone.utc)
    workflow_id = str(uuid.uuid4())
    workflow = WorkflowDefinition(
        id=workflow_id,
        name=body.name,
        description=body.description or "Custom workflow",
        status=body.status or "draft",
        trigger=body.trigger or "manual",
        icon=body.icon or "Workflow",
        color=body.color or "text-primary",
        bg=body.bg or "bg-primary/10",
        user_id=user_id,
        created_at=now,
        updated_at=now,
        last_run="Never",
    )
    await ActivityService.log_activity(
        user_id=user_id,
        type="workflow_definition_created",
        title=f"Workflow saved: {workflow.name}",
        description=workflow.description,
        entity_id=workflow_id,
        entity_type="workflow_definition",
        metadata={"workflow": workflow.model_dump(mode="json")},
    )
    return _workflow_payload(workflow.model_dump())


@router.patch("/workflows/{workflow_id}")
async def update_workflow(
    workflow_id: str,
    body: WorkflowUpdateRequest,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    raw = await _load_workflow_definitions_raw(db, user_id)
    current = raw.get(workflow_id)
    if not current:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    patch = body.model_dump(exclude_none=True)
    patch["updated_at"] = datetime.now(timezone.utc)
    await ActivityService.log_activity(
        user_id=user_id,
        type="workflow_definition_updated",
        title=f"Workflow updated: {current.get('name', 'Workflow')}",
        description=patch.get("description"),
        entity_id=workflow_id,
        entity_type="workflow_definition",
        metadata={"patch": patch},
    )
    current.update(patch)
    return _workflow_payload(WorkflowDefinition(**current).model_dump())
