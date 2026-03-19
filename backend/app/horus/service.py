"""
Horus AI Service - Global Brain Refactor

Conversational intelligence with full platform awareness, persistence, and streaming.
"""

import base64
import json
import logging
import asyncio
import mimetypes
from types import SimpleNamespace
from uuid import uuid4
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, AsyncGenerator, Callable
from pydantic import BaseModel

from app.ai.service import get_gemini_client
from app.evidence.service import EvidenceService, ALLOWED_FILE_TYPES
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
from app.core.redis import redis_client

logger = logging.getLogger(__name__)

# Pending confirmations: Redis (persistent, survives restarts) or in-memory fallback.
# Scope check (user_id/chat_id) prevents cross-user execution.
PENDING_CONFIRMATION_TTL_SECONDS = 15 * 60
_PENDING_ACTION_CONFIRMATIONS_FALLBACK: dict[str, dict[str, Any]] = {}  # Used when Redis disabled
PENDING_CONFIRM_KEY_PREFIX = "horus:confirm:"
STRUCTURED_RESULT_TYPES = {"audit_report", "gap_table", "remediation_plan", "job_started", "analytics_report", "link_result", "report_export", "action_error"}


def _pending_set(confirm_id: str, data: dict[str, Any]) -> None:
    """Store pending confirmation in Redis (or in-memory fallback) with TTL."""
    if redis_client.enabled:
        key = f"{PENDING_CONFIRM_KEY_PREFIX}{confirm_id}"
        redis_client.set(key, json.dumps(data), ex=PENDING_CONFIRMATION_TTL_SECONDS)
    else:
        _PENDING_ACTION_CONFIRMATIONS_FALLBACK[confirm_id] = data


def _pending_get(confirm_id: str) -> dict[str, Any] | None:
    """Get pending confirmation from Redis or in-memory fallback."""
    if redis_client.enabled:
        key = f"{PENDING_CONFIRM_KEY_PREFIX}{confirm_id}"
        raw = redis_client.get(key)
        if raw:
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                return None
        return None
    return _PENDING_ACTION_CONFIRMATIONS_FALLBACK.get(confirm_id)


def _pending_pop(confirm_id: str) -> dict[str, Any] | None:
    """Get and remove pending confirmation."""
    data = _pending_get(confirm_id)
    if data and redis_client.enabled:
        redis_client.delete(f"{PENDING_CONFIRM_KEY_PREFIX}{confirm_id}")
    elif data:
        _PENDING_ACTION_CONFIRMATIONS_FALLBACK.pop(confirm_id, None)
    return data


