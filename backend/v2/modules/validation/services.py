import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from v2.modules.evidence.models import Evidence, EvidenceStatus, EvidenceValidation
from v2.modules.validation.models import AISignalLog, Risk, RiskSeverity, RiskStatus
from v2.modules.tasks.models import Task, TaskStatus, TaskPriority
from v2.modules.standards.models import Requirement, CampusRequirement, RequirementStatus
from v2.modules.validation.engine import ValidationEngine
from v2.core.logging import setup_logger

logger = setup_logger("v2.modules.validation.services")

class ValidationService:
    @staticmethod
    async def log_ai_signal(
        db: AsyncSession,
        correlation_id: str,
        prompt: str,
        raw_response: str,
        model: str,
        latency_ms: int,
        token_usage: dict,
        estimated_cost: float
    ) -> AISignalLog:
        """
        Durable logging of raw AI models interaction for trace audit logs.
        Aggregates usage per organization, campus, feature, and model.
        """
        log = AISignalLog(
            correlation_id=correlation_id,
            prompt=prompt,
            raw_response=raw_response,
            model=model,
            latency_ms=latency_ms,
            token_usage=token_usage,
            estimated_cost=estimated_cost
        )
        db.add(log)
        
        # Aggregate AI usage
        try:
            from v2.modules.evidence.models import Evidence
            from v2.modules.organizations.models import Campus
            from v2.modules.validation.models import AIUsageAggregate
            from datetime import datetime, time
            
            campus_id = None
            organization_id = None
            evidence_stmt = select(Evidence).where(Evidence.correlation_id == correlation_id)
            evidence = (await db.execute(evidence_stmt)).scalars().first()
            if evidence:
                campus_id = evidence.campus_id
                campus_stmt = select(Campus).where(Campus.id == campus_id)
                campus = (await db.execute(campus_stmt)).scalar_one_or_none()
                if campus:
                    organization_id = campus.organization_id
            
            today_date = datetime.combine(datetime.now().date(), time.min)
            feature = "validation"
            if "ocr" in prompt.lower() or "extract" in prompt.lower():
                feature = "ocr"
                
            usage_stmt = select(AIUsageAggregate).where(
                AIUsageAggregate.date == today_date,
                AIUsageAggregate.organization_id == organization_id,
                AIUsageAggregate.campus_id == campus_id,
                AIUsageAggregate.feature == feature,
                AIUsageAggregate.model == model
            )
            usage = (await db.execute(usage_stmt)).scalar_one_or_none()
            if usage:
                usage.prompt_tokens += token_usage.get("input_tokens", 0)
                usage.completion_tokens += token_usage.get("output_tokens", 0)
                usage.estimated_cost += estimated_cost
                usage.request_count += 1
            else:
                usage = AIUsageAggregate(
                    date=today_date,
                    organization_id=organization_id,
                    campus_id=campus_id,
                    feature=feature,
                    model=model,
                    prompt_tokens=token_usage.get("input_tokens", 0),
                    completion_tokens=token_usage.get("output_tokens", 0),
                    estimated_cost=estimated_cost,
                    request_count=1
                )
                db.add(usage)
        except Exception as e:
            logger.error(f"Error aggregating AI usage: {e}")

        await db.commit()
        return log

    @staticmethod
    async def apply_retention_policy(db: AsyncSession):
        """
        Applies AI signal log retention policy:
        1. Compresses and archives logs older than 30 days.
        2. Purges archives older than 180 days.
        """
        import zlib
        from datetime import datetime, timedelta, UTC
        from v2.modules.validation.models import AISignalLog, AISignalLogArchive
        from sqlalchemy import delete
        
        now = datetime.now(UTC)
        archive_threshold = now - timedelta(days=30)
        purge_threshold = now - timedelta(days=180)
        
        # 1. Archive logs older than 30 days
        stmt = select(AISignalLog).where(AISignalLog.created_at < archive_threshold)
        old_logs = (await db.execute(stmt)).scalars().all()
        
        for log in old_logs:
            compressed_prompt = zlib.compress(log.prompt.encode("utf-8"))
            compressed_response = zlib.compress(log.raw_response.encode("utf-8"))
            
            archive_entry = AISignalLogArchive(
                correlation_id=log.correlation_id,
                model=log.model,
                latency_ms=log.latency_ms,
                token_usage=log.token_usage,
                estimated_cost=log.estimated_cost,
                compressed_prompt=compressed_prompt,
                compressed_raw_response=compressed_response,
                created_at=log.created_at
            )
            db.add(archive_entry)
            await db.delete(log)
            
        # 2. Purge archives older than 180 days
        purge_stmt = delete(AISignalLogArchive).where(AISignalLogArchive.created_at < purge_threshold)
        await db.execute(purge_stmt)
        await db.commit()
        logger.info("AI Signal Log retention policy applied successfully.")

    @staticmethod
    async def replay_failed_event(db: AsyncSession, redis_client, failed_event_id: uuid.UUID) -> bool:
        """
        Fetch a failed event by ID and republish its payload to its original stream.
        """
        from v2.modules.validation.models import FailedEvent
        from v2.events.bus import EventPublisher
        
        stmt = select(FailedEvent).where(FailedEvent.id == failed_event_id)
        failed_event = (await db.execute(stmt)).scalar_one_or_none()
        if not failed_event:
            logger.error(f"FailedEvent {failed_event_id} not found for replay")
            return False
            
        worker_to_stream = {
            "handle_evidence_uploaded": ("evidence", "evidence.file.uploaded"),
            "handle_text_extracted": ("evidence", "evidence.text.extracted"),
            "handle_ai_signal_generated": ("evidence", "ai.signal.generated"),
            "handle_validation_completed": ("evidence", "validation.completed"),
            "handle_task_created": ("tasks", "task.created")
        }
        
        stream_info = worker_to_stream.get(failed_event.worker_name)
        if not stream_info:
            logger.error(f"Unknown stream for worker {failed_event.worker_name}")
            return False
            
        stream, event_type = stream_info
        publisher = EventPublisher(redis_client)
        
        await publisher.publish(
            stream=stream,
            event_type=event_type,
            payload=failed_event.payload,
            correlation_id=failed_event.correlation_id
        )
        
        await db.delete(failed_event)
        await db.commit()
        logger.info(f"Replayed and removed failed event {failed_event_id}")
        return True

    @staticmethod
    async def run_validation(
        db: AsyncSession,
        evidence_id: uuid.UUID,
        requirement_id: uuid.UUID,
        ai_signal: dict,
        correlation_id: str
    ) -> dict:
        """
        Validates evidence against standard requirements. Enforces explicit transitions.
        """
        # Fetch evidence and requirement
        evidence_stmt = select(Evidence).where(Evidence.id == evidence_id)
        evidence = (await db.execute(evidence_stmt)).scalar_one_or_none()
        
        req_stmt = select(Requirement).where(Requirement.id == requirement_id)
        requirement = (await db.execute(req_stmt)).scalar_one_or_none()
        
        if not evidence or not requirement:
            raise ValueError("Evidence or Requirement not found")
            
        # Transition state: EXTRACTED -> ANALYZED
        evidence.transition_to(EvidenceStatus.ANALYZED)
        await db.commit()
        
        # Evaluate using Validation Engine
        engine = ValidationEngine()
        result = engine.process_ai_signal(ai_signal, requirement.rule_definition)
        
        decision = result["decision"]
        explanations = result["explanations"]
        
        # Write validation result
        validation = EvidenceValidation(
            evidence_id=evidence_id,
            requirement_id=requirement_id,
            status=decision,
            confidence=ai_signal.get("confidence", 0.0),
            explainability_metadata=result
        )
        db.add(validation)
        
        # Update CampusRequirement status
        camp_req_stmt = select(CampusRequirement).where(
            CampusRequirement.campus_id == evidence.campus_id,
            CampusRequirement.requirement_id == requirement_id
        )
        campus_req = (await db.execute(camp_req_stmt)).scalar_one_or_none()
        
        if not campus_req:
            campus_req = CampusRequirement(
                campus_id=evidence.campus_id,
                requirement_id=requirement_id,
                status=RequirementStatus.NOT_ASSESSED,
                score=0.0
            )
            db.add(campus_req)
            await db.flush()
            
        # Map decision string to RequirementStatus
        target_status = RequirementStatus.NOT_ASSESSED
        score = 0.0
        if decision == "COVERED":
            target_status = RequirementStatus.FULLY_COVERED
            score = 1.0
        elif decision == "PARTIALLY_COVERED":
            target_status = RequirementStatus.COVERED
            score = 0.8
        elif decision == "NOT_COVERED":
            target_status = RequirementStatus.PARTIALLY_COVERED
            score = 0.4
        else:
            target_status = RequirementStatus.NOT_ASSESSED
            score = 0.0
            
        campus_req.transition_to(target_status)
        campus_req.score = score
        
        # Generate Risks and Tasks if not covered
        task_id = None
        risk_id = None
        if decision in {"PARTIALLY_COVERED", "NOT_COVERED", "NEEDS_REVIEW"}:
            severity = RiskSeverity.HIGH if decision == "NOT_COVERED" else RiskSeverity.MEDIUM
            # Risk Creation
            risk = Risk(
                campus_id=evidence.campus_id,
                type="INSUFFICIENT_COVERAGE",
                description=f"Evidence {evidence.filename} failed compliance for standard requirement {requirement.title}. Reasoning: {decision}.",
                severity=severity,
                status=RiskStatus.OPEN,
                reference_type="requirement",
                reference_id=str(requirement_id)
            )
            db.add(risk)
            await db.flush()
            risk_id = risk.id
            
            # Auto Task Generation
            task = Task(
                campus_id=evidence.campus_id,
                title=f"Address compliance gap for: {requirement.title}",
                description=f"Automated remediation task spawned from compliance gap. Explanations: {', '.join(explanations)}",
                status=TaskStatus.OPEN,
                priority=TaskPriority.HIGH if severity == RiskSeverity.HIGH else TaskPriority.MEDIUM,
                reference_type="risk",
                reference_id=str(risk.id),
                metadata_json={"correlation_id": correlation_id}
            )
            db.add(task)
            await db.flush()
            task_id = task.id
            logger.info(f"Auto-generated Risk {risk.id} and Task {task.id} for requirement {requirement_id}.")
            
        # Transition state: ANALYZED -> VALIDATED
        evidence.transition_to(EvidenceStatus.VALIDATED)
        await db.commit()
        
        logger.info(f"Validation completed for evidence {evidence_id} against requirement {requirement_id} with outcome: {decision}.")
        return {
            "validation_id": validation.id,
            "decision": decision,
            "explanations": explanations,
            "risk_id": risk_id,
            "task_id": task_id
        }
