from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException, status

from app.activity.service import ActivityService
from app.core.db import get_db
from app.compliance.models import (
    ActionPlanCreateRequest,
    ActionPlanTask,
    ActionPlanUpdateRequest,
    AuditTrailItem,
    CollaborationComment,
    CollaborationCommentCreateRequest,
    CommandCenterResponse,
    ReviewDecisionRequest,
    ReviewDecisionResponse,
    ReviewQueueItem,
    VersionEntry,
    WorkflowRun,
    WorkflowRunCreateRequest,
    WorkflowRunUpdateRequest,
)


class ComplianceService:
    @staticmethod
    def _scope(current_user: dict) -> Tuple[str, Optional[str], str]:
        return current_user["id"], current_user.get("institutionId"), current_user.get("role", "USER")

    @staticmethod
    def _as_dict(meta: Any) -> Dict[str, Any]:
        if isinstance(meta, dict):
            return meta
        return {}

    @staticmethod
    async def _mapping_review_decisions(user_id: str) -> Dict[str, Dict[str, Any]]:
        db = get_db()
        review_events = await db.activity.find_many(
            where={"userId": user_id, "type": "mapping_review_decision"},
            order={"createdAt": "asc"},
        )
        decisions: Dict[str, Dict[str, Any]] = {}
        for evt in review_events:
            if evt.entityId:
                decisions[evt.entityId] = ComplianceService._as_dict(evt.metadata)
        return decisions

    @staticmethod
    async def get_command_center(current_user: dict) -> CommandCenterResponse:
        db = get_db()
        user_id, institution_id, role = ComplianceService._scope(current_user)

        evidence_where: Dict[str, Any]
        if role == "ADMIN":
            evidence_where = {}
        elif institution_id:
            evidence_where = {"OR": [{"uploadedById": user_id}, {"ownerId": institution_id}]}
        else:
            evidence_where = {"uploadedById": user_id}

        now = datetime.now(timezone.utc)
        stale_cutoff = now - timedelta(days=90)

        evidence_count = await db.evidence.count(where=evidence_where)
        processing_count = await db.evidence.count(where={**evidence_where, "status": "processing"})
        stale_evidence = await db.evidence.count(
            where={**evidence_where, "status": {"in": ["analyzed", "unmapped"]}, "updatedAt": {"lt": stale_cutoff}}
        )

        open_gaps = await db.platformgap.count(where={"userId": user_id, "status": "defined"})
        addressed_gaps = await db.platformgap.count(where={"userId": user_id, "status": "addressed"})
        closed_gaps = await db.platformgap.count(where={"userId": user_id, "status": "closed"})

        review_queue = await ComplianceService.list_review_queue(current_user)
        pending_reviews = len([r for r in review_queue if not r.reviewed])

        tasks = await ComplianceService.list_action_plan_tasks(current_user)
        overdue_tasks = len(
            [
                t
                for t in tasks
                if t.status not in {"done", "archived"} and t.dueDate is not None and t.dueDate < now
            ]
        )

        denominator = max(1, open_gaps + addressed_gaps + closed_gaps)
        closure_component = (closed_gaps / denominator) * 60
        evidence_component = min(25.0, evidence_count * 0.7)
        governance_penalty = min(30.0, pending_reviews * 1.5 + overdue_tasks * 2.5)
        readiness = max(0.0, min(100.0, closure_component + evidence_component - governance_penalty))

        last_30_days = now - timedelta(days=30)
        closed_last_30 = await db.platformgap.count(where={"userId": user_id, "status": "closed", "closedAt": {"gte": last_30_days}})
        forecast_days = None
        if open_gaps > 0 and closed_last_30 > 0:
            per_day = closed_last_30 / 30.0
            if per_day > 0:
                forecast_days = int(round(open_gaps / per_day))

        return CommandCenterResponse(
            evidenceCount=evidence_count,
            processingEvidenceCount=processing_count,
            staleEvidenceCount=stale_evidence,
            openGapsCount=open_gaps,
            addressedGapsCount=addressed_gaps,
            closedGapsCount=closed_gaps,
            pendingReviewsCount=pending_reviews,
            overdueTasksCount=overdue_tasks,
            auditReadinessScore=round(readiness, 2),
            forecastDaysToReadiness=forecast_days,
            computedAt=now,
        )

    @staticmethod
    async def list_review_queue(current_user: dict) -> List[ReviewQueueItem]:
        db = get_db()
        user_id, institution_id, role = ComplianceService._scope(current_user)

        if role != "ADMIN" and not institution_id:
            return []

        where_clause = {} if role == "ADMIN" else {"institutionId": institution_id}
        mappings = await db.criteriamapping.find_many(
            where=where_clause,
            include={"criterion": {"include": {"standard": True}}},
            order=[{"confidenceScore": "asc"}, {"updatedAt": "desc"}],
            take=500,
        )

        decisions = await ComplianceService._mapping_review_decisions(user_id)
        items: List[ReviewQueueItem] = []
        for m in mappings:
            if not m.criterion:
                continue
            is_risky = m.status in {"gap", "partial"} or float(m.confidenceScore or 0) < 0.75
            if not is_risky:
                continue

            decision_meta = decisions.get(m.id)
            items.append(
                ReviewQueueItem(
                    mappingId=m.id,
                    criterionId=m.criterionId,
                    criterionTitle=m.criterion.title,
                    standardId=m.standardId,
                    standardTitle=(m.criterion.standard.title if m.criterion.standard else "Unknown"),
                    status=m.status,
                    confidenceScore=float(m.confidenceScore or 0),
                    aiReasoning=m.aiReasoning or "",
                    evidenceId=m.evidenceId,
                    reviewed=bool(decision_meta),
                )
            )

        return items

    @staticmethod
    async def submit_review_decision(
        mapping_id: str, body: ReviewDecisionRequest, current_user: dict
    ) -> ReviewDecisionResponse:
        db = get_db()
        user_id, institution_id, role = ComplianceService._scope(current_user)
        mapping = await db.criteriamapping.find_unique(where={"id": mapping_id})
        if not mapping:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mapping not found")
        if role != "ADMIN" and mapping.institutionId != institution_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        patch_data: Dict[str, Any] = {}
        if body.decision == "edit":
            if body.statusOverride:
                patch_data["status"] = body.statusOverride
            if body.evidenceIdOverride is not None:
                patch_data["evidenceId"] = body.evidenceIdOverride
            if body.note:
                patch_data["aiReasoning"] = (mapping.aiReasoning or "") + f"\nReviewer note: {body.note}"
        elif body.decision == "approve":
            if mapping.status == "gap":
                patch_data["status"] = "partial"

        if patch_data:
            await db.criteriamapping.update(where={"id": mapping_id}, data=patch_data)

        await ActivityService.log_activity(
            user_id=user_id,
            type="mapping_review_decision",
            title=f"Review decision: {body.decision}",
            description=body.note,
            entity_id=mapping_id,
            entity_type="criteria_mapping",
            metadata={
                "decision": body.decision,
                "statusOverride": body.statusOverride,
                "evidenceIdOverride": body.evidenceIdOverride,
                "note": body.note,
            },
        )

        current = await db.criteriamapping.find_unique(where={"id": mapping_id})
        return ReviewDecisionResponse(
            mappingId=mapping_id,
            decision=body.decision,
            status=current.status if current else (body.statusOverride or mapping.status),
            reviewedAt=datetime.now(timezone.utc),
        )

    @staticmethod
    def _apply_task_event(task_state: Dict[str, Any], activity_type: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        if activity_type == "action_plan_created":
            return dict(metadata.get("task") or {})
        if activity_type == "action_plan_updated":
            patch = metadata.get("patch") or {}
            next_state = dict(task_state)
            next_state.update(patch)
            return next_state
        return task_state

    @staticmethod
    async def list_action_plan_tasks(current_user: dict) -> List[ActionPlanTask]:
        db = get_db()
        user_id, _, role = ComplianceService._scope(current_user)
        activity_where = {"type": {"in": ["action_plan_created", "action_plan_updated"]}}
        if role != "ADMIN":
            activity_where["userId"] = user_id

        events = await db.activity.find_many(where=activity_where, order={"createdAt": "asc"}, take=5000)
        by_task: Dict[str, Dict[str, Any]] = {}
        for evt in events:
            if not evt.entityId:
                continue
            meta = ComplianceService._as_dict(evt.metadata)
            current = by_task.get(evt.entityId, {})
            by_task[evt.entityId] = ComplianceService._apply_task_event(current, evt.type, meta)

        tasks: List[ActionPlanTask] = []
        for task in by_task.values():
            if not task:
                continue
            task.setdefault("metadata", {})
            if task.get("status") == "archived":
                continue
            tasks.append(ActionPlanTask(**task))
        tasks.sort(key=lambda t: (t.dueDate or datetime.max, t.updatedAt), reverse=False)
        return tasks

    @staticmethod
    async def create_action_plan_task(body: ActionPlanCreateRequest, current_user: dict) -> ActionPlanTask:
        user_id, _, _ = ComplianceService._scope(current_user)
        task_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        task = ActionPlanTask(
            id=task_id,
            title=body.title,
            description=body.description,
            ownerId=body.ownerId or user_id,
            dueDate=body.dueDate,
            status="todo",
            priority=body.priority,
            gapId=body.gapId,
            criterionId=body.criterionId,
            createdBy=user_id,
            createdAt=now,
            updatedAt=now,
            metadata=body.metadata,
        )
        await ActivityService.log_activity(
            user_id=user_id,
            type="action_plan_created",
            title=f"Action Plan Task: {task.title}",
            description=task.description,
            entity_id=task_id,
            entity_type="action_plan_task",
            metadata={"task": task.model_dump(mode="json")},
        )
        return task

    @staticmethod
    async def update_action_plan_task(
        task_id: str, body: ActionPlanUpdateRequest, current_user: dict
    ) -> ActionPlanTask:
        user_id, _, _ = ComplianceService._scope(current_user)
        tasks = await ComplianceService.list_action_plan_tasks(current_user)
        current = next((t for t in tasks if t.id == task_id), None)
        if not current:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

        patch = body.model_dump(exclude_none=True)
        patch["updatedAt"] = datetime.now(timezone.utc).isoformat()
        await ActivityService.log_activity(
            user_id=user_id,
            type="action_plan_updated",
            title=f"Action Task Updated: {current.title}",
            description=f"Status: {patch.get('status', current.status)}",
            entity_id=task_id,
            entity_type="action_plan_task",
            metadata={"patch": patch},
        )
        merged = current.model_dump()
        merged.update(body.model_dump(exclude_none=True))
        merged["updatedAt"] = datetime.now(timezone.utc)
        return ActionPlanTask(**merged)

    @staticmethod
    def _apply_workflow_event(run_state: Dict[str, Any], activity_type: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        if activity_type == "workflow_run_started":
            return dict(metadata.get("run") or {})
        if activity_type == "workflow_run_updated":
            next_state = dict(run_state)
            patch = metadata.get("patch") or {}
            next_state.update(patch)
            return next_state
        return run_state

    @staticmethod
    async def list_workflow_runs(current_user: dict) -> List[WorkflowRun]:
        db = get_db()
        user_id, _, role = ComplianceService._scope(current_user)
        where = {"type": {"in": ["workflow_run_started", "workflow_run_updated"]}}
        if role != "ADMIN":
            where["userId"] = user_id
        events = await db.activity.find_many(where=where, order={"createdAt": "asc"}, take=5000)
        by_run: Dict[str, Dict[str, Any]] = {}
        for evt in events:
            if not evt.entityId:
                continue
            by_run[evt.entityId] = ComplianceService._apply_workflow_event(
                by_run.get(evt.entityId, {}),
                evt.type,
                ComplianceService._as_dict(evt.metadata),
            )
        runs = [WorkflowRun(**run) for run in by_run.values() if run]
        runs.sort(key=lambda r: r.startedAt, reverse=True)
        return runs

    @staticmethod
    async def create_workflow_run(body: WorkflowRunCreateRequest, current_user: dict) -> WorkflowRun:
        user_id, _, _ = ComplianceService._scope(current_user)
        now = datetime.now(timezone.utc)
        run = WorkflowRun(
            id=str(uuid.uuid4()),
            workflowName=body.workflowName,
            status="queued",
            trigger=body.trigger,
            startedAt=now,
            startedBy=user_id,
            message=body.message,
            metadata=body.metadata,
        )
        await ActivityService.log_activity(
            user_id=user_id,
            type="workflow_run_started",
            title=f"Workflow queued: {body.workflowName}",
            description=body.message,
            entity_id=run.id,
            entity_type="workflow_run",
            metadata={"run": run.model_dump(mode="json")},
        )
        # Manual runs from the UI are recorded as immediately completed so Activity reflects a finished audit entry.
        end = datetime.now(timezone.utc)
        await ActivityService.log_activity(
            user_id=user_id,
            type="workflow_run_updated",
            title=f"Workflow completed: {body.workflowName}",
            description=body.message,
            entity_id=run.id,
            entity_type="workflow_run",
            metadata={
                "patch": {
                    "status": "success",
                    "endedAt": end.isoformat(),
                }
            },
        )
        return WorkflowRun(
            id=run.id,
            workflowName=run.workflowName,
            status="success",
            trigger=run.trigger,
            startedAt=run.startedAt,
            endedAt=end,
            startedBy=run.startedBy,
            message=run.message,
            metadata=run.metadata,
        )

    @staticmethod
    async def update_workflow_run(run_id: str, body: WorkflowRunUpdateRequest, current_user: dict) -> WorkflowRun:
        user_id, _, _ = ComplianceService._scope(current_user)
        runs = await ComplianceService.list_workflow_runs(current_user)
        current = next((r for r in runs if r.id == run_id), None)
        if not current:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow run not found")

        patch = body.model_dump(exclude_none=True)
        if body.status in {"success", "failed", "canceled"}:
            patch["endedAt"] = datetime.now(timezone.utc).isoformat()
        await ActivityService.log_activity(
            user_id=user_id,
            type="workflow_run_updated",
            title=f"Workflow {body.status}: {current.workflowName}",
            description=body.message,
            entity_id=run_id,
            entity_type="workflow_run",
            metadata={"patch": patch},
        )
        merged = current.model_dump()
        merged.update(body.model_dump(exclude_none=True))
        if body.status in {"success", "failed", "canceled"}:
            merged["endedAt"] = datetime.now(timezone.utc)
        return WorkflowRun(**merged)

    @staticmethod
    async def list_audit_trail(
        current_user: dict,
        take: int = 100,
        skip: int = 0,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        event_type: Optional[str] = None,
    ) -> List[AuditTrailItem]:
        db = get_db()
        user_id, _, role = ComplianceService._scope(current_user)
        where: Dict[str, Any] = {}
        if role != "ADMIN":
            where["userId"] = user_id
        if entity_type:
            where["entityType"] = entity_type
        if entity_id:
            where["entityId"] = entity_id
        if event_type:
            where["type"] = event_type

        rows = await db.activity.find_many(where=where, order={"createdAt": "desc"}, take=take, skip=skip)
        return [
            AuditTrailItem(
                id=row.id,
                type=row.type,
                title=row.title,
                description=row.description,
                entityId=row.entityId,
                entityType=row.entityType,
                metadata=ComplianceService._as_dict(row.metadata),
                createdAt=row.createdAt,
            )
            for row in rows
        ]

    @staticmethod
    async def create_comment(
        body: CollaborationCommentCreateRequest, current_user: dict
    ) -> CollaborationComment:
        user_id, _, _ = ComplianceService._scope(current_user)
        created = await ActivityService.log_activity(
            user_id=user_id,
            type="collaboration_comment",
            title=f"Comment on {body.entityType}",
            description=body.text[:200],
            entity_id=body.entityId,
            entity_type=body.entityType,
            metadata={"text": body.text, "mentions": body.mentions},
        )
        return CollaborationComment(
            id=created.id,
            entityType=body.entityType,
            entityId=body.entityId,
            text=body.text,
            mentions=body.mentions,
            authorId=user_id,
            createdAt=created.createdAt,
        )

    @staticmethod
    async def list_comments(entity_type: str, entity_id: str, current_user: dict) -> List[CollaborationComment]:
        db = get_db()
        user_id, _, role = ComplianceService._scope(current_user)
        where: Dict[str, Any] = {"type": "collaboration_comment", "entityType": entity_type, "entityId": entity_id}
        if role != "ADMIN":
            where["userId"] = user_id
        rows = await db.activity.find_many(where=where, order={"createdAt": "asc"})
        comments: List[CollaborationComment] = []
        for row in rows:
            meta = ComplianceService._as_dict(row.metadata)
            comments.append(
                CollaborationComment(
                    id=row.id,
                    entityType=entity_type,
                    entityId=entity_id,
                    text=str(meta.get("text", row.description or "")),
                    mentions=list(meta.get("mentions", [])) if isinstance(meta.get("mentions"), list) else [],
                    authorId=row.userId,
                    createdAt=row.createdAt,
                )
            )
        return comments

    @staticmethod
    async def get_entity_versions(
        entity_type: str, entity_id: str, current_user: dict
    ) -> List[VersionEntry]:
        db = get_db()
        user_id, _, role = ComplianceService._scope(current_user)
        where: Dict[str, Any] = {
            "type": {"in": [f"{entity_type}_snapshot_created", f"{entity_type}_snapshot_updated", f"{entity_type}_snapshot_deleted"]},
            "entityType": entity_type,
            "entityId": entity_id,
        }
        if role != "ADMIN":
            where["userId"] = user_id

        rows = await db.activity.find_many(where=where, order={"createdAt": "desc"}, take=200)
        versions: List[VersionEntry] = []
        for row in rows:
            meta = ComplianceService._as_dict(row.metadata)
            versions.append(
                VersionEntry(
                    id=row.id,
                    kind=row.type,
                    entityType=entity_type,
                    entityId=entity_id,
                    createdAt=row.createdAt,
                    actorId=row.userId,
                    snapshot=meta.get("snapshot", {}),
                    diff=meta.get("diff"),
                )
            )
        return versions
