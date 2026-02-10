"""
Horus AI API Router

Conversational AI with full platform awareness.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.auth.dependencies import get_current_user
from app.core.db import get_db, Prisma
import traceback

router = APIRouter(prefix="/horus", tags=["horus"])


class Observation(BaseModel):
    """A response from Horus."""
    content: str
    timestamp: datetime
    state_hash: str


def get_user_id(current_user):
    """Safely extract user_id from current_user."""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if isinstance(current_user, dict):
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user data")
        return user_id
    if hasattr(current_user, 'id'):
        return current_user.id
    raise HTTPException(status_code=401, detail="Invalid user format")


def generate_horus_response(message: Optional[str]) -> Observation:
    """Generate a Horus response without database dependency."""
    if not message:
        return Observation(
            content="Hey there! I'm Horus, your AI assistant for the Ayn platform. How can I help you today?",
            timestamp=datetime.utcnow(),
            state_hash="v1"
        )
    
    msg_lower = message.lower()
    
    # Greetings
    if any(word in msg_lower for word in ["hello", "hi", "hey", "مرحب", "أهلا", "سلام"]):
        return Observation(
            content="Hello! 👋 I'm Horus, your AI assistant. I can help you with:\n\n• Uploading and analyzing compliance documents\n• Creating evidence scopes\n• Running gap analysis\n• Checking platform status\n\nWhat would you like to do?",
            timestamp=datetime.utcnow(),
            state_hash="v1"
        )
    
    # Help
    if any(word in msg_lower for word in ["help", "assist", "support"]):
        return Observation(
            content="I can help you with:\n\n1. **File Management** - Upload and analyze compliance documents\n2. **Evidence** - Create and organize evidence scopes\n3. **Gap Analysis** - Identify compliance gaps\n4. **Dashboard** - View platform metrics\n\nJust tell me what you'd like to do!",
            timestamp=datetime.utcnow(),
            state_hash="v1"
        )
    
    # Status
    if any(word in msg_lower for word in ["status", "state", "what do you see"]):
        return Observation(
            content="I'm online and ready to help! The platform state tracking is being set up. In the meantime, I can help you upload files and manage your compliance project.",
            timestamp=datetime.utcnow(),
            state_hash="v1"
        )
    
    # File upload
    if any(word in msg_lower for word in ["upload", "file", "document"]):
        return Observation(
            content="You can upload compliance documents (PDF, Word, Excel) and I'll help analyze them for standards like ISO 9001, ISO 21001, and NAQAAE. Use the paperclip button below to upload files!",
            timestamp=datetime.utcnow(),
            state_hash="v1"
        )
    
    # Default response
    return Observation(
        content=f"I understand: \"{message}\"\n\nI'm here to help with your compliance project. You can ask me to:\n• Upload and analyze documents\n• Create evidence scopes\n• Run gap analysis\n• Check platform status\n\nWhat would you like to do?",
        timestamp=datetime.utcnow(),
        state_hash="v1"
    )


@router.get("/observe", response_model=Observation)
async def horus_chat(
    query: Optional[str] = Query(None, description="User message to Horus"),
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Chat with Horus AI.
    """
    try:
        # Just verify user is authenticated, don't need the ID for now
        _ = get_user_id(current_user)
        return generate_horus_response(query)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Horus error: {e}")
        print(traceback.format_exc())
        return Observation(
            content=f"⚠️ Error: {str(e)}",
            timestamp=datetime.utcnow(),
            state_hash="error"
        )


@router.post("/chat", response_model=Observation)
async def horus_chat_post(
    query: Optional[str] = Query(None, description="User message to Horus"),
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Chat with Horus AI (POST method).
    """
    try:
        _ = get_user_id(current_user)
        return generate_horus_response(query)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Horus error: {e}")
        print(traceback.format_exc())
        return Observation(
            content=f"⚠️ Error: {str(e)}",
            timestamp=datetime.utcnow(),
            state_hash="error"
        )


@router.get("/state/files")
async def get_files_detailed_state(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed files state breakdown."""
    _ = get_user_id(current_user)
    return {"total": 0, "by_status": {}, "unlinked": []}


@router.get("/state/gaps")
async def get_gaps_detailed_state(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed gaps state breakdown."""
    _ = get_user_id(current_user)
    return {"total": 0, "by_status": {}, "by_standard": {}}


@router.get("/state/evidence")
async def get_evidence_detailed_state(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed evidence state breakdown."""
    _ = get_user_id(current_user)
    return {"total": 0, "linked": 0, "unlinked": 0}
