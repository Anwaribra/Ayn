import uuid
from datetime import datetime, UTC, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from v2.core.database import get_db_session
from app.core.middlewares import get_current_user
from v2.modules.standards.router import get_active_campus_id
from v2.modules.tasks.models import Task, TaskStatus, TaskPriority
from v2.modules.validation.models import Risk, RiskStatus, RiskSeverity
from v2.modules.standards.models import CampusRequirement, RequirementStatus, Requirement, Criterion, Standard
from v2.modules.evidence.models import EvidenceValidation, Evidence

router = APIRouter(prefix="", tags=["validation"])

@router.get("/action-center/summary")
async def get_action_center_summary(
    campus_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Get aggregated summary count metrics for the Action Center dashboard.
    """
    active_campus = await get_active_campus_id(db, current_user["id"], campus_id)
    
    # 1. My Tasks Count (OPEN or IN_PROGRESS)
    tasks_stmt = select(func.count(Task.id)).where(
        (Task.campus_id == active_campus) & 
        (Task.status.in_([TaskStatus.OPEN, TaskStatus.IN_PROGRESS]))
    )
    tasks_count = (await db.execute(tasks_stmt)).scalar() or 0
    
    # 2. Open Risks Count (OPEN status)
    risks_stmt = select(func.count(Risk.id)).where(
        (Risk.campus_id == active_campus) & 
        (Risk.status == RiskStatus.OPEN)
    )
    risks_count = (await db.execute(risks_stmt)).scalar() or 0
    
    # 3. Missing Evidence Count (where requirement is NOT_ASSESSED or has a MISSING_EVIDENCE risk)
    missing_reqs_stmt = select(func.count(CampusRequirement.id)).where(
        (CampusRequirement.campus_id == active_campus) &
        (CampusRequirement.status == RequirementStatus.NOT_ASSESSED)
    )
    missing_count = (await db.execute(missing_reqs_stmt)).scalar() or 0
    
    # 4. Needs Review (validations with low confidence < 0.7 or validation status 'NEEDS_REVIEW')
    # Or evidence marked as ANALYZED but not yet VALIDATED
    needs_review_stmt = select(func.count(EvidenceValidation.id)).join(
        Evidence, Evidence.id == EvidenceValidation.evidence_id
    ).where(
        (Evidence.campus_id == active_campus) &
        ((EvidenceValidation.status == "NEEDS_REVIEW") | (EvidenceValidation.confidence < 0.7))
    )
    needs_review_count = (await db.execute(needs_review_stmt)).scalar() or 0
    
    # 5. Expiring Documents (Tasks or evidence expiring within next 30 days)
    now = datetime.now(UTC)
    expiry_threshold = now + timedelta(days=30)
    expiring_stmt = select(func.count(Task.id)).where(
        (Task.campus_id == active_campus) &
        (Task.status.in_([TaskStatus.OPEN, TaskStatus.IN_PROGRESS])) &
        (Task.due_date >= now) &
        (Task.due_date <= expiry_threshold)
    )
    expiring_count = (await db.execute(expiring_stmt)).scalar() or 0

    # 6. Covered requirements count (FULLY_COVERED)
    covered_stmt = select(func.count(CampusRequirement.id)).where(
        (CampusRequirement.campus_id == active_campus) &
        (CampusRequirement.status == RequirementStatus.FULLY_COVERED)
    )
    covered_count = (await db.execute(covered_stmt)).scalar() or 0

    # 7. Partial requirements count (PARTIALLY_COVERED)
    partial_stmt = select(func.count(CampusRequirement.id)).where(
        (CampusRequirement.campus_id == active_campus) &
        (CampusRequirement.status == RequirementStatus.PARTIALLY_COVERED)
    )
    partial_count = (await db.execute(partial_stmt)).scalar() or 0
    
    return {
        "tasks_count": tasks_count,
        "risks_count": risks_count,
        "missing_evidence_count": missing_count,
        "needs_review_count": needs_review_count,
        "expiring_documents_count": expiring_count,
        "covered_requirements_count": covered_count,
        "partial_requirements_count": partial_count,
        "missing_requirements_count": missing_count # Same as NOT_ASSESSED count
    }


@router.get("/risks")
async def list_risks(
    campus_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    """
    List open risks for the active campus, enriched with linked standard and requirement info.
    """
    active_campus = await get_active_campus_id(db, current_user["id"], campus_id)
    
    stmt = select(Risk).where(
        (Risk.campus_id == active_campus) & 
        (Risk.status == RiskStatus.OPEN)
    ).order_by(Risk.created_at.desc())
    
    risks = (await db.execute(stmt)).scalars().all()
    
    enriched_risks = []
    for r in risks:
        linked_standard_title = None
        linked_requirement_title = None
        
        req_uuid = None
        if r.reference_type == "requirement" and r.reference_id:
            try:
                req_uuid = uuid.UUID(r.reference_id)
            except ValueError:
                pass
                
        if req_uuid:
            req_stmt = select(Requirement, Criterion, Standard).join(
                Criterion, Criterion.id == Requirement.criterion_id
            ).join(
                Standard, Standard.id == Criterion.standard_id
            ).where(Requirement.id == req_uuid)
            req_res = (await db.execute(req_stmt)).first()
            if req_res:
                req_obj, crit_obj, std_obj = req_res
                linked_standard_title = std_obj.code or std_obj.title
                linked_requirement_title = req_obj.title
                
        enriched_risks.append({
            "id": str(r.id),
            "campus_id": str(r.campus_id),
            "type": r.type,
            "description": r.description,
            "severity": r.severity,
            "status": r.status,
            "reference_type": r.reference_type,
            "reference_id": r.reference_id,
            "linked_standard_title": linked_standard_title,
            "linked_requirement_title": linked_requirement_title,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
        
    return enriched_risks
