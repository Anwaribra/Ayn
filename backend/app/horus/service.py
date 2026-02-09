"""
Horus Service

Read-only platform intelligence.
Queries state and produces observations.
Does NOT write state.
Does NOT trigger actions.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class Observation(BaseModel):
    """A state observation from Horus."""
    content: str
    timestamp: datetime
    state_hash: str  # For caching/invalidation


class HorusService:
    """
    Horus AI - Read-only platform intelligence.
    
    This service:
    - Reads from platform state
    - Produces observations about current state
    - Never writes or modifies state
    - Never triggers actions
    - Never makes recommendations
    """
    
    def __init__(self, state_manager):
        self.state_manager = state_manager
    
    async def observe(self, user_id: str, query: Optional[str] = None) -> Observation:
        """
        Produce a state observation.
        
        Args:
            user_id: The user whose state to observe
            query: Optional specific query (does not change observation format)
        
        Returns:
            Observation containing state description
        """
        summary = await self.state_manager.get_state_summary(user_id)
        
        # Build observation content
        lines = []
        
        # Header
        lines.append("Platform state:")
        
        # File state
        lines.append(f"- Files: {summary.total_files} ({summary.analyzed_files} analyzed, {summary.unlinked_files} unlinked)")
        
        # Evidence state
        lines.append(f"- Evidence scopes: {summary.total_evidence} ({summary.linked_evidence} linked)")
        
        # Gap state
        lines.append(f"- Gaps: {summary.total_gaps} ({summary.addressed_gaps} addressed, {summary.closed_gaps} closed)")
        
        # Metrics
        lines.append(f"- Metrics: {summary.total_metrics}")
        
        # Cross-module observations
        if summary.orphan_files:
            lines.append("")
            lines.append(f"Unlinked files ({len(summary.orphan_files)}):")
            for f in summary.orphan_files[:3]:
                standards = ", ".join(f.detected_standards) if f.detected_standards else "unanalyzed"
                lines.append(f"- {f.name}: {standards}")
        
        if summary.addressable_gaps:
            lines.append("")
            lines.append(f"Gaps with potential file matches ({len(summary.addressable_gaps)}):")
            for g in summary.addressable_gaps[:3]:
                lines.append(f"- {g.standard} {g.clause}: {len(g.related_file_ids)} potential file(s)")
        
        # Recent activity
        if summary.last_event_type:
            lines.append("")
            lines.append(f"Last activity: {summary.last_event_type} at {summary.last_event_time.strftime('%H:%M') if summary.last_event_time else 'unknown'}")
        
        # Query-specific observations (state only, no recommendations)
        if query:
            lines.append("")
            lines.extend(self._observe_query(query, summary))
        
        content = "\n".join(lines)
        
        return Observation(
            content=content,
            timestamp=datetime.utcnow(),
            state_hash=self._hash_state(summary)
        )
    
    def _observe_query(self, query: str, summary) -> List[str]:
        """Produce query-specific state observations."""
        lines = []
        query_lower = query.lower()
        
        # File-related queries
        if "file" in query_lower:
            if summary.unlinked_files == 0 and summary.total_files > 0:
                lines.append("All uploaded files are linked to evidence scopes.")
            elif summary.total_files == 0:
                lines.append("No files in state.")
            else:
                lines.append(f"{summary.unlinked_files} file(s) remain unlinked.")
        
        # Gap-related queries
        if "gap" in query_lower:
            open_gaps = summary.total_gaps - summary.closed_gaps
            if open_gaps == 0:
                if summary.total_gaps == 0:
                    lines.append("No gaps defined in state.")
                else:
                    lines.append("All defined gaps are closed.")
            else:
                lines.append(f"{open_gaps} gap(s) open.")
        
        # Evidence-related queries
        if "evidence" in query_lower:
            if summary.total_evidence == 0:
                lines.append("No evidence scopes defined.")
            else:
                orphan_evidence = summary.total_evidence - summary.linked_evidence
                if orphan_evidence > 0:
                    lines.append(f"{orphan_evidence} evidence scope(s) without source files.")
        
        # Completeness queries
        if "complete" in query_lower or "status" in query_lower:
            if summary.unlinked_files > 0:
                lines.append("State incomplete: unlinked files exist.")
            else:
                lines.append("File linkage complete.")
        
        return lines if lines else ["State as described above."]
    
    def _hash_state(self, summary) -> str:
        """Generate a hash of current state for caching."""
        # Simple hash based on counts and last event
        return f"{summary.total_files}:{summary.total_evidence}:{summary.total_gaps}:{summary.last_event_time}"
    
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
