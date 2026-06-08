import asyncio
import uuid
import json
import logging
import traceback
from typing import Callable
from sqlalchemy.ext.asyncio import AsyncSession

from v2.core.redis import get_redis_client
from v2.core.database import async_session_maker
from v2.core.logging import setup_logger, set_correlation_id
from v2.events.bus import EventPublisher, EventSubscriber

from v2.modules.evidence.services import EvidenceService
from v2.modules.ai_signals.client import AISignalsClient
from v2.modules.validation.services import ValidationService
from v2.modules.validation.models import FailedEvent
from v2.modules.standards.services import ReadinessService
from v2.modules.notifications.services import NotificationService

logger = setup_logger("v2.workers.main")

# Instantiate shared objects
redis_client = get_redis_client()
publisher = EventPublisher(redis_client)
ai_client = AISignalsClient()

def classify_exception(error: Exception) -> str:
    """
    Classify exception type into: VALIDATION, TIMEOUT, RATE_LIMIT, EXTERNAL_PROVIDER, TRANSIENT, PERMANENT.
    """
    from v2.core.database import InvalidStateTransitionError
    error_str = str(error).lower()
    
    if isinstance(error, (AssertionError, InvalidStateTransitionError, ValueError)) or "out of order" in error_str:
        return "VALIDATION"
    import asyncio
    if isinstance(error, (asyncio.TimeoutError, TimeoutError)) or "timeout" in error_str or "timed out" in error_str:
        return "TIMEOUT"
    if "429" in error_str or "rate limit" in error_str or "quota" in error_str:
        return "RATE_LIMIT"
    if "api key expired" in error_str or "provider" in error_str or "gemini" in error_str or "google" in error_str:
        return "EXTERNAL_PROVIDER"
    if "connection" in error_str or "redis" in error_str or "db" in error_str or "locked" in error_str:
        return "TRANSIENT"
    return "PERMANENT"


async def log_failed_event(worker_name: str, payload: dict, error: Exception, correlation_id: str):
    """
    Durable failure logging / Dead Letter Queue for failed operations with failed event classification.
    """
    classification = classify_exception(error)
    async with async_session_maker() as db:
        try:
            from v2.modules.validation.models import FailedEvent, FailedEventClassification
            failed_event = FailedEvent(
                correlation_id=correlation_id,
                payload=payload,
                worker_name=worker_name,
                retry_count=0, # Base implementation without automatic retry scheduling
                exception=f"{type(error).__name__}: {str(error)}\n{traceback.format_exc()}",
                classification=FailedEventClassification(classification)
            )
            db.add(failed_event)
            await db.commit()
            logger.info(f"Logged failed event in Dead-Letter Queue (v2_failed_events) with classification {classification} for worker {worker_name}")
        except Exception as e:
            logger.error(f"Double failure: Could not log failed event to DB: {e}")


# 1. OCR / Text Extraction Worker
async def handle_evidence_uploaded(event: dict):
    # Event Versioning Validation
    if event.get("type") != "evidence.file.uploaded.v1":
        logger.info(f"Skipping event type {event.get('type')} in handle_evidence_uploaded")
        return

    payload = event.get("payload", {})
    correlation_id = event.get("correlation_id", "no-correlation-id")
    
    try:
        evidence_id = uuid.UUID(payload["evidence_id"])
        req_id = payload.get("requirement_id")
        
        logger.info(f"Processing evidence.file.uploaded event for evidence {evidence_id}")
        
        async with async_session_maker() as db:
            # Deterministic Event Ordering Validation
            from v2.modules.evidence.models import Evidence, EvidenceStatus
            from sqlalchemy import select
            
            stmt = select(Evidence).where(Evidence.id == evidence_id)
            evidence = (await db.execute(stmt)).scalar_one_or_none()
            if not evidence:
                logger.warning(f"Evidence {evidence_id} not found, skipping.")
                return
            if evidence.status != EvidenceStatus.UPLOADED:
                logger.info(f"Evidence {evidence_id} status is already {evidence.status}. Skipping handle_evidence_uploaded.")
                return
                
            # Service execution
            chunks = await EvidenceService.extract_and_chunk_text(db, evidence_id)
            
            # Publish next event
            await publisher.publish(
                stream="evidence",
                event_type="evidence.text.extracted",
                payload={
                    "evidence_id": str(evidence_id), 
                    "chunk_count": len(chunks),
                    "requirement_id": req_id
                },
                correlation_id=correlation_id
            )
    except Exception:
        raise


