from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
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
from app.compliance.service import ComplianceService

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/command-center", response_model=CommandCenterResponse)
async def get_command_center(current_user: dict = Depends(get_current_user)):
    return await ComplianceService.get_command_center(current_user)


@router.get("/review-queue", response_model=List[ReviewQueueItem])
async def get_review_queue(current_user: dict = Depends(get_current_user)):
    return await ComplianceService.list_review_queue(current_user)


@router.post("/review-queue/{mapping_id}/decision", response_model=ReviewDecisionResponse)
async def decide_review(
    mapping_id: str,
    body: ReviewDecisionRequest,
    current_user: dict = Depends(get_current_user),
):
    return await ComplianceService.submit_review_decision(mapping_id, body, current_user)


@router.get("/action-plans", response_model=List[ActionPlanTask])
async def list_action_plans(current_user: dict = Depends(get_current_user)):
    return await ComplianceService.list_action_plan_tasks(current_user)


@router.post("/action-plans", response_model=ActionPlanTask)
async def create_action_plan(
    body: ActionPlanCreateRequest, current_user: dict = Depends(get_current_user)
):
    return await ComplianceService.create_action_plan_task(body, current_user)


@router.patch("/action-plans/{task_id}", response_model=ActionPlanTask)
async def update_action_plan(
    task_id: str, body: ActionPlanUpdateRequest, current_user: dict = Depends(get_current_user)
):
    return await ComplianceService.update_action_plan_task(task_id, body, current_user)


@router.get("/workflows/runs", response_model=List[WorkflowRun])
async def list_workflow_runs(current_user: dict = Depends(get_current_user)):
    return await ComplianceService.list_workflow_runs(current_user)


@router.post("/workflows/runs", response_model=WorkflowRun)
async def create_workflow_run(
    body: WorkflowRunCreateRequest, current_user: dict = Depends(get_current_user)
):
    return await ComplianceService.create_workflow_run(body, current_user)


@router.patch("/workflows/runs/{run_id}", response_model=WorkflowRun)
async def update_workflow_run(
    run_id: str, body: WorkflowRunUpdateRequest, current_user: dict = Depends(get_current_user)
):
    return await ComplianceService.update_workflow_run(run_id, body, current_user)


@router.get("/audit-trail", response_model=List[AuditTrailItem])
async def get_audit_trail(
    take: int = Query(default=100, ge=1, le=500),
    skip: int = Query(default=0, ge=0),
    entity_type: Optional[str] = Query(default=None),
    entity_id: Optional[str] = Query(default=None),
    event_type: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    return await ComplianceService.list_audit_trail(
        current_user=current_user,
        take=take,
        skip=skip,
        entity_type=entity_type,
        entity_id=entity_id,
        event_type=event_type,
    )


@router.post("/collaboration/comments", response_model=CollaborationComment)
async def post_comment(
    body: CollaborationCommentCreateRequest, current_user: dict = Depends(get_current_user)
):
    return await ComplianceService.create_comment(body, current_user)


@router.get("/collaboration/comments/{entity_type}/{entity_id}", response_model=List[CollaborationComment])
async def get_comments(
    entity_type: str, entity_id: str, current_user: dict = Depends(get_current_user)
):
    return await ComplianceService.list_comments(entity_type, entity_id, current_user)


@router.get("/versions/{entity_type}/{entity_id}", response_model=List[VersionEntry])
async def get_versions(
    entity_type: str, entity_id: str, current_user: dict = Depends(get_current_user)
):
    return await ComplianceService.get_entity_versions(entity_type, entity_id, current_user)

