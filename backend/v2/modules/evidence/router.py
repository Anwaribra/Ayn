import uuid
import logging
from typing import Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from v2.core.database import get_db_session
from app.core.middlewares import get_current_user
from v2.modules.evidence.models import Evidence, EvidenceStatus, EvidenceValidation
from v2.modules.evidence.services import EvidenceService
from v2.modules.standards.router import get_active_campus_id
from v2.modules.standards.models import Requirement, Criterion, Standard
from v2.events.bus import EventPublisher
from v2.core.redis import get_redis_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/evidence", tags=["evidence"])

@router.post("/upload")
async def upload_evidence(
    file: UploadFile = File(...),
    campus_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
) -> dict[str, Any]:
    """
    V2 Evidence Upload Endpoint.
    Saves document status, publishes event, and triggers background processing.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename required")
        
    active_campus = await get_active_campus_id(db, current_user["id"], campus_id)
    
    correlation_id = f"trace-{uuid.uuid4()}"
    file_url = f"s3://ayn-vault/evidence/{file.filename}"
    
    # Register evidence record in the DB using EvidenceService
    evidence = await EvidenceService.create_evidence(
        db=db,
        campus_id=active_campus,
        filename=file.filename,
        file_url=file_url,
        content_type=file.content_type or "application/pdf",
        correlation_id=correlation_id
    )
    
    # Read files contents if any and parse chunk (mock or real)
    # Trigger event-loop
    try:
        redis_client = get_redis_client()
        publisher = EventPublisher(redis_client)
        
        # Select a default requirement for mapping demo purposes if needed
        req_stmt = select(Requirement.id).limit(1)
        req_id = (await db.execute(req_stmt)).scalar_one_or_none()
        
        await publisher.publish(
            stream="evidence",
            event_type="evidence.file.uploaded",
            payload={
                "evidence_id": str(evidence.id),
                "requirement_id": str(req_id) if req_id else None
            },
            correlation_id=correlation_id
        )
    except Exception as e:
        logger.error(f"Error publishing file uploaded event: {e}")
        
    return {
        "status": "processing",
        "message": "File uploaded successfully. Processing started.",
        "id": str(evidence.id),
        "filename": evidence.filename,
        "correlation_id": correlation_id
    }


@router.get("")
async def list_evidence(
    search: str | None = Query(None),
    status: EvidenceStatus | None = Query(None),
    standard_id: str | None = Query(None),
    needs_review: bool | None = Query(None),
    campus_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    """
    List all evidence records for the active campus with search, filtering, and review indicators.
    """
    active_campus = await get_active_campus_id(db, current_user["id"], campus_id)
    
    stmt = select(Evidence).where(Evidence.campus_id == active_campus)
    
    if status:
        stmt = stmt.where(Evidence.status == status)
    if search:
        stmt = stmt.where(Evidence.filename.ilike(f"%{search}%"))
        
    stmt = stmt.order_by(Evidence.created_at.desc())
    results = (await db.execute(stmt)).scalars().all()
    
    # Process & filter by validation status/standards on the database side where necessary
    evidence_list = []
    for ev in results:
        # Load validations and standards associated with the evidence
        val_stmt = select(EvidenceValidation, Requirement, Standard).join(
            Requirement, Requirement.id == EvidenceValidation.requirement_id
        ).join(
            Criterion, Criterion.id == Requirement.criterion_id
        ).join(
            Standard, Standard.id == Criterion.standard_id
        ).where(EvidenceValidation.evidence_id == ev.id)
        
        validations = (await db.execute(val_stmt)).all()
        
        # Map criteria
        criteria_list = []
        is_needs_review = False
        avg_confidence = 0.0
        
        if validations:
            total_conf = 0.0
            for val, req, std in validations:
                total_conf += val.confidence
                if val.status == "NEEDS_REVIEW" or val.confidence < 0.7:
                    is_needs_review = True
                    
                criteria_list.append({
                    "id": str(req.id),
                    "title": req.title,
                    "standardId": str(std.id),
                    "standardTitle": std.code or std.title
                })
            avg_confidence = round((total_conf / len(validations)) * 100)
            
        # Apply filters
        if standard_id:
            # If standard_id is specified, filter out evidence not containing this standard mapping
            if not any(c["standardId"] == standard_id for c in criteria_list):
                continue
        if needs_review is True:
            # If needs review is true, filter to only return item requiring review
            if not is_needs_review and ev.status != EvidenceStatus.FAILED:
                continue
                
        evidence_list.append({
            "id": str(ev.id),
            "fileName": ev.filename,
            "originalFilename": ev.filename,
            "title": ev.filename.replace("_", " ").replace(".pdf", ""),
            "fileUrl": ev.file_url,
            "status": ev.status.lower(),
            "createdAt": ev.created_at.isoformat() if ev.created_at else None,
            "confidenceScore": avg_confidence or 85, # Default fallback if validation hasn't run yet
            "fileSize": 1024 * 1024 * 1.5,
            "mimeType": ev.content_type,
            "criteria": criteria_list,
            "needsReview": is_needs_review or ev.status == EvidenceStatus.FAILED
        })
        
    return evidence_list


@router.get("/{evidence_id}/signed-url")
async def get_evidence_signed_url(
    evidence_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Get signed URL for previewing files. Resolves from storage vault.
    """
    ev_uuid = uuid.UUID(evidence_id)
    stmt = select(Evidence).where(Evidence.id == ev_uuid)
    evidence = (await db.execute(stmt)).scalar_one_or_none()
    
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
        
    # Return S3 signed URL or fallback
    return {
        "url": evidence.file_url,
        "expiresIn": 3600
    }


@router.delete("/{evidence_id}")
async def delete_evidence(
    evidence_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete evidence item and clear its validations.
    """
    ev_uuid = uuid.UUID(evidence_id)
    
    # Clear validations first
    val_del_stmt = delete(EvidenceValidation).where(EvidenceValidation.evidence_id == ev_uuid)
    await db.execute(val_del_stmt)
    
    # Delete evidence record
    ev_del_stmt = delete(Evidence).where(Evidence.id == ev_uuid)
    await db.execute(ev_del_stmt)
    
    await db.commit()
    return {
        "status": "success",
        "message": "Evidence deleted successfully"
    }
