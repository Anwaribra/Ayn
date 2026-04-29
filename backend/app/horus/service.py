"""
Horus AI Service - Global Brain Refactor

Conversational intelligence with full platform awareness, persistence, and streaming.
"""

import base64
import json
import logging
import asyncio
import mimetypes
import time
from types import SimpleNamespace
from uuid import uuid4
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, AsyncGenerator, Callable
from pydantic import BaseModel

from app.ai.service import get_gemini_client, CONTEXT_LIMIT_SENTINEL
from app.evidence.service import EvidenceService, ALLOWED_FILE_TYPES
from app.notifications.service import NotificationService
from app.notifications.models import NotificationCreateRequest
from app.chat.service import ChatService
from app.activity.service import ActivityService
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
from app.horus.extraction import extract_text_cached
from app.horus.progressive_analysis import ProgressiveFileAnalysis
from app.horus.retrieval import SmartRetrievalPlanner
from app.horus.context_cache import HorusContextCache
from app.horus.memory import HorusMemoryService

logger = logging.getLogger(__name__)

# ── Platform identity constant ────────────────────────────────────────────────
AYN_PLATFORM_DESCRIPTION = (
    "Ayn (عين) is an academic accreditation and quality-assurance management platform "
    "designed for educational institutions (schools, universities, and training centres). "
    "It helps institutions prepare for and achieve accreditation against international "
    "frameworks such as NCAAA (Saudi Arabia), ISO 21001, QAA (UK), AdvancED, and UAE MoE standards. "
    "Core features include: Gap Analysis, Evidence Vault, Standards Hub, and Horus AI (this assistant). "
    "Horus is a read-only AI analyst: it explains existing reports, mappings, and gaps using data already "
    "produced by the platform. It never creates or alters mappings, gaps, reports, or evidence — users do that "
    "through the main workflows."
)