# 2. AI Signal Generation Worker
async def handle_text_extracted(event: dict):
    # Event Versioning Validation
    if event.get("type") != "evidence.text.extracted.v1":
        logger.info(f"Skipping event type {event.get('type')} in handle_text_extracted")
        return

    payload = event.get("payload", {})
    correlation_id = event.get("correlation_id", "no-correlation-id")
    
    try:
        evidence_id = uuid.UUID(payload["evidence_id"])
        req_id = payload.get("requirement_id")
        
        logger.info(f"Processing evidence.text.extracted event for evidence {evidence_id}")
        
        async with async_session_maker() as db:
            # Deterministic Event Ordering Validation
            from v2.modules.evidence.models import Evidence, EvidenceStatus
            from sqlalchemy import select
            
            stmt = select(Evidence).where(Evidence.id == evidence_id)
            evidence = (await db.execute(stmt)).scalar_one_or_none()
            if not evidence:
                logger.warning(f"Evidence {evidence_id} not found, skipping.")
                return
            if evidence.status != EvidenceStatus.EXTRACTED:
                if evidence.status in (EvidenceStatus.ANALYZED, EvidenceStatus.VALIDATED):
                    logger.info(f"Evidence {evidence_id} status is {evidence.status}. Skipping handle_text_extracted.")
                    return
                raise ValueError(f"Out of order event: evidence status is {evidence.status}, expected EXTRACTED")
                
            # 1. Gather all chunks
            from v2.modules.evidence.models import EvidenceChunk
            
            stmt = select(EvidenceChunk).where(EvidenceChunk.evidence_id == evidence_id)
            chunks = (await db.execute(stmt)).scalars().all()
            full_text = "\n".join([c.content for c in chunks])
            
            # 2. Call Gemini
            ai_payload, metadata = await ai_client.analyze_document_relevance(full_text)
            
            # 3. Log AI interaction transparently
            await ValidationService.log_ai_signal(
                db=db,
                correlation_id=correlation_id,
                prompt=metadata["prompt"],
                raw_response=metadata["raw_response"],
                model=metadata["model"],
                latency_ms=metadata["latency_ms"],
                token_usage=metadata["token_usage"],
                estimated_cost=metadata["estimated_cost"]
            )
            
            # Publish next event
            await publisher.publish(
                stream="evidence",
                event_type="ai.signal.generated",
                payload={
                    "evidence_id": str(evidence_id),
                    "ai_signal": ai_payload.model_dump(),
                    "requirement_id": req_id
                },
                correlation_id=correlation_id
            )
    except Exception:
        raise


