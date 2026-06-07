import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from v2.core.database import get_db_session
from app.core.middlewares import get_current_user
from v2.modules.standards.models import Standard, Criterion, Requirement, CampusStandard, CampusRequirement
from v2.modules.evidence.models import EvidenceValidation, Evidence

router = APIRouter(prefix="/standards", tags=["standards"])

async def get_active_campus_id(db: AsyncSession, user_id: str, campus_query: str | None = None) -> uuid.UUID:
    if campus_query:
        try:
            return uuid.UUID(campus_query)
        except ValueError:
            pass
            
    from v2.modules.organizations.models import UserCampusRole, Campus
    stmt = select(UserCampusRole.campus_id).where(UserCampusRole.user_id == uuid.UUID(user_id)).limit(1)
    res = (await db.execute(stmt)).scalar_one_or_none()
    if res:
        return res
        
    stmt_fallback = select(Campus.id).limit(1)
    res_fallback = (await db.execute(stmt_fallback)).scalar_one_or_none()
    if res_fallback:
        return res_fallback
        
    raise HTTPException(status_code=404, detail="No active campus found for the institution.")


@router.get("")
async def list_standards(
    campus_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    """
    List standards with aggregated campus readiness scores.
    """
    active_campus = await get_active_campus_id(db, current_user["id"], campus_id)
    
    # Select all standards and their readiness scores for the active campus
    stmt = select(Standard, CampusStandard.readiness_score).outerjoin(
        CampusStandard, 
        (CampusStandard.standard_id == Standard.id) & (CampusStandard.campus_id == active_campus)
    )
    result = await db.execute(stmt)
    
    standards_list = []
    for std, score in result.all():
        standards_list.append({
            "id": str(std.id),
            "title": std.title,
            "code": std.code,
            "description": std.description,
            "weight": std.weight,
            "readiness_score": score or 0.0,
            "isPublic": True, # Match frontend expectation
            "criteriaCount": 0 # Populated next
        })
        
    # Get criteria counts
    for std_data in standards_list:
        crit_stmt = select(Criterion.id).where(Criterion.standard_id == uuid.UUID(std_data["id"]))
        crits = (await db.execute(crit_stmt)).scalars().all()
        std_data["criteriaCount"] = len(crits)
        
    return standards_list


@router.get("/{standard_id}/tree")
async def get_standard_tree(
    standard_id: str,
    campus_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Get standard criteria & requirement hierarchy tree with status tracking and linked evidence.
    """
    active_campus = await get_active_campus_id(db, current_user["id"], campus_id)
    std_uuid = uuid.UUID(standard_id)
    
    # 1. Fetch standard & campus readiness score
    std_stmt = select(Standard, CampusStandard.readiness_score).outerjoin(
        CampusStandard, 
        (CampusStandard.standard_id == Standard.id) & (CampusStandard.campus_id == active_campus)
    ).where(Standard.id == std_uuid)
    std_res = (await db.execute(std_stmt)).first()
    if not std_res:
        raise HTTPException(status_code=404, detail="Standard not found")
        
    std, readiness_score = std_res
    
    # 2. Fetch criteria under this standard
    crit_stmt = select(Criterion).where(Criterion.standard_id == std_uuid)
    criteria = (await db.execute(crit_stmt)).scalars().all()
    
    criteria_list = []
    for crit in criteria:
        # Fetch requirements for each criterion
        req_stmt = select(Requirement).where(Requirement.criterion_id == crit.id)
        requirements = (await db.execute(req_stmt)).scalars().all()
        
        req_ids = [r.id for r in requirements]
        
        # Fetch campus status mapping for requirements
        campus_reqs_list = []
        if req_ids:
            camp_reqs_stmt = select(CampusRequirement).where(
                CampusRequirement.campus_id == active_campus,
                CampusRequirement.requirement_id.in_(req_ids)
            )
            campus_reqs_list = (await db.execute(camp_reqs_stmt)).scalars().all()
            
        camp_req_map = {cr.requirement_id: cr for cr in campus_reqs_list}
        
        # Fetch validation and evidence mappings for requirements
        validations_list = []
        if req_ids:
            val_stmt = select(EvidenceValidation, Evidence).join(
                Evidence, Evidence.id == EvidenceValidation.evidence_id
            ).where(EvidenceValidation.requirement_id.in_(req_ids))
            validations_list = (await db.execute(val_stmt)).all()
            
        val_map = {}
        for val, ev in validations_list:
            if val.requirement_id not in val_map:
                val_map[val.requirement_id] = []
            val_map[val.requirement_id].append({
                "id": str(ev.id),
                "filename": ev.filename,
                "status": ev.status,
                "validation_status": val.status,
                "confidence": val.confidence,
                "decision": val.status,
                "explainability_metadata": val.explainability_metadata
            })
            
        reqs_data = []
        for req in requirements:
            camp_req = camp_req_map.get(req.id)
            linked_ev = val_map.get(req.id, [])
            
            # Extract gaps from validation explainability metadata
            gaps = []
            for ev_val in linked_ev:
                meta = ev_val["explainability_metadata"]
                if "explanations" in meta:
                    # Collect warnings/gaps
                    exps = meta["explanations"]
                    if isinstance(exps, list):
                        gaps.extend([e for e in exps if "below" in e.lower() or "missing" in e.lower() or "failed" in e.lower()])
            
            reqs_data.append({
                "id": str(req.id),
                "title": req.title,
                "description": req.description,
                "weight": req.weight,
                "rule_definition": req.rule_definition,
                "status": camp_req.status if camp_req else "NOT_ASSESSED",
                "score": camp_req.score if camp_req else 0.0,
                "linked_evidence": linked_ev,
                "gaps": list(set(gaps))
            })
            
        # Calculate aggregate criterion score for display
        crit_weighted_sum = sum(r["score"] * r["weight"] for r in reqs_data)
        crit_weight_sum = sum(r["weight"] for r in reqs_data)
        crit_score = (crit_weighted_sum / crit_weight_sum) if crit_weight_sum > 0 else 0.0
        
        criteria_list.append({
            "id": str(crit.id),
            "title": crit.title,
            "description": crit.description,
            "weight": crit.weight,
            "score": round(crit_score, 4),
            "requirements": reqs_data
        })
        
    return {
        "id": str(std.id),
        "title": std.title,
        "code": std.code,
        "description": std.description,
        "weight": std.weight,
        "readiness_score": readiness_score or 0.0,
        "criteria": criteria_list
    }
