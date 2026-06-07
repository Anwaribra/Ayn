import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Any

from v2.core.database import get_db_session
from app.core.middlewares import get_current_user
from v2.modules.horus_operations.models import V2HorusActionLog, V2MockAudit, V2HorusBriefing
from v2.modules.horus_operations.mock_audit import MockAuditService
from v2.modules.horus_operations.briefing import BriefingService

router = APIRouter(prefix="/horus", tags=["Horus Operations"])

def verify_campus_isolation(campus_id: uuid.UUID, current_user: dict):
    user_campus_id = current_user.get("institutionId")
    if user_campus_id and uuid.UUID(str(user_campus_id)) != campus_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Campus ID does not match user institution boundary."
        )

@router.get("/action-logs")
async def get_action_logs(
    campus_id: uuid.UUID, 
    limit: int = 50, 
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    verify_campus_isolation(campus_id, current_user)
    
    stmt = select(V2HorusActionLog).where(V2HorusActionLog.campus_id == campus_id).order_by(V2HorusActionLog.created_at.desc()).limit(limit)
    logs = (await db.execute(stmt)).scalars().all()
    
    return [
        {
            "id": str(log.id),
            "triggering_event": log.triggering_event,
            "reasoning_summary": log.reasoning_summary,
            "recommended_action": log.recommended_action,
            "executed_action": log.executed_action,
            "confidence_score": log.confidence_score,
            "policy_result": log.policy_result,
            "execution_status": log.execution_status,
            "created_at": log.created_at.isoformat()
        } for log in logs
    ]

@router.get("/briefings/latest")
async def get_latest_briefing(
    campus_id: uuid.UUID, 
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    verify_campus_isolation(campus_id, current_user)
    
    today = datetime.utcnow().date()
    briefing = await BriefingService.get_or_generate_daily_briefing(db, campus_id, today)
    return {
        "id": str(briefing.id),
        "date": briefing.date.isoformat(),
        "summary_content": briefing.summary_content
    }

@router.post("/mock-audits", status_code=status.HTTP_202_ACCEPTED)
async def trigger_mock_audit(
    payload: dict, 
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    campus_id = uuid.UUID(payload.get("campus_id"))
    verify_campus_isolation(campus_id, current_user)
    
    standard_id = uuid.UUID(payload.get("standard_id"))
    audit = await MockAuditService.initiate_mock_audit(db, campus_id, standard_id)
    return {"message": "Mock audit triggered", "audit_id": str(audit.id)}

@router.get("/mock-audits/{audit_id}")
async def get_mock_audit_status(
    audit_id: uuid.UUID, 
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    audit = await MockAuditService.get_mock_audit(db, audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Mock audit not found")
        
    verify_campus_isolation(audit.campus_id, current_user)
        
    return {
        "id": str(audit.id),
        "status": audit.simulation_status,
        "report_payload": audit.report_payload,
        "created_at": audit.created_at.isoformat()
    }

