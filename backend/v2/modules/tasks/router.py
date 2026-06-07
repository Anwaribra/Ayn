import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from v2.core.database import get_db_session
from app.core.middlewares import get_current_user
from v2.modules.tasks.models import Task, TaskStatus, TaskPriority
from v2.modules.standards.router import get_active_campus_id
from v2.modules.standards.models import Requirement, Criterion, Standard
from v2.modules.validation.models import Risk
from v2.modules.organizations.models import User

router = APIRouter(prefix="/tasks", tags=["tasks"])

class TaskCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: str | None = Field(None, max_length=1000)
    priority: TaskPriority = Field(TaskPriority.MEDIUM)
    status: TaskStatus = Field(TaskStatus.OPEN)
    assignee_id: str | None = Field(None)
    due_date: str | None = Field(None) # ISO string
    reference_type: str | None = Field(None, max_length=50)
    reference_id: str | None = Field(None, max_length=255)
    metadata_json: dict | None = Field(None)

class TaskUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    description: str | None = Field(None, max_length=1000)
    priority: TaskPriority | None = Field(None)
    status: TaskStatus | None = Field(None)
    assignee_id: str | None = Field(None)
    due_date: str | None = Field(None)
    reference_type: str | None = Field(None)
    reference_id: str | None = Field(None)


@router.get("")
async def list_tasks(
    status: TaskStatus | None = Query(None),
    priority: TaskPriority | None = Query(None),
    campus_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    """
    List tasks for the active campus.
    """
    active_campus = await get_active_campus_id(db, current_user["id"], campus_id)
    
    stmt = select(Task).where(Task.campus_id == active_campus)
    if status:
        stmt = stmt.where(Task.status == status)
    if priority:
        stmt = stmt.where(Task.priority == priority)
        
    stmt = stmt.order_by(Task.created_at.desc())
    tasks = (await db.execute(stmt)).scalars().all()
    
    # Enrich tasks with linked object details (e.g. Standard, Requirement, Assignee Name)
    enriched_tasks = []
    for t in tasks:
        assignee_name = None
        if t.assignee_id:
            user_stmt = select(User.email).where(User.id == t.assignee_id)
            user_res = (await db.execute(user_stmt)).scalar_one_or_none()
            if user_res:
                assignee_name = user_res.split("@")[0].title()
                
        # Resolve linked standard / requirement if references are present
        linked_standard_id = None
        linked_standard_title = None
        linked_requirement_title = None
        
        req_id = None
        if t.reference_type == "requirement" and t.reference_id:
            try:
                req_id = uuid.UUID(t.reference_id)
            except ValueError:
                pass
        elif t.reference_type == "risk" and t.reference_id:
            try:
                risk_uuid = uuid.UUID(t.reference_id)
                risk_stmt = select(Risk).where(Risk.id == risk_uuid)
                risk_obj = (await db.execute(risk_stmt)).scalar_one_or_none()
                if risk_obj and risk_obj.reference_type == "requirement" and risk_obj.reference_id:
                    req_id = uuid.UUID(risk_obj.reference_id)
            except ValueError:
                pass
                
        if req_id:
            req_stmt = select(Requirement, Criterion, Standard).join(
                Criterion, Criterion.id == Requirement.criterion_id
            ).join(
                Standard, Standard.id == Criterion.standard_id
            ).where(Requirement.id == req_id)
            req_res = (await db.execute(req_stmt)).first()
            if req_res:
                req_obj, crit_obj, std_obj = req_res
                linked_standard_id = str(std_obj.id)
                linked_standard_title = std_obj.code or std_obj.title
                linked_requirement_title = req_obj.title
                
        enriched_tasks.append({
            "id": str(t.id),
            "campus_id": str(t.campus_id),
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "priority": t.priority,
            "assignee_id": str(t.assignee_id) if t.assignee_id else None,
            "assignee_name": assignee_name,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "reference_type": t.reference_type,
            "reference_id": t.reference_id,
            "linked_standard_id": linked_standard_id,
            "linked_standard_title": linked_standard_title,
            "linked_requirement_title": linked_requirement_title,
            "created_at": t.created_at.isoformat() if t.created_at else None
        })
        
    return enriched_tasks


@router.post("", status_code=201)
async def create_task(
    payload: TaskCreate,
    campus_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new compliance task.
    """
    active_campus = await get_active_campus_id(db, current_user["id"], campus_id)
    
    due_dt = None
    if payload.due_date:
        try:
            # Parse ISO date string
            due_dt = datetime.fromisoformat(payload.due_date.replace("Z", "+00:00"))
        except ValueError:
            pass
            
    assignee_uuid = None
    if payload.assignee_id:
        try:
            assignee_uuid = uuid.UUID(payload.assignee_id)
        except ValueError:
            pass
            
    # If resolving from risk, verify risk exists
    if payload.reference_type == "risk" and payload.reference_id:
        try:
            risk_uuid = uuid.UUID(payload.reference_id)
            stmt = select(Risk).where(Risk.id == risk_uuid)
            risk = (await db.execute(stmt)).scalar_one_or_none()
            if risk:
                # If there's an associated risk, auto-fill standard/requirement linkage
                pass
        except ValueError:
            pass
            
    task = Task(
        campus_id=active_campus,
        title=payload.title,
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        assignee_id=assignee_uuid,
        due_date=due_dt,
        reference_type=payload.reference_type,
        reference_id=payload.reference_id,
        metadata_json=payload.metadata_json
    )
    
    db.add(task)
    await db.commit()
    await db.refresh(task)
    
    return {
        "status": "success",
        "task_id": str(task.id),
        "message": "Task created successfully"
    }


@router.patch("/{task_id}")
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Update an existing task properties.
    """
    task_uuid = uuid.UUID(task_id)
    stmt = select(Task).where(Task.id == task_uuid)
    task = (await db.execute(stmt)).scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.status is not None:
        task.status = payload.status
    if payload.due_date is not None:
        try:
            task.due_date = datetime.fromisoformat(payload.due_date.replace("Z", "+00:00"))
        except ValueError:
            task.due_date = None
    if payload.assignee_id is not None:
        try:
            task.assignee_id = uuid.UUID(payload.assignee_id) if payload.assignee_id else None
        except ValueError:
            task.assignee_id = None
            
    await db.commit()
    return {
        "status": "success",
        "message": "Task updated successfully"
    }
