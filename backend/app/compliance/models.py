from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional, Literal
from pydantic import BaseModel, Field


TaskStatus = Literal["todo", "in_progress", "blocked", "done", "archived"]
TaskPriority = Literal["low", "medium", "high", "critical"]
ReviewDecision = Literal["approve", "reject", "edit"]
WorkflowStatus = Literal["queued", "running", "success", "failed", "canceled"]


class CommandCenterResponse(BaseModel):
    evidenceCount: int
    processingEvidenceCount: int
    staleEvidenceCount: int
    openGapsCount: int
    addressedGapsCount: int
    closedGapsCount: int
    pendingReviewsCount: int
    overdueTasksCount: int
    auditReadinessScore: float
    forecastDaysToReadiness: Optional[int] = None
    computedAt: datetime


class ReviewQueueItem(BaseModel):
    mappingId: str
    criterionId: str
    criterionTitle: str
    standardId: str
    standardTitle: str
    status: str
    confidenceScore: float
    aiReasoning: str
    evidenceId: Optional[str] = None
    reviewed: bool = False


class ReviewDecisionRequest(BaseModel):
    decision: ReviewDecision
    note: Optional[str] = None
    statusOverride: Optional[str] = None
    evidenceIdOverride: Optional[str] = None


class ReviewDecisionResponse(BaseModel):
    mappingId: str
    decision: ReviewDecision
    status: str
    reviewedAt: datetime


class ActionPlanTask(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    ownerId: Optional[str] = None
    dueDate: Optional[datetime] = None
    status: TaskStatus = "todo"
    priority: TaskPriority = "medium"
    gapId: Optional[str] = None
    criterionId: Optional[str] = None
    createdBy: str
    createdAt: datetime
    updatedAt: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ActionPlanCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    ownerId: Optional[str] = None
    dueDate: Optional[datetime] = None
    priority: TaskPriority = "medium"
    gapId: Optional[str] = None
    criterionId: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ActionPlanUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    ownerId: Optional[str] = None
    dueDate: Optional[datetime] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    metadata: Optional[Dict[str, Any]] = None


class WorkflowRun(BaseModel):
    id: str
    workflowName: str
    status: WorkflowStatus
    trigger: str
    startedAt: datetime
    endedAt: Optional[datetime] = None
    startedBy: str
    message: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class WorkflowRunCreateRequest(BaseModel):
    workflowName: str
    trigger: str = "manual"
    message: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class WorkflowRunUpdateRequest(BaseModel):
    status: WorkflowStatus
    message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AuditTrailItem(BaseModel):
    id: str
    type: str
    title: str
    description: Optional[str] = None
    entityId: Optional[str] = None
    entityType: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    createdAt: datetime


class CollaborationCommentCreateRequest(BaseModel):
    entityType: str
    entityId: str
    text: str
    mentions: List[str] = Field(default_factory=list)


class CollaborationComment(BaseModel):
    id: str
    entityType: str
    entityId: str
    text: str
    mentions: List[str] = Field(default_factory=list)
    authorId: str
    createdAt: datetime


class VersionEntry(BaseModel):
    id: str
    kind: str
    entityType: str
    entityId: str
    createdAt: datetime
    actorId: Optional[str] = None
    snapshot: Dict[str, Any] = Field(default_factory=dict)
    diff: Optional[Dict[str, Any]] = None