# 3. Validation & Rules Engine Worker
async def handle_ai_signal_generated(event: dict):
    # Event Versioning Validation
    if event.get("type") != "ai.signal.generated.v1":
        logger.info(f"Skipping event type {event.get('type')} in handle_ai_signal_generated")
        return

    payload = event.get("payload", {})
    correlation_id = event.get("correlation_id", "no-correlation-id")
    
    try:
        evidence_id = uuid.UUID(payload["evidence_id"])
        ai_signal = payload["ai_signal"]
        req_id_str = payload.get("requirement_id")
        
        logger.info(f"Processing ai.signal.generated event for evidence {evidence_id}")
        
        async with async_session_maker() as db:
            # Deterministic Event Ordering Validation
            from v2.modules.evidence.models import Evidence, EvidenceStatus
            from sqlalchemy import select
            
            stmt = select(Evidence).where(Evidence.id == evidence_id)
            evidence = (await db.execute(stmt)).scalar_one_or_none()
            if not evidence:
                logger.warning(f"Evidence {evidence_id} not found, skipping.")
                return
            if evidence.status not in (EvidenceStatus.EXTRACTED, EvidenceStatus.ANALYZED):
                if evidence.status == EvidenceStatus.VALIDATED:
                    logger.info(f"Evidence {evidence_id} status is already {evidence.status}. Skipping handle_ai_signal_generated.")
                    return
                raise ValueError(f"Out of order event: evidence status is {evidence.status}, expected EXTRACTED or ANALYZED")
                
            from v2.modules.standards.models import Requirement
            
            requirement = None
            if req_id_str:
                req_id = uuid.UUID(req_id_str)
                stmt = select(Requirement).where(Requirement.id == req_id)
                requirement = (await db.execute(stmt)).scalar_one_or_none()
                
            if not requirement:
                stmt = select(Requirement).limit(1)
                requirement = (await db.execute(stmt)).scalar_one_or_none()
            
            if not requirement:
                requirement = Requirement(
                    title="Annual Policy Review",
                    description="Requires QA policies to be reviewed annually by the campus director.",
                    weight=1.5,
                    rule_definition={
                        "operator": "AND",
                        "conditions": [
                            {"type": "confidence", "min": 0.7},
                            {"type": "detected_entities", "contains": "Quality Assurance"}
                        ]
                    }
                )
                db.add(requirement)
                await db.flush()
                
            val_result = await ValidationService.run_validation(
                db=db,
                evidence_id=evidence_id,
                requirement_id=requirement.id,
                ai_signal=ai_signal,
                correlation_id=correlation_id
            )
            
            # Publish next event
            await publisher.publish(
                stream="evidence",
                event_type="validation.completed",
                payload={
                    "evidence_id": str(evidence_id),
                    "requirement_id": str(requirement.id),
                    "decision": val_result["decision"],
                    "risk_id": str(val_result["risk_id"]) if val_result["risk_id"] else None,
                    "task_id": str(val_result["task_id"]) if val_result["task_id"] else None
                },
                correlation_id=correlation_id
            )
            
            # If a task was created, publish the task created event
            if val_result["task_id"]:
                await publisher.publish(
                    stream="tasks",
                    event_type="task.created",
                    payload={
                        "task_id": str(val_result["task_id"]),
                        "risk_id": str(val_result["risk_id"])
                    },
                    correlation_id=correlation_id
                )
    except Exception:
        raise


# 4. Incremental Readiness Recalculation Worker
async def handle_validation_completed(event: dict):
    # Event Versioning Validation
    if event.get("type") != "validation.completed.v1":
        logger.info(f"Skipping event type {event.get('type')} in handle_validation_completed")
        return

    payload = event.get("payload", {})
    correlation_id = event.get("correlation_id", "no-correlation-id")
    
    try:
        evidence_id = uuid.UUID(payload["evidence_id"])
        requirement_id = uuid.UUID(payload["requirement_id"])
        
        logger.info(f"Processing validation.completed event for evidence {evidence_id}")
        
        async with async_session_maker() as db:
            # Deterministic Event Ordering Validation
            from v2.modules.evidence.models import Evidence, EvidenceStatus
            from sqlalchemy import select
            
            stmt = select(Evidence).where(Evidence.id == evidence_id)
            evidence = (await db.execute(stmt)).scalar_one_or_none()
            if not evidence:
                logger.warning(f"Evidence {evidence_id} not found, skipping.")
                return
            if evidence.status != EvidenceStatus.VALIDATED:
                raise ValueError(f"Out of order event: evidence status is {evidence.status}, expected VALIDATED")
                
            # Recalculate readiness score incrementally up standard hierarchy
            await ReadinessService.recalculate_readiness_delta(
                db=db,
                campus_id=evidence.campus_id,
                requirement_id=requirement_id
            )
    except Exception:
        raise


# 5. Task & Notification Dispatch Worker
async def handle_task_created(event: dict):
    # Event Versioning Validation
    if event.get("type") != "task.created.v1":
        logger.info(f"Skipping event type {event.get('type')} in handle_task_created")
        return

    payload = event.get("payload", {})
    correlation_id = event.get("correlation_id", "no-correlation-id")
    
    try:
        task_id = uuid.UUID(payload["task_id"])
        
        logger.info(f"Processing task.created event for task {task_id}")
        
        async with async_session_maker() as db:
            from v2.modules.tasks.models import Task, TaskStatus
            from sqlalchemy import select
            
            stmt = select(Task).where(Task.id == task_id)
            task = (await db.execute(stmt)).scalar_one_or_none()
            
            if not task:
                logger.warning(f"Task {task_id} not found, skipping.")
                return
            # Deterministic Event Ordering Validation
            if task.status != TaskStatus.OPEN:
                logger.info(f"Task {task_id} is already {task.status}. Skipping handle_task_created.")
                return
                
            # Dispatch notification with preference gating
            notification = await NotificationService.create_and_dispatch_notification(
                db=db,
                redis_client=redis_client,
                title="New Remediation Task Assigned",
                message=f"A new task has been auto-generated due to standard gap: {task.title}",
                notif_type="TASK_CREATED",
                campus_id=task.campus_id,
                severity="HIGH"
            )
            
            if notification:
                await publisher.publish(
                    stream="notifications",
                    event_type="notification.dispatched",
                    payload={"notification_id": str(notification.id)},
                    correlation_id=correlation_id
                )
    except Exception:
        raise


