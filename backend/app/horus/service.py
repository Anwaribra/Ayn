"""
Horus AI Service

Conversational intelligence with full platform awareness.
Like ChatGPT, but can see and control the entire Ayn platform.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import base64
import json
import logging
import asyncio
from app.ai.service import get_gemini_client
from app.evidence.service import EvidenceService
from app.notifications.service import NotificationService
from app.notifications.models import NotificationCreateRequest

logger = logging.getLogger(__name__)


class Observation(BaseModel):
    """A response from Horus."""
    content: str
    timestamp: datetime
    state_hash: str
    structured: Optional[Dict[str, Any]] = None
    suggested_actions: List[Dict[str, Any]] = []  # Only populated if user asks for help


class HorusService:
    """
    Horus AI - Conversational platform intelligence.
    
    Behavior:
    - Talks naturally like ChatGPT
    - Always aware of platform state
    - Only suggests/triggers when explicitly asked
    - Cross-module understanding
    """
    
    def __init__(self, state_manager):
        self.state_manager = state_manager
    
    async def chat(
        self, 
        user_id: str, 
        message: Optional[str] = None, 
        files: List[Any] = None,
        background_tasks: Any = None,
        db: Any = None,
        current_user: Any = None
    ) -> Observation:
        """
        Main chat interface. Natural conversation with platform awareness.
        Handles text and file attachments.
        """
        summary = await self.state_manager.get_state_summary(user_id)
        state_hash = self._hash_state(summary)
        
        # ─── File Handling ──────────────────────────────────────────────────
        file_references = []
        uploaded_evidence_ids = []
        
        if files and len(files) > 0:
            for file in files:
                try:
                    # 1. Upload to Evidence System
                    upload_result = await EvidenceService.upload_evidence(
                        file=file,
                        current_user=current_user,
                        background_tasks=background_tasks
                    )
                    
                    if upload_result.success:
                        uploaded_evidence_ids.append(upload_result.evidenceId)
                        
                        # 2. Prepare for AI context
                        content = await file.read()
                        await file.seek(0) # Reset for any other potential reads
                        
                        if file.content_type.startswith("image/"):
                            file_references.append({
                                "type": "image",
                                "mime_type": file.content_type,
                                "data": base64.b64encode(content).decode("utf-8"),
                                "filename": file.filename
                            })
                        elif file.content_type == "application/pdf":
                            file_references.append({
                                "type": "document",
                                "mime_type": "application/pdf",
                                "data": base64.b64encode(content).decode("utf-8"),
                                "filename": file.filename
                            })
                        else:
                            try:
                                file_references.append({
                                    "type": "text",
                                    "data": content.decode("utf-8"),
                                    "filename": file.filename
                                })
                            except:
                                pass
                except Exception as e:
                    logger.error(f"Failed to process file {file.filename} in Horus: {e}")

        # ─── AI Interaction ─────────────────────────────────────────────────
        client = get_gemini_client()
        
        # If files provided, use multimodal chat
        if file_references:
            # Instruction for structured output if analysis is implied
            system_instruction = """
            Return a natural chat response. 
            If you are analyzing files, provide a clear summary and evaluation.
            Always maintain your Horus persona.
            """
            
            # Using shared prompt logic
            ai_response = await asyncio.to_thread(
                client.chat_with_files,
                message=f"{message}\n\n[Context: User uploaded {len(file_references)} files to the platform]",
                files=file_references
            )
            
            # Notify about successful processing
            await NotificationService.create_notification(NotificationCreateRequest(
                userId=user_id,
                type="success",
                title="Horus Analysis Ready",
                message=f"I've processed {len(file_references)} file(s). You can find them in your Evidence Library.",
                relatedEntityId=uploaded_evidence_ids[0] if uploaded_evidence_ids else None,
                relatedEntityType="evidence"
            ))
            
            return Observation(
                content=ai_response,
                timestamp=datetime.utcnow(),
                state_hash=state_hash
            )

        # ─── Casual Conversational Logic ────────────────────────────────────
        message_lower = (message or "").lower()
        
        # Check if user is asking for help/action
        is_asking_for_help = any(word in message_lower for word in [
            "help", "suggest", "what should", "what do", "how to", "guide", 
            "assist", "recommend", "advice", "tip", "idea", "next step"
        ])
        
        # Check if user wants to trigger an action
        is_triggering_action = any(phrase in message_lower for phrase in [
            "create", "make", "add", "save", "link", "update", "delete", 
            "remove", "analyze", "process", "generate"
        ])
        
        # Casual greetings
        if any(word in message_lower for word in ["hello", "hi", "hey", "مرحب", "أهلا", "سلام"]):
            return self._generate_awareness_greeting(summary, state_hash, conversational=True)
        
        # Status/state questions
        if any(word in message_lower for word in ["status", "state", "what do you see", "what's happening", "update"]):
            return self._generate_state_report(summary, state_hash)
        
        # User is asking for help/suggestions
        if is_asking_for_help:
            return self._generate_help_response(summary, state_hash, message)
        
        # User wants to trigger an action
        if is_triggering_action:
            return self._handle_action_request(summary, state_hash, message)
        
        # Default: conversational response with implicit awareness
        return await self._generate_conversational_response(summary, state_hash, message)
    
    def _generate_awareness_greeting(self, summary, state_hash, conversational=False) -> Observation:
        """Generate a greeting that shows platform awareness."""
        parts = []
        
        # Natural greeting
        if conversational:
            greetings = ["Hey there!", "Hello!", "Hi!", "أهلاً!", "مرحباً!"]
            import random
            parts.append(random.choice(greetings))
        else:
            parts.append("Horus is online.")
        
        # Platform awareness - what's happening
        awareness = []
        
        if summary.total_files == 0:
            awareness.append("I see no files uploaded yet.")
        else:
            file_status = f"{summary.total_files} file{'s' if summary.total_files > 1 else ''} uploaded"
            if summary.unlinked_files > 0:
                file_status += f" ({summary.unlinked_files} not linked to evidence)"
            awareness.append(f"I can see {file_status}.")
        
        if summary.total_evidence > 0:
            awareness.append(f"{summary.total_evidence} evidence scope{'s' if summary.total_evidence > 1 else ''} defined.")
        
        if summary.total_gaps > 0:
            open_gaps = summary.total_gaps - summary.closed_gaps
            if open_gaps > 0:
                awareness.append(f"{open_gaps} gap{'s' if open_gaps > 1 else ''} open.")
        
        if awareness:
            parts.append(" " + " ".join(awareness))
        
        # Natural closing
        if conversational:
            parts.append(" What would you like to do?")
        else:
            parts.append("\n\nAsk me anything about your compliance project.")
        
        return Observation(
            content="".join(parts),
            timestamp=datetime.utcnow(),
            state_hash=state_hash
        )
    
    def _generate_state_report(self, summary, state_hash) -> Observation:
        """Generate a structured state report when explicitly asked."""
        lines = ["Here's what I see in your platform:", ""]
        
        # Files
        if summary.total_files == 0:
            lines.append("📁 Files: None uploaded yet")
        else:
            lines.append(f"📁 Files: {summary.total_files} total")
            lines.append(f"   ✓ {summary.analyzed_files} analyzed")
            lines.append(f"   ⚠ {summary.unlinked_files} not linked to evidence")
        
        lines.append("")
        
        # Evidence
        if summary.total_evidence == 0:
            lines.append("📋 Evidence: No scopes defined yet")
        else:
            lines.append(f"📋 Evidence: {summary.total_evidence} scope{'s' if summary.total_evidence > 1 else ''}")
            orphan = summary.total_evidence - summary.linked_evidence
            if orphan > 0:
                lines.append(f"   ⚠ {orphan} without source files")
        
        lines.append("")
        
        # Gaps
        if summary.total_gaps == 0:
            lines.append("🔍 Gaps: None identified yet")
        else:
            open_gaps = summary.total_gaps - summary.closed_gaps
            lines.append(f"🔍 Gaps: {summary.total_gaps} total")
            lines.append(f"   ✓ {summary.closed_gaps} closed")
            lines.append(f"   🔄 {summary.addressed_gaps} addressed")
            lines.append(f"   ⚠ {open_gaps} open")
        
        lines.append("")
        lines.append("Want me to suggest next steps?")
        
        return Observation(
            content="\n".join(lines),
            timestamp=datetime.utcnow(),
            state_hash=state_hash
        )
    
    def _generate_help_response(self, summary, state_hash, message) -> Observation:
        """Generate helpful suggestions when user asks for help."""
        suggestions = []
        
        # Analyze current state and suggest
        if summary.total_files == 0:
            suggestions.append("1. Upload compliance documents (quality manual, procedures, etc.)")
        elif summary.unlinked_files > 0:
            suggestions.append(f"1. Link your {summary.unlinked_files} unlinked file(s) to evidence scopes")
            suggestions.append("   - Go to Evidence module and create scopes for each standard")
            suggestions.append("   - Or ask me to 'analyze files' to auto-detect standards")
        
        if summary.total_evidence == 0 and summary.total_files > 0:
            suggestions.append(f"{len(suggestions)+1}. Create evidence scopes for your standards")
        elif summary.total_evidence > 0 and summary.linked_evidence < summary.total_evidence:
            orphan = summary.total_evidence - summary.linked_evidence
            suggestions.append(f"{len(suggestions)+1}. Link {orphan} evidence scope(s) to source files")
        
        if summary.total_gaps == 0 and summary.total_evidence > 0:
            suggestions.append(f"{len(suggestions)+1}. Run gap analysis on your standards")
        elif summary.total_gaps > 0:
            open_gaps = summary.total_gaps - summary.closed_gaps
            if open_gaps > 0:
                suggestions.append(f"{len(suggestions)+1}. Address {open_gaps} open gap(s) with evidence")
        
        content = "Based on your current state, here's what I'd suggest:\n\n"
        content += "\n".join(suggestions) if suggestions else "Your platform looks complete! 🎉"
        content += "\n\nWant me to help with any of these? Just say the word."
        
        return Observation(
            content=content,
            timestamp=datetime.utcnow(),
            state_hash=state_hash,
            suggested_actions=self._generate_action_suggestions(summary)
        )
    
    async def _generate_conversational_response(self, summary, state_hash, message) -> Observation:
        """Generate a natural conversational response using AI."""
        client = get_gemini_client()
        
        # Prepare context about current platform state
        context = f"""
        Current Platform State:
        - Files: {summary.total_files} total ({summary.analyzed_files} analyzed, {summary.unlinked_files} unlinked)
        - Evidence: {summary.total_evidence} scopes ({summary.linked_evidence} linked)
        - Gaps: {summary.total_gaps} total ({summary.closed_gaps} closed, {summary.addressed_gaps} addressed)
        """
        
        try:
            # Call AI for a natural response
            ai_response = await asyncio.to_thread(
                client.chat,
                messages=[{"role": "user", "content": message}],
                context=context
            )
            
            return Observation(
                content=ai_response,
                timestamp=datetime.utcnow(),
                state_hash=state_hash
            )
        except Exception as e:
            logger.error(f"AI Chat failed: {e}")
            return Observation(
                content=f"I understand you're asking about '{message}'. I can see you have {summary.total_files} files and {summary.total_gaps} gaps in the system.",
                timestamp=datetime.utcnow(),
                state_hash=state_hash
            )
    
    def _handle_action_request(self, summary, state_hash, message) -> Observation:
        """Handle requests to trigger actions."""
        lower_msg = message.lower()
        
        # File analysis request
        if "analyze" in lower_msg and ("file" in lower_msg or "document" in lower_msg):
            if summary.total_files == 0:
                return Observation(
                    content="I'd love to analyze files, but there are none uploaded yet. Please upload some documents first!",
                    timestamp=datetime.utcnow(),
                    state_hash=state_hash
                )
            return Observation(
                content=f"I'll analyze your {summary.total_files} file(s) to detect standards and clauses. This may take a moment...",
                timestamp=datetime.utcnow(),
                state_hash=state_hash,
                suggested_actions=[{"type": "analyze_files", "params": {}}]
            )
        
        # Create evidence
        if "create" in lower_msg and "evidence" in lower_msg:
            return Observation(
                content="I can help create evidence scopes. What standard/criteria do you want to create evidence for?",
                timestamp=datetime.utcnow(),
                state_hash=state_hash,
                suggested_actions=[{"type": "create_evidence", "params": {}}]
            )
        
        # Run gap analysis
        if ("gap" in lower_msg and ("analyze" in lower_msg or "analysis" in lower_msg)) or "run gap" in lower_msg:
            return Observation(
                content="I'll run a gap analysis on your standards. This will compare your evidence against criteria requirements...",
                timestamp=datetime.utcnow(),
                state_hash=state_hash,
                suggested_actions=[{"type": "run_gap_analysis", "params": {}}]
            )
        
        # Generic action acknowledgment
        return Observation(
            content="I understand you want to take action. Let me know specifically what you'd like to create, update, or analyze.",
            timestamp=datetime.utcnow(),
            state_hash=state_hash
        )
    
    def _generate_action_suggestions(self, summary) -> List[Dict[str, Any]]:
        """Generate suggested actions based on state."""
        actions = []
        
        if summary.total_files == 0:
            actions.append({"type": "upload_files", "label": "Upload Documents", "priority": "high"})
        elif summary.unlinked_files > 0:
            actions.append({"type": "link_files", "label": f"Link {summary.unlinked_files} Files", "priority": "high"})
        
        if summary.total_evidence == 0:
            actions.append({"type": "create_evidence", "label": "Create Evidence Scopes", "priority": "high"})
        
        if summary.total_gaps == 0 and summary.total_evidence > 0:
            actions.append({"type": "run_gap_analysis", "label": "Run Gap Analysis", "priority": "medium"})
        elif summary.total_gaps > 0 and (summary.total_gaps - summary.closed_gaps) > 0:
            actions.append({"type": "address_gaps", "label": "Address Open Gaps", "priority": "medium"})
        
        return actions
    
    def _hash_state(self, summary) -> str:
        """Generate a hash of current state for caching."""
        return f"{summary.total_files}:{summary.total_evidence}:{summary.total_gaps}:{datetime.utcnow().strftime('%Y%m%d%H')}"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LEGACY STATE METHODS (for direct state queries)
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def get_files_state(self, user_id: str) -> Dict[str, Any]:
        """Get detailed files state."""
        files = await self.state_manager.get_files_by_user(user_id)
        return {
            "total": len(files),
            "by_status": {
                "uploaded": len([f for f in files if f.status == "uploaded"]),
                "analyzed": len([f for f in files if f.status == "analyzed"]),
                "linked": len([f for f in files if f.status == "linked"]),
            },
            "unlinked": [
                {"id": f.id, "name": f.name, "standards": f.detected_standards}
                for f in files if not f.linked_evidence_ids
            ]
        }
    
    async def get_gaps_state(self, user_id: str) -> Dict[str, Any]:
        """Get detailed gaps state."""
        gaps = await self.state_manager.get_gaps_by_user(user_id)
        return {
            "total": len(gaps),
            "by_status": {
                "defined": len([g for g in gaps if g.status == "defined"]),
                "addressed": len([g for g in gaps if g.status == "addressed"]),
                "closed": len([g for g in gaps if g.status == "closed"]),
            },
            "by_standard": {}
        }
    
    async def get_evidence_state(self, user_id: str) -> Dict[str, Any]:
        """Get detailed evidence state."""
        evidence = await self.state_manager.get_evidence_by_user(user_id)
        return {
            "total": len(evidence),
            "linked": len([e for e in evidence if e.source_file_ids]),
            "unlinked": len([e for e in evidence if not e.source_file_ids]),
        }
