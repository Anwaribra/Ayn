"""
State Service

API layer for platform state operations.
Modules call this to write state.
"""

from datetime import datetime
from typing import List, Optional
from .models import PlatformStateManager, PlatformFile, PlatformEvidence, PlatformGap, PlatformMetric, StateSummary


class StateService:
    """
    Service for platform state operations.
    
    Used by modules to WRITE state.
    Horus reads directly from the database.
    """
    
    def __init__(self, db):
        self.manager = PlatformStateManager(db)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # FILE OPERATIONS (Called by file upload handlers)
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def record_file_upload(self, user_id: str, file_id: str, name: str, file_type: str, size: int) -> PlatformFile:
        """Record that a file was uploaded."""
        return await self.manager.create_file({
            "id": file_id,
            "name": name,
            "type": file_type,
            "size": size,
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
    
    async def record_file_analysis(self, file_id: str, standards: List[str], document_type: Optional[str] = None, clauses: List[str] = None, confidence: float = 0) -> PlatformFile:
        """Record file analysis results."""
        return await self.manager.analyze_file(file_id, {
            "standards": standards,
            "document_type": document_type,
            "clauses": clauses or [],
            "confidence": confidence
        })
    
    # ═══════════════════════════════════════════════════════════════════════════
    # EVIDENCE OPERATIONS (Called by Evidence module)
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def record_evidence_created(self, user_id: str, evidence_id: str, title: str, ev_type: str, criteria_refs: List[str] = None) -> PlatformEvidence:
        """Record that an evidence scope was defined."""
        return await self.manager.create_evidence({
            "id": evidence_id,
            "title": title,
            "type": ev_type,
            "user_id": user_id,
            "criteria_refs": criteria_refs or [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
    
    async def record_evidence_linked(self, evidence_id: str, file_ids: List[str]):
        """Record that evidence was linked to files."""
        await self.manager.link_evidence_to_files(evidence_id, file_ids)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # GAP OPERATIONS (Called by Gap Analysis module)
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def record_gap_defined(self, user_id: str, gap_id: str, standard: str, clause: str, description: str, severity: str = "medium") -> PlatformGap:
        """Record that a gap was defined."""
        gap = await self.manager.create_gap({
            "id": gap_id,
            "standard": standard,
            "clause": clause,
            "description": description,
            "severity": severity,
            "user_id": user_id,
            "created_at": datetime.utcnow()
        })
        
        # Notify 
        try:
            from app.notifications.service import NotificationService
            from app.notifications.models import NotificationCreateRequest
            await NotificationService.create_notification(NotificationCreateRequest(
                userId=user_id,
                type="warning",
                title="New Gap Identified",
                message=f"Gap found in {standard} {clause}: {description[:100]}...",
                relatedEntityId=gap_id,
                relatedEntityType="gap"
            ))
        except Exception as e:
            print(f"Failed to send notification: {e}")
            
        return gap
    
    async def record_gap_addressed(self, gap_id: str, evidence_id: str):
        """Record that a gap was addressed by evidence."""
        await self.manager.address_gap(gap_id, evidence_id)
    
    async def record_gap_closed(self, gap_id: str):
        """Record that a gap was closed."""
        await self.manager.close_gap(gap_id)
        
        # Notify (we need user_id, assume manager or caller handles context, but here we might lack user_id if not passed. 
        # Actually close_gap in manager might return the record with user_id.
        # For now, skipping notification if user_id is missing, or we'd need to fetch the gap first.)
    
    async def find_open_gaps_for_evidence(self, user_id: str, standard_name: str, clause_code: str) -> List[PlatformGap]:
        """Find open gaps that match the evidence content."""
        return await self.manager.find_gaps_by_standard_clause(user_id, standard_name, clause_code)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # METRIC OPERATIONS (Called by Dashboard module)
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def record_metric_update(self, user_id: str, metric_id: str, name: str, value: float, source_module: str) -> PlatformMetric:
        """Record a metric update."""
        metric = await self.manager.update_metric({
            "id": metric_id,
            "name": name,
            "value": value,
            "source_module": source_module,
            "user_id": user_id,
            "updated_at": datetime.utcnow()
        })
        
        # Notify only on SIGNIFICANT score changes/updates that actually changed the value
        if ("alignment" in name.lower() or "score" in name.lower()):
            has_changed = (metric.previous_value is None) or (abs(metric.value - metric.previous_value) > 0.001)
            
            if has_changed:
                 try:
                    from app.notifications.service import NotificationService
                    from app.notifications.models import NotificationCreateRequest
                    await NotificationService.create_notification(NotificationCreateRequest(
                        userId=user_id,
                        type="info",
                        title="Metric Updated",
                        message=f"{name} is now {value}",
                        relatedEntityId=metric_id,
                        relatedEntityType="metric"
                    ))
                 except Exception as e:
                    print(f"Failed to send notification: {e}")
                
        return metric
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STATE SUMMARY (Called by Horus)
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def get_current_state(self, user_id: str) -> StateSummary:
        """Get current platform state summary."""
        return await self.manager.get_state_summary(user_id)

    async def get_state_summary(self, user_id: str) -> StateSummary:
        """Alias for horus."""
        return await self.get_current_state(user_id)
