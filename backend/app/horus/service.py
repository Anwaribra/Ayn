"""
Horus AI Service - Global Brain Refactor

Conversational intelligence with full platform awareness, persistence, and streaming.
"""

import base64
import json
import logging
import asyncio
from uuid import uuid4
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
from app.gap_analysis.models import GapAnalysisRequest, UserDTO
from app.rag.service import RagService
from app.horus.agent_context import build_agent_context
from app.horus.agent_tools import (
    TOOL_REGISTRY,
    build_tool_manifest,
    execute_tool,
    get_tool_ui_meta,
    requires_explicit_confirmation,
)

logger = logging.getLogger(__name__)

# In-memory pending confirmations keyed by confirmation id.
# Scope check (user_id/chat_id) prevents cross-user execution.
PENDING_ACTION_CONFIRMATIONS: dict[str, dict[str, Any]] = {}
PENDING_CONFIRMATION_TTL_SECONDS = 15 * 60
STRUCTURED_RESULT_TYPES = {"audit_report", "gap_table", "remediation_plan", "job_started"}


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
        context = await self._prepare_context(user_id, summary, message)
        
        if file_references:
            ai_response = await client.chat_with_files(
                message=message or "Analyze these files.",
                files=file_references,
                context=context
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

        Agent mode: if the user message matches a known compliance intent,
        we bypass the AI streaming pipeline, run the agent action directly,
        and return a structured __ACTION_RESULT__ prefix that the frontend
        can render as a typed card component.
        """
        # 1. Start Chat Creation or Fetch in Parallel with State
        if not chat_id:
            chat = await ChatService.create_chat(user_id, title=message[:50] if message else "New Conversation")
            chat_id = chat.id
            yield f"__CHAT_ID__:{chat_id}\n"

        client = get_gemini_client()

        # ── TIER 1: FAST PATH (no platform context build) ────────────────────
        if self._should_use_fast_path(message=message, files=files):
            full_response = ""
            try:
                if message:
                    if background_tasks:
                        background_tasks.add_task(ChatService.save_message, chat_id, user_id, "user", message)
                    else:
                        asyncio.create_task(ChatService.save_message(chat_id, user_id, "user", message))

                yield "__THINKING__:Generating response...\n"

                fast_messages = [{"role": "user", "content": message or ""}]
                try:
                    history = await asyncio.wait_for(
                        ChatService.get_chat(chat_id, user_id, message_limit=6),
                        timeout=0.5,
                    )
                    if history and getattr(history, "messages", None):
                        fast_messages = [{"role": m.role, "content": m.content} for m in history.messages[-6:]]
                        if message and not any(m["content"] == message for m in fast_messages):
                            fast_messages.append({"role": "user", "content": message})
                except Exception:
                    # Keep fast path non-blocking; fall back to current user message only.
                    pass

                async for chunk in client.stream_chat(
                    messages=fast_messages,
                    context=(
                        "You are Horus AI for the Ayn platform. "
                        "Answer conversational and general questions clearly. "
                        "Do not claim you accessed platform state unless explicitly requested."
                    ),
                ):
                    if chunk:
                        full_response += chunk
                        yield chunk
            except Exception as fast_err:
                logger.error(f"Fast path failed, continuing with fallback error response: {fast_err}", exc_info=True)
                if not full_response:
                    full_response = "I’m having trouble right now. Please try again."
                    yield full_response

            if full_response and background_tasks:
                background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", full_response)
            elif full_response:
                await ChatService.save_message(chat_id, user_id, "assistant", full_response)
            return

        # ── AGENT PLANNER + TOOL EXECUTION ────────────────────────────────────
        if message and not files:
            try:
                from app.core.db import db as prisma_client

                user_obj = await prisma_client.user.find_unique(where={"id": user_id})
                institution_id = getattr(user_obj, "institutionId", None) if user_obj else None
                current_user_dict = current_user if isinstance(current_user, dict) else {
                    "id": user_id,
                    "email": getattr(current_user, "email", ""),
                    "role": getattr(current_user, "role", "USER"),
                    "institutionId": institution_id,
                }

                # 1) Resolve pending confirmation command first.
                self._cleanup_stale_pending_confirmations()
                confirm_id = self._extract_control_token(message, "__CONFIRM_ACTION__:")
                cancel_id = self._extract_control_token(message, "__CANCEL_ACTION__:")

                if message.startswith("__CONFIRM_ACTION__:"):
                    pending = PENDING_ACTION_CONFIRMATIONS.get(confirm_id)
                    if not confirm_id or not pending or not self._pending_matches_scope(pending, user_id, chat_id):
                        invalid_text = "That confirmation request is invalid or expired. Please run the action again."
                        yield invalid_text
                        if background_tasks:
                            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", invalid_text)
                        else:
                            await ChatService.save_message(chat_id, user_id, "assistant", invalid_text)
                        return

                    tool_name = pending["tool_name"]
                    args = pending.get("args", {})
                    yield "__THINKING__:Executing confirmed action...\n"
                    await asyncio.sleep(0.25)

                    if tool_name == "__plan__":
                        plan_steps = pending.get("plan_steps", [])
                        plan_output = await self._execute_agent_plan(
                            plan_steps=plan_steps,
                            db=prisma_client,
                            user_id=user_id,
                            institution_id=institution_id,
                            current_user=current_user_dict,
                            background_tasks=background_tasks,
                        )
                        PENDING_ACTION_CONFIRMATIONS.pop(confirm_id, None)
                        if plan_output["last_structured"]:
                            yield f"__ACTION_RESULT__:{json.dumps(plan_output['last_structured'])}\n"
                        if plan_output["summary_text"]:
                            yield ("\n" if plan_output["last_structured"] else "") + plan_output["summary_text"]
                        if background_tasks:
                            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", plan_output["summary_text"])
                        else:
                            await ChatService.save_message(chat_id, user_id, "assistant", plan_output["summary_text"])
                        return
                    else:
                        tool_result = await execute_tool(
                            tool_name=tool_name,
                            args=args,
                            db=prisma_client,
                            user_id=user_id,
                            institution_id=institution_id,
                            current_user=current_user_dict,
                        )
                        PENDING_ACTION_CONFIRMATIONS.pop(confirm_id, None)

                        if tool_result.get("type") in STRUCTURED_RESULT_TYPES:
                            yield f"__ACTION_RESULT__:{json.dumps(tool_result)}\n"

                        await self._log_agent_action(
                            user_id=user_id,
                            tool_name=tool_name,
                            args=args,
                            result=tool_result,
                            background_tasks=background_tasks,
                            phase="confirmed",
                        )

                        narrative_prompt = (
                            "You are Horus. Summarize this confirmed action execution in 2 concise sentences.\n\n"
                            f"Tool: {tool_name}\n"
                            f"Tool result JSON: {json.dumps(tool_result)}\n"
                        )
                        narrative_text = (await client.generate_text(prompt=narrative_prompt) or "Action completed.").strip()
                        if narrative_text:
                            yield ("\n" if tool_result.get("type") in STRUCTURED_RESULT_TYPES else "") + narrative_text

                        if background_tasks:
                            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", narrative_text)
                        else:
                            await ChatService.save_message(chat_id, user_id, "assistant", narrative_text)
                        return

                if message.startswith("__CANCEL_ACTION__:"):
                    pending = PENDING_ACTION_CONFIRMATIONS.get(cancel_id)
                    if not cancel_id or not pending or not self._pending_matches_scope(pending, user_id, chat_id):
                        cancelled_text = "That confirmation request is no longer active."
                        yield cancelled_text
                        if background_tasks:
                            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", cancelled_text)
                        else:
                            await ChatService.save_message(chat_id, user_id, "assistant", cancelled_text)
                        return

                    PENDING_ACTION_CONFIRMATIONS.pop(cancel_id, None)
                    cancelled_text = "Understood. I canceled that action."
                    yield cancelled_text
                    if background_tasks:
                        background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", cancelled_text)
                    else:
                        await ChatService.save_message(chat_id, user_id, "assistant", cancelled_text)
                    return

                # 2) Normal planner path.
                snapshot = await build_agent_context(
                    db=prisma_client,
                    user_id=user_id,
                    institution_id=institution_id,
                )
                plan = await self._plan_agent_action(
                    client=client,
                    message=message,
                    platform_snapshot=snapshot,
                )

                if plan and plan.get("mode") == "tool":
                    tool_name = plan.get("tool")
                    args = plan.get("arguments", {}) or {}
                    if tool_name in TOOL_REGISTRY:
                        if background_tasks:
                            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "user", message)
                        else:
                            await ChatService.save_message(chat_id, user_id, "user", message)

                        tool_meta = get_tool_ui_meta(tool_name)
                        yield "__THINKING__:Reading your platform data...\n"
                        await asyncio.sleep(0.25)
                        yield f"__THINKING__:Identified action: {tool_meta['title']}\n"
                        await asyncio.sleep(0.25)
                        yield f"__THINKING__:Preparing {tool_meta['prepare_text']}...\n"
                        await asyncio.sleep(0.25)

                        if requires_explicit_confirmation(tool_name):
                            confirm_id = str(uuid4())
                            description = tool_meta["description"]
                            PENDING_ACTION_CONFIRMATIONS[confirm_id] = {
                                "user_id": user_id,
                                "chat_id": chat_id,
                                "tool_name": tool_name,
                                "args": args,
                                "description": description,
                                "created_at": datetime.utcnow().isoformat(),
                            }
                            confirm_payload = {
                                "id": confirm_id,
                                "tool": tool_name,
                                "title": tool_meta["title"],
                                "description": description,
                            }
                            yield f"__ACTION_CONFIRM__:{json.dumps(confirm_payload)}\n"
                            if background_tasks:
                                background_tasks.add_task(
                                    ChatService.save_message,
                                    chat_id,
                                    user_id,
                                    "assistant",
                                    f"Confirmation required before '{tool_meta['title']}'.",
                                )
                            else:
                                await ChatService.save_message(
                                    chat_id,
                                    user_id,
                                    "assistant",
                                    f"Confirmation required before '{tool_meta['title']}'.",
                                )
                            return

                        tool_result = await execute_tool(
                            tool_name=tool_name,
                            args=args,
                            db=prisma_client,
                            user_id=user_id,
                            institution_id=institution_id,
                            current_user=current_user_dict,
                        )

                        if tool_result.get("type") in STRUCTURED_RESULT_TYPES:
                            yield f"__ACTION_RESULT__:{json.dumps(tool_result)}\n"

                        await self._log_agent_action(
                            user_id=user_id,
                            tool_name=tool_name,
                            args=args,
                            result=tool_result,
                            background_tasks=background_tasks,
                            phase="auto",
                        )

                        narrative_prompt = (
                            "You are Horus. Summarize this tool execution in 2 concise sentences. "
                            "If relevant, include exactly one next step.\n\n"
                            f"User message: {message}\n"
                            f"Tool: {tool_name}\n"
                            f"Tool result JSON: {json.dumps(tool_result)}\n"
                        )
                        narrative_text = await client.generate_text(prompt=narrative_prompt)
                        narrative_text = (narrative_text or "Agent action completed.").strip()
                        if narrative_text:
                            if tool_result.get("type") in STRUCTURED_RESULT_TYPES:
                                yield "\n" + narrative_text
                            else:
                                yield narrative_text

                        if background_tasks:
                            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", narrative_text)
                        else:
                            await ChatService.save_message(chat_id, user_id, "assistant", narrative_text)
                        return
                elif plan and plan.get("mode") == "plan":
                    raw_steps = plan.get("steps", [])
                    plan_steps = self._normalize_plan_steps(raw_steps)
                    if plan_steps:
                        if background_tasks:
                            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "user", message)
                        else:
                            await ChatService.save_message(chat_id, user_id, "user", message)

                        has_mutating = any(requires_explicit_confirmation(step["tool"]) for step in plan_steps)
                        if has_mutating:
                            confirm_id = str(uuid4())
                            PENDING_ACTION_CONFIRMATIONS[confirm_id] = {
                                "user_id": user_id,
                                "chat_id": chat_id,
                                "tool_name": "__plan__",
                                "plan_steps": plan_steps,
                                "description": f"Run a {len(plan_steps)}-step agent plan including write operations.",
                                "created_at": datetime.utcnow().isoformat(),
                            }
                            confirm_payload = {
                                "id": confirm_id,
                                "tool": "__plan__",
                                "title": "Execute multi-step plan",
                                "description": f"Horus prepared {len(plan_steps)} steps. Confirmation required for mutating actions.",
                            }
                            yield "__THINKING__:Prepared a multi-step plan...\n"
                            yield f"__ACTION_CONFIRM__:{json.dumps(confirm_payload)}\n"
                            if background_tasks:
                                background_tasks.add_task(
                                    ChatService.save_message,
                                    chat_id,
                                    user_id,
                                    "assistant",
                                    "Confirmation required before executing the multi-step plan.",
                                )
                            else:
                                await ChatService.save_message(
                                    chat_id,
                                    user_id,
                                    "assistant",
                                    "Confirmation required before executing the multi-step plan.",
                                )
                            return

                        yield "__THINKING__:Executing multi-step plan...\n"
                        plan_output = await self._execute_agent_plan(
                            plan_steps=plan_steps,
                            db=prisma_client,
                            user_id=user_id,
                            institution_id=institution_id,
                            current_user=current_user_dict,
                            background_tasks=background_tasks,
                        )
                        if plan_output["last_structured"]:
                            yield f"__ACTION_RESULT__:{json.dumps(plan_output['last_structured'])}\n"
                        if plan_output["summary_text"]:
                            yield ("\n" if plan_output["last_structured"] else "") + plan_output["summary_text"]
                        if background_tasks:
                            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", plan_output["summary_text"])
                        else:
                            await ChatService.save_message(chat_id, user_id, "assistant", plan_output["summary_text"])
                        return
            except Exception as agent_err:
                logger.error(f"Agent planner/tool execution failed: {agent_err}", exc_info=True)
        
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

        async def fetch_mappings_context(uid: str):
            try:
                from app.core.db import db as prisma_client
                user_obj = await prisma_client.user.find_unique(where={"id": uid})
                if user_obj and user_obj.institutionId:
                    mappings = await prisma_client.criteriamapping.find_many(
                        where={"institutionId": user_obj.institutionId},
                        include={"criterion": True}
                    )
                    if mappings:
                        met = len([m for m in mappings if m.status == "met"])
                        total = len(mappings)
                        gap_mappings = [m for m in mappings if m.status == "gap"]
                        gap_titles = [m.criterion.title for m in gap_mappings[:3] if m.criterion]
                        gap_str = ", ".join(gap_titles) if gap_titles else "None"
                        return f"CRITERIA MAPPINGS: {met}/{total} criteria met across all standards.\nCritical gaps: {gap_str}"
            except Exception as e:
                logger.error(f"Failed to fetch criteria mappings context: {e}")
            return ""

        tasks = [
            self.state_manager.get_state_summary(user_id),
            ActivityService.get_recent_activities(user_id, limit=5),
            fetch_mappings_context(user_id),
        ]
        
        # Add file processing tasks if any
        if files:
            tasks.extend([process_file(f) for f in files])
        
        # Save user message in background to avoid blocking
        if message:
            if background_tasks:
                background_tasks.add_task(ChatService.save_message, chat_id, user_id, "user", message)
            else:
                asyncio.create_task(ChatService.save_message(chat_id, user_id, "user", message))

        # EXECUTE EVERYTHING IN PARALLEL
        if files:
            yield "__THINKING__:Processing attached files...\n"
        else:
            yield "__THINKING__:Reading platform state...\n"
        
        results = await asyncio.gather(*tasks)
        
        
        summary = results[0]
        recent_activities = results[1]
        mapping_context = results[2]
        
        # Handle dynamic results (files)
        offset = 3
        file_results = []
        if files:
            file_results = [r for r in results[offset:offset+len(files)] if r is not None]
        
        # Log file uploads in background
        for res in file_results:
            evidence_id = res.get("evidenceId")
            if background_tasks:
                background_tasks.add_task(ActivityService.log_activity,
                    user_id=user_id,
                    type="evidence_uploaded",
                    title=f"File uploaded: {res['filename']}",
                    entity_id=evidence_id,
                    entity_type="evidence"
                )

        # 3. AI Interaction (Streaming)
        context = await self._prepare_context_sync(summary, recent_activities, message=message, mapping_context=mapping_context)
        
        full_response = ""
        
        # Lazily fetch history without blocking initial file processing or state fetching
        history_task = asyncio.create_task(ChatService.get_chat(chat_id, user_id, message_limit=20))

        if file_results:
            compliance_keywords = ["gap", "compliance", "standard", "criteria", "NCAAA", "ISO", "accreditation", "analysis", "audit", "score", "evaluate"]
            needs_analysis = any(kw.lower() in (message or "").lower() for kw in compliance_keywords)
            
            if background_tasks:
                background_tasks.add_task(
                    self._execute_brain_pipeline,
                    user_id,
                    current_user,
                    file_results,
                    db,
                    needs_analysis
                )
            else:
                asyncio.create_task(
                    self._execute_brain_pipeline(user_id, current_user, file_results, db, needs_analysis)
                )
            
            yield "__THINKING__:Analyzing document content...\n"
            context = await self._prepare_context_sync(summary, recent_activities, None, message=message, mapping_context=mapping_context)
            yield "__THINKING__:Generating response...\n"
            
            async for chunk in client.stream_chat_with_files(
                message=message or "Analyze these files.",
                files=file_results,
                context=context # Pass the enriched brain context
            ):
                if chunk:
                    full_response += chunk
                    yield chunk
            if not full_response.strip():
                # Some multimodal providers may stream empty chunks for certain files.
                # Ensure the user never sees a silent response.
                fallback_response = await client.chat_with_files(
                    message=message or "Analyze these files.",
                    files=file_results,
                    context=context,
                )
                if fallback_response and fallback_response.strip():
                    full_response = fallback_response.strip()
                    yield full_response
                else:
                    full_response = "I received your file, but I couldn't extract a clear answer from it. Try sending a clearer image or add more context."
                    yield full_response
        else:
            history = await history_task
            yield "__THINKING__:Searching conversation history...\n"
            messages = [{"role": m.role, "content": m.content} for m in (history.messages if history else [])]
            # Ensure the current message is included if not already in history (race condition check)
            if message and not any(m["content"] == message for m in messages):
                messages.append({"role": "user", "content": message})
            yield "__THINKING__:Generating response...\n"
            
            async for chunk in client.stream_chat(messages=messages, context=context):
                if chunk:
                    full_response += chunk
                    yield chunk
            if not full_response.strip():
                fallback_response = await client.chat(messages=messages, context=context)
                if fallback_response and fallback_response.strip():
                    full_response = fallback_response.strip()
                    yield full_response

        # 4. Save Assistant Response in Background to release the generator faster
        if full_response and background_tasks:
            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", full_response)
        elif full_response:
             await ChatService.save_message(chat_id, user_id, "assistant", full_response)

    async def _execute_brain_pipeline(self, user_id, current_user, file_results, db, needs_analysis: bool = False):
        """
        Executes the full processor pipeline: OCR -> Evidence Analysis.
        Optionally runs Gap Analysis if requested.
        Returns the findings for AI injection.
        """
        results = {
            "files_analyzed": len(file_results),
            "gap_reports": [],
            "dashboard_updated": True
        }
        
        # 1. Evidence Analysis (Synchronous for Brain Mode)
        for res in file_results:
            try:
                # We reuse the background logic but await it directly
                # Res already contains data and mime_type
                # filename, data, mime_type
                content = base64.b64decode(res["data"])
                await EvidenceService.analyze_evidence_task(
                    evidence_id=res["evidenceId"],
                    file_content=content,
                    filename=res["filename"],
                    mime_type=res["mime_type"],
                    user_id=user_id
                )
                
                # IMPORTANT: Rag Indexing
                # Decode the content for RAG (assuming it's text or pdf processed by OCR inside analyze_evidence_task)
                # Since analyze_evidence_task handles PDF text extraction but doesn't return it,
                # we will extract simple text here if possible, or assume OCR will handle DB save.
                # For pure text files, we can index immediately:
                if res["mime_type"] == "text/plain" or res["mime_type"] == "text/markdown":
                    rag = RagService()
                    await rag.index_document(content.decode("utf-8"), document_id=res["evidenceId"])
                    
            except Exception as e:
                logger.error(f"Brain Pipeline Step 1 (Evidence/RAG) failed: {e}")

        if not needs_analysis:
            logger.info("Skipping explicit Gap Analysis Trigger; user did not request analysis.")
            return results

        # 2. Gap Analysis Trigger
        try:
            # Find the user's institution
            from app.core.db import db as prisma_client
            user = await prisma_client.user.find_unique(
                where={"id": user_id},
                include={"institution": True}
            )
            
            if user and user.institution:
                institution_id = user.institution.id
                
                # Fetch standard to analyze (latest or most comprehensive)
                # For now, we analyze against ALL standards linked to the institution
                standards = await prisma_client.standard.find_many(
                    where={
                        "criteria": {
                            "some": {
                                "evidenceCriteria": {
                                    "some": {
                                        "evidence": {
                                            "ownerId": institution_id
                                        }
                                    }
                                }
                            }
                        }
                    }
                )
                
                gap_service = GapAnalysisService()
                user_dto = UserDTO(
                    id=user_id,
                    institutionId=institution_id,
                    role=getattr(user, "role", "USER"),
                    email=getattr(user, "email", "unknown")
                )
                
                for standard in standards:
                    try:
                        queued = await gap_service.queue_report(
                            GapAnalysisRequest(standardId=standard.id),
                            user_dto
                        )
                        await gap_service.run_report_background(
                            job_id=queued["jobId"],
                            user_id=user_id,
                            institution_id=institution_id,
                            standard_id=standard.id,
                            current_user=user_dto,
                        )
                        report = await prisma_client.gapanalysis.find_unique(where={"id": queued["jobId"]})
                        if not report:
                            continue
                        results["gap_reports"].append({
                            "id": queued["jobId"],
                            "title": standard.title,
                            "score": report.overallScore,
                            "gaps": [],
                        })
                    except Exception as e:
                        logger.error(f"Brain Pipeline Step 2 (Gap) failed for {standard.title}: {e}")
        except Exception as e:
            logger.error(f"Brain Pipeline Step 2 (Gap) outer failed: {e}")

        return results

    async def _prepare_context_sync(self, summary, recent_activities, brain_results=None, message: str = "", mapping_context: str = "") -> str:
        """Faster context preparation without extra DB calls."""
        brain_context = ""
        if brain_results:
            reports_text = []
            for r in brain_results["gap_reports"]:
                gaps = ", ".join(r["gaps"])
                reports_text.append(f"- {r['title']}: Score {r['score']}% | Gaps: {gaps} | ReportID: {r['id']}")
            
            brain_context = f"""
            === RECENT BRAIN ANALYSIS RESULTS ===
            Files Analyzed: {brain_results['files_analyzed']}
            Gap Reports Generated:
            {" ".join(reports_text) if reports_text else "No standards affected."}
            Dashboard Metrics: Synchronized
            
            MANDATORY RESPONSE TEMPLATE FOR FILE UPLOADS:
            ✅ File analyzed
            📊 Overall score: [Score]%
            ⚠️ Gaps: [Summarize critical gaps]
            📈 Dashboard updated
            📄 [Download Report](ACTION:gap_report:{brain_results['gap_reports'][0]['id'] if brain_results['gap_reports'] else 'none'}) | [View Reports](/platform/gap-analysis)
            
            Note: Use the actual data above.
            """

        compliance_keywords = ["gap", "compliance", "standard", "criteria", "NCAAA", "ISO", "accreditation", "analysis"]
        message_lower = (message or "").lower()
        needs_heavy_context = any(kw.lower() in message_lower for kw in compliance_keywords)
        
        context_parts = []
        
        if needs_heavy_context:
            context_parts.append(f"""
        Current Platform State Summary:
        - Files: {summary.total_files} ({summary.analyzed_files} analyzed)
        - Evidence Vault: {summary.total_evidence} items ({summary.linked_evidence} mapped to criteria)
        - Compliance Gaps: {summary.total_gaps} detected ({summary.closed_gaps} resolved)
        - Global Compliance Score: {summary.total_score}%
        """)
        else:
            logger_msg = message[:20].replace('\n', ' ') if message else ""
            logger.info(f"Skipping heavy context injection for '{logger_msg}...': skipped ~150 tokens.")
            
        if brain_context:
            context_parts.append(brain_context)
            
        context_parts.append(mapping_context)

        # 🚀 TRUE RAG: 
        # Retrieve semantic chunks based on the user's message
        if message:
            try:
                rag = RagService()
                rag_context = await rag.retrieve_context(message, limit=4)
                if rag_context:
                    context_parts.append(rag_context)
            except Exception as e:
                logger.error(f"RAG Context retrieval failed during chat sync: {e}")

        import re
        message_clean = (message or "").replace(" ", "")
        arabic_chars = len(re.findall(r'[\u0600-\u06FF]', message_clean))
        is_arabic = (arabic_chars / len(message_clean)) > 0.1 if len(message_clean) > 0 else False
        language_instruction = "- ALWAYS respond in Arabic because the user wrote in Arabic." if is_arabic else "- ALWAYS respond in English."

        context_parts.append(f"""
        Recent Platform Activities:
        {self._format_activities(recent_activities)}
        
        Instructions for Horus Brain:
        - You are the central intelligence of the Ayn Platform.
        - You process compliance data, analyze evidence, and manage gaps.
        - When files are uploaded, ALWAYS use the brain results provided above.
        - Be concise, professional, and data-driven.
        {language_instruction}
        """)
        return "\n".join(context_parts)

    async def _prepare_context(self, user_id: str, summary, message: str = "") -> str:
        """Prepare deep platform state context for AI."""
        # Fetch extra context
        recent_activities = await ActivityService.get_recent_activities(user_id, limit=5)
        
        compliance_keywords = ["gap", "compliance", "standard", "criteria", "NCAAA", "ISO", "accreditation", "analysis"]
        message_lower = (message or "").lower()
        needs_heavy_context = any(kw.lower() in message_lower for kw in compliance_keywords)
        
        context_parts = []
        
        if needs_heavy_context:
            context_parts.append(f"""
        Current Platform State Summary:
        - Files: {summary.total_files} ({summary.analyzed_files} analyzed)
        - Evidence Vault: {summary.total_evidence} items ({summary.linked_evidence} mapped to criteria)
        - Compliance Gaps: {summary.total_gaps} detected ({summary.closed_gaps} resolved)
        - Global Compliance Score: {summary.total_score}%
        
        Critical Pending Gaps:
        {self._format_gaps(summary.addressable_gaps)}
        """)
        else:
            logger_msg = message[:20].replace('\n', ' ') if message else ""
            logger.info(f"Skipping heavy context injection for '{logger_msg}...': skipped ~300 tokens.")
            
        try:
            from app.core.db import db as prisma_client
            user_obj = await prisma_client.user.find_unique(where={"id": user_id})
            if user_obj and user_obj.institutionId:
                mappings = await prisma_client.criteriamapping.find_many(
                    where={"institutionId": user_obj.institutionId},
                    include={"criterion": True}
                )
                if mappings:
                    met = len([m for m in mappings if m.status == "met"])
                    total = len(mappings)
                    gap_mappings = [m for m in mappings if m.status == "gap"]
                    gap_titles = [m.criterion.title for m in gap_mappings[:3] if m.criterion]
                    gap_str = ", ".join(gap_titles) if gap_titles else "None"
                    context_parts.append(f"CRITERIA MAPPINGS: {met}/{total} criteria met across all standards.\nCritical gaps: {gap_str}")
        except Exception as e:
            logger.error(f"Failed to fetch criteria mappings context: {e}")
            
        # 🚀 TRUE RAG: 
        # Retrieve semantic chunks based on the user's message
        if message:
            try:
                rag = RagService()
                rag_context = await rag.retrieve_context(message, limit=4)
                if rag_context:
                    context_parts.append(rag_context)
            except Exception as e:
                logger.error(f"RAG Context retrieval failed during chat loop: {e}")
        
        import re
        message_clean = (message or "").replace(" ", "")
        arabic_chars = len(re.findall(r'[\u0600-\u06FF]', message_clean))
        is_arabic = (arabic_chars / len(message_clean)) > 0.1 if len(message_clean) > 0 else False
        language_instruction = "- ALWAYS respond in Arabic because the user wrote in Arabic." if is_arabic else "- ALWAYS respond in English."

        context_parts.append(f"""
        Recent Platform Activities:
        {self._format_activities(recent_activities)}
        
        Instructions for Horus Brain:
        - You are the central intelligence of the Ayn Platform.
        - You have access to all platform modules (Evidence, Standards, Gap Analysis, Dashboard).
        - You should help the user navigate, analyze their compliance status, and suggest actions.
        - Be proactive. If a file was just analyzed (see Recent Activities), mention it.
        - If gaps are high, suggest specific evidence uploads.
        - You are not just a chatbot; you are a platform assistant.
        {language_instruction}
        """)
        return "\n".join(context_parts)

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

    def _extract_control_token(self, message: str, prefix: str) -> str | None:
        if not message:
            return None
        if not message.startswith(prefix):
            return None
        return message[len(prefix):].strip() or None

    def _should_use_fast_path(self, message: str | None, files: List[Any] | None) -> bool:
        if files:
            return False
        if not message:
            return False

        msg = message.strip()
        lowered = msg.lower()
        if not lowered:
            return False

        if lowered.startswith("__confirm_action__:") or lowered.startswith("__cancel_action__:"):
            return False

        platform_keywords = (
            "gap",
            "evidence",
            "standard",
            "criteria",
            "criterion",
            "audit",
            "remediation",
            "report",
            "dashboard",
            "workflow",
            "analytics",
            "compliance",
            "policy",
            "document",
            "vault",
            "hub",
            "score",
            "ncaaa",
            "iso",
            "institution",
            "upload",
            "export",
            "task",
        )
        if any(keyword in lowered for keyword in platform_keywords):
            return False

        direct_smalltalk = (
            "hi",
            "hello",
            "hey",
            "thanks",
            "thank you",
            "how are you",
            "good morning",
            "good evening",
            "who are you",
            "what can you do",
        )
        if any(lowered == t or lowered.startswith(f"{t} ") for t in direct_smalltalk):
            return True

        # Lightweight default for simple factual/conversational prompts.
        word_count = len(lowered.split())
        return word_count <= 20

    def _cleanup_stale_pending_confirmations(self) -> None:
        now = datetime.utcnow()
        expired_ids: list[str] = []
        for confirmation_id, pending in PENDING_ACTION_CONFIRMATIONS.items():
            created_at = pending.get("created_at")
            try:
                created_ts = datetime.fromisoformat(created_at) if created_at else None
            except Exception:
                created_ts = None
            if not created_ts:
                expired_ids.append(confirmation_id)
                continue
            age_seconds = (now - created_ts).total_seconds()
            if age_seconds > PENDING_CONFIRMATION_TTL_SECONDS:
                expired_ids.append(confirmation_id)
        for confirmation_id in expired_ids:
            PENDING_ACTION_CONFIRMATIONS.pop(confirmation_id, None)

    def _pending_matches_scope(self, pending: Dict[str, Any], user_id: str, chat_id: str | None) -> bool:
        return bool(
            pending
            and pending.get("user_id") == user_id
            and pending.get("chat_id") == chat_id
        )

    def _extract_json_block(self, text: str) -> Dict[str, Any] | None:
        if not text:
            return None
        cleaned = text.strip().replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(cleaned)
        except Exception:
            pass
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return None
        try:
            return json.loads(cleaned[start : end + 1])
        except Exception:
            return None

    async def _plan_agent_action(
        self,
        client: Any,
        message: str,
        platform_snapshot: Dict[str, Any],
    ) -> Dict[str, Any] | None:
        tool_manifest = build_tool_manifest()

        planner_prompt = f"""
You are Horus planner. Decide whether to call exactly one tool or answer as chat.

User message:
{message}

Platform snapshot JSON:
{json.dumps(platform_snapshot)[:8000]}

Available tools:
{json.dumps(tool_manifest)}

Return ONLY valid JSON with this exact schema:
{{
  "mode": "tool" | "plan" | "chat",
  "tool": "tool_name_or_null",
  "arguments": {{}},
  "steps": [{{"tool":"tool_name","arguments":{{}},"reason":"short"}}],
  "reason": "short reason"
}}

Rules:
- Choose mode "tool" only if a tool materially improves accuracy/action.
- Choose mode "plan" only when user asks for multiple outcomes in one request.
- Plan can contain up to 3 steps.
- For mutating tools, choose them only when user intent is explicit.
- If unsure, return mode "chat".
"""
        raw = await client.generate_text(prompt=planner_prompt)
        parsed = self._extract_json_block(raw)
        if not isinstance(parsed, dict):
            return None
        if parsed.get("mode") not in {"tool", "plan", "chat"}:
            return None
        if parsed.get("mode") == "tool" and parsed.get("tool") not in TOOL_REGISTRY:
            return None
        if parsed.get("mode") == "plan":
            parsed["steps"] = self._normalize_plan_steps(parsed.get("steps", []))
            if not parsed["steps"]:
                return None
        if not isinstance(parsed.get("arguments", {}), dict):
            parsed["arguments"] = {}
        return parsed

    def _normalize_plan_steps(self, raw_steps: Any) -> list[dict]:
        if not isinstance(raw_steps, list):
            return []
        steps: list[dict] = []
        for step in raw_steps[:3]:
            if not isinstance(step, dict):
                continue
            tool = step.get("tool")
            if tool not in TOOL_REGISTRY:
                continue
            arguments = step.get("arguments", {})
            if not isinstance(arguments, dict):
                arguments = {}
            steps.append({
                "tool": tool,
                "arguments": arguments,
                "reason": str(step.get("reason", "")).strip()[:180],
            })
        return steps

    async def _execute_agent_plan(
        self,
        *,
        plan_steps: list[dict],
        db: Any,
        user_id: str,
        institution_id: Optional[str],
        current_user: dict,
        background_tasks: Any = None,
    ) -> dict:
        executed: list[dict] = []
        last_structured: Optional[dict] = None

        for step in plan_steps:
            tool_name = step["tool"]
            args = step.get("arguments", {}) or {}
            result = await execute_tool(
                tool_name=tool_name,
                args=args,
                db=db,
                user_id=user_id,
                institution_id=institution_id,
                current_user=current_user,
            )
            if result.get("type") in STRUCTURED_RESULT_TYPES:
                last_structured = result

            await self._log_agent_action(
                user_id=user_id,
                tool_name=tool_name,
                args=args,
                result=result,
                background_tasks=background_tasks,
                phase="plan",
            )
            executed.append({
                "tool": tool_name,
                "result_type": result.get("type", "unknown"),
                "ok": result.get("type") != "action_error",
            })

        success = len([e for e in executed if e["ok"]])
        summary_lines = [f"Executed {len(executed)} plan steps ({success} successful)."]
        for idx, e in enumerate(executed, start=1):
            status = "ok" if e["ok"] else "failed"
            summary_lines.append(f"{idx}. {e['tool']} -> {e['result_type']} ({status})")

        return {
            "last_structured": last_structured,
            "summary_text": "\n".join(summary_lines),
        }

    async def _log_agent_action(
        self,
        *,
        user_id: str,
        tool_name: str,
        args: dict,
        result: dict,
        background_tasks: Any = None,
        phase: str = "auto",
    ) -> None:
        title = f"Horus executed {tool_name}"
        description = f"Phase={phase}, result={result.get('type', 'unknown')}"
        metadata = {"tool": tool_name, "args": args, "result_type": result.get("type"), "phase": phase}
        if background_tasks:
            background_tasks.add_task(
                ActivityService.log_activity,
                user_id=user_id,
                type="horus_action",
                title=title,
                description=description,
                entity_type="horus_tool",
                metadata=metadata,
            )
        else:
            await ActivityService.log_activity(
                user_id=user_id,
                type="horus_action",
                title=title,
                description=description,
                entity_type="horus_tool",
                metadata=metadata,
            )

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
                                        "ownerId": institution_id
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
                    user_dto = UserDTO(
                        id=user_id,
                        institutionId=institution_id,
                        role=getattr(user, "role", "USER"),
                        email=getattr(user, "email", "unknown")
                    )
                    queued = await gap_service.queue_report(request, user_dto)
                    await gap_service.run_report_background(
                        job_id=queued["jobId"],
                        user_id=user_id,
                        institution_id=institution_id,
                        standard_id=standard.id,
                        current_user=user_dto,
                    )
                    report = await prisma_client.gapanalysis.find_unique(where={"id": queued["jobId"]})
                    if not report:
                        continue
                    logger.info(f"Horus gap trigger: Gap analysis complete for standard '{standard.title}' — score: {report.overallScore}%")

                    # Notify the user
                    await NotificationService.create_notification(NotificationCreateRequest(
                        userId=user_id,
                        type="info",
                        title="Gap Analysis Updated",
                        message=f"Horus auto-ran gap analysis for '{standard.title}' after your file upload. Score: {report.overallScore:.0f}%.",
                        relatedEntityId=queued["jobId"],
                        relatedEntityType="gap_analysis"
                    ))

                except Exception as e:
                    logger.error(f"Horus gap trigger: Failed for standard '{standard.title}': {e}")

        except Exception as e:
            logger.error(f"Horus gap trigger: Unexpected error for user {user_id}: {e}", exc_info=True)