# 6. Passive Horus Event Observer
from v2.modules.horus_operations.services import HorusExecutionService
from v2.modules.horus_operations.policy_engine import ActionProposal, ActionType
from v2.modules.horus_operations.models import V2HorusWorkflow
from sqlalchemy import select, func
from typing import Any

def evaluate_conditions(conditions: Any, payload: dict) -> bool:
    """
    Evaluates condition expressions against the event payload.
    Supports a list of dicts (AND) or a single dict mapping fields to values.
    """
    if not conditions:
        return True
    
    if isinstance(conditions, list):
        for cond in conditions:
            if not isinstance(cond, dict):
                continue
            field = cond.get("field")
            operator = cond.get("operator", "equals")
            expected = cond.get("value")
            
            actual = payload.get(field)
            if operator == "equals":
                if actual != expected:
                    return False
            elif operator == "not_equals":
                if actual == expected:
                    return False
            elif operator == "contains":
                if not isinstance(actual, (list, str)) or expected not in actual:
                    return False
            else:
                if actual != expected:
                    return False
        return True

    if isinstance(conditions, dict):
        for field, expected in conditions.items():
            if payload.get(field) != expected:
                return False
        return True

    return False

def resolve_payload(template_payload: dict, event_payload: dict) -> dict:
    """
    Recursively replaces string placeholders like {field_name} in action templates
    with values from event_payload.
    """
    resolved = {}
    for k, v in template_payload.items():
        if isinstance(v, str):
            val_str = v
            for pk, pv in event_payload.items():
                val_str = val_str.replace(f"{{{pk}}}", str(pv))
            resolved[k] = val_str
        elif isinstance(v, dict):
            resolved[k] = resolve_payload(v, event_payload)
        elif isinstance(v, list):
            resolved_list = []
            for item in v:
                if isinstance(item, dict):
                    resolved_list.append(resolve_payload(item, event_payload))
                elif isinstance(item, str):
                    item_str = item
                    for pk, pv in event_payload.items():
                        item_str = item_str.replace(f"{{{pk}}}", str(pv))
                    resolved_list.append(item_str)
                else:
                    resolved_list.append(item)
            resolved[k] = resolved_list
        else:
            resolved[k] = v
    return resolved

async def handle_horus_event(event: dict):
    """
    Active Horus Operations orchestrator. Evaluates events and proposes actions
    deterministically using workflows configured in the database.
    """
    event_id = event.get("event_id")
    event_type = event.get("type")
    trace_id = event.get("correlation_id", str(uuid.uuid4()))
    payload = event.get("payload", {})
    
    logger.info(f"[Horus Operations] Evaluating event: {event_type} (Trace: {trace_id})")
    
    async with async_session_maker() as db:
        stmt = select(V2HorusWorkflow).where(
            V2HorusWorkflow.trigger_event == event_type,
            V2HorusWorkflow.enabled == True
        )
        workflows = (await db.execute(stmt)).scalars().all()
        
        if not workflows:
            logger.info(f"[Horus Operations] No active workflows found for event: {event_type}")
            return

        for workflow in workflows:
            logger.info(f"[Horus Operations] Matching workflow: '{workflow.workflow_name}'")
            
            if not evaluate_conditions(workflow.conditions_json, payload):
                logger.info(f"[Horus Operations] Workflow '{workflow.workflow_name}' conditions did not match payload.")
                continue
                
            logger.info(f"[Horus Operations] Workflow '{workflow.workflow_name}' matched! Proposing actions.")
            
            actions = workflow.actions_json
            if not isinstance(actions, list):
                actions = [actions]
                
            for action in actions:
                if not isinstance(action, dict):
                    continue
                
                action_type_str = action.get("action_type")
                if not action_type_str or not hasattr(ActionType, action_type_str):
                    logger.warning(f"Invalid action type in workflow: {action_type_str}")
                    continue
                
                raw_payload = action.get("payload", {})
                resolved_action_payload = resolve_payload(raw_payload, payload)
                
                campus_id_str = payload.get("campus_id")
                if not campus_id_str:
                    logger.warning("Event payload is missing campus_id. Skipping action proposal.")
                    continue
                    
                proposal = ActionProposal(
                    action_type=ActionType(action_type_str),
                    payload=resolved_action_payload,
                    campus_id=uuid.UUID(campus_id_str),
                    confidence_score=action.get("confidence_score", 1.0)
                )
                
                await HorusExecutionService.execute_proposal(
                    db=db,
                    proposal=proposal,
                    correlation_id=trace_id,
                    triggering_event=event_type,
                    reasoning=f"Triggered by workflow: '{workflow.workflow_name}'",
                    workflow_id=workflow.id
                )