# Pending confirmations: Redis (persistent, survives restarts) or in-memory fallback.
# Scope check (user_id/chat_id) prevents cross-user execution.
PENDING_CONFIRMATION_TTL_SECONDS = 15 * 60
_PENDING_ACTION_CONFIRMATIONS_FALLBACK: dict[str, dict[str, Any]] = {}  # Used when Redis disabled
PENDING_CONFIRM_KEY_PREFIX = "horus:confirm:"
STRUCTURED_RESULT_TYPES = {"audit_report", "gap_table", "remediation_plan", "report_export", "action_error"}
CONTEXT_BUDGETS_SECONDS = {
    "identity": 0.15,
    "goal": 0.15,
    "state_summary": 0.30,
    "recent_activities": 0.25,
    "mappings": 0.30,
    "history": 0.25,
    "memory": 0.25,
    "rag": 0.70,
}


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
    def _timing_ms(start: float) -> int:
        return int((time.perf_counter() - start) * 1000)

    @staticmethod
    async def _with_budget(
        label: str,
        awaitable,
        *,
        default=None,
        correlation_id: str | None = None,
        budget_seconds: float | None = None,
    ):
        """Run optional context work with a hard latency budget."""
        budget = budget_seconds if budget_seconds is not None else CONTEXT_BUDGETS_SECONDS.get(label, 0.25)
        start = time.perf_counter()
        try:
            result = await asyncio.wait_for(awaitable, timeout=budget)
            logger.info(
                "Horus context task completed",
                extra={"context_task": label, "duration_ms": HorusService._timing_ms(start), "correlation_id": correlation_id},
            )
            return result
        except asyncio.TimeoutError:
            logger.info(
                "Horus context task skipped after budget",
                extra={"context_task": label, "budget_ms": int(budget * 1000), "correlation_id": correlation_id},
            )
            return default
        except Exception as err:
            logger.debug("Horus context task failed: %s: %s", label, err, extra={"correlation_id": correlation_id})
            return default

    @staticmethod
    def _default_user_identity(current_user: Any = None) -> Dict[str, str]:
        if isinstance(current_user, dict):
            name = current_user.get("name") or ""
            email = current_user.get("email") or ""
            role = current_user.get("role") or "USER"
        else:
            name = getattr(current_user, "name", "") if current_user is not None else ""
            email = getattr(current_user, "email", "") if current_user is not None else ""
            role = getattr(current_user, "role", "USER") if current_user is not None else "USER"
        display_name = (name or "").strip()
        if not display_name and email and "@" in email:
            local = email.split("@", 1)[0]
            alpha = "".join(c for c in local if c.isalpha())
            display_name = (alpha[:5].capitalize() if alpha else "") or "User"
        return {"name": display_name or "User", "email": email or "", "role": str(role or "USER"), "institution": ""}

    @staticmethod
    def _read_buffered_body(part: dict[str, Any]) -> bytes:
        body = part.get("body")
        if isinstance(body, bytes):
            return body
        temp_path = part.get("temp_path")
        if temp_path:
            with open(temp_path, "rb") as handle:
                return handle.read()
        return b""

    @staticmethod
    def _file_size(part: Any) -> int | None:
        if isinstance(part, dict):
            size = part.get("size")
            return int(size) if isinstance(size, int) or (isinstance(size, str) and size.isdigit()) else None
        return None

    @staticmethod
    def _file_storage(part: Any) -> str:
        if isinstance(part, dict):
            return str(part.get("storage") or ("memory" if part.get("body") is not None else "stream"))
        return "stream"

    @staticmethod
    def _part_content_type(part: Any) -> str:
        if isinstance(part, dict):
            return (part.get("content_type") or part.get("mime_type") or "").strip()
        return (getattr(part, "content_type", None) or "").strip()

    @staticmethod
    def _build_file_payload(part: dict[str, Any], *, include_base64: bool = False) -> Dict[str, Any]:
        content = HorusService._read_buffered_body(part)
        fname = part.get("filename") or "file"
        if fname.lower().endswith(".pdf"):
            ct = "application/pdf"
        else:
            ct = (part.get("content_type") or "").strip()
            if not ct or ct not in ALLOWED_FILE_TYPES:
                guessed, _ = mimetypes.guess_type(fname)
                if guessed:
                    ct = guessed.strip()
        payload: Dict[str, Any] = {
            "type": "image" if ct.startswith("image/") else "document" if ct == "application/pdf" else "text",
            "mime_type": ct or "application/octet-stream",
            "filename": fname,
            "evidenceId": None,
            "size": part.get("size") or len(content),
            "sha256": part.get("sha256"),
            "storage": part.get("storage") or ("memory" if part.get("body") is not None else "tempfile"),
        }
        if include_base64:
            payload["data"] = base64.b64encode(content).decode("utf-8")
        else:
            payload["body"] = content
        return payload

    @staticmethod
    def _should_use_rag(message: str | None) -> bool:
        return SmartRetrievalPlanner.plan(message).should_retrieve

    @staticmethod
    def _minimal_context(message: str | None, user_identity: Dict[str, str] | None = None, goal: str | None = None) -> str:
        lang = HorusService._detect_language(message)
        language_directive = (
            "The user is writing in Arabic. Respond in Arabic."
            if lang == "ar"
            else "Respond in English. If the user writes in Arabic, switch to Arabic."
        )
        user_line = ""
        if user_identity:
            user_line = f"The user is {user_identity.get('name') or 'User'} ({user_identity.get('role') or 'USER'})."
        goal_line = f"Active goal: {goal}." if goal else ""
        return (
            "You are Horus, the AI compliance advisor inside Ayn. "
            "Answer immediately, clearly, and concisely. "
            "Do not claim you saved or permanently stored uploaded files unless the user explicitly requested saving. "
            f"{language_directive} {user_line} {goal_line}"
        ).strip()

    @staticmethod
    def _build_attachment_metadata(files: List[Any] | None) -> List[Dict[str, str]]:
        if not files:
            return []
        attachments: List[Dict[str, str]] = []
        for item in files:
            if isinstance(item, dict):
                filename = item.get("filename") or "file"
                content_type = (item.get("content_type") or "").strip()
                size = item.get("size")
                storage = item.get("storage")
            else:
                filename = getattr(item, "filename", None) or "file"
                content_type = (getattr(item, "content_type", None) or "").strip()
                size = None
                storage = None
            attachment_type = "image" if content_type.startswith("image/") else "document"
            meta = {
                "name": filename,
                "type": attachment_type,
                "mime_type": content_type,
            }
            if size is not None:
                meta["size"] = size
            if storage:
                meta["storage"] = storage
            attachments.append(meta)
        return attachments

    @staticmethod
    def _message_metadata(message_obj: Any) -> Dict[str, Any]:
        metadata = getattr(message_obj, "metadata", None)
        return metadata if isinstance(metadata, dict) else {}

    @classmethod
    def _history_has_recent_attachment_context(cls, messages: List[Any] | None) -> bool:
        if not messages:
            return False
        recent_messages = messages[-6:]
        for msg in recent_messages:
            meta = cls._message_metadata(msg)
            if meta.get("attachments"):
                return True
        return False

    @staticmethod
    def _format_prior_messages_for_file_model(
        messages: List[Any] | None,
        *,
        current_user_message: Optional[str],
        max_messages: int = 14,
        max_chars_per_message: int = 12000,
    ) -> str:
        """
        Text-only transcript of prior turns for multimodal (file) requests.

        stream_chat_with_files sends only the current user turn + attachments to Gemini,
        so follow-ups (e.g. 'summarize again') must inject earlier USER/ASSISTANT text here.
        """
        if not messages:
            return ""
        msgs = list(messages)[-max_messages:]
        cur = (current_user_message or "").strip()
        if cur and msgs and (getattr(msgs[-1], "role", None) or "").strip().lower() == "user":
            last_content = (getattr(msgs[-1], "content", None) or "").strip()
            if last_content == cur:
                msgs = msgs[:-1]
        lines: list[str] = []
        for m in msgs:
            role = (getattr(m, "role", None) or "").strip().upper()
            if role not in ("USER", "ASSISTANT"):
                continue
            body = (getattr(m, "content", None) or "").strip()
            if not body:
                continue
            if len(body) > max_chars_per_message:
                body = body[:max_chars_per_message] + "\n[...truncated for length...]"
            lines.append(f"{role}: {body}")
        if not lines:
            return ""
        return (
            "[Prior conversation in this chat — use it for follow-up questions. "
            "The user's CURRENT request and any newly attached files are in the main prompt below. "
            "Answer the current request using this history; do not ignore prior assistant answers.]\n\n"
            + "\n\n".join(lines)
        )

    @staticmethod
    def _trim_history_to_budget(
        messages: List[Dict[str, Any]],
        max_tokens: int = 28_000,
        chars_per_token: int = 4,
    ) -> List[Dict[str, Any]]:
        """
        Keep the most recent messages that fit within `max_tokens`.
        Always keeps at least the last user message.
        Estimation: 1 token ≈ 4 chars (conservative for Arabic/English mix).
        """
        if not messages:
            return messages
        budget = max_tokens * chars_per_token
        selected: List[Dict[str, Any]] = []
        used = 0
        for msg in reversed(messages):
            length = len(msg.get("content") or "")
            if used + length > budget and selected:
                break
            selected.insert(0, msg)
            used += length
        # Always keep at least the last message
        if not selected:
            selected = [messages[-1]]
        return selected

    @staticmethod
    def _detect_language(
        message: str | None,
        history: List[Any] | None = None,
        history_dicts: List[Dict[str, Any]] | None = None,
    ) -> str:
        """Return 'ar' if the conversation is in Arabic, else 'en'.

        Priority:
          1. Current message — if it contains enough Arabic characters, return 'ar'.
          2. Recent history (model objects or dicts) — check last 6 turns.
          3. Default to 'en'.
        """
        import re as _re

        def _arabic_ratio(text: str) -> float:
            clean = text.replace(" ", "")
            if not clean:
                return 0.0
            arabic_chars = len(_re.findall(r'[\u0600-\u06FF]', clean))
            return arabic_chars / len(clean)

        # 1. Current message
        if message:
            ratio = _arabic_ratio(message)
            if ratio > 0.1:
                return "ar"
            # If the message is clearly Latin/English (and long enough to be confident), return 'en'
            if len(message.strip()) >= 8 and ratio == 0.0:
                return "en"

        # 2. History — model objects (have .role / .content attributes)
        if history:
            recent = list(history)[-6:]
            for msg in reversed(recent):
                role = (getattr(msg, "role", None) or "").lower()
                content = (getattr(msg, "content", None) or "").strip()
                if role == "user" and content:
                    r = _arabic_ratio(content)
                    if r > 0.1:
                        return "ar"
                    if r == 0.0 and len(content) >= 8:
                        return "en"

        # 2b. History — plain dicts ({"role": ..., "content": ...})
        if history_dicts:
            recent_d = list(history_dicts)[-6:]
            for msg in reversed(recent_d):
                if (msg.get("role") or "").lower() == "user":
                    content = (msg.get("content") or "").strip()
                    r = _arabic_ratio(content)
                    if r > 0.1:
                        return "ar"
                    if r == 0.0 and len(content) >= 8:
                        return "en"

        return "en"

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
    def _has_explicit_platform_action_intent(message: str | None) -> bool:
        if not message:
            return False
        action_keywords = [
            "run audit", "full audit", "gap analysis", "compliance gap", "remediation",
            "check compliance", "score this", "map to standard", "map against",
            "ncaaa", "iso 21001", "criteria", "criterion", "evidence vault",
            "platform data", "dashboard", "workflow", "institution data",
            "تشغيل تدقيق", "تدقيق كامل", "تحليل فجوات", "فجوات الامتثال", "خطة معالجة",
            "تحقق من الامتثال", "قيم الملف", "طابق مع معيار", "المعيار", "المعايير",
            "بيانات المنصة", "لوحة التحكم", "سير العمل", "بيانات المؤسسة",
        ]
        msg = message.lower()
        return any(keyword in msg for keyword in action_keywords)

    @classmethod
    def _should_route_files_to_agent(cls, message: str | None, request_mode: str | None) -> bool:
        if not message:
            return False
        if cls._has_explicit_platform_action_intent(message):
            return True
        # Agent mode alone is not enough when the request is really "analyze this attachment".
        # File-only requests should stay on the multimodal file-analysis path.
        if request_mode == "agent":
            return False
        return False

    @staticmethod
    def _is_visual_only(files: List[Any] | None) -> bool:
        if not files:
            return False
        for f in files:
            ct = HorusService._part_content_type(f)
            if not ct.startswith("image/"):
                return False
        return True

    @staticmethod
    def _buffered_part_filename(part: Any) -> str:
        if isinstance(part, dict):
            return part.get("filename") or "file"
        return getattr(part, "filename", None) or "file"

    @staticmethod
    def _infer_agent_goal(message: str | None, files: List[Any] | None = None) -> str:
        if message and message.strip():
            return message.strip()[:180]
        if files:
            filenames = [HorusService._buffered_part_filename(f) for f in files[:2]]
            joined = ", ".join(filenames)
            return f"Analyze attached file{'s' if len(files) > 1 else ''}: {joined}"
        return "Assist with the current request"

    @classmethod
    def _classify_agent_intent(
        cls,
        *,
        message: str | None,
        files: List[Any] | None,
        request_mode: str | None,
    ) -> Dict[str, Any]:
        msg = (message or "").strip().lower()
        has_files = bool(files)
        explicit_platform = cls._has_explicit_platform_action_intent(message)
        asks_multi_step = any(phrase in msg for phrase in [
            "full audit", "gap analysis", "remediation plan", "compare and summarize",
            "analyze and map", "audit and recommend", "تدقيق كامل", "تحليل فجوات", "خطة معالجة",
        ])
        asks_file_analysis = has_files and not explicit_platform

        if asks_file_analysis:
            return {
                "mode": request_mode or "agent",
                "intent": "file_analysis",
                "route": "file_analysis",
                "goal": cls._infer_agent_goal(message, files),
                "reason": "The request is centered on the attached file, so Horus should analyze the attachment directly before considering platform actions.",
            }
        if explicit_platform and asks_multi_step:
            return {
                "mode": request_mode or "agent",
                "intent": "multi_step_workflow",
                "route": "planner",
                "goal": cls._infer_agent_goal(message, files),
                "reason": "The request asks for a broader compliance workflow, so Horus should plan and execute multiple platform-aware steps.",
            }
        if explicit_platform:
            return {
                "mode": request_mode or "agent",
                "intent": "platform_action",
                "route": "planner",
                "goal": cls._infer_agent_goal(message, files),
                "reason": "The request explicitly references compliance or platform actions, so Horus should select the most useful tool path.",
            }
        return {
            "mode": request_mode or "agent",
            "intent": "agent_chat",
            "route": "chat",
            "goal": cls._infer_agent_goal(message, files),
            "reason": "No platform action is clearly required, so Horus should respond conversationally.",
        }
    
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
        # 1. Ensure Chat exists (strip __MODE__: prefix before using message as title)
        _, clean_message_for_title = self._extract_mode_token(message)
        if not chat_id:
            chat = await ChatService.create_chat(user_id, title=clean_message_for_title[:50] if clean_message_for_title else "New Conversation")
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
            # Disabled automatic evidence upload to vastly improve latency
            # the user can manually save files to evidence if needed
            store_as_evidence = False
            for file in files:
                if store_as_evidence:
                    content = self._read_buffered_body(file) if isinstance(file, dict) else await file.read()
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
                    if isinstance(file, dict):
                        file_references.append(self._build_file_payload(file))
                    else:
                        content = await file.read()
                        ct = file.content_type or ""
                        file_references.append({
                            "type": "image" if ct.startswith("image/") else "document" if ct == "application/pdf" else "text",
                            "mime_type": ct,
                            "body": content,
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
        cached = HorusContextCache.get(user_id)
        if cached:
            return cached
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
        resolved = {
            "name": display_name or "User",
            "email": email or "",
            "role": str(role or "USER"),
            "institution": institution_name or "",
        }
        HorusContextCache.set(user_id, resolved)
        return resolved

    async def _get_conversation_memory(self, user_id: str, exclude_chat_id: str | None = None) -> str:
        """Build a lightweight memory string from recent chat summaries. Cached for 90s."""
        cache_key = f"horus:memory:{user_id}"
        if redis_client.enabled:
            cached = redis_client.get(cache_key)
            if cached:
                return cached.decode("utf-8") if isinstance(cached, bytes) else str(cached)

        try:
            from app.core.db import db as prisma_client
            institution_id = None
            try:
                user_obj = await prisma_client.user.find_unique(where={"id": user_id})
                institution_id = getattr(user_obj, "institutionId", None) if user_obj else None
            except Exception:
                institution_id = None
            durable_memory = await HorusMemoryService.get_context(user_id, institution_id=institution_id)
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
                return durable_memory
            recent_memory = "Recent conversation memory (past sessions):\n" + "\n".join(memory_lines)
            full_memory = "\n\n".join(part for part in [durable_memory, recent_memory] if part)
            
            if redis_client.enabled:
                redis_client.set(cache_key, full_memory, ex=90)
            
            return full_memory
        except Exception as e:
            logger.error(f"Failed to build conversation memory: {e}")
            return ""

    async def _remember_exchange_async(
        self,
        *,
        user_id: str,
        chat_id: str | None,
        user_message: str | None,
        assistant_response: str | None,
    ) -> None:
        try:
            from app.core.db import db as prisma_client
            user_obj = await prisma_client.user.find_unique(where={"id": user_id})
            institution_id = getattr(user_obj, "institutionId", None) if user_obj else None
            await HorusMemoryService.remember_exchange(
                user_id=user_id,
                institution_id=institution_id,
                chat_id=chat_id,
                user_message=user_message,
                assistant_response=assistant_response,
            )
        except Exception as exc:
            logger.debug("Horus memory update skipped: %s", exc)

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
        request_started = time.perf_counter()
        logger.info("Horus stream_chat started", extra={"correlation_id": corr_id, "user_id": user_id, "chat_id": chat_id})

        async def _yield_text_chunks(text: str, chunk_size: int = 32):
            if not text:
                return
            for i in range(0, len(text), chunk_size):
                yield text[i:i + chunk_size]
                await asyncio.sleep(0)


        # 0. Read request multipart into memory BEFORE any response bytes are sent.
        # Vercel / some ASGI stacks finalize the request body once streaming starts;
        # a later UploadFile.read() then raises "I/O operation on closed file".
        if files:
            if all(isinstance(f, dict) and ("body" in f or "temp_path" in f) for f in files):
                buffered_parts = list(files)
                files = buffered_parts
            else:
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
        request_mode, message = self._extract_mode_token(message)
        if not chat_id:
            chat = await ChatService.create_chat(user_id, title=message[:50] if message else "New Conversation")
            chat_id = chat.id
            yield f"__CHAT_ID__:{chat_id}\n"
            await asyncio.sleep(0)
        user_metadata = {"responseMode": request_mode} if request_mode else {}
        attachment_metadata = self._build_attachment_metadata(files)
        if attachment_metadata:
            user_metadata["attachments"] = attachment_metadata
        if not user_metadata:
            user_metadata = None
        client = get_gemini_client()
        agent_intent = self._classify_agent_intent(
            message=message,
            files=files,
            request_mode=request_mode,
        ) if request_mode == "agent" else None
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
        
        # Disabled automatic evidence upload in chat flow to vastly improve latency
        store_as_evidence = False
        agent_intent = self._classify_agent_intent(message=message, files=files, request_mode=request_mode)

        if files:
            yield "__HORUS_UPLOAD_MODE__:ephemeral\n"
            for f in files:
                fn = self._buffered_part_filename(f)
                yield f"__FILE_STATUS__:{json.dumps({'filename': fn, 'status': 'received', 'storage': self._file_storage(f), 'size': self._file_size(f)})}\n"
            logger.info(
                "Horus ephemeral upload accepted",
                extra={
                    "correlation_id": corr_id,
                    "user_id": user_id,
                    "file_count": len(files),
                    "elapsed_ms": self._timing_ms(request_started),
                },
            )
            await asyncio.sleep(0)

        # ── TIER 1: FAST PATH (no platform context build) ────────────────────
        if fast_path:
            full_response = ""
            rag_sources: list[dict[str, Any]] = []
            try:
                if message:
                    if background_tasks:
                        background_tasks.add_task(ChatService.save_message, chat_id, user_id, "user", message, user_metadata)
                    else:
                        asyncio.create_task(ChatService.save_message(chat_id, user_id, "user", message, user_metadata))

                # Skip __THINKING__ for Ask fast path — frontend shows "Answering…" immediately; saves one round-trip

                fast_messages = [{"role": "user", "content": message or ""}]
                _fast_history_messages: List[Any] | None = None
                try:
                    history = await asyncio.wait_for(
                        ChatService.get_chat(chat_id, user_id, message_limit=6),
                        timeout=0.2,
                    )
                    if history and getattr(history, "messages", None):
                        _fast_history_messages = history.messages
                        raw = [{"role": m.role, "content": m.content} for m in history.messages[-12:]]
                        fast_messages = self._trim_history_to_budget(raw)
                        if message and not any(m["content"] == message for m in fast_messages):
                            fast_messages.append({"role": "user", "content": message})
                except Exception:
                    pass

                # Detect language from current message + history fallback
                _fast_lang = self._detect_language(message, history=_fast_history_messages)
                _fast_lang_directive = (
                    "IMPORTANT: The user is writing in Arabic. You MUST respond in Arabic throughout your entire reply. Do not switch to English."
                    if _fast_lang == "ar"
                    else "Respond in English. If the user writes in Arabic, switch to Arabic immediately."
                )

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

                local_fast_response = self._local_fast_response(message, user_name)
                if local_fast_response:
                    full_response = local_fast_response
                    async for piece in _yield_text_chunks(local_fast_response):
                        yield piece

                    assistant_meta = {"citations": rag_sources} if rag_sources else None
                    if full_response and background_tasks:
                        background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", full_response, assistant_meta)
                        background_tasks.add_task(self._remember_exchange_async, user_id=user_id, chat_id=chat_id, user_message=message, assistant_response=full_response)
                        if message:
                            background_tasks.add_task(self._generate_chat_title, message, full_response, None, chat_id)
                    elif full_response:
                        await ChatService.save_message(chat_id, user_id, "assistant", full_response, assistant_meta)
                        asyncio.create_task(self._remember_exchange_async(user_id=user_id, chat_id=chat_id, user_message=message, assistant_response=full_response))
                        if message:
                            asyncio.create_task(self._generate_chat_title(message, full_response, None, chat_id))
                    return

                # RAG in Fast Path: Smart planner avoids embedding calls for general chat.
                rag_fast = ""
                retrieval_plan = SmartRetrievalPlanner.plan(message)
                if retrieval_plan.should_retrieve:
                    try:
                        from app.core.db import db as _prisma
                        _u = await _prisma.user.find_unique(where={"id": user_id})
                        _inst = getattr(_u, "institutionId", None) if _u else None
                        rag = RagService()
                        rag_fast, rag_sources = await asyncio.wait_for(
                            rag.retrieve_context(
                                message,
                                limit=retrieval_plan.limit,
                                user_id=user_id,
                                institution_id=_inst,
                            ),
                            timeout=retrieval_plan.budget_seconds,
                        )
                        if rag_fast:
                            rag_fast = "\n" + rag_fast
                    except Exception as e:
                        logger.debug(f"Fast path RAG skipped: {e}")

                # Emit citations before streaming when RAG sources available
                if rag_sources:
                    yield f"__CITATION__:{json.dumps(rag_sources)}\n"
                    await asyncio.sleep(0)
                gen = client.stream_chat(
                    messages=fast_messages,
                    context=(
                        f"You are Horus, the AI compliance advisor built into the Ayn platform. "
                        f"{AYN_PLATFORM_DESCRIPTION} "
                        f"The user's name is {user_name} (email: {user_email}, role: {user_role}).{institution_line} "
                        f"Address them by name when appropriate. Never say 'Hello User' — use their actual name or a neutral 'Hello'/'Hi'. "
                        f"Answer conversational and general questions immediately and clearly. Stream your response token-by-token; do not buffer. "
                        f"Prefer the shortest complete useful answer. "
                        f"Do not claim you accessed platform state unless explicitly requested. "
                        f"{_fast_lang_directive}"
                        f"{memory_line}"
                        f"{rag_fast}"
                    ),
                )
                try:
                    first = await asyncio.wait_for(gen.__anext__(), timeout=8.0)
                except StopAsyncIteration:
                    first = ""
                except asyncio.TimeoutError:
                    first = None
                if first is None:
                    try:
                        fallback = await asyncio.wait_for(
                            client.chat(messages=fast_messages, context=(
                                f"You are Horus, the AI compliance advisor built into the Ayn platform. "
                                f"{AYN_PLATFORM_DESCRIPTION} "
                                f"The user's name is {user_name} (email: {user_email}, role: {user_role}).{institution_line} "
                                f"Address them by name when appropriate. Never say 'Hello User' — use their actual name or a neutral 'Hello'/'Hi'. "
                                f"Answer conversational and general questions immediately and clearly. "
                                f"Prefer the shortest complete useful answer. "
                                f"Do not claim you accessed platform state unless explicitly requested. "
                                f"{_fast_lang_directive}"
                                f"{memory_line}"
                                f"{rag_fast}"
                            )),
                            timeout=18.0,
                        )
                    except asyncio.TimeoutError:
                        fallback = "The AI service is taking longer than expected. Please try again in a moment."
                    if fallback:
                        full_response += fallback
                        async for piece in _yield_text_chunks(fallback):
                            yield piece
                else:
                    if first:
                        full_response += first
                        logger.info(
                            "Horus first fast-path token",
                            extra={"correlation_id": corr_id, "elapsed_ms": self._timing_ms(request_started)},
                        )
                        yield first
                    async for chunk in gen:
                        if chunk == CONTEXT_LIMIT_SENTINEL:
                            yield "\n__CONTEXT_LIMIT__:true\n"
                            await asyncio.sleep(0)
                            continue
                        if chunk:
                            full_response += chunk
                            yield chunk
                            await asyncio.sleep(0)

                # Some providers can terminate a stream immediately with no text.
                # In that case, fall back to a normal completion instead of returning silently.
                if not full_response.strip():
                    try:
                        fallback = await asyncio.wait_for(
                            client.chat(
                                messages=fast_messages,
                                context=(
                                    f"You are Horus, the AI compliance advisor built into the Ayn platform. "
                                    f"{AYN_PLATFORM_DESCRIPTION} "
                                    f"The user's name is {user_name} (email: {user_email}, role: {user_role}).{institution_line} "
                                    f"Address them by name when appropriate. Never say 'Hello User' — use their actual name or a neutral 'Hello'/'Hi'. "
                                    f"Answer conversational and general questions immediately and clearly. "
                                    f"Prefer the shortest complete useful answer. "
                                    f"Do not claim you accessed platform state unless explicitly requested."
                                    f"{memory_line}"
                                    f"{rag_fast}"
                                ),
                            ),
                            timeout=18.0,
                        )
                    except asyncio.TimeoutError:
                        fallback = "The AI service is taking longer than expected. Please try again in a moment."
                    if fallback and fallback.strip():
                        full_response = fallback.strip()
                        async for piece in _yield_text_chunks(full_response):
                            yield piece
            except Exception as fast_err:
                logger.error(f"Fast path failed, continuing with fallback error response: {fast_err}", exc_info=True)
                if not full_response:
                    if self._is_provider_unavailable_err(fast_err):
                        full_response = (
                            "My AI provider is temporarily unavailable right now. "
                            "I can still answer simple questions directly — for deeper analysis, "
                            "please try again in a few minutes once the provider is back."
                        )
                        yield full_response
                    else:
                        yield "__STREAM_ERROR__:Request failed. Please try again.\n"
                        full_response = "The request was interrupted. Please try sending your message again."
                        yield full_response

            if full_response and background_tasks:
                assistant_meta = {"citations": rag_sources} if rag_sources else None
                background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", full_response, assistant_meta)
                background_tasks.add_task(self._remember_exchange_async, user_id=user_id, chat_id=chat_id, user_message=message, assistant_response=full_response)
                if message:
                    background_tasks.add_task(self._generate_chat_title, message, full_response, None, chat_id)
            elif full_response:
                assistant_meta = {"citations": rag_sources} if rag_sources else None
                await ChatService.save_message(chat_id, user_id, "assistant", full_response, assistant_meta)
                asyncio.create_task(self._remember_exchange_async(user_id=user_id, chat_id=chat_id, user_message=message, assistant_response=full_response))
                if message:
                    asyncio.create_task(self._generate_chat_title(message, full_response, None, chat_id))
            return

        # First visible stream event for non-fast paths must not wait for DB/context work.
        if agent_intent:
            yield f"__AGENT_RUN__:{json.dumps(agent_intent)}\n"
            await asyncio.sleep(0)
        yield "__THINKING__:Preparing your request...\n"
        await asyncio.sleep(0)

        user_identity_task = asyncio.create_task(self._resolve_user_identity(user_id, current_user))
        active_goal_task = asyncio.create_task(self._get_active_goal(user_id, chat_id))
        user_identity = await self._with_budget(
            "identity",
            user_identity_task,
            default=self._default_user_identity(current_user),
            correlation_id=corr_id,
        )
        active_goal = await self._with_budget("goal", active_goal_task, default=None, correlation_id=corr_id)

        # ── AGENT PLANNER + TOOL EXECUTION ────────────────────────────────────
        # Allow agent with files when: Agent mode selected, or message has platform keywords (e.g. "حلل", "analyze", "gaps")
        allow_agent_with_files = agent_intent.get("intent") in {"platform_action", "multi_step_workflow"}
        is_confirmation_control = bool(
            message
            and (
                message.startswith("__CONFIRM_ACTION__:")
                or message.startswith("__CANCEL_ACTION__:")
            )
        )
        should_run_agent_planner = bool(
            message
            and request_mode == "agent"
            and request_mode != "think"
            and (not files or allow_agent_with_files)
        )
        if message and (is_confirmation_control or should_run_agent_planner):
            try:
                prisma_client = db
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
                            confirmed=True,
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
                            request_mode=request_mode,
                            confirmed=True,
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
                    agent_intent=agent_intent,
                )

                if plan and plan.get("mode") == "tool":
                    tool_name = plan.get("tool")
                    args = plan.get("arguments", {}) or {}
                    if tool_name in TOOL_REGISTRY:
                        yield f"__AGENT_RUN__:{json.dumps({'mode': request_mode or 'agent', 'intent': agent_intent['intent'] if agent_intent else 'platform_action', 'route': 'tool', 'goal': (agent_intent or {}).get('goal') or self._infer_agent_goal(message, files), 'reason': plan.get('reason') or 'A single tool can answer this request most directly.', 'tool': tool_name, 'step_count': 1})}\n"
                        if background_tasks:
                            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "user", message, user_metadata)
                        else:
                            await ChatService.save_message(chat_id, user_id, "user", message, user_metadata)

                        tool_meta = get_tool_ui_meta(tool_name)
                        yield "__THINKING__:Fetching platform data...\n"
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

                        yield f"__TOOL_STEP__:{json.dumps({'step': 1, 'total': 1, 'tool': tool_name, 'title': tool_meta['title'], 'status': 'running', 'estimated_duration_ms': tool_meta.get('estimated_duration_ms', 3000)})}\n"
                        tool_result = await execute_tool(
                            tool_name=tool_name,
                            args=args,
                            db=prisma_client,
                            user_id=user_id,
                            institution_id=institution_id,
                            current_user=current_user_dict,
                            request_mode=request_mode,
                            confirmed=False,
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
                        yield f"__AGENT_RUN__:{json.dumps({'mode': request_mode or 'agent', 'intent': agent_intent['intent'] if agent_intent else 'multi_step_workflow', 'route': 'plan', 'goal': (agent_intent or {}).get('goal') or self._infer_agent_goal(message, files), 'reason': plan.get('reason') or 'This request is best handled as a short multi-step workflow.', 'step_count': len(plan_steps), 'tools': [step['tool'] for step in plan_steps]})}\n"
                        if background_tasks:
                            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "user", message, user_metadata)
                        else:
                            await ChatService.save_message(chat_id, user_id, "user", message, user_metadata)

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
                                confirmed=False,
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
            content = self._read_buffered_body(part)
            file_payload = self._build_file_payload(part)
            extraction = extract_text_cached(
                content=content,
                filename=file_payload["filename"],
                mime_type=file_payload["mime_type"],
                sha256=file_payload.get("sha256"),
            )
            if extraction.get("text"):
                file_payload["extracted_text"] = extraction["text"]
                file_payload["extraction_cache_hit"] = extraction.get("cache_hit", False)
            mime_for_upload = file_payload["mime_type"] if file_payload["mime_type"] in ALLOWED_FILE_TYPES else "application/octet-stream"
            if store_as_evidence and content:
                meta = SimpleNamespace(filename=file_payload["filename"], content_type=mime_for_upload)
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

        tasks = []
        if not files:
            tasks.extend([
                self._with_budget("state_summary", self.state_manager.get_state_summary(user_id), default=None, correlation_id=corr_id),
                self._with_budget("recent_activities", ActivityService.get_recent_activities(user_id, limit=5), default=[], correlation_id=corr_id),
                self._with_budget("mappings", fetch_mappings_context(user_id), default="", correlation_id=corr_id),
            ])
        
        # Add file processing tasks if any
        if files:
            tasks.extend([process_file(f) for f in files])
        
        # Save user message in background to avoid blocking
        if message:
            if background_tasks:
                background_tasks.add_task(ChatService.save_message, chat_id, user_id, "user", message, user_metadata)
            else:
                asyncio.create_task(ChatService.save_message(chat_id, user_id, "user", message, user_metadata))

        # Yield immediately so user sees feedback before any await (avoids 2–5s silence)
        if files:
            yield "__THINKING__:Got it, analyzing your file...\n"
            for f in files:
                fn = self._buffered_part_filename(f)
                yield f"__FILE_STATUS__:{json.dumps({'filename': fn, 'status': 'routing', 'storage': self._file_storage(f), 'size': self._file_size(f)})}\n"
            await asyncio.sleep(0)
        else:
            yield "__THINKING__:Checking your platform context...\n"
            await asyncio.sleep(0)

        results = await asyncio.gather(*tasks) if tasks else []

        if files:
            yield "__THINKING__:Processing attached files...\n"
            await asyncio.sleep(0)

        summary = None if files else results[0]
        recent_activities = [] if files else results[1]
        mapping_context = "" if files else results[2]
        
        # Handle dynamic results (files)
        offset = 0 if files else 3
        file_results = []
        if files:
            file_results = [r for r in results[offset:offset+len(files)] if r is not None]
            for res in file_results:
                fn = res.get("filename") or "file"
                yield f"__FILE_STATUS__:{json.dumps({'filename': fn, 'status': 'done'})}\n"
                yield f"__FILE__:{fn}\n"
                await asyncio.sleep(0)
                if res.get("temp_attachment_id"):
                    try:
                        if background_tasks:
                            background_tasks.add_task(
                                ProgressiveFileAnalysis.enqueue,
                                user_id=user_id,
                                attachment=res,
                                message=message,
                            )
                        else:
                            asyncio.create_task(
                                ProgressiveFileAnalysis.enqueue(
                                    user_id=user_id,
                                    attachment=res,
                                    message=message,
                                )
                            )
                        yield f"__FILE_STATUS__:{json.dumps({'filename': fn, 'status': 'background_queued'})}\n"
                    except Exception as progressive_err:
                        logger.debug("Progressive file analysis enqueue skipped: %s", progressive_err)

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
        # File requests use a minimal context so the model call is not blocked by
        # platform state, RAG, or memory lookups. Text requests still get bounded
        # context enrichment.
        if files:
            context = self._minimal_context(message, user_identity=user_identity, goal=active_goal)
            memory = ""
        else:
            memory_task = asyncio.create_task(self._get_conversation_memory(user_id, exclude_chat_id=chat_id))
            context_task = asyncio.create_task(self._prepare_context_sync(
                summary,
                recent_activities,
                message=message,
                mapping_context=mapping_context,
                user_identity=user_identity,
                goal=active_goal,
                user_id=user_id,
                allow_rag=self._should_use_rag(message),
                correlation_id=corr_id,
            ))
            memory, context = await asyncio.gather(
                self._with_budget("memory", memory_task, default="", correlation_id=corr_id),
                context_task,
            )
            if memory:
                context = memory + "\n\n" + context
        
        full_response = ""
        
        # Lazily fetch history without blocking initial file processing or state fetching
        history_task = asyncio.create_task(ChatService.get_chat(chat_id, user_id, message_limit=10))

        if file_results:
            # Multimodal path only sends the current turn + files to Gemini — inject prior
            # chat text so follow-ups (e.g. summarize) still see the last assistant answer.
            history_for_files = await self._with_budget(
                "history",
                history_task,
                default=None,
                correlation_id=corr_id,
            )
            prior_transcript = self._format_prior_messages_for_file_model(
                getattr(history_for_files, "messages", None) if history_for_files else None,
                current_user_message=message,
            )
            if prior_transcript:
                context = prior_transcript + "\n\n---\n" + context

            if request_mode == "agent":
                yield f"__AGENT_RUN__:{json.dumps({'mode': 'agent', 'intent': (agent_intent or {}).get('intent', 'file_analysis'), 'route': 'file_analysis', 'goal': (agent_intent or {}).get('goal') or self._infer_agent_goal(message, files), 'reason': 'Agent mode stayed on direct file analysis because the attached document is the main source of truth.', 'step_count': 1})}\n"
                await asyncio.sleep(0)
            visual_only = all((f.get("type") == "image") for f in file_results)
            _file_lang = self._detect_language(
                message,
                history=getattr(history_for_files, "messages", None) if history_for_files else None,
            )
            language_hint = (
                "IMPORTANT: The user is writing in Arabic. You MUST respond in Arabic throughout your entire reply. Do not switch to English."
                if _file_lang == "ar"
                else "Respond in English. If the user writes in Arabic, switch to Arabic immediately."
            )

            domain_hint = (
                f"You are Horus, the AI compliance advisor built into the Ayn platform. "
                f"{AYN_PLATFORM_DESCRIPTION} "
                "Always analyze the attached file(s) and answer in a normal chat style."
            )
            if not needs_analysis:
                domain_hint += " Do not return JSON unless the user explicitly asked for JSON."
            domain_hint += (
                " If the content relates to education quality, accreditation, or academic standards, map key points to common frameworks "
                "such as NAQAAE, ISO 21001, AACSB, ABET, or other clearly indicated frameworks, and highlight compliance gaps or missing evidence. "
                "Do not assume a Saudi context or mention NCAAA unless the user or the document explicitly points to it. "
                "If the user asks about Ayn itself without country context, treat Ayn as Egypt-first. "
                "Be explicit when a mapping is uncertain."
            )
            if language_hint:
                domain_hint += f" {language_hint}"
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
                    ai_message += (
                        "\n\nRespond for an end user in plain language, not as raw JSON. "
                        "Use short readable sections when helpful. Include: "
                        "1) a concise summary, "
                        "2) an overall score from 0-100, "
                        "3) key findings as bullet points, and "
                        "4) improvement suggestions as actionable bullet points. "
                        "Do not say 'JSON-formatted analysis'. Do not return code blocks unless the user explicitly asked for them."
                    )
                else:
                    ai_message = user_line or "Please look at the attached file(s)."
                    ai_message += (
                        "\n\nYou have direct access to the attached file(s) as vision/document input. "
                        "Use their real content. Answer in the same language as the user (e.g. Arabic if they wrote in Arabic). "
                        "Explain clearly what the document is, what it contains, and anything useful you notice. "
                        "Do NOT say you cannot see or access the attachment. "
                        "Do NOT reply with only JSON unless the user explicitly asked for JSON."
                    )
            ai_message = f"{ai_message}\n\n{domain_hint}"

            try:
                gen = client.stream_chat_with_files(
                    message=ai_message,
                    files=file_results,
                    context=context # Pass the enriched brain context
                )
                try:
                    first = await asyncio.wait_for(gen.__anext__(), timeout=10.0)
                except StopAsyncIteration:
                    first = ""
                except asyncio.TimeoutError:
                    first = None
                if first is None:
                    try:
                        fallback_response = await asyncio.wait_for(
                            client.chat_with_files(
                                message=ai_message,
                                files=file_results,
                                context=context,
                            ),
                            timeout=30.0,
                        )
                    except asyncio.TimeoutError:
                        fallback_response = "The AI analysis service is taking longer than expected. Your file was received — please try again or select an action below."
                    if fallback_response:
                        full_response = (fallback_response or "").strip()
                        async for piece in _yield_text_chunks(full_response):
                            yield piece
                else:
                    if first:
                        full_response += first
                        logger.info(
                            "Horus first file token",
                            extra={"correlation_id": corr_id, "elapsed_ms": self._timing_ms(request_started)},
                        )
                        yield first
                    async for chunk in gen:
                        if chunk == CONTEXT_LIMIT_SENTINEL:
                            yield "\n__CONTEXT_LIMIT__:true\n"
                            await asyncio.sleep(0)
                            continue
                        if chunk:
                            full_response += chunk
                            yield chunk
                            await asyncio.sleep(0)  # Yield control so chunk is sent immediately
            except Exception as file_stream_err:
                logger.error(f"File analysis stream failed: {file_stream_err}", exc_info=True)
                if not full_response.strip():
                    # Streaming sometimes fails even when a normal multimodal completion still works.
                    # Try one final non-streaming pass before returning a generic fallback.
                    try:
                        fallback_response = await asyncio.wait_for(
                            client.chat_with_files(
                                message=ai_message,
                                files=file_results,
                                context=context,
                            ),
                            timeout=30.0,
                        )
                    except Exception as fallback_err:
                        logger.error(
                            "File analysis fallback failed after stream error: %s",
                            fallback_err,
                            exc_info=True,
                        )
                        fallback_response = ""

                    if fallback_response and fallback_response.strip():
                        full_response = fallback_response.strip()
                        async for piece in _yield_text_chunks(full_response):
                            yield piece
                    else:
                        is_arabic = self._detect_language(message) == "ar"
                        if self._is_provider_unavailable_err(file_stream_err):
                            # Provider unavailable — give intentional message; suggestions will still fire
                            full_response = (
                                "تعذّر تحليل الملف الآن بسبب عدم توفر خدمة الذكاء الاصطناعي مؤقتًا. يمكنك اختيار إجراء من الخيارات أدناه."
                                if is_arabic
                                else "The AI analysis service is temporarily unavailable. Your file was received — select an action below to continue."
                            )
                        else:
                            attachment_label = "الصورة المرفقة" if visual_only else "الملف المرفق"
                            attachment_hint = "صورة أوضح" if visual_only else "ملفًا أوضح أو صيغة مختلفة"
                            full_response = (
                                f"حصل خطأ أثناء تحليل {attachment_label}. جرّب إرسال {attachment_hint} أو اكتب لي بالتحديد ماذا تريد أن أستخرج منه."
                                if is_arabic
                                else (
                                    "I hit an error while analyzing the attached image. Try sending a clearer image or tell me exactly what you want extracted."
                                    if visual_only
                                    else "I hit an error while analyzing the attached file. Try re-uploading the file or tell me exactly what you want extracted."
                                )
                            )
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
                    full_response = (
                        "I received your image, but I couldn't extract a clear answer from it. Try sending a clearer image or add more context."
                        if visual_only
                        else "I received your file, but I couldn't extract a clear answer from it. Try re-uploading the file or add more context."
                    )
                    yield full_response
        else:
            if request_mode == "agent":
                yield f"__AGENT_RUN__:{json.dumps({'mode': 'agent', 'intent': (agent_intent or {}).get('intent', 'agent_chat'), 'route': 'chat', 'goal': (agent_intent or {}).get('goal') or self._infer_agent_goal(message, files), 'reason': 'No tool or file workflow was necessary, so Horus is answering directly in Agent mode.'})}\n"
                await asyncio.sleep(0)
            history = await self._with_budget("history", history_task, default=None, correlation_id=corr_id)
            yield "__THINKING__:Reviewing conversation history...\n"
            await asyncio.sleep(0)
            raw_messages = [{"role": m.role, "content": m.content} for m in (history.messages if history else [])]
            messages = self._trim_history_to_budget(raw_messages)
            if message and not any(m["content"] == message for m in messages):
                messages.append({"role": "user", "content": message})

            # Re-check language with history in case the current message was ambiguous
            _hist_lang = self._detect_language(message, history=getattr(history, "messages", None))
            _hist_lang_override = (
                "\n[LANGUAGE OVERRIDE] The user is communicating in Arabic. You MUST respond in Arabic throughout. Do not switch to English."
                if _hist_lang == "ar"
                else "\n[LANGUAGE OVERRIDE] The user is communicating in English. Respond in English."
            )
            context += _hist_lang_override
            # When user refers to a file they sent earlier but no file in this request:
            # we don't have file content in history — add context so AI explains they must re-attach
            file_ref_keywords = ["بعته", "ارسلت", "اللي فوق", "السابق", "الملف", "الفايل", "file", "sent", "attached", "uploaded", "حلل", "analyze"]
            msg_lower = (message or "").lower()
            if any(kw in msg_lower for kw in file_ref_keywords):
                has_recent_attachment_context = self._history_has_recent_attachment_context(history.messages if history else [])
                if has_recent_attachment_context:
                    context += (
                        "\n\n[IMPORTANT] The user is likely referring to an attachment shared earlier in this same chat. "
                        "Use the recent conversation context about that attachment to answer the follow-up naturally. "
                        "Do NOT say you cannot access past files unless the answer truly requires raw file content that is not available from the conversation context."
                    )
                else:
                    context += (
                        "\n\n[IMPORTANT] The user may be referring to a file that is not attached in this request. "
                        "Use the recent conversation context if it is enough to answer. "
                        "Only ask them to re-attach the file if the needed document details are genuinely unavailable in this chat."
                    )
            yield "__THINKING__:Preparing response...\n"
            await asyncio.sleep(0)
            
            try:
                gen = client.stream_chat(messages=messages, context=context)
                try:
                    first = await asyncio.wait_for(gen.__anext__(), timeout=8.0)
                except StopAsyncIteration:
                    first = ""
                except asyncio.TimeoutError:
                    first = None
                if first is None:
                    try:
                        fallback_response = await asyncio.wait_for(
                            client.chat(messages=messages, context=context),
                            timeout=18.0,
                        )
                    except asyncio.TimeoutError:
                        fallback_response = "The AI service is taking longer than expected. Please try again in a moment."
                    if fallback_response and fallback_response.strip():
                        full_response = fallback_response.strip()
                        async for piece in _yield_text_chunks(full_response):
                            yield piece
                else:
                    if first:
                        full_response += first
                        logger.info(
                            "Horus first text token",
                            extra={"correlation_id": corr_id, "elapsed_ms": self._timing_ms(request_started)},
                        )
                        yield first
                    async for chunk in gen:
                        if chunk == CONTEXT_LIMIT_SENTINEL:
                            yield "\n__CONTEXT_LIMIT__:true\n"
                            await asyncio.sleep(0)
                            continue
                        if chunk:
                            full_response += chunk
                            yield chunk
                            await asyncio.sleep(0)  # Yield control so chunk is sent immediately
                if not full_response.strip():
                    fallback_response = await client.chat(messages=messages, context=context)
                    if fallback_response and fallback_response.strip():
                        full_response = fallback_response.strip()
                        async for piece in _yield_text_chunks(full_response):
                            yield piece
            except Exception as stream_err:
                logger.error(f"Stream chat failed mid-response: {stream_err}", exc_info=True)
                if not full_response.strip():
                    if self._is_provider_unavailable_err(stream_err):
                        full_response = (
                            "My AI provider is temporarily unavailable right now. "
                            "Please try again in a few minutes, or ask a simpler question and I’ll do my best."
                        )
                        yield full_response
                    else:
                        yield "__STREAM_ERROR__:Request failed. Please try again.\n"
                        full_response = "The connection was interrupted. Please try sending your message again."
                        yield full_response

        # 4. Emit contextual next-step suggestions
        # File analysis: always suggest (suggestions are generated locally; provider not needed).
        # Text chat: only suggest when the response is substantive and compliance-related.
        try:
            if file_results:
                primary = file_results[0] if file_results else {}
                sug = self._get_file_suggestions(
                    filename=primary.get("filename", "file"),
                    message=message,
                    file_type=primary.get("mime_type", ""),
                )
            elif (
                self._is_substantive_response(full_response)
                and (self._needs_compliance_analysis(message) or self._has_explicit_platform_action_intent(message))
            ):
                sug = self._get_chat_suggestions(message, full_response)
            else:
                sug = []
            if sug:
                # Leading \n guarantees clean line separation even when the previous
                # content chunk was coalesced with this yield by the ASGI transport.
                yield f"\n__AGENT_SUGGESTIONS__:{json.dumps(sug)}\n"
        except Exception as _sug_err:
            logger.debug(f"Suggestion generation skipped: {_sug_err}")

        # 5. Save Assistant Response in Background to release the generator faster
        if full_response and background_tasks:
            background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", full_response)
            background_tasks.add_task(self._remember_exchange_async, user_id=user_id, chat_id=chat_id, user_message=message, assistant_response=full_response)
            if message:
                background_tasks.add_task(self._generate_chat_title, message, full_response, None, chat_id)
        elif full_response:
            await ChatService.save_message(chat_id, user_id, "assistant", full_response)
            asyncio.create_task(self._remember_exchange_async(user_id=user_id, chat_id=chat_id, user_message=message, assistant_response=full_response))
            if message:
                asyncio.create_task(self._generate_chat_title(message, full_response, None, chat_id))

    async def _execute_brain_pipeline(self, user_id, current_user, file_results, db, needs_analysis: bool = False):
        """Legacy hook: Horus no longer runs evidence writes or gap jobs from chat (read-only assistant)."""
        logger.info(
            "Horus brain pipeline skipped (read-only mode)",
            extra={"user_id": user_id, "files": len(file_results or [])},
        )
        return {
            "files_analyzed": len(file_results or []),
            "gap_reports": [],
            "dashboard_updated": False,
        }

    async def _prepare_context_sync(
        self,
        summary,
        recent_activities,
        brain_results=None,
        message: str = "",
        mapping_context: str = "",
        user_identity: Dict[str, str] | None = None,
        goal: str | None = None,
        user_id: str | None = None,
        allow_rag: bool = True,
        correlation_id: str | None = None,
    ) -> str:
        """Build a clean, deliberate system prompt for Horus. Instructions come first so the
        model always knows who it is before reading any data."""

        # ── Language detection (message + history fallback) ──────────────────────
        _lang = self._detect_language(message)
        language_directive = (
            "IMPORTANT: The user is writing in Arabic. You MUST respond in Arabic throughout your entire reply. Do not switch to English."
            if _lang == "ar"
            else "Respond in English. If the user writes in Arabic, switch to Arabic immediately."
        )

        # ── Identity + behavioral instructions ──────────────────────────────────
        user_line = ""
        if user_identity:
            name = user_identity.get("name") or ""
            email = user_identity.get("email") or ""
            role = user_identity.get("role") or ""
            inst = user_identity.get("institution") or ""
            inst_part = f" at {inst}" if inst else ""
            user_line = (
                f"You are speaking with {name} ({email}, {role}{inst_part}). "
                f"Address them by name. Never say \'Hello User\'."
            )

        goal_line = f"Active session goal: {goal}" if goal else ""

        instructions = f"""You are Horus (حورس), the read-only AI compliance advisor built into the Ayn platform.
{AYN_PLATFORM_DESCRIPTION}
Your role: answer questions, analyze attachments for explanation only, and interpret existing platform data.

Hard limits:
- You do not run new gap analysis, create reports, link evidence to criteria, or change any database state.
- Direct users to the appropriate Ayn screens when they need to perform write operations.

{user_line}
{goal_line}

Behavioral rules:
- {language_directive}
- Be specific and data-driven; avoid vague reassurances.
- When you have platform data (scores, gaps, evidence counts), cite it directly.
- When you do not have relevant data, say so honestly rather than inventing details.
- Keep responses focused; avoid repeating the same point in different words.
- Use plain prose for conversational answers; use short bullet lists only when listing distinct items.
- Do not return JSON unless the user explicitly asks for it.
- If the user asks about uploading, evidence, or standards, reference the relevant platform section.
"""

        parts = [instructions.strip()]

        # ── Platform state (only when compliance-relevant) ────────────────────
        compliance_keywords = [
            "gap", "compliance", "standard", "criteria", "criterion", "ncaaa", "iso",
            "accreditation", "analysis", "audit", "score", "evaluate", "evidence",
            "فجوة", "امتثال", "معيار", "معايير", "تقييم", "تدقيق", "اعتماد", "تحليل", "درجة",
        ]
        needs_platform_state = any(kw in (message or "").lower() for kw in compliance_keywords)

        if needs_platform_state and summary:
            score_str = f"{summary.total_score}%" if hasattr(summary, "total_score") else "—"
            files_str = str(getattr(summary, "total_files", "—"))
            analyzed_str = str(getattr(summary, "analyzed_files", "—"))
            evidence_str = str(getattr(summary, "total_evidence", "—"))
            linked_str = str(getattr(summary, "linked_evidence", "—"))
            gaps_str = str(getattr(summary, "total_gaps", "—"))
            closed_str = str(getattr(summary, "closed_gaps", "—"))
            parts.append(
                f"Platform state:\n"
                f"  Compliance score: {score_str}\n"
                f"  Files: {files_str} total, {analyzed_str} analyzed\n"
                f"  Evidence vault: {evidence_str} items, {linked_str} mapped to criteria\n"
                f"  Open gaps: {gaps_str} detected, {closed_str} resolved"
            )

        # ── Criteria mapping context ──────────────────────────────────────────
        if mapping_context and mapping_context.strip():
            parts.append(mapping_context.strip())

        # ── RAG: retrieve relevant document excerpts ──────────────────────────
        retrieval_plan = SmartRetrievalPlanner.plan(message)
        if allow_rag and message and user_id and retrieval_plan.should_retrieve:
            try:
                async def retrieve_rag_with_scope():
                    from app.core.db import db as _prisma
                    _user = await _prisma.user.find_unique(where={"id": user_id})
                    _inst_id = getattr(_user, "institutionId", None) if _user else None
                    rag = RagService()
                    return await rag.retrieve_context(
                        message,
                        limit=retrieval_plan.limit,
                        user_id=user_id,
                        institution_id=_inst_id,
                    )

                rag_context, _ = await self._with_budget(
                    "rag",
                    retrieve_rag_with_scope(),
                    default=("", []),
                    budget_seconds=retrieval_plan.budget_seconds,
                    correlation_id=correlation_id,
                )
                if rag_context and rag_context.strip():
                    parts.append(f"Relevant document excerpts:\n{rag_context.strip()}")
            except Exception as _rag_err:
                logger.debug(f"RAG retrieval skipped: {_rag_err}")

        # ── Brain pipeline results (file uploads) ────────────────────────────
        if brain_results and brain_results.get("gap_reports"):
            reports = brain_results["gap_reports"]
            report_lines = []
            for r in reports:
                gaps = ", ".join(r.get("gaps", [])) or "none identified yet"
                report_lines.append(
                    f"  - {r['title']}: score {r.get('score', '—')}% | gaps: {gaps} | report ID: {r['id']}"
                )
            parts.append(
                f"Files analyzed this session: {brain_results['files_analyzed']}\n"
                f"Gap reports generated:\n" + "\n".join(report_lines)
            )

        # ── Recent activity context ────────────────────────────────────────────
        activity_str = self._format_activities(recent_activities)
        if activity_str and activity_str.strip():
            parts.append(f"Recent platform activity:\n{activity_str.strip()}")

        return "\n\n".join(p for p in parts if p and p.strip())


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
        
        _lang2 = self._detect_language(message)
        language_instruction = (
            "- ALWAYS respond in Arabic because the user wrote in Arabic. Do not switch to English."
            if _lang2 == "ar"
            else "- ALWAYS respond in English. If the user writes in Arabic, switch to Arabic immediately."
        )

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

    @staticmethod
    def _is_provider_unavailable_err(err: Exception) -> bool:
        msg = str(err).lower()
        return (
            "402" in msg
            or "payment required" in msg
            or "429" in msg
            or "resource_exhausted" in msg
            or "all ai providers failed" in msg
            or "no streaming ai provider available" in msg
            or "quota" in msg
        )

    @staticmethod
    def _local_fast_response(message: str | None, user_name: str | None = None) -> str | None:
        if not message:
            return None

        msg = message.strip()
        lowered = msg.lower()
        safe_name = (user_name or "").strip()
        first_name = safe_name.split()[0] if safe_name else ""
        is_arabic = any(ch in msg for ch in "ابتثجحخدذرزسشصضطظعغفقكلمنهوي")

        greetings = {"hi", "hello", "hey", "مرحبا", "اهلا", "أهلا", "صباح الخير", "مساء الخير"}
        thanks = {"thanks", "thank you", "شكرا", "شكرًا"}

        if lowered in greetings or any(lowered.startswith(f"{token} ") for token in greetings):
            if is_arabic:
                name_part = f" يا {first_name}" if first_name else ""
                return (
                    f"أهلًا{name_part}. أنا Horus، مساعدك داخل Ayn. "
                    "أقدر أساعدك في مراجعة الأدلة، تشغيل Gap Analysis، تلخيص الملفات، أو شرح وضع الامتثال عندك."
                )
            name_part = f", {first_name}" if first_name else ""
            return (
                f"Hi{name_part}. I’m Horus, your Ayn assistant. "
                "I can help review evidence, run gap analysis, summarize files, and explain your compliance status."
            )

        if lowered in thanks or any(lowered.startswith(f"{token} ") for token in thanks):
            return (
                "على الرحب والسعة. ابعت لي سؤالك أو الملف الذي تريد مراجعته."
                if is_arabic
                else "You’re welcome. Send me your question or a file and I’ll help."
            )

        if lowered.startswith("who are you") or lowered == "what can you do":
            return (
                "I’m Horus, the Ayn platform assistant. I can answer questions, summarize uploaded files, "
                "help with standards and evidence, and guide you through gap analysis."
            )

        if (
            msg.startswith("من انت") or msg.startswith("من أنت")
            or "ماذا تستطيع" in msg
            or "تقدر تعمل" in msg
            or "تعمل ايه" in msg
            or "تعملي ايه" in msg
            or "what can you do" in lowered
            or "what do you do" in lowered
            or "ايه اللي تقدر" in msg
        ):
            return (
                "أنا Horus، مساعد منصة Ayn. أقدر ألخص الملفات، أراجع الأدلة، أساعدك في المعايير، "
                "وأوجّهك في Gap Analysis وخطوات الامتثال."
            )

        if lowered.startswith("how are you"):
            return "I’m ready to help. Ask me anything about your documents, standards, or compliance work."

        if msg.startswith("كيف حالك"):
            return "جاهز أساعدك. اسألني عن الملفات أو المعايير أو أي خطوة تخص الامتثال."

        return None



    @staticmethod
    def _is_substantive_response(text: str) -> bool:
        """Return True when the response looks like a real answer rather than an error or
        fallback string that was produced when a provider was unavailable."""
        t = text.strip().lower()
        if len(t) < 80:
            return False
        _ERROR_PHRASES = (
            "i'm having trouble",
            "i'm taking too long",
            "my ai provider",
            "hit an error while analyzing",
            "the connection was interrupted",
            "provider is temporarily unavailable",
            "request was interrupted",
            "حصل خطأ",       # Arabic: "an error occurred"
            "جرّب إرسال",    # Arabic: "try sending"
        )
        if any(phrase in t for phrase in _ERROR_PHRASES):
            return False
        return True

    @staticmethod
    def _get_file_suggestions(filename: str, message: str | None, file_type: str) -> list[dict]:
        """Return contextual next-step action suggestions after file analysis.
        Suggestions are classified by file characteristics and message intent."""
        fname = filename.lower()
        msg = (message or "").lower()

        is_image = file_type.startswith("image/")

        is_policy = any(kw in fname or kw in msg for kw in [
            "policy", "accreditation", "ncaaa", "iso", "standard", "procedure", "manual",
            "quality", "governance", "framework", "regulation", "compliance", "charter",
            "سياسة", "معيار", "امتثال", "جودة", "اعتماد",
        ])
        is_evidence = any(kw in fname or kw in msg for kw in [
            "evidence", "survey", "data", "results", "performance", "outcome",
            "student", "faculty", "enrollment", "أدلة", "بيانات", "نتائج",
        ])
        is_report = any(kw in fname or kw in msg for kw in [
            "report", "audit", "review", "assessment", "evaluation",
            "تقرير", "تدقيق", "مراجعة", "تقييم",
        ])
        already_summarizing = any(kw in msg for kw in [
            "summarize", "summary", "ملخص", "لخص",
        ])

        suggestions: list[dict] = []

        if is_image:
            suggestions.append({
                "id": "extract_text",
                "label": "Extract visible text",
                "prompt": "Extract and organize all visible text from this image",
                "icon": "type",
            })
            suggestions.append({
                "id": "identify_issues",
                "label": "Identify issues",
                "prompt": "Identify any compliance-relevant issues or concerns visible in this image",
                "icon": "alert-triangle",
            })
            return suggestions[:4]

        if not already_summarizing:
            suggestions.append({
                "id": "summarize",
                "label": "Summarize key points",
                "prompt": "Summarize the key points of this document clearly and concisely",
                "icon": "file-text",
            })

        if is_policy or fname.endswith(".pdf"):
            suggestions.append({
                "id": "extract_risks",
                "label": "Extract compliance risks",
                "prompt": "Identify and list any compliance risks or gaps in this document, prioritized by severity",
                "icon": "alert-triangle",
            })
            suggestions.append({
                "id": "map_standards",
                "label": "Map to standards",
                "prompt": "Map the content of this document to relevant accreditation criteria (NCAAA, ISO 21001, or the applicable framework)",
                "icon": "git-merge",
            })

        if is_evidence:
            suggestions.append({
                "id": "link_criteria",
                "label": "Link to criteria",
                "prompt": "Which accreditation criteria does this evidence best support? List the most relevant ones.",
                "icon": "link",
            })
            suggestions.append({
                "id": "assess_completeness",
                "label": "Assess evidence quality",
                "prompt": "Is this evidence sufficient to demonstrate compliance? What is still missing?",
                "icon": "shield-check",
            })

        if is_report or is_policy:
            suggestions.append({
                "id": "remediation",
                "label": "Build remediation checklist",
                "prompt": "Create a prioritized remediation checklist for the gaps and issues in this document",
                "icon": "list-checks",
            })

        suggestions.append({
            "id": "gap_snapshot",
            "label": "Compare to current gaps",
            "prompt": "Using my institution's existing criteria mappings and latest reports in Ayn, what in this document relates to open vs covered criteria?",
            "icon": "bar-chart-2",
        })

        return suggestions[:4]

    @staticmethod
    def _get_chat_suggestions(message: str | None, response: str | None) -> list[dict]:
        """Return follow-up suggestions after a compliance discussion in text mode."""
        resp = (response or "").lower()
        suggestions: list[dict] = []

        if any(kw in resp for kw in ["gap", "missing", "not covered", "no evidence", "criterion"]):
            suggestions.append({
                "id": "remediation",
                "label": "Create remediation plan",
                "prompt": "Create a detailed remediation plan with specific steps and priorities based on these gaps",
                "icon": "list-checks",
            })

        if any(kw in resp for kw in ["score", "compliance", "percentage", "aligned", "readiness"]):
            suggestions.append({
                "id": "gap_snapshot",
                "label": "Summarize latest gap findings",
                "prompt": "Summarize my latest gap analysis reports and criteria mappings — which areas are weakest and why?",
                "icon": "bar-chart-2",
            })

        if any(kw in resp for kw in ["evidence", "document", "criteria", "standard", "upload"]):
            suggestions.append({
                "id": "review_evidence",
                "label": "Review evidence coverage",
                "prompt": "Show me which criteria have evidence mapped and which ones still need documentation",
                "icon": "shield-check",
            })

        suggestions.append({
            "id": "next_steps",
            "label": "What should I prioritize?",
            "prompt": "Based on our current compliance situation, what should I focus on first?",
            "icon": "arrow-right",
        })

        return suggestions[:3]

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
        agent_intent: Dict[str, Any] | None = None,
    ) -> Dict[str, Any] | None:
        tool_manifest = build_tool_manifest()

        goal_block = f"\nActive session goal:\n{goal}\n" if goal else ""
        mode_block = ""
        if mode == "agent":
            mode_block = '\nMode bias:\n- The user explicitly selected AGENT mode.\n- Prefer mode "tool" or "plan" whenever a platform action can help.\n- Use mode "chat" only when no tool meaningfully helps.\n'
        intent_block = ""
        if agent_intent:
            intent_block = (
                "\nAgent intent classification:\n"
                f"- intent: {agent_intent.get('intent')}\n"
                f"- suggested_route: {agent_intent.get('route')}\n"
                f"- goal: {agent_intent.get('goal')}\n"
                f"- rationale: {agent_intent.get('reason')}\n"
            )
        planner_prompt = f"""
You are the Horus agent planner. Your job is to decide the best next action for the user's request.

User message:
{message}
{goal_block}
{mode_block}
{intent_block}

Platform snapshot:
{json.dumps(platform_snapshot)[:4000]}

Available tools:
{json.dumps(tool_manifest)}

Decision rules:
1. Choose mode "tool" when a single tool gives a materially better answer than a text reply.
   - Prefer "tool" when the user asks for summaries of existing reports/mappings, gap explanations, remediation suggestions, or an export link for a report they already have.
   - All tools are read-only; none create or update platform records.
   - Do NOT choose a tool when the user is asking a general question that does not require platform data.
2. Choose mode "plan" only when the user explicitly asks for two or more distinct outcomes in one request.
   - A plan can have at most 3 steps.
   - Do not create a plan for a request a single tool already covers.
3. Choose mode "chat" when no tool adds value — conversational questions, explanations, general compliance advice.
4. When the classified intent is "file_analysis" or "agent_chat", prefer mode "chat" unless the user has clearly asked for a platform action.

Return ONLY valid JSON in this exact format (no markdown, no commentary):
{{
  "mode": "tool",
  "tool": "tool_name",
  "arguments": {{}},
  "steps": [],
  "reason": "one concise sentence"
}}
or
{{
  "mode": "plan",
  "tool": null,
  "arguments": {{}},
  "steps": [{{"tool":"tool_name","arguments":{{}},"reason":"short"}}],
  "reason": "one concise sentence"
}}
or
{{
  "mode": "chat",
  "tool": null,
  "arguments": {{}},
  "steps": [],
  "reason": "one concise sentence"
}}
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
- Plan can contain up to 3 steps. All tools are read-only.
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
        """Return a short, natural, user-facing sentence after a tool runs."""
        result_type = result.get("type", "unknown")
        payload = result.get("payload") or {}

        if result_type == "action_error":
            detail = (
                result.get("message")
                or result.get("error")
                or payload.get("message")
                or "The action did not complete successfully."
            )
            return str(detail).strip()

        if result_type == "job_started":
            job_id = result.get("jobId") or result.get("job_id") or payload.get("jobId")
            if job_id:
                return f"A background job id `{job_id}` appeared in an older message; new analyses must be started from Gap Analysis in the app."
            return "Background jobs are started from the main Gap Analysis workflow, not from Horus."

        if result_type == "audit_report":
            score = payload.get("score") or payload.get("overallScore")
            score_str = f" — overall score: **{round(score)}%**" if score is not None else ""
            return f"Your audit report is ready{score_str}. Review the findings above to see which criteria need attention."

        if result_type == "gap_table":
            rows = payload.get("rows") or []
            gap_count = sum(1 for r in rows if (r.get("status") or "").lower() != "met")
            return f"Here are **{len(rows)}** mapping rows ({gap_count} non-met). See the table above for details."

        if result_type == "remediation_plan":
            rows = payload.get("rows") or []
            steps_str = f" with {len(rows)} suggested actions" if rows else ""
            return f"Remediation suggestions ready{steps_str}. Each row is advisory only — confirm changes in the main app."

        if result_type == "analytics_report":
            return "Legacy analytics card — use Gap Analysis / Reports in the app for authoritative data."

        # Fallback: use any message the tool returned
        msg = result.get("message") or payload.get("message") or ""
        if msg and str(msg).strip():
            return str(msg).strip()

        return "Done."

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
        confirmed: bool = False,
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

            _emit(f"__TOOL_STEP__:{json.dumps({'step': step_idx, 'total': total, 'tool': tool_name, 'title': tool_meta['title'], 'status': 'running', 'estimated_duration_ms': tool_meta.get('estimated_duration_ms', 3000)})}\n")

            result = await execute_tool(
                tool_name=tool_name,
                args=args,
                db=db,
                user_id=user_id,
                institution_id=institution_id,
                current_user=current_user,
                request_mode="agent",
                confirmed=confirmed,
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
        failed = len(executed) - success
        if success == len(executed):
            summary_text = f"All {len(executed)} step{'s' if len(executed) > 1 else ''} completed successfully."
        elif failed == len(executed):
            summary_text = f"None of the {len(executed)} planned steps completed. Please check the details above."
        else:
            summary_text = f"Completed {success} of {len(executed)} steps. {failed} step{'s' if failed > 1 else ''} did not complete — see the details above."

        return {
            "last_structured": last_structured,
            "summary_text": summary_text,
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
        result_type = result.get("type", "unknown")
        is_error = result_type == "action_error"
        meta = result.get("_meta", {})
        elapsed_ms = meta.get("elapsed_ms", 0)

        title = f"Horus {'failed' if is_error else 'executed'} {tool_name}"
        description = f"Phase={phase}, result={result_type}"
        if elapsed_ms:
            description += f", took {elapsed_ms}ms"

        metadata: Dict[str, Any] = {
            "tool": tool_name,
            "args": args,
            "result_type": result_type,
            "phase": phase,
            "success": not is_error,
            "elapsed_ms": elapsed_ms,
        }
        if is_error:
            payload = result.get("payload", {})
            metadata["error_message"] = payload.get("message", "")
            metadata["suggested_fix"] = payload.get("suggested_fix", "")
        if meta.get("undoable"):
            metadata["undoable"] = True
            metadata["undo_tool"] = meta.get("undo_tool", "")
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

    async def get_analytics_insights(self, user_id: str, db: Prisma):
        """
        Generate strategic Horus insights for the analytics dashboard using actual data.
        """
        try:
            from app.analytics.service import AnalyticsService
            user = await db.user.find_unique(where={"id": user_id})
            if not user:
                raise Exception("User not found")
                
            current_user_dict = {"id": user_id, "institutionId": user.institutionId}
            analytics = await AnalyticsService.get_analytics(current_user_dict, period_days=30)
            
            prompt = f"""
            You are Horus, the AI auditor for the Ayn platform. 
            Analyze this compliance data and provide strategic, actionable insights.
            
            KPIs:
            - Avg Score: {analytics.avgScore}%
            - Alignment: {analytics.alignmentPercentage}%
            - Growth: {analytics.growth.growthPercent}%
            - Total Reports: {analytics.totalReports}
            - Total Evidence: {analytics.totalEvidence}
            
            DETAILED DATA:
            {json.dumps(analytics.dict(), default=str)}
            
            Return ONLY a JSON object with this exact structure:
            {{
              "directAnswer": "concise 2-sentence executive summary",
              "topRisks": [
                {{
                  "id": "unique-id",
                  "severity": "critical" | "warning" | "positive",
                  "title": "Clear Title",
                  "description": "Short explanation",
                  "metric": "e.g. 12% drop",
                  "actions": [{{ "label": "Fix Now", "href": "/platform/gap-analysis" }}]
                }}
              ],
              "nextActions": ["step 1", "step 2", "step 3"],
              "cardInsights": {{ "avg-score": "insight", "growth": "insight", ... }},
              "confidence": "High",
              "counts": {{ "reports": {analytics.totalReports}, "evidence": {analytics.totalEvidence} }},
              "analysis": "Internal logic summary",
              "timestamp": {time.time()}
            }}
            """
            
            client = get_gemini_client()
            response = await client.generate_content(prompt)
            text = response.text.strip()
            
            # Clean up potential markdown formatting
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            
            return json.loads(text)
        except Exception as e:
            logger.error(f"Error generating Horus insights: {e}")
            return {
                "directAnswer": "Compliance data indicates stable posture. Continue monitoring gaps.",
                "topRisks": [],
                "nextActions": ["Review latest reports", "Update evidence vault"],
                "cardInsights": {},
                "confidence": "Medium",
                "counts": {},
                "analysis": str(e),
                "timestamp": time.time()
            }

    async def explain_analytics_page(self, user_id: str, analytics_data: dict, horus_data: Optional[dict] = None):
        """
        Generate a deep explanation for the current analytics page state.
        """
        try:
            prompt = f"""
            You are Horus, the AI auditor. Explain the current analytics state for the user.
            
            ANALYTICS STATE:
            {json.dumps(analytics_data, default=str)}
            
            PREVIOUS INSIGHTS:
            {json.dumps(horus_data, default=str) if horus_data else "None"}
            
            Return ONLY a JSON object with:
            {{
              "summary": ["Point 1", "Point 2", "Point 3"],
              "topProblems": ["Problem 1", "Problem 2", "Problem 3"],
              "impact": "Description of business impact",
              "recommendedPlan": ["Action 1", "Action 2", "Action 3"],
              "links": [{{ "label": "Go to Gaps", "href": "/platform/gap-analysis" }}],
              "confidence": "High"
            }}
            """
            
            client = get_gemini_client()
            response = await client.generate_content(prompt)
            text = response.text.strip()
            
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                    
            return json.loads(text)
        except Exception as e:
            logger.error(f"Error explaining analytics page: {e}")
            return {
                "summary": ["Failed to generate deep explanation."],
                "topProblems": [str(e)],
                "impact": "Analysis unavailable.",
                "recommendedPlan": ["Retry in a few moments"],
                "links": [],
                "confidence": "Low"
            }


