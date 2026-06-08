import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from v2.core.database import get_db_session
from app.core.middlewares import get_current_user
from v2.modules.validation.models import FailedEvent, AISignalLog, AIUsageAggregate, FailedEventClassification
from v2.core.redis import get_redis_client
from v2.events.bus import EventPublisher

router = APIRouter(prefix="/admin", tags=["admin"])

redis_client = get_redis_client()
publisher = EventPublisher(redis_client)

WORKER_STREAM_MAP = {
    "handle_evidence_uploaded": ("evidence", "evidence.file.uploaded"),
    "handle_text_extracted": ("evidence", "evidence.text.extracted"),
    "handle_ai_signal_generated": ("evidence", "ai.signal.generated"),
    "handle_validation_completed": ("evidence", "validation.completed"),
    "handle_task_created": ("tasks", "task.created"),
}

@router.get("/telemetry")
async def get_telemetry_summary(
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Get aggregated observability and cost telemetry.
    """
    if current_user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access telemetry dashboard."
        )

    # 1. Total failed events count in DLQ
    failed_stmt = select(func.count(FailedEvent.id))
    failed_count = (await db.execute(failed_stmt)).scalar() or 0

    # 2. Failed events count grouped by classification
    class_stmt = select(FailedEvent.classification, func.count(FailedEvent.id)).group_by(FailedEvent.classification)
    class_res = (await db.execute(class_stmt)).all()
    failed_by_classification = {str(c.value): count for c, count in class_res}

    # 3. Total AI cost and token usage from AIUsageAggregate
    cost_stmt = select(
        func.sum(AIUsageAggregate.estimated_cost),
        func.sum(AIUsageAggregate.prompt_tokens),
        func.sum(AIUsageAggregate.completion_tokens),
        func.sum(AIUsageAggregate.request_count)
    )
    cost_res = (await db.execute(cost_stmt)).first()
    
    total_cost = float(cost_res[0] or 0.0) if cost_res and cost_res[0] is not None else 0.0
    total_prompt_tokens = int(cost_res[1] or 0) if cost_res and cost_res[1] is not None else 0
    total_completion_tokens = int(cost_res[2] or 0) if cost_res and cost_res[2] is not None else 0
    total_requests = int(cost_res[3] or 0) if cost_res and cost_res[3] is not None else 0

    # 4. Grouped by model cost & requests
    model_stmt = select(
        AIUsageAggregate.model,
        func.sum(AIUsageAggregate.estimated_cost),
        func.sum(AIUsageAggregate.request_count)
    ).group_by(AIUsageAggregate.model)
    model_res = (await db.execute(model_stmt)).all()
    cost_by_model = [
        {
            "model": model,
            "cost": float(cost or 0.0),
            "requests": int(reqs or 0)
        }
        for model, cost, reqs in model_res
    ]

    return {
        "failed_events_count": failed_count,
        "failed_by_classification": failed_by_classification,
        "ai_telemetry": {
            "total_estimated_cost_usd": round(total_cost, 6),
            "total_prompt_tokens": total_prompt_tokens,
            "total_completion_tokens": total_completion_tokens,
            "total_requests": total_requests,
            "cost_by_model": cost_by_model
        }
    }

@router.get("/failed-events")
async def list_failed_events(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    """
    List failed events in the Dead Letter Queue.
    """
    if current_user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )
        
    stmt = select(FailedEvent).order_by(FailedEvent.timestamp.desc()).limit(limit).offset(offset)
    res = (await db.execute(stmt)).scalars().all()
    
    return [
        {
            "id": str(e.id),
            "correlation_id": e.correlation_id,
            "worker_name": e.worker_name,
            "retry_count": e.retry_count,
            "exception": e.exception,
            "classification": e.classification.value,
            "payload": e.payload,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None
        }
        for e in res
    ]

@router.post("/failed-events/{event_id}/replay")
async def replay_failed_event(
    event_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Replays a failed event from the DLQ by republishing it to its Redis stream,
    then removes it from the DLQ.
    """
    if current_user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )

    try:
        event_uuid = uuid.UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event UUID")

    stmt = select(FailedEvent).where(FailedEvent.id == event_uuid)
    failed_event = (await db.execute(stmt)).scalar_one_or_none()
    
    if not failed_event:
        raise HTTPException(status_code=404, detail="Failed event not found")
        
    worker_name = failed_event.worker_name
    if worker_name not in WORKER_STREAM_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Replay not supported for worker: {worker_name}"
        )
        
    stream, event_type = WORKER_STREAM_MAP[worker_name]
    
    try:
        # Publish event
        await publisher.publish(
            stream=stream,
            event_type=event_type,
            payload=failed_event.payload,
            correlation_id=failed_event.correlation_id,
            version="v1"
        )
        
        # Delete from DLQ
        await db.execute(delete(FailedEvent).where(FailedEvent.id == event_uuid))
        await db.commit()
        
        return {"status": "success", "message": f"Successfully replayed event to stream '{stream}'."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to replay event: {str(e)}")
