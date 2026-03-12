"""DocumentDraft CRUD API."""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.middlewares import get_current_user
from app.core.db import get_db

logger = logging.getLogger(__name__)
router = APIRouter()

class DraftCreate(BaseModel):
    title: str
    content: str
    gapId: Optional[str] = None

class DraftUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None

@router.get("")
async def list_drafts(current_user: dict = Depends(get_current_user)):
    db = get_db()
    drafts = await db.documentdraft.find_many(
        where={"userId": current_user["id"]},
        order={"updatedAt": "desc"},
    )
    return [{"id": d.id, "title": d.title, "content": d.content, "status": d.status, "gapId": d.gapId, "createdAt": d.createdAt.isoformat(), "updatedAt": d.updatedAt.isoformat()} for d in drafts]

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_draft(body: DraftCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    institution_id = current_user.get("institutionId")
    if not institution_id:
        raise HTTPException(status_code=400, detail="No institution linked to your account")
    draft = await db.documentdraft.create(data={
        "userId": current_user["id"],
        "institutionId": institution_id,
        "title": body.title,
        "content": body.content,
        "gapId": body.gapId,
    })
    return {"id": draft.id, "title": draft.title, "content": draft.content, "status": draft.status, "gapId": draft.gapId, "createdAt": draft.createdAt.isoformat(), "updatedAt": draft.updatedAt.isoformat()}

@router.get("/{draft_id}")
async def get_draft(draft_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    draft = await db.documentdraft.find_unique(where={"id": draft_id})
    if not draft or draft.userId != current_user["id"]:
        raise HTTPException(status_code=404, detail="Draft not found")
    return {"id": draft.id, "title": draft.title, "content": draft.content, "status": draft.status, "gapId": draft.gapId, "createdAt": draft.createdAt.isoformat(), "updatedAt": draft.updatedAt.isoformat()}

@router.patch("/{draft_id}")
async def update_draft(draft_id: str, body: DraftUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    draft = await db.documentdraft.find_unique(where={"id": draft_id})
    if not draft or draft.userId != current_user["id"]:
        raise HTTPException(status_code=404, detail="Draft not found")
    data = {}
    if body.title is not None: data["title"] = body.title
    if body.content is not None: data["content"] = body.content
    if body.status is not None: data["status"] = body.status
    updated = await db.documentdraft.update(where={"id": draft_id}, data=data)
    return {"id": updated.id, "title": updated.title, "content": updated.content, "status": updated.status, "gapId": updated.gapId, "createdAt": updated.createdAt.isoformat(), "updatedAt": updated.updatedAt.isoformat()}

@router.delete("/{draft_id}")
async def delete_draft(draft_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    draft = await db.documentdraft.find_unique(where={"id": draft_id})
    if not draft or draft.userId != current_user["id"]:
        raise HTTPException(status_code=404, detail="Draft not found")
    await db.documentdraft.delete(where={"id": draft_id})
    return {"message": "Deleted"}
