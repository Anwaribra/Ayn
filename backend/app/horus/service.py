"""
Horus AI Service - Global Brain Refactor

Conversational intelligence with full platform awareness, persistence, and streaming.
"""

import base64
import json
import logging
import asyncio
from datetime import datetime
from typing import List, Optional, Dict, Any, AsyncGenerator
from pydantic import BaseModel

from app.ai.service import get_gemini_client
from app.evidence.service import EvidenceService
from app.notifications.service import NotificationService
from app.notifications.models import NotificationCreateRequest
from app.chat.service import ChatService
from app.activity.service import ActivityService

logger = logging.getLogger(__name__)


class Observation(BaseModel):
    """A response from Horus."""
    content: str
    chat_id: str
    timestamp: datetime
    state_hash: str
    structured: Optional[Dict[str, Any]] = None
    suggested_actions: List[Dict[str, Any]] = []


class HorusService:
    """
    Horus AI - Global Platform Intelligence.
    """
    
    def __init__(self, state_manager):
        self.state_manager = state_manager
    
    async def chat(
        self, 
        user_id: str, 
        message: Optional[str] = None, 
        chat_id: Optional[str] = None,
        files: List[Any] = None,
        background_tasks: Any = None,
        db: Any = None,
        current_user: Any = None
    ) -> Observation:
        """
        Non-streaming chat interface with persistence.
        """
        # 1. Ensure Chat exists
        if not chat_id:
            chat = await ChatService.create_chat(user_id, title=message[:50] if message else "New Conversation")
            chat_id = chat.id
        
        # 2. Save User Message
        if message:
            await ChatService.save_message(chat_id, user_id, "user", message)
            await ActivityService.log_activity(
                user_id=user_id,
                type="chat_message",
                title="Message sent to Horus",
                entity_id=chat_id,
                entity_type="chat"
            )

        # 3. Get State Summary
        summary = await self.state_manager.get_state_summary(user_id)
        state_hash = self._hash_state(summary)
        
        # 4. Handle Files
        file_references = []
        if files:
            for file in files:
                upload_result = await EvidenceService.upload_evidence(
                    file=file,
                    current_user=current_user,
                    background_tasks=background_tasks
                )
                if upload_result.success:
                    content = await file.read()
                    await file.seek(0)
                    file_references.append({
                        "type": "image" if file.content_type.startswith("image/") else "document" if file.content_type == "application/pdf" else "text",
                        "mime_type": file.content_type,
                        "data": base64.b64encode(content).decode("utf-8"),
                        "filename": file.filename
                    })
                    
                    await ActivityService.log_activity(
                        user_id=user_id,
                        type="evidence_uploaded",
                        title=f"File uploaded: {file.filename}",
                        entity_id=upload_result.evidenceId,
                        entity_type="evidence"
                    )

        # 5. AI Interaction
        client = get_gemini_client()
        context = self._prepare_context(summary)
        
        if file_references:
            ai_response = await client.chat_with_files(
                message=message or "Analyze these files.",
                files=file_references
            )
        else:
            # Load history for context
            history = await ChatService.get_chat(chat_id, user_id)
            messages = [{"role": m.role, "content": m.content} for m in history.messages[-10:]]
            if not any(m["content"] == message for m in messages):
                messages.append({"role": "user", "content": message})
            
            ai_response = await client.chat(messages=messages, context=context)

        # 6. Save Assistant Response
        await ChatService.save_message(chat_id, user_id, "assistant", ai_response)
        
        return Observation(
            content=ai_response,
            chat_id=chat_id,
            timestamp=datetime.utcnow(),
            state_hash=state_hash
        )

    async def stream_chat(
        self, 
        user_id: str, 
        message: Optional[str] = None, 
        chat_id: Optional[str] = None,
        files: List[Any] = None,
        background_tasks: Any = None,
        db: Any = None,
        current_user: Any = None
    ) -> AsyncGenerator[str, None]:
        """
        Streaming chat interface with persistence.
        """
        # 1. Ensure Chat exists
        if not chat_id:
            chat = await ChatService.create_chat(user_id, title=message[:50] if message else "New Conversation")
            chat_id = chat.id
            yield f"__CHAT_ID__:{chat_id}\n"
        
        # 2. Save User Message
        if message:
            await ChatService.save_message(chat_id, user_id, "user", message)
            await ActivityService.log_activity(
                user_id=user_id,
                type="chat_message",
                title="Message sent to Horus",
                entity_id=chat_id,
                entity_type="chat"
            )

        # 3. Get State Summary
        summary = await self.state_manager.get_state_summary(user_id)
        
        # 4. Handle Files
        file_references = []
        if files:
            for file in files:
                upload_result = await EvidenceService.upload_evidence(
                    file=file,
                    current_user=current_user,
                    background_tasks=background_tasks
                )
                if upload_result.success:
                    content = await file.read()
                    await file.seek(0)
                    file_references.append({
                        "type": "image" if file.content_type.startswith("image/") else "document" if file.content_type == "application/pdf" else "text",
                        "mime_type": file.content_type,
                        "data": base64.b64encode(content).decode("utf-8"),
                        "filename": file.filename
                    })
                    await ActivityService.log_activity(
                        user_id=user_id,
                        type="evidence_uploaded",
                        title=f"File uploaded: {file.filename}",
                        entity_id=upload_result.evidenceId,
                        entity_type="evidence"
                    )

        # 5. AI Interaction (Streaming)
        client = get_gemini_client()
        context = self._prepare_context(summary)
        
        full_response = ""
        if file_references:
            async for chunk in client.stream_chat_with_files(
                message=message or "Analyze these files.",
                files=file_references
            ):
                if chunk:
                    full_response += chunk
                    yield chunk
        else:
            history = await ChatService.get_chat(chat_id, user_id)
            messages = [{"role": m.role, "content": m.content} for m in history.messages[-10:]]
            
            async for chunk in client.stream_chat(messages=messages, context=context):
                if chunk:
                    full_response += chunk
                    yield chunk

        # 6. Save Assistant Response
        if full_response:
            await ChatService.save_message(chat_id, user_id, "assistant", full_response)

    def _prepare_context(self, summary) -> str:
        """Prepare platform state context for AI."""
        return f"""
        Current Platform State for User:
        - Files: {summary.total_files} total ({summary.analyzed_files} analyzed)
        - Evidence: {summary.total_evidence} scopes ({summary.linked_evidence} linked)
        - Gaps: {summary.total_gaps} total ({summary.closed_gaps} closed)
        - Performance: {summary.total_score}% overall compliance score
        """

    def _hash_state(self, summary) -> str:
        return f"{summary.total_files}:{summary.total_evidence}:{summary.total_gaps}:{datetime.utcnow().strftime('%Y%m%d%H')}"
