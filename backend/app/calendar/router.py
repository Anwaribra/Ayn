"""Calendar milestones API - stores milestones in Activity table."""
import json
import logging
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.middlewares import get_current_user
from app.core.db import get_db

logger = logging.getLogger(__name__)
router = APIRouter()

class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    dueDate: str
    category: Optional[str] = "deadline"
    priority: Optional[str] = "medium"

class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    dueDate: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    completed: Optional[bool] = None

@router.get("")
async def list_milestones(current_user: dict = Depends(get_current_user)):
    db = get_db()
    activities = await db.activity.find_many(
        where={"userId": current_user["id"], "type": "calendar_milestone"},
        order={"createdAt": "desc"},
        take=100,
    )
    milestones = []
    for a in activities:
        meta = a.metadata if isinstance(a.metadata, dict) else json.loads(a.metadata) if a.metadata else {}
        if not meta.get("deleted"):
            milestones.append({
                "id": a.id,
                "title": a.title,
                "description": a.description,
                "dueDate": meta.get("dueDate"),
                "category": meta.get("category", "deadline"),
                "priority": meta.get("priority", "medium"),
                "completed": meta.get("completed", False),
                "createdAt": a.createdAt.isoformat(),
            })
    return milestones

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_milestone(body: MilestoneCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    activity = await db.activity.create(data={
        "userId": current_user["id"],
        "type": "calendar_milestone",
        "title": body.title,
        "description": body.description,
        "entityType": "milestone",
        "metadata": json.dumps({
            "dueDate": body.dueDate,
            "category": body.category,
            "priority": body.priority,
            "completed": False,
        }),
    })
    meta = json.loads(activity.metadata) if isinstance(activity.metadata, str) else activity.metadata
    return {"id": activity.id, "title": activity.title, "description": activity.description, **meta, "createdAt": activity.createdAt.isoformat()}

@router.patch("/{milestone_id}")
async def update_milestone(milestone_id: str, body: MilestoneUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = await db.activity.find_unique(where={"id": milestone_id})
    if not existing or existing.userId != current_user["id"]:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    meta = existing.metadata if isinstance(existing.metadata, dict) else json.loads(existing.metadata) if existing.metadata else {}
    if body.dueDate is not None: meta["dueDate"] = body.dueDate
    if body.category is not None: meta["category"] = body.category
    if body.priority is not None: meta["priority"] = body.priority
    if body.completed is not None: meta["completed"] = body.completed
    
    updated = await db.activity.update(
        where={"id": milestone_id},
        data={
            "title": body.title or existing.title,
            "description": body.description if body.description is not None else existing.description,
            "metadata": json.dumps(meta),
        }
    )
    return {"id": updated.id, "title": updated.title, "description": updated.description, **meta, "createdAt": updated.createdAt.isoformat()}

@router.delete("/{milestone_id}")
async def delete_milestone(milestone_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = await db.activity.find_unique(where={"id": milestone_id})
    if not existing or existing.userId != current_user["id"]:
        raise HTTPException(status_code=404, detail="Milestone not found")
    await db.activity.delete(where={"id": milestone_id})
    return {"message": "Deleted"}
