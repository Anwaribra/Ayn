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
from app.gap_analysis.service import GapAnalysisService
from app.gap_analysis.models import GapAnalysisRequest

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
        context = await self._prepare_context(user_id, summary)
        
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
        Hyper-optimized streaming chat interface.
        Parallelizes database saves, state fetching, and file processing.
        """
        # 1. Start Chat Creation or Fetch in Parallel with State
        if not chat_id:
            chat = await ChatService.create_chat(user_id, title=message[:50] if message else "New Conversation")
            chat_id = chat.id
            yield f"__CHAT_ID__:{chat_id}\n"
        
        # 2. Parallelize ALL initial operations for speed
        async def process_file(f):
            upload_result = await EvidenceService.upload_evidence(
                file=f,
                current_user=current_user,
                background_tasks=background_tasks
            )
            if upload_result.success:
                content = await f.read()
                await f.seek(0)
                return {
                    "type": "image" if f.content_type.startswith("image/") else "document" if f.content_type == "application/pdf" else "text",
                    "mime_type": f.content_type,
                    "data": base64.b64encode(content).decode("utf-8"),
                    "filename": f.filename,
                    "evidenceId": upload_result.evidenceId
                }
            return None

        tasks = [
            self.state_manager.get_state_summary(user_id),
            ActivityService.get_recent_activities(user_id, limit=5),
            ChatService.get_chat(chat_id, user_id, message_limit=10)
        ]
        
        # Add file processing tasks if any
        if files:
            tasks.extend([process_file(f) for f in files])
        
        # Add background tasks for logging (don't block the gather if we want max speed, 
        # but here we'll include the user message save in gather to ensure it's in history)
        if message:
            tasks.append(ChatService.save_message(chat_id, user_id, "user", message))
            # Activity logging can definitely be backgrounded
            if background_tasks:
                background_tasks.add_task(ActivityService.log_activity, 
                    user_id=user_id, 
                    type="chat_message", 
                    title="Message sent to Horus",
                    entity_id=chat_id,
                    entity_type="chat"
                )

        # EXECUTE EVERYTHING IN PARALLEL
        results = await asyncio.gather(*tasks)
        
        summary = results[0]
        recent_activities = results[1]
        history = results[2]
        
        # Handle dynamic results (files and message save)
        offset = 3
        file_results = []
        if files:
            file_results = [r for r in results[offset:offset+len(files)] if r is not None]
            offset += len(files)
        
        # Log file uploads in background
        for res in file_results:
            evidence_id = res.pop("evidenceId")
            if background_tasks:
                background_tasks.add_task(ActivityService.log_activity,
                    user_id=user_id,
                    type="evidence_uploaded",
                    title=f"File uploaded: {res['filename']}",
                    entity_id=evidence_id,
                    entity_type="evidence"
                )

        # 3. AI Interaction (Streaming)
        client = get_gemini_client()
        context = self._prepare_context_sync(summary, recent_activities)
        
        full_response = ""
        if file_results:
            async for chunk in client.stream_chat_with_files(
                message=message or "Analyze these files.",
                files=file_results
            ):
                if chunk:
                    full_response += chunk
                    yield chunk
        else:
            messages = [{"role": m.role, "content": m.content} for m in (history.messages if history else [])]
            # Ensure the current message is included if not already in history (race condition check)
            if message and not any(m["content"] == message for m in messages):
                messages.append({"role": "user", "content": message})
            
            async for chunk in client.stream_chat(messages=messages, context=context):
                if chunk:
                    full_response += chunk
                    yield chunk

        # 4. Save Assistant Response in Background to release the generator faster
        if full_response and background_tasks:
            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", full_response)
        elif full_response:
             await ChatService.save_message(chat_id, user_id, "assistant", full_response)

        # P2.1: If files were uploaded, schedule auto gap analysis in background
        if file_results and background_tasks:
            background_tasks.add_task(
                self._trigger_gap_analysis_after_upload,
                user_id=user_id,
                current_user=current_user,
                db=db
            )

    def _prepare_context_sync(self, summary, recent_activities) -> str:
        """Faster context preparation without extra DB calls."""
        return f"""
        Current Platform State Summary:
        - Files: {summary.total_files} ({summary.analyzed_files} analyzed)
        - Evidence Vault: {summary.total_evidence} items ({summary.linked_evidence} mapped to criteria)
        - Compliance Gaps: {summary.total_gaps} detected ({summary.closed_gaps} resolved)
        - Global Compliance Score: {summary.total_score}%
        
        Recent Platform Activities:
        {self._format_activities(recent_activities)}
        
        Critical Pending Gaps:
        {self._format_gaps(summary.addressable_gaps)}
        
        Instructions for Horus Brain:
        - You are the central intelligence of the Ayn Platform.
        - You have access to all platform modules (Evidence, Standards, Gap Analysis, Dashboard).
        - You should help the user navigate, analyze their compliance status, and suggest actions.
        - Be proactive. If a file was just analyzed (see Recent Activities), mention it.
        - If gaps are high, suggest specific evidence uploads.
        - You are not just a chatbot; you are a platform assistant.
        """

    async def _prepare_context(self, user_id: str, summary) -> str:
        """Prepare deep platform state context for AI."""
        # Fetch extra context
        recent_activities = await ActivityService.get_recent_activities(user_id, limit=5)
        
        return f"""
        Current Platform State Summary:
        - Files: {summary.total_files} ({summary.analyzed_files} analyzed)
        - Evidence Vault: {summary.total_evidence} items ({summary.linked_evidence} mapped to criteria)
        - Compliance Gaps: {summary.total_gaps} detected ({summary.closed_gaps} resolved)
        - Global Compliance Score: {summary.total_score}%
        
        Recent Platform Activities:
        {self._format_activities(recent_activities)}
        
        Critical Pending Gaps:
        {self._format_gaps(summary.addressable_gaps)}
        
        Instructions for Horus Brain:
        - You are the central intelligence of the Ayn Platform.
        - You have access to all platform modules (Evidence, Standards, Gap Analysis, Dashboard).
        - You should help the user navigate, analyze their compliance status, and suggest actions.
        - Be proactive. If a file was just analyzed (see Recent Activities), mention it.
        - If gaps are high, suggest specific evidence uploads.
        - You are not just a chatbot; you are a platform assistant.
        """

    def _format_activities(self, activities) -> str:
        if not activities: return "No recent activity."
        lines = []
        for a in activities:
            # Handle both model objects and dicts
            title = a.title if hasattr(a, 'title') else a.get('title', 'Unknown')
            desc = a.description if hasattr(a, 'description') else a.get('description', '')
            created = a.createdAt if hasattr(a, 'createdAt') else datetime.utcnow()
            lines.append(f"- {title}: {desc} ({created.strftime('%Y-%m-%d %H:%M')})")
        return "\n".join(lines)

    def _format_gaps(self, gaps) -> str:
        if not gaps: return "No critical gaps found."
        lines = []
        for g in gaps[:5]:
            lines.append(f"- [{g.severity.upper()}] {g.standard} {g.clause}: {g.description[:60]}...")
        return "\n".join(lines)

    def _hash_state(self, summary) -> str:
        return f"{summary.total_files}:{summary.total_evidence}:{summary.total_gaps}:{datetime.utcnow().strftime('%Y%m%d%H')}"

    async def _trigger_gap_analysis_after_upload(
        self,
        user_id: str,
        current_user: Any,
        db: Any
    ):
        """
        P2.1: Auto-trigger gap analysis after files are uploaded via Horus chat.
        Waits briefly for the evidence analysis background task to complete,
        then runs gap analysis for all standards the institution has evidence for.
        """
        import asyncio as _asyncio
        # Wait for evidence analysis background task to process the file
        await _asyncio.sleep(30)

        try:
            from app.core.db import db as prisma_client

            # Find the user's institution
            user = await prisma_client.user.find_unique(
                where={"id": user_id},
                include={"institution": True}
            )
            if not user or not user.institution:
                logger.warning(f"Horus gap trigger: No institution found for user {user_id}")
                return

            institution_id = user.institution.id

            # Find all standards that have evidence linked to this institution
            standards_with_evidence = await prisma_client.standard.find_many(
                where={
                    "criteria": {
                        "some": {
                            "evidenceCriteria": {
                                "some": {
                                    "evidence": {
                                        "institutionId": institution_id
                                    }
                                }
                            }
                        }
                    }
                }
            )

            if not standards_with_evidence:
                logger.info(f"Horus gap trigger: No standards with evidence for institution {institution_id}")
                return

            logger.info(f"Horus gap trigger: Running gap analysis for {len(standards_with_evidence)} standard(s)")

            gap_service = GapAnalysisService()
            for standard in standards_with_evidence:
                try:
                    request = GapAnalysisRequest(
                        standardId=standard.id,
                    )
                    # B1 FIX: Build a plain dict — GapAnalysisService.generate_report()
                    # expects a dict with .get() calls, not a Prisma model object.
                    fake_user = {
                        "id": user_id,
                        "institutionId": institution_id,
                        "role": "USER",
                        "email": getattr(user, "email", "unknown"),
                    }
                    report = await gap_service.generate_report(request, fake_user)
                    logger.info(f"Horus gap trigger: Gap analysis complete for standard '{standard.title}' — score: {report.overallScore}%")

                    # Notify the user
                    await NotificationService.create_notification(NotificationCreateRequest(
                        userId=user_id,
                        type="info",
                        title="Gap Analysis Updated",
                        message=f"Horus auto-ran gap analysis for '{standard.title}' after your file upload. Score: {report.overallScore:.0f}%.",
                        relatedEntityId=report.id,
                        relatedEntityType="gap_analysis"
                    ))

                except Exception as e:
                    logger.error(f"Horus gap trigger: Failed for standard '{standard.title}': {e}")

        except Exception as e:
            logger.error(f"Horus gap trigger: Unexpected error for user {user_id}: {e}", exc_info=True)