def wrap_with_retry(handler: Callable, worker_name: str) -> Callable:
    async def wrapped_handler(event: dict):
        payload = event.get("payload", {})
        correlation_id = event.get("correlation_id", "no-correlation-id")
        max_retries = 3
        base_delay = 2.0
        
        for attempt in range(1, max_retries + 1):
            try:
                await handler(event)
                return
            except Exception as e:
                classification = classify_exception(e)
                is_transient = classification in ("TIMEOUT", "RATE_LIMIT", "TRANSIENT")
                
                if not is_transient or attempt == max_retries:
                    logger.error(
                        f"Worker {worker_name} failed permanently or exhausted retries (classification: {classification}). "
                        f"Logging to DLQ. Error: {e}"
                    )
                    await log_failed_event(worker_name, payload, e, correlation_id)
                    return
                else:
                    delay = base_delay * (2 ** (attempt - 1))
                    logger.warning(
                        f"Worker {worker_name} failed with transient error: {e}. "
                        f"Attempt {attempt}/{max_retries}. Retrying in {delay}s..."
                    )
                    await asyncio.sleep(delay)
    return wrapped_handler


# Setup subscriber loops
async def run_subscriber_loop(stream: str, group_name: str, consumer_name: str, handler: Callable):
    subscriber = EventSubscriber(redis_client, group_name, consumer_name)
    wrapped = wrap_with_retry(handler, handler.__name__)
    await subscriber.listen(stream, wrapped)

async def main():
    logger.info("Initializing V2 Background Worker Daemon...")
    
    # Seed default workflow if none exist
    try:
        async with async_session_maker() as db:
            stmt = select(func.count(V2HorusWorkflow.id))
            count = (await db.execute(stmt)).scalar()
            if count == 0:
                default_wf = V2HorusWorkflow(
                    workflow_name="Auto-Remediate Failed Validation",
                    trigger_event="validation.completed.v1",
                    enabled=True,
                    conditions_json=[
                        {"field": "status", "operator": "equals", "value": "FAILED"}
                    ],
                    actions_json=[
                        {
                            "action_type": "CREATE_TASK",
                            "payload": {
                                "title": "Remediate Failed Validation",
                                "description": "Validation failed for requirement {requirement_id}.",
                                "priority": "HIGH"
                            },
                            "confidence_score": 0.95
                        }
                    ]
                )
                db.add(default_wf)
                await db.commit()
                logger.info("Seeded default Horus workflow.")
    except Exception as e:
        logger.error(f"Error seeding default Horus workflow: {e}")

    # Run the worker groups concurrently
    await asyncio.gather(
        # Evidence processing pipeline
        run_subscriber_loop("evidence", "evidence_processing_group", "ocr_worker", handle_evidence_uploaded),
        run_subscriber_loop("evidence", "ai_signals_group", "ai_worker", handle_text_extracted),
        run_subscriber_loop("evidence", "validation_group", "validator_worker", handle_ai_signal_generated),
        run_subscriber_loop("evidence", "readiness_group", "readiness_worker", handle_validation_completed),
        
        # Task & Notifications pipeline
        run_subscriber_loop("tasks", "task_processing_group", "task_worker", handle_task_created),
        
        # Horus Operations Active Orchestrator
        run_subscriber_loop("evidence", "horus_operations_group", "horus_orchestrator", handle_horus_event),
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Worker daemon stopped.")

