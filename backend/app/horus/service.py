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
from app.gap_analysis.models import GapAnalysisRequest, UserDTO
from app.rag.service import RagService
from app.horus.intent_router import detect_intent
from app.horus.agent_actions import ACTION_REGISTRY

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

        # ── AGENT INTENT DISPATCH ─────────────────────────────────────────────
        # Only run intent detection when there are no files attached (file uploads
        # always go through the full AI pipeline for multi-modal analysis).
        if message and not files:
            intent = detect_intent(message)
            if intent and intent in ACTION_REGISTRY:
                logger.info(f"Horus agent intent detected: '{intent}' for user {user_id}")

                # Save user message to history
                if background_tasks:
                    background_tasks.add_task(ChatService.save_message, chat_id, user_id, "user", message)
                else:
                    asyncio.create_task(ChatService.save_message(chat_id, user_id, "user", message))

                try:
                    # Resolve institution_id from the user record
                    from app.core.db import db as prisma_client
                    user_obj = await prisma_client.user.find_unique(where={"id": user_id})
                    institution_id = getattr(user_obj, "institutionId", None) if user_obj else None

                    # Execute the agent action
                    action_fn = ACTION_REGISTRY[intent]
                    result = await action_fn(
                        user_id=user_id,
                        institution_id=institution_id,
                        db=prisma_client,
                    )

                    # Emit the structured result as a special prefix
                    yield f"__ACTION_RESULT__:{json.dumps(result)}\n"

                    # Also emit a short human-readable summary so the chat
                    # history contains something meaningful (not just the JSON blob)
                    intent_labels = {
                        "run_full_audit": "Full compliance audit report generated.",
                        "check_compliance_gaps": "Compliance gap analysis retrieved.",
                        "generate_remediation_report": "Remediation action plan generated.",
                    }
                    summary_text = intent_labels.get(intent, "Agent action completed.")
                    yield summary_text

                    # Save the summary (not the raw JSON) to chat history
                    if background_tasks:
                        background_tasks.add_task(ChatService.save_message, chat_id, user_id, "assistant", summary_text)
                    else:
                        await ChatService.save_message(chat_id, user_id, "assistant", summary_text)

                    return  # ← Exit before the AI streaming pipeline

                except Exception as agent_err:
                    logger.error(f"Agent action '{intent}' failed: {agent_err}", exc_info=True)
                    # Fall through to the normal AI pipeline on failure
                    yield "I encountered an issue running that action. Let me help you with a standard response instead.\n\n"
        
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
            yield "_[Status: Processing attached files...]_\n\n"
        
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
        context = await self._prepare_context_sync(summary, recent_activities, message=message, mapping_context=mapping_context)
        
        full_response = ""
        
        # Lazily fetch history without blocking initial file processing or state fetching
        history_task = asyncio.create_task(ChatService.get_chat(chat_id, user_id, message_limit=5))

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
            
            yield "_[Status: 📄 Document received. Analyzing and indexing vector embeddings...]_\n\n"
            
            context = await self._prepare_context_sync(summary, recent_activities, None, message=message, mapping_context=mapping_context)
            
            async for chunk in client.stream_chat_with_files(
                message=message or "Analyze these files.",
                files=file_results,
                context=context # Pass the enriched brain context
            ):
                if chunk:
                    full_response += chunk
                    yield chunk
        else:
            history = await history_task
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
                                            "institutionId": institution_id
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
                        report = await gap_service.generate_report(GapAnalysisRequest(standardId=standard.id), user_dto)
                        results["gap_reports"].append({
                            "id": report.id,
                            "title": standard.title,
                            "score": report.overallScore,
                            "gaps": [g.criterionTitle for g in report.gaps[:3]] # Just top 3 gaps for context
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
                    user_dto = UserDTO(
                        id=user_id,
                        institutionId=institution_id,
                        role=getattr(user, "role", "USER"),
                        email=getattr(user, "email", "unknown")
                    )
                    report = await gap_service.generate_report(request, user_dto)
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