def _pending_cleanup_stale() -> None:
    """Remove expired in-memory confirmations (Redis uses TTL, no cleanup needed)."""
    if redis_client.enabled:
        return
    now = datetime.now(timezone.utc)
    expired_ids: list[str] = []
    for cid, p in _PENDING_ACTION_CONFIRMATIONS_FALLBACK.items():
        created_at = p.get("created_at")
        if not created_at:
            expired_ids.append(cid)
            continue
        try:
            created_ts = datetime.fromisoformat(created_at)
        except Exception:
            expired_ids.append(cid)
            continue
        if (now - created_ts).total_seconds() > PENDING_CONFIRMATION_TTL_SECONDS:
            expired_ids.append(cid)
    for cid in expired_ids:
        _PENDING_ACTION_CONFIRMATIONS_FALLBACK.pop(cid, None)


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

    @staticmethod
    def _needs_compliance_analysis(message: str | None) -> bool:
        if not message:
            return False
        compliance_keywords = [
            "gap", "compliance", "standard", "criteria", "criterion", "ncaaa", "iso",
            "accreditation", "analysis", "audit", "score", "evaluate",
            "فجوة", "امتثال", "معيار", "معايير", "تقييم", "تدقيق", "اعتماد", "تحليل", "درجة", "نتيجة",
        ]
        msg = message.lower()
        return any(kw.lower() in msg for kw in compliance_keywords)

    @staticmethod
    def _is_visual_only(files: List[Any] | None) -> bool:
        if not files:
            return False
        for f in files:
            if isinstance(f, dict):
                ct = f.get("content_type") or ""
            else:
                ct = getattr(f, "content_type", "") or ""
            if not ct.startswith("image/"):
                return False
        return True

    @staticmethod
    def _buffered_part_filename(part: Any) -> str:
        if isinstance(part, dict):
            return part.get("filename") or "file"
        return getattr(part, "filename", None) or "file"
    
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
        active_goal = await self._get_active_goal(user_id, chat_id)
        
        # 2. Save User Message
        if message:
            await ChatService.save_message(chat_id, user_id, "user", message)

        # 3. Get State Summary
        summary = await self.state_manager.get_state_summary(user_id)
        state_hash = self._hash_state(summary)
        
        # 4. Handle Files
        file_references = []
        if files:
            visual_only = self._is_visual_only(files)
            needs_analysis = self._needs_compliance_analysis(message)
            store_as_evidence = not (visual_only and not needs_analysis)
            for file in files:
                if store_as_evidence:
                    content = await file.read()
                    upload_result = await EvidenceService.upload_evidence(
                        file=file,
                        current_user=current_user,
                        background_tasks=background_tasks,
                        file_content=content,
                    )
                    if upload_result.success:
                        ct = file.content_type or ""
                        file_references.append({
                            "type": "image" if ct.startswith("image/") else "document" if ct == "application/pdf" else "text",
                            "mime_type": ct,
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
                else:
                    content = await file.read()
                    ct = file.content_type or ""
                    file_references.append({
                        "type": "image" if ct.startswith("image/") else "document" if ct == "application/pdf" else "text",
                        "mime_type": ct,
                        "data": base64.b64encode(content).decode("utf-8"),
                        "filename": file.filename
                    })

        # 5. AI Interaction
        client = get_gemini_client()
        chat_user_identity = await self._resolve_user_identity(user_id, current_user)
        context = await self._prepare_context(user_id, summary, message, user_identity=chat_user_identity, goal=active_goal)
        
        if file_references:
            visual_only = self._is_visual_only(files)
            needs_analysis = self._needs_compliance_analysis(message)
            if visual_only and not needs_analysis:
                ai_message = message or "Please analyze the attached image(s) and respond in plain language. If it's a UI screenshot, summarize the key elements and any obvious issues. Do not return JSON or code."
            elif visual_only and needs_analysis:
                ai_message = (message or "").strip() + "\n\nAnalyze the attached image(s) with a brief compliance-focused summary. Respond in plain language. Do not return JSON or code."
            else:
                ai_message = message or "Analyze these files."
            ai_response = await client.chat_with_files(
                message=ai_message,
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
            timestamp=datetime.now(timezone.utc),
            state_hash=state_hash
        )

    async def _resolve_user_identity(self, user_id: str, current_user: Any = None) -> Dict[str, str]:
        """Fetch user name/email/role/institution for AI context injection."""
        name = getattr(current_user, "name", None) or (current_user.get("name") if isinstance(current_user, dict) else None)
        email = getattr(current_user, "email", None) or (current_user.get("email") if isinstance(current_user, dict) else None)
        role = getattr(current_user, "role", None) or (current_user.get("role") if isinstance(current_user, dict) else None)
        institution_name = None
        if not name or (isinstance(name, str) and name.strip().lower() == "user"):
            try:
                from app.core.db import db as prisma_client
                user_obj = await prisma_client.user.find_unique(
                    where={"id": user_id},
                    include={"institution": True},
                )
                if user_obj:
                    name = getattr(user_obj, "name", None)
                    if isinstance(name, str):
                        name = name.strip() or None
                    email = email or getattr(user_obj, "email", None)
                    role = role or getattr(user_obj, "role", None)
                    if getattr(user_obj, "institution", None):
                        institution_name = user_obj.institution.name
            except Exception:
                pass
        # Fallback: derive first name from email (e.g. anwarmousa80@gmail.com -> Anwar)
        if not name or (isinstance(name, str) and name.strip().lower() == "user"):
            email_str = (email or "").strip()
            if email_str and "@" in email_str:
                local = email_str.split("@")[0]
                alpha_part = "".join(c for c in local if c.isalpha())
                if alpha_part:
                    first_name = alpha_part[:5]
                    name = first_name[0].upper() + first_name[1:].lower()
        # Use first name for friendlier AI address (e.g. "Musa" from "Musa Ahmed")
        display_name = (name or "User").strip()
        if display_name and display_name.lower() != "user" and " " in display_name:
            display_name = display_name.split()[0]
        return {
            "name": display_name or "User",
            "email": email or "",
            "role": str(role or "USER"),
            "institution": institution_name or "",
        }

    async def _get_conversation_memory(self, user_id: str, exclude_chat_id: str | None = None) -> str:
        """Build a lightweight memory string from recent chat summaries."""
        try:
            from app.core.db import db as prisma_client
            recent_chats = await prisma_client.chat.find_many(
                where={"userId": user_id},
                order={"updatedAt": "desc"},
                take=6,
                include={"messages": {"take": -4, "order_by": {"timestamp": "asc"}}},
            )
            if not recent_chats:
                return ""

            memory_lines: list[str] = []
            for chat in recent_chats:
                if chat.id == exclude_chat_id:
                    continue
                if not chat.messages:
                    continue
                summary_parts = []
                for m in chat.messages[-4:]:
                    prefix = "User" if m.role == "user" else "Horus"
                    snippet = m.content[:120].replace("\n", " ")
                    summary_parts.append(f"{prefix}: {snippet}")
                if summary_parts:
                    title = chat.title or "Untitled"
                    memory_lines.append(f"[{title}] {' | '.join(summary_parts)}")
                if len(memory_lines) >= 3:
                    break

            if not memory_lines:
                return ""
            return "Recent conversation memory (past sessions):\n" + "\n".join(memory_lines)
        except Exception as e:
            logger.error(f"Failed to build conversation memory: {e}")
            return ""

    async def _generate_chat_title(self, message: str, response: str, background_tasks: Any, chat_id: str) -> None:
        """Generate a smart 3-5 word title for a chat using AI (only on first exchange)."""
        try:
            from app.core.db import db as prisma_client
            msg_count = await prisma_client.message.count(where={"chatId": chat_id})
            if msg_count > 3:
                return

            client = get_gemini_client()
            prompt = (
                "Generate a short chat title (3-5 words, no quotes, no punctuation at the end) "
                "that captures the topic of this conversation.\n\n"
                f"User: {message[:200]}\n"
                f"Assistant: {response[:200]}\n\n"
                "Title:"
            )
            title = await client.generate_text(prompt=prompt)
            title = (title or "").strip().strip('"').strip("'").strip()[:60]
            if not title:
                return
            await prisma_client.chat.update(
                where={"id": chat_id},
                data={"title": title},
            )
        except Exception as e:
            logger.error(f"Failed to generate chat title: {e}")

    async def stream_chat(
        self, 
        user_id: str, 
        message: Optional[str] = None, 
        chat_id: Optional[str] = None,
        files: List[Any] = None,
        background_tasks: Any = None,
        db: Any = None,
        current_user: Any = None,
        correlation_id: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Hyper-optimized streaming chat interface.
        Parallelizes database saves, state fetching, and file processing.

        Agent mode: if the user message matches a known compliance intent,
        we bypass the AI streaming pipeline, run the agent action directly,
        and return a structured __ACTION_RESULT__ prefix that the frontend
        can render as a typed card component.
        """
        corr_id = correlation_id or str(uuid4())
        logger.info("Horus stream_chat started", extra={"correlation_id": corr_id, "user_id": user_id, "chat_id": chat_id})

        # 0. Read request multipart into memory BEFORE any response bytes are sent.
        # Vercel / some ASGI stacks finalize the request body once streaming starts;
        # a later UploadFile.read() then raises "I/O operation on closed file".
        if files:
            buffered_parts: list[dict[str, Any]] = []
            for uf in files:
                try:
                    body = await uf.read()
                except Exception as read_err:
                    logger.error(
                        "Horus: could not read uploaded file %s: %s",
                        getattr(uf, "filename", "?"),
                        read_err,
                        exc_info=True,
                    )
                    body = b""
                fname = getattr(uf, "filename", None) or "file"
                ct = (getattr(uf, "content_type", None) or "").strip()
                if not ct:
                    guessed, _ = mimetypes.guess_type(fname)
                    ct = (guessed or "").strip()
                buffered_parts.append({"filename": fname, "content_type": ct, "body": body})
            files = buffered_parts

        # 1. Start Chat Creation or Fetch in Parallel with State
        if not chat_id:
            chat = await ChatService.create_chat(user_id, title=message[:50] if message else "New Conversation")
            chat_id = chat.id
            yield f"__CHAT_ID__:{chat_id}\n"

        request_mode, message = self._extract_mode_token(message)
        client = get_gemini_client()
        # Text-only fast path must NOT run when files are attached — otherwise Ask mode
        # would call stream_chat without multimodal parts and the model thinks no file exists.
        has_attachments = bool(files)
        fast_path = (
            not has_attachments
            and (
                request_mode == "ask"
                or (
                    request_mode not in ("agent", "think")
                    and self._should_use_fast_path(message=message, files=files)
                )
            )
        )
        visual_only_request = self._is_visual_only(files)
        needs_analysis = self._needs_compliance_analysis(message)
        store_as_evidence = not (visual_only_request and not needs_analysis)

        # ── TIER 1: FAST PATH (no platform context build) ────────────────────
        if fast_path:
            full_response = ""
            try:
                if message:
                    if background_tasks:
                        background_tasks.add_task(ChatService.save_message, chat_id, user_id, "user", message)
                    else:
                        asyncio.create_task(ChatService.save_message(chat_id, user_id, "user", message))

                # Skip __THINKING__ for Ask fast path — frontend shows "Answering…" immediately; saves one round-trip

                fast_messages = [{"role": "user", "content": message or ""}]
                try:
                    history = await asyncio.wait_for(
                        ChatService.get_chat(chat_id, user_id, message_limit=6),
                        timeout=0.2,
                    )
                    if history and getattr(history, "messages", None):
                        fast_messages = [{"role": m.role, "content": m.content} for m in history.messages[-6:]]
                        if message and not any(m["content"] == message for m in fast_messages):
                            fast_messages.append({"role": "user", "content": message})
                except Exception:
                    pass

                # Use _resolve_user_identity so we get name from DB when current_user dict lacks it
                user_identity = await self._resolve_user_identity(user_id, current_user)
                user_name = user_identity.get("name") or "User"
                user_email = user_identity.get("email") or ""
                user_role = str(user_identity.get("role") or "USER")
                institution_name = user_identity.get("institution") or ""
                institution_line = ""
                if institution_name:
                    institution_line = f" They belong to institution '{institution_name}'."
                memory_line = ""

                # RAG in Fast Path: when platform keywords present, inject document context
                rag_fast = ""
                compliance_kw = ["gap", "compliance", "standard", "criteria", "ncaaa", "iso", "accreditation", "analysis", "evidence", "فجوة", "امتثال", "معيار"]
                rag_sources: List[Dict[str, Any]] = []
                if message and any(kw in (message or "").lower() for kw in compliance_kw):
                    try:
                        from app.core.db import db as _prisma
                        _u = await _prisma.user.find_unique(where={"id": user_id})
                        _inst = getattr(_u, "institutionId", None) if _u else None
                        rag = RagService()
                        rag_fast, rag_sources = await rag.retrieve_context(message, limit=3, user_id=user_id, institution_id=_inst)
                        if rag_fast:
                            rag_fast = "\n" + rag_fast
                    except Exception as e:
                        logger.debug(f"Fast path RAG skipped: {e}")

                # Emit citations before streaming when RAG sources available
                if rag_sources:
                    yield f"__CITATION__:{json.dumps(rag_sources)}\n"
                    await asyncio.sleep(0)
                async for chunk in client.stream_chat(
                    messages=fast_messages,
                    context=(
                        f"You are Horus, the AI assistant for the Ayn platform. "
                        f"The user's name is {user_name} (email: {user_email}, role: {user_role}).{institution_line} "
                        f"Address them by name when appropriate. Never say 'Hello User' — use their actual name or a neutral 'Hello'/'Hi'. "
                        f"Answer conversational and general questions immediately and clearly. Stream your response token-by-token; do not buffer. "
                        f"Prefer the shortest complete useful answer. "
                        f"Do not claim you accessed platform state unless explicitly requested."
                        f"{memory_line}"
                        f"{rag_fast}"
                    ),
                ):
                    if chunk:
                        full_response += chunk
                        yield chunk
                        await asyncio.sleep(0)  # Yield control so chunk is sent immediately
            except Exception as fast_err:
                logger.error(f"Fast path failed, continuing with fallback error response: {fast_err}", exc_info=True)
                if not full_response:
                    yield "__STREAM_ERROR__:Connection interrupted. Please try again.\n"
                    full_response = "I’m having trouble right now. Please try again."
                    yield full_response

            if full_response and background_tasks:
                background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", full_response)
                if message:
                    background_tasks.add_task(self._generate_chat_title, message, full_response, None, chat_id)
            elif full_response:
                await ChatService.save_message(chat_id, user_id, "assistant", full_response)
                if message:
                    asyncio.create_task(self._generate_chat_title(message, full_response, None, chat_id))
            return

        user_identity = await self._resolve_user_identity(user_id, current_user)
        active_goal = await self._get_active_goal(user_id, chat_id)

        # Yield immediately so user sees progress before any heavy work
        yield "__THINKING__:Preparing your request...\n"
        await asyncio.sleep(0)

        # ── AGENT PLANNER + TOOL EXECUTION ────────────────────────────────────
        # Allow agent with files when: Agent mode selected, or message has platform keywords (e.g. "حلل", "analyze", "gaps")
        agent_keywords = ["حلل", "analyze", "gaps", "فجوات", "compliance", "audit", "report", "تحليل"]
        msg_lower = (message or "").lower()
        has_agent_keywords = any(kw in msg_lower for kw in agent_keywords)
        allow_agent_with_files = request_mode == "agent" or has_agent_keywords
        if message and request_mode != "think" and (not files or allow_agent_with_files):
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
                _pending_cleanup_stale()
                confirm_id = self._extract_control_token(message, "__CONFIRM_ACTION__:")
                cancel_id = self._extract_control_token(message, "__CANCEL_ACTION__:")

                if message.startswith("__CONFIRM_ACTION__:"):
                    pending = _pending_get(confirm_id)
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

                    if tool_name == "__plan__":
                        plan_steps = pending.get("plan_steps", [])
                        plan_output = await self._execute_agent_plan(
                            plan_steps=plan_steps,
                            db=prisma_client,
                            user_id=user_id,
                            institution_id=institution_id,
                            current_user=current_user_dict,
                            background_tasks=background_tasks,
                            correlation_id=corr_id,
                        )
                        _pending_pop(confirm_id)
                        if plan_output["last_structured"]:
                            yield f"__ACTION_RESULT__:{json.dumps(plan_output['last_structured'])}\n"
                        if plan_output["summary_text"]:
                            yield ("\n" if plan_output["last_structured"] else "") + plan_output["summary_text"]
                        plan_meta = {"structuredResult": plan_output["last_structured"]} if plan_output["last_structured"] else None
                        if background_tasks:
                            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", plan_output["summary_text"], plan_meta)
                        else:
                            await ChatService.save_message(chat_id, user_id, "assistant", plan_output["summary_text"], plan_meta)
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
                        _pending_pop(confirm_id)

                        if tool_result.get("type") in STRUCTURED_RESULT_TYPES:
                            yield f"__ACTION_RESULT__:{json.dumps(tool_result)}\n"

                        await self._log_agent_action(
                            user_id=user_id,
                            tool_name=tool_name,
                            args=args,
                            result=tool_result,
                            background_tasks=background_tasks,
                            phase="confirmed",
                            correlation_id=corr_id,
                        )

                        narrative_text = self._summarize_tool_result(tool_name, tool_result, message)
                        if narrative_text:
                            yield ("\n" if tool_result.get("type") in STRUCTURED_RESULT_TYPES else "") + narrative_text

                        msg_metadata = {"structuredResult": tool_result} if tool_result.get("type") in STRUCTURED_RESULT_TYPES else None
                        if background_tasks:
                            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", narrative_text, msg_metadata)
                        else:
                            await ChatService.save_message(chat_id, user_id, "assistant", narrative_text, msg_metadata)
                        return

                if message.startswith("__CANCEL_ACTION__:"):
                    pending = _pending_get(cancel_id)
                    if not cancel_id or not pending or not self._pending_matches_scope(pending, user_id, chat_id):
                        cancelled_text = "That confirmation request is no longer active."
                        yield cancelled_text
                        if background_tasks:
                            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", cancelled_text)
                        else:
                            await ChatService.save_message(chat_id, user_id, "assistant", cancelled_text)
                        return

                    _pending_pop(cancel_id)
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
                    user_identity=user_identity,
                )
                plan = await self._plan_agent_action(
                    client=client,
                    message=message,
                    platform_snapshot=snapshot,
                    goal=active_goal,
                    mode=request_mode,
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
                        yield f"__THINKING__:Identified action: {tool_meta['title']}\n"
                        yield f"__THINKING__:Preparing {tool_meta['prepare_text']}...\n"

                        if requires_explicit_confirmation(tool_name):
                            confirm_id = str(uuid4())
                            description = tool_meta["description"]
                            _pending_set(confirm_id, {
                                "user_id": user_id,
                                "chat_id": chat_id,
                                "tool_name": tool_name,
                                "args": args,
                                "description": description,
                                "created_at": datetime.now(timezone.utc).isoformat(),
                            })
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

                        yield f"__TOOL_STEP__:{json.dumps({'step': 1, 'total': 1, 'tool': tool_name, 'title': tool_meta['title'], 'status': 'running'})}\n"
                        tool_result = await execute_tool(
                            tool_name=tool_name,
                            args=args,
                            db=prisma_client,
                            user_id=user_id,
                            institution_id=institution_id,
                            current_user=current_user_dict,
                        )
                        yield f"__TOOL_STEP__:{json.dumps({'step': 1, 'total': 1, 'tool': tool_name, 'title': tool_meta['title'], 'status': 'done' if tool_result.get('type') != 'action_error' else 'error', 'result_type': tool_result.get('type', 'unknown')})}\n"

                        if tool_result.get("type") in STRUCTURED_RESULT_TYPES and tool_result.get("type") != "action_error":
                            yield f"__ACTION_RESULT__:{json.dumps(tool_result)}\n"

                        await self._log_agent_action(
                            user_id=user_id,
                            tool_name=tool_name,
                            args=args,
                            result=tool_result,
                            background_tasks=background_tasks,
                            phase="auto",
                            correlation_id=corr_id,
                        )

                        narrative_text = self._summarize_tool_result(tool_name, tool_result, message)
                        if narrative_text:
                            if tool_result.get("type") in STRUCTURED_RESULT_TYPES:
                                yield "\n" + narrative_text
                            else:
                                yield narrative_text

                        msg_metadata = {"structuredResult": tool_result} if tool_result.get("type") in STRUCTURED_RESULT_TYPES else None
                        if background_tasks:
                            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", narrative_text, msg_metadata)
                        else:
                            await ChatService.save_message(chat_id, user_id, "assistant", narrative_text, msg_metadata)
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
                            _pending_set(confirm_id, {
                                "user_id": user_id,
                                "chat_id": chat_id,
                                "tool_name": "__plan__",
                                "plan_steps": plan_steps,
                                "description": f"Run a {len(plan_steps)}-step agent plan including write operations.",
                                "created_at": datetime.now(timezone.utc).isoformat(),
                            })
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
                        chunk_queue: asyncio.Queue[str | None] = asyncio.Queue()

                        def put_chunk(c: str) -> None:
                            chunk_queue.put_nowait(c)

                        async def run_plan() -> dict:
                            return await self._execute_agent_plan(
                                plan_steps=plan_steps,
                                db=prisma_client,
                                user_id=user_id,
                                institution_id=institution_id,
                                current_user=current_user_dict,
                                background_tasks=background_tasks,
                                yield_chunk=put_chunk,
                                correlation_id=corr_id,
                            )

                        plan_task = asyncio.create_task(run_plan())
                        emitted_action_result = False
                        while True:
                            try:
                                chunk = await asyncio.wait_for(chunk_queue.get(), timeout=0.05)
                            except asyncio.TimeoutError:
                                if plan_task.done():
                                    break
                                continue
                            if chunk is None:
                                break
                            if "__ACTION_RESULT__" in chunk:
                                emitted_action_result = True
                            yield chunk
                        while not chunk_queue.empty():
                            try:
                                chunk = chunk_queue.get_nowait()
                            except asyncio.QueueEmpty:
                                break
                            if chunk and chunk is not None:
                                if "__ACTION_RESULT__" in chunk:
                                    emitted_action_result = True
                                yield chunk
                        plan_output = await plan_task
                        tool_results = plan_output.get("tool_results", [])
                        has_failures = any(tr.get("result", {}).get("type") == "action_error" for tr in tool_results)

                        # Reflection: re-plan on failure (once)
                        if has_failures and tool_results:
                            yield "__THINKING__:Reflecting after failure…\n"
                            re_plan = await self._plan_with_observations(
                                client=client,
                                message=message,
                                platform_snapshot=snapshot,
                                tool_results=tool_results,
                                goal=active_goal,
                            )
                            if re_plan and re_plan.get("mode") == "chat":
                                fallback_msg = re_plan.get("response") or re_plan.get("reason") or plan_output["summary_text"]
                                if fallback_msg:
                                    yield fallback_msg
                                if background_tasks:
                                    background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", fallback_msg)
                                else:
                                    await ChatService.save_message(chat_id, user_id, "assistant", fallback_msg)
                                return

                        if plan_output["last_structured"] and not emitted_action_result:
                            yield f"__ACTION_RESULT__:{json.dumps(plan_output['last_structured'])}\n"
                        if plan_output["summary_text"]:
                            yield ("\n" if plan_output["last_structured"] else "") + plan_output["summary_text"]
                        plan_meta = {"structuredResult": plan_output["last_structured"]} if plan_output["last_structured"] else None
                        if background_tasks:
                            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", plan_output["summary_text"], plan_meta)
                        else:
                            await ChatService.save_message(chat_id, user_id, "assistant", plan_output["summary_text"], plan_meta)
                        return
            except Exception as agent_err:
                logger.error(f"Agent planner/tool execution failed: {agent_err}", exc_info=True)
        
        # 2. Parallelize ALL initial operations for speed
        async def process_file(part: dict[str, Any]):
            content = part["body"]
            fname = part.get("filename") or "file"
            # Gemini requires application/pdf; browsers often send octet-stream for PDFs.
            if fname.lower().endswith(".pdf"):
                ct = "application/pdf"
            else:
                ct = (part.get("content_type") or "").strip()
                if not ct or ct not in ALLOWED_FILE_TYPES:
                    guessed, _ = mimetypes.guess_type(fname)
                    if guessed:
                        ct = guessed.strip()
            mime_for_upload = ct if ct in ALLOWED_FILE_TYPES else (ct or "application/octet-stream")
            file_payload = {
                "type": "image" if ct.startswith("image/") else "document" if ct == "application/pdf" else "text",
                "mime_type": ct or mime_for_upload,
                "data": base64.b64encode(content).decode("utf-8"),
                "filename": fname,
                "evidenceId": None,
            }
            if store_as_evidence and content:
                meta = SimpleNamespace(filename=fname, content_type=mime_for_upload)
                try:
                    upload_result = await EvidenceService.upload_evidence(
                        meta,  # duck-typed; body passed as file_content
                        current_user,
                        background_tasks,
                        file_content=content,
                    )
                    if upload_result.success:
                        file_payload["evidenceId"] = upload_result.evidenceId
                except Exception as upload_err:
                    logger.warning(f"Evidence upload failed, continuing with AI analysis: {upload_err}")
            return file_payload

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

        # Yield immediately so user sees feedback before any await (avoids 2–5s silence)
        if files:
            yield "__THINKING__:Got it, analyzing your file...\n"
            for f in files:
                fn = self._buffered_part_filename(f)
                yield f"__FILE_STATUS__:{json.dumps({'filename': fn, 'status': 'uploading'})}\n"
            await asyncio.sleep(0)
        else:
            yield "__THINKING__:Reading platform state...\n"
            await asyncio.sleep(0)

        results = await asyncio.gather(*tasks)

        if files:
            yield "__THINKING__:Processing attached files...\n"
            await asyncio.sleep(0)

        summary = results[0]
        recent_activities = results[1]
        mapping_context = results[2]
        
        # Handle dynamic results (files)
        offset = 3
        file_results = []
        if files:
            file_results = [r for r in results[offset:offset+len(files)] if r is not None]
            for res in file_results:
                fn = res.get("filename") or "file"
                yield f"__FILE_STATUS__:{json.dumps({'filename': fn, 'status': 'done'})}\n"
                yield f"__FILE__:{fn}\n"
                await asyncio.sleep(0)

        # Log file uploads in background
        for res in file_results:
            evidence_id = res.get("evidenceId")
            if evidence_id and background_tasks:
                background_tasks.add_task(
                    ActivityService.log_activity,
                    user_id=user_id,
                    type="evidence_uploaded",
                    title=f"File uploaded: {res['filename']}",
                    entity_id=evidence_id,
                    entity_type="evidence"
                )

        # 3. AI Interaction (Streaming)
        memory_task = asyncio.create_task(self._get_conversation_memory(user_id, exclude_chat_id=chat_id))
        context_task = asyncio.create_task(self._prepare_context_sync(
            summary,
            recent_activities,
            message=message,
            mapping_context=mapping_context,
            user_identity=user_identity,
            goal=active_goal,
            user_id=user_id,
        ))
        memory, context = await asyncio.gather(memory_task, context_task)
        if memory:
            context = memory + "\n\n" + context
        
        full_response = ""
        
        # Lazily fetch history without blocking initial file processing or state fetching
        history_task = asyncio.create_task(ChatService.get_chat(chat_id, user_id, message_limit=20))

        if file_results:
            visual_only = all((f.get("type") == "image") for f in file_results)
            for res in file_results:
                fn = res.get("filename") or "file"
                yield f"__FILE_STATUS__:{json.dumps({'filename': fn, 'status': 'analyzing'})}\n"
            await asyncio.sleep(0)

            if store_as_evidence:
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
            
            if visual_only:
                yield "__THINKING__:Phase 1: Reading visual content...\n"
                await asyncio.sleep(0)
                yield "__THINKING__:Phase 2: Identifying key UI elements...\n"
                await asyncio.sleep(0)
                yield "__THINKING__:Phase 3: Summarizing observations...\n"
                await asyncio.sleep(0)
                yield "__THINKING__:Phase 4: Finalizing response...\n"
                await asyncio.sleep(0)
            else:
                yield "__THINKING__:Phase 1 (Identify): Scanning document category...\n"
                await asyncio.sleep(0)
                yield "__THINKING__:Phase 2 (Deconstruct): Splitting PDF into semantic chunks and metadata...\n"
                await asyncio.sleep(0)
                yield "__THINKING__:Phase 3 (Analyze): Cross-referencing against internal Quality Constitution...\n"
                await asyncio.sleep(0)
                yield "__THINKING__:Phase 4 (Score): Calculating weighted Compliance Score...\n"
                await asyncio.sleep(0)
                yield "__THINKING__:Phase 5 (Synthesize): Preparing Audit Report and Optimized Content...\n"
                await asyncio.sleep(0)
            
            if visual_only:
                if needs_analysis:
                    ai_message = (message or "").strip() + "\n\nAnalyze the attached image(s) with a brief compliance-focused summary. Respond in plain language. Do not return JSON or code."
                else:
                    ai_message = message or "Please analyze the attached image(s) and respond in plain language. If it's a UI screenshot, summarize the key elements and any obvious issues. Do not return JSON or code."
            else:
                user_line = (message or "").strip()
                if needs_analysis:
                    ai_message = user_line or "Analyze these files."
                    ai_message += "\n\nCRITICAL: You must generate a JSON-ready markdown report containing:\n- **overall_score**: (0-100)\n- **key_findings**: (List of strengths and weaknesses)\n- **improvement_suggestions**: (Actionable steps)"
                else:
                    ai_message = user_line or "Please look at the attached file(s)."
                    ai_message += (
                        "\n\nYou have direct access to the attached file(s) as vision/document input. "
                        "Use their real content. Answer in the same language as the user (e.g. Arabic if they wrote in Arabic). "
                        "Explain clearly what the document is, what it contains, and anything useful you notice. "
                        "Do NOT say you cannot see or access the attachment. "
                        "Do NOT reply with only JSON unless the user explicitly asked for JSON."
                    )

            try:
                async for chunk in client.stream_chat_with_files(
                    message=ai_message,
                    files=file_results,
                    context=context # Pass the enriched brain context
                ):
                    if chunk:
                        full_response += chunk
                        yield chunk
                        await asyncio.sleep(0)  # Yield control so chunk is sent immediately
            except Exception as file_stream_err:
                logger.error(f"File analysis stream failed: {file_stream_err}", exc_info=True)
                if not full_response.strip():
                    full_response = "I encountered an error while analyzing your file. Please try again or attach a different file."
                    yield full_response
            if not full_response.strip():
                # Some multimodal providers may stream empty chunks for certain files.
                # Ensure the user never sees a silent response.
                fallback_response = await client.chat_with_files(
                    message=ai_message,
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
            await asyncio.sleep(0)
            messages = [{"role": m.role, "content": m.content} for m in (history.messages if history else [])]
            if message and not any(m["content"] == message for m in messages):
                messages.append({"role": "user", "content": message})
            # When user refers to a file they sent earlier but no file in this request:
            # we don't have file content in history — add context so AI explains they must re-attach
            file_ref_keywords = ["بعته", "ارسلت", "اللي فوق", "السابق", "الملف", "الفايل", "file", "sent", "attached", "uploaded", "حلل", "analyze"]
            msg_lower = (message or "").lower()
            if any(kw in msg_lower for kw in file_ref_keywords):
                context += "\n\n[IMPORTANT] The user may be referring to a file from a previous message. You do NOT have access to file content from past messages. If they want file analysis, they must re-attach the file in this message. Respond clearly: ask them to re-attach the file to analyze it. Do NOT propose a plan or ask for confirmation—just explain this directly."
            yield "__THINKING__:Generating response...\n"
            await asyncio.sleep(0)
            
            try:
                async for chunk in client.stream_chat(messages=messages, context=context):
                    if chunk:
                        full_response += chunk
                        yield chunk
                        await asyncio.sleep(0)  # Yield control so chunk is sent immediately
                if not full_response.strip():
                    fallback_response = await client.chat(messages=messages, context=context)
                    if fallback_response and fallback_response.strip():
                        full_response = fallback_response.strip()
                        yield full_response
            except Exception as stream_err:
                logger.error(f"Stream chat failed mid-response: {stream_err}", exc_info=True)
                if not full_response.strip():
                    yield "__STREAM_ERROR__:Connection interrupted. Please try again.\n"
                    full_response = "I encountered an error while generating a response. Please try again."
                    yield full_response

        # 4. Save Assistant Response in Background to release the generator faster
        if full_response and background_tasks:
            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", full_response)
            if message:
                background_tasks.add_task(self._generate_chat_title, message, full_response, None, chat_id)
        elif full_response:
            await ChatService.save_message(chat_id, user_id, "assistant", full_response)
            if message:
                asyncio.create_task(self._generate_chat_title(message, full_response, None, chat_id))

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
                
                # IMPORTANT: Rag Indexing (scoped by user/institution)
                if res["mime_type"] == "text/plain" or res["mime_type"] == "text/markdown":
                    from app.core.db import db as _prisma
                    _user = await _prisma.user.find_unique(where={"id": user_id})
                    _inst_id = getattr(_user, "institutionId", None) if _user else None
                    rag = RagService()
                    await rag.index_document(
                        content.decode("utf-8"),
                        document_id=res["evidenceId"],
                        user_id=user_id,
                        institution_id=_inst_id,
                    )
                    
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

    async def _prepare_context_sync(self, summary, recent_activities, brain_results=None, message: str = "", mapping_context: str = "", user_identity: Dict[str, str] | None = None, goal: str | None = None, user_id: str | None = None) -> str:
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

        # 🚀 TRUE RAG: scoped by user/institution for multi-tenant security
        institution_id_sync = None
        if message and user_id:
            try:
                from app.core.db import db as prisma_client
                user_obj = await prisma_client.user.find_unique(where={"id": user_id})
                institution_id_sync = getattr(user_obj, "institutionId", None) if user_obj else None
            except Exception:
                pass
        if message:
            try:
                rag = RagService()
                rag_context, _ = await rag.retrieve_context(
                    message, limit=4, user_id=user_id, institution_id=institution_id_sync
                )
                if rag_context:
                    context_parts.append(rag_context)
                else:
                    context_parts.append("[Note: RAG retrieval returned no results. Embeddings may require Gemini. Proceed without document context.]")
            except Exception as e:
                logger.error(f"RAG Context retrieval failed during chat sync: {e}")
                context_parts.append(f"[Note: RAG retrieval failed ({e}). Proceed without document context.]")

        import re
        message_clean = (message or "").replace(" ", "")
        arabic_chars = len(re.findall(r'[\u0600-\u06FF]', message_clean))
        is_arabic = (arabic_chars / len(message_clean)) > 0.1 if len(message_clean) > 0 else False
        language_instruction = "- ALWAYS respond in Arabic because the user wrote in Arabic." if is_arabic else "- ALWAYS respond in English."

        user_line = ""
        if user_identity:
            inst = f", institution: {user_identity['institution']}" if user_identity.get("institution") else ""
            user_line = f"- The current user is {user_identity['name']} (email: {user_identity['email']}, role: {user_identity['role']}{inst}). Address them by name when appropriate. Never say 'Hello User' — use their actual name or 'Hello'/'Hi'."

        goal_line = f"- Active goal: {goal}" if goal else ""
        context_parts.append(f"""
        Recent Platform Activities:
        {self._format_activities(recent_activities)}
        
        Instructions for Horus Brain:
        - You are Horus (حورس), the central intelligence of the Ayn Platform.
        {user_line}
        {goal_line}
        - You process compliance data, analyze evidence, and manage gaps.
        - When files are uploaded, ALWAYS use the brain results provided above.
        - Be concise, professional, and data-driven.
        {language_instruction}
        """)
        return "\n".join(context_parts)

    async def _prepare_context(self, user_id: str, summary, message: str = "", user_identity: Dict[str, str] | None = None, goal: str | None = None) -> str:
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
            
        user_obj = None
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
            
        # 🚀 TRUE RAG: scoped by user/institution for multi-tenant security
        institution_id_ctx = getattr(user_obj, "institutionId", None) if user_obj else None
        if message:
            try:
                rag = RagService()
                rag_context, _ = await rag.retrieve_context(
                    message, limit=4, user_id=user_id, institution_id=institution_id_ctx
                )
                if rag_context:
                    context_parts.append(rag_context)
                else:
                    context_parts.append("[Note: RAG retrieval returned no results. Embeddings may require Gemini. Proceed without document context.]")
            except Exception as e:
                logger.error(f"RAG Context retrieval failed during chat loop: {e}")
                context_parts.append(f"[Note: RAG retrieval failed ({e}). Proceed without document context.]")
        
        import re
        message_clean = (message or "").replace(" ", "")
        arabic_chars = len(re.findall(r'[\u0600-\u06FF]', message_clean))
        is_arabic = (arabic_chars / len(message_clean)) > 0.1 if len(message_clean) > 0 else False
        language_instruction = "- ALWAYS respond in Arabic because the user wrote in Arabic." if is_arabic else "- ALWAYS respond in English."

        user_line = ""
        if user_identity:
            inst = f", institution: {user_identity['institution']}" if user_identity.get("institution") else ""
            user_line = f"- The current user is {user_identity['name']} (email: {user_identity['email']}, role: {user_identity['role']}{inst}). Address them by name when appropriate. Never say 'Hello User' — use their actual name or 'Hello'/'Hi'."

        goal_line = f"- Active goal: {goal}" if goal else ""
        context_parts.append(f"""
        Recent Platform Activities:
        {self._format_activities(recent_activities)}
        
        Instructions for Horus Brain:
        - You are Horus (حورس), the central intelligence of the Ayn Platform.
        {user_line}
        {goal_line}
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
            created = a.createdAt if hasattr(a, 'createdAt') else datetime.now(timezone.utc)
            lines.append(f"- {title}: {desc} ({created.strftime('%Y-%m-%d %H:%M')})")
        return "\n".join(lines)

    def _format_gaps(self, gaps) -> str:
        if not gaps: return "No critical gaps found."
        lines = []
        for g in gaps[:5]:
            lines.append(f"- [{g.severity.upper()}] {g.standard} {g.clause}: {g.description[:60]}...")
        return "\n".join(lines)

    def _hash_state(self, summary) -> str:
        return f"{summary.total_files}:{summary.total_evidence}:{summary.total_gaps}:{datetime.now(timezone.utc).strftime('%Y%m%d%H')}"

    def _extract_control_token(self, message: str, prefix: str) -> str | None:
        if not message:
            return None
        if not message.startswith(prefix):
            return None
        return message[len(prefix):].strip() or None

    def _extract_mode_token(self, message: str | None) -> tuple[str | None, str]:
        if not message:
            return None, ""
        prefix = "__MODE__:"
        if not message.startswith(prefix):
            return None, message
        first_line, _, remainder = message.partition("\n")
        mode = first_line[len(prefix):].strip().lower() or None
        return mode, remainder

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

        platform_keywords_en = (
            "gap", "evidence", "standard", "criteria", "criterion",
            "audit", "remediation", "report", "dashboard", "workflow",
            "analytics", "compliance", "policy", "document", "vault",
            "hub", "score", "ncaaa", "iso", "institution", "upload",
            "export", "task", "analyze", "analysis",
        )
        platform_keywords_ar = (
            "فجوة", "أدلة", "دليل", "معيار", "معايير", "تقرير",
            "لوحة", "تحليل", "امتثال", "سياسة", "وثيقة", "مستند",
            "رفع", "تصدير", "مهمة", "تدقيق", "علاج", "مؤسسة",
            "درجة", "نتيجة", "جودة", "اعتماد", "تقييم",
        )
        if any(keyword in lowered for keyword in platform_keywords_en):
            return False
        if any(keyword in msg for keyword in platform_keywords_ar):
            return False

        direct_smalltalk = (
            "hi", "hello", "hey", "thanks", "thank you",
            "how are you", "good morning", "good evening",
            "who are you", "what can you do",
            "مرحبا", "اهلا", "شكرا", "صباح الخير", "مساء الخير",
        )
        if any(lowered == t or lowered.startswith(f"{t} ") or msg == t or msg.startswith(f"{t} ") for t in direct_smalltalk):
            return True

        word_count = len(lowered.split())
        return word_count <= 12

    async def _get_active_goal(self, user_id: str, chat_id: str | None) -> str | None:
        try:
            chat = await ChatService.get_goal(user_id, chat_id)
            if chat and getattr(chat, "goal", None):
                return chat.goal
        except Exception as e:
            logger.error(f"Failed to fetch active goal: {e}")
        return None

    def _cleanup_stale_pending_confirmations(self) -> None:
        """Delegates to module-level _pending_cleanup_stale (Redis or in-memory)."""
        _pending_cleanup_stale()

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
        goal: str | None = None,
        mode: str | None = None,
    ) -> Dict[str, Any] | None:
        tool_manifest = build_tool_manifest()

        goal_block = f"\nActive session goal:\n{goal}\n" if goal else ""
        mode_block = ""
        if mode == "agent":
            mode_block = '\nMode bias:\n- The user explicitly selected AGENT mode.\n- Prefer mode "tool" or "plan" whenever a platform action can help.\n- Use mode "chat" only when no tool meaningfully helps.\n'
        planner_prompt = f"""
You are Horus planner. Decide whether to call exactly one tool or answer as chat.

User message:
{message}
{goal_block}
{mode_block}

Platform snapshot JSON:
{json.dumps(platform_snapshot)[:5000]}

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

    async def _plan_with_observations(
        self,
        client: Any,
        message: str,
        platform_snapshot: Dict[str, Any],
        tool_results: list[dict],
        goal: str | None = None,
    ) -> Dict[str, Any] | None:
        """Re-plan after tool failures. Asks planner for alternative or chat response."""
        tool_manifest = build_tool_manifest()
        observations = "\n".join(
            f"- {r['tool']}: {r['result'].get('type', 'unknown')} — {(r['result'].get('payload') or {}).get('message', str(r['result']))[:200]}"
            for r in tool_results
        )
        goal_block = f"\nActive session goal:\n{goal}\n" if goal else ""
        planner_prompt = f"""
You are Horus planner. A previous plan had failures. Decide next action.

Original user message:
{message}
{goal_block}

Previous tool execution results (some may have failed):
{observations}

Platform snapshot JSON:
{json.dumps(platform_snapshot)[:4000]}

Available tools:
{json.dumps(tool_manifest)}

Return ONLY valid JSON:
{{"mode": "tool" | "plan" | "chat", "tool": "tool_name_or_null", "arguments": {{}}, "steps": [...], "reason": "short", "response": "Brief user-facing message when mode is chat"}}

Rules:
- If a tool failed, consider an alternative tool or different arguments.
- If no alternative helps, use mode "chat" and explain the failure to the user.
- Plan can contain up to 3 steps.
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

    def _summarize_tool_result(self, tool_name: str, result: dict, user_message: str | None = None) -> str:
        result_type = result.get("type", "unknown")
        if result_type == "job_started":
            job_id = result.get("jobId") or result.get("job_id")
            return f"I started `{tool_name}` successfully.{f' Job ID: {job_id}.' if job_id else ''}"
        if result_type == "action_error":
            detail = result.get("message") or result.get("error") or "The action did not complete successfully."
            return str(detail)
        if result_type == "audit_report":
            return "I generated the audit report and attached the structured output above."
        if result_type == "gap_table":
            return "I prepared the gap analysis table and highlighted the main issues above."
        if result_type == "remediation_plan":
            return "I generated a remediation plan with the next recommended steps."
        if result_type == "analytics_report":
            return "I prepared the analytics summary and included the structured result above."
        if isinstance(result.get("message"), str) and result["message"].strip():
            return result["message"].strip()
        if user_message:
            return f"I completed `{tool_name}` for: {user_message.strip()}"
        return f"I completed `{tool_name}` successfully."

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
        yield_chunk: Callable[[str], Any] | None = None,
        correlation_id: Optional[str] = None,
    ) -> dict:
        """Execute plan steps with ReAct-style feedback: emit __TOOL_STEP__ per step,
        retry on failure, emit __ACTION_RESULT__ for each successful step."""
        executed: list[dict] = []
        last_structured: Optional[dict] = None
        total = len(plan_steps)
        tool_results: list[dict] = []  # For potential re-plan / reflection

        def _emit(chunk: str) -> None:
            if yield_chunk:
                yield_chunk(chunk)

        for step_idx, step in enumerate(plan_steps, start=1):
            tool_name = step["tool"]
            args = step.get("arguments", {}) or {}
            tool_meta = get_tool_ui_meta(tool_name)

            _emit(f"__TOOL_STEP__:{json.dumps({'step': step_idx, 'total': total, 'tool': tool_name, 'title': tool_meta['title'], 'status': 'running'})}\n")

            result = await execute_tool(
                tool_name=tool_name,
                args=args,
                db=db,
                user_id=user_id,
                institution_id=institution_id,
                current_user=current_user,
            )

            tool_results.append({"tool": tool_name, "result": result})
            ok = result.get("type") != "action_error"

            _emit(f"__TOOL_STEP__:{json.dumps({'step': step_idx, 'total': total, 'tool': tool_name, 'title': tool_meta['title'], 'status': 'done' if ok else 'error', 'result_type': result.get('type', 'unknown')})}\n")

            if result.get("type") in STRUCTURED_RESULT_TYPES and result.get("type") != "action_error":
                last_structured = result
            if ok and result.get("type") in STRUCTURED_RESULT_TYPES and result.get("type") != "action_error":
                _emit(f"__ACTION_RESULT__:{json.dumps(result)}\n")

            await self._log_agent_action(
                user_id=user_id,
                tool_name=tool_name,
                args=args,
                result=result,
                background_tasks=background_tasks,
                phase="plan",
                correlation_id=correlation_id,
            )
            executed.append({
                "tool": tool_name,
                "result_type": result.get("type", "unknown"),
                "ok": ok,
            })

        success = len([e for e in executed if e["ok"]])
        summary_lines = [f"Executed {len(executed)} plan steps ({success} successful)."]
        for idx, e in enumerate(executed, start=1):
            status = "ok" if e["ok"] else "failed"
            summary_lines.append(f"{idx}. {e['tool']} -> {e['result_type']} ({status})")

        return {
            "last_structured": last_structured,
            "summary_text": "\n".join(summary_lines),
            "tool_results": tool_results,
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
        correlation_id: Optional[str] = None,
    ) -> None:
        title = f"Horus executed {tool_name}"
        description = f"Phase={phase}, result={result.get('type', 'unknown')}"
        metadata = {"tool": tool_name, "args": args, "result_type": result.get("type"), "phase": phase}
        if correlation_id:
            metadata["correlation_id"] = correlation_id
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
