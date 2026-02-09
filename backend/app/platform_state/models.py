"""
Platform State Database Models

Tables:
- platform_files: Files uploaded to the system
- platform_evidence: Evidence items defined
- platform_gaps: Compliance gaps
- platform_metrics: Dashboard metrics
- platform_events: Event log (immutable)
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel


class FileStatus(str, Enum):
    UPLOADED = "uploaded"
    ANALYZED = "analyzed"
    LINKED = "linked"
    ORPHANED = "orphaned"


class EvidenceStatus(str, Enum):
    DEFINED = "defined"
    LINKED = "linked"
    COMPLETE = "complete"
    VOID = "void"


class GapStatus(str, Enum):
    DEFINED = "defined"
    ADDRESSED = "addressed"
    CLOSED = "closed"
    DORMANT = "dormant"


class PlatformFile(BaseModel):
    """A file in the platform state."""
    id: str
    name: str
    type: str
    size: int
    user_id: str
    
    # Analysis results
    detected_standards: List[str] = []
    document_type: Optional[str] = None
    clauses: List[str] = []
    analysis_confidence: float = 0.0
    
    # State
    status: FileStatus = FileStatus.UPLOADED
    
    # Cross-module links
    linked_evidence_ids: List[str] = []
    linked_gap_ids: List[str] = []
    
    # Metadata
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PlatformEvidence(BaseModel):
    """An evidence item in the platform state."""
    id: str
    title: str
    type: str
    user_id: str
    
    # State
    status: EvidenceStatus = EvidenceStatus.DEFINED
    
    # References
    source_file_ids: List[str] = []
    criteria_refs: List[str] = []
    
    # Metadata
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PlatformGap(BaseModel):
    """A compliance gap in the platform state."""
    id: str
    standard: str  # ISO21001, ISO9001, NAQAAE
    clause: str
    description: str
    severity: str  # critical, high, medium, low
    user_id: str
    
    # State
    status: GapStatus = GapStatus.DEFINED
    
    # References
    evidence_ids: List[str] = []
    related_file_ids: List[str] = []
    
    # Metadata
    created_at: datetime
    closed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PlatformMetric(BaseModel):
    """A dashboard metric in the platform state."""
    id: str
    name: str
    value: float
    previous_value: Optional[float] = None
    source_module: str
    user_id: str
    
    # Metadata
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PlatformEvent(BaseModel):
    """An event in the platform event log."""
    id: str
    type: str  # file_uploaded, evidence_created, etc.
    user_id: str
    
    # Event data
    entity_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    
    # Timestamp (immutable)
    timestamp: datetime
    
    class Config:
        from_attributes = True


class StateSummary(BaseModel):
    """Summary of current platform state."""
    # File counts
    total_files: int = 0
    analyzed_files: int = 0
    unlinked_files: int = 0
    
    # Evidence counts
    total_evidence: int = 0
    linked_evidence: int = 0
    
    # Gap counts
    total_gaps: int = 0
    addressed_gaps: int = 0
    closed_gaps: int = 0
    
    # Metrics
    total_metrics: int = 0
    
    # Last activity
    last_event_type: Optional[str] = None
    last_event_time: Optional[datetime] = None
    
    # Computed
    orphan_files: List[PlatformFile] = []
    addressable_gaps: List[PlatformGap] = []


class PlatformStateManager:
    """
    Manages platform state operations.
    All writes go through here.
    """
    
    def __init__(self, db):
        self.db = db
    
    # ═══════════════════════════════════════════════════════════════════════════
    # FILE OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_file(self, file_data: dict) -> PlatformFile:
        """Record a file upload event."""
        file = await self.db.platform_files.create(data=file_data)
        
        # Log event
        await self._log_event("file_uploaded", file.user_id, file.id)
        
        return PlatformFile.model_validate(file)
    
    async def analyze_file(self, file_id: str, analysis: dict) -> PlatformFile:
        """Record file analysis results."""
        file = await self.db.platform_files.update(
            where={"id": file_id},
            data={
                "detected_standards": analysis.get("standards", []),
                "document_type": analysis.get("document_type"),
                "clauses": analysis.get("clauses", []),
                "analysis_confidence": analysis.get("confidence", 0),
                "status": FileStatus.ANALYZED,
                "updated_at": datetime.utcnow()
            }
        )
        
        await self._log_event("file_analyzed", file.user_id, file_id, {
            "standards": analysis.get("standards", [])
        })
        
        return PlatformFile.model_validate(file)
    
    async def link_file_to_evidence(self, file_id: str, evidence_id: str):
        """Link a file to an evidence item."""
        file = await self.db.platform_files.find_unique(where={"id": file_id})
        
        if file:
            linked_ids = file.linked_evidence_ids or []
            if evidence_id not in linked_ids:
                linked_ids.append(evidence_id)
                
                await self.db.platform_files.update(
                    where={"id": file_id},
                    data={
                        "linked_evidence_ids": linked_ids,
                        "status": FileStatus.LINKED,
                        "updated_at": datetime.utcnow()
                    }
                )
    
    async def get_file(self, file_id: str) -> Optional[PlatformFile]:
        """Get a file by ID."""
        file = await self.db.platform_files.find_unique(where={"id": file_id})
        return PlatformFile.model_validate(file) if file else None
    
    async def get_files_by_user(self, user_id: str) -> List[PlatformFile]:
        """Get all files for a user."""
        files = await self.db.platform_files.find_many(where={"user_id": user_id})
        return [PlatformFile.model_validate(f) for f in files]
    
    async def get_unlinked_files(self, user_id: str) -> List[PlatformFile]:
        """Get files not linked to any evidence."""
        files = await self.db.platform_files.find_many(
            where={
                "user_id": user_id,
                "linked_evidence_ids": {"equals": []}
            }
        )
        return [PlatformFile.model_validate(f) for f in files]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # EVIDENCE OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_evidence(self, evidence_data: dict) -> PlatformEvidence:
        """Record an evidence item creation."""
        evidence = await self.db.platform_evidence.create(data=evidence_data)
        
        await self._log_event("evidence_created", evidence.user_id, evidence.id)
        
        return PlatformEvidence.model_validate(evidence)
    
    async def link_evidence_to_files(self, evidence_id: str, file_ids: List[str]):
        """Link evidence to source files."""
        evidence = await self.db.platform_evidence.find_unique(where={"id": evidence_id})
        
        if evidence:
            current_ids = evidence.source_file_ids or []
            new_ids = list(set(current_ids + file_ids))
            
            await self.db.platform_evidence.update(
                where={"id": evidence_id},
                data={
                    "source_file_ids": new_ids,
                    "status": EvidenceStatus.LINKED if new_ids else evidence.status,
                    "updated_at": datetime.utcnow()
                }
            )
            
            # Update file links
            for file_id in file_ids:
                await self.link_file_to_evidence(file_id, evidence_id)
    
    async def get_evidence(self, evidence_id: str) -> Optional[PlatformEvidence]:
        """Get evidence by ID."""
        evidence = await self.db.platform_evidence.find_unique(where={"id": evidence_id})
        return PlatformEvidence.model_validate(evidence) if evidence else None
    
    async def get_evidence_by_user(self, user_id: str) -> List[PlatformEvidence]:
        """Get all evidence for a user."""
        evidence = await self.db.platform_evidence.find_many(where={"user_id": user_id})
        return [PlatformEvidence.model_validate(e) for e in evidence]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # GAP OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_gap(self, gap_data: dict) -> PlatformGap:
        """Record a gap definition."""
        gap = await self.db.platform_gaps.create(data=gap_data)
        
        await self._log_event("gap_defined", gap.user_id, gap.id)
        
        return PlatformGap.model_validate(gap)
    
    async def address_gap(self, gap_id: str, evidence_id: str):
        """Record that a gap has been addressed by evidence."""
        gap = await self.db.platform_gaps.find_unique(where={"id": gap_id})
        
        if gap:
            evidence_ids = gap.evidence_ids or []
            if evidence_id not in evidence_ids:
                evidence_ids.append(evidence_id)
                
                await self.db.platform_gaps.update(
                    where={"id": gap_id},
                    data={
                        "evidence_ids": evidence_ids,
                        "status": GapStatus.ADDRESSED,
                        "updated_at": datetime.utcnow()
                    }
                )
                
                await self._log_event("gap_addressed", gap.user_id, gap_id, {
                    "evidence_id": evidence_id
                })
    
    async def close_gap(self, gap_id: str):
        """Record a gap closure."""
        gap = await self.db.platform_gaps.update(
            where={"id": gap_id},
            data={
                "status": GapStatus.CLOSED,
                "closed_at": datetime.utcnow()
            }
        )
        
        await self._log_event("gap_closed", gap.user_id, gap_id)
    
    async def get_gap(self, gap_id: str) -> Optional[PlatformGap]:
        """Get a gap by ID."""
        gap = await self.db.platform_gaps.find_unique(where={"id": gap_id})
        return PlatformGap.model_validate(gap) if gap else None
    
    async def get_gaps_by_user(self, user_id: str) -> List[PlatformGap]:
        """Get all gaps for a user."""
        gaps = await self.db.platform_gaps.find_many(where={"user_id": user_id})
        return [PlatformGap.model_validate(g) for g in gaps]
    
    async def get_addressable_gaps(self, user_id: str) -> List[PlatformGap]:
        """Get gaps that have related files but aren't addressed."""
        gaps = await self.db.platform_gaps.find_many(
            where={
                "user_id": user_id,
                "status": GapStatus.DEFINED,
                "related_file_ids": {"not": {"equals": []}}
            }
        )
        return [PlatformGap.model_validate(g) for g in gaps]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # METRIC OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def update_metric(self, metric_data: dict) -> PlatformMetric:
        """Update or create a metric."""
        existing = await self.db.platform_metrics.find_unique(
            where={"id": metric_data.get("id")}
        )
        
        if existing:
            metric = await self.db.platform_metrics.update(
                where={"id": existing.id},
                data={
                    "value": metric_data["value"],
                    "previous_value": existing.value,
                    "updated_at": datetime.utcnow()
                }
            )
        else:
            metric = await self.db.platform_metrics.create(data=metric_data)
        
        await self._log_event("metric_updated", metric.user_id, metric.id, {
            "value": metric.value
        })
        
        return PlatformMetric.model_validate(metric)
    
    async def get_metrics_by_user(self, user_id: str) -> List[PlatformMetric]:
        """Get all metrics for a user."""
        metrics = await self.db.platform_metrics.find_many(where={"user_id": user_id})
        return [PlatformMetric.model_validate(m) for m in metrics]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # EVENT LOG
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _log_event(self, event_type: str, user_id: str, entity_id: Optional[str] = None, metadata: dict = None):
        """Log an event to the event store."""
        await self.db.platform_events.create(data={
            "type": event_type,
            "user_id": user_id,
            "entity_id": entity_id,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow()
        })
    
    async def get_recent_events(self, user_id: str, limit: int = 50) -> List[PlatformEvent]:
        """Get recent events for a user."""
        events = await self.db.platform_events.find_many(
            where={"user_id": user_id},
            order={"timestamp": "desc"},
            take=limit
        )
        return [PlatformEvent.model_validate(e) for e in events]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STATE SUMMARY (For Horus)
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def get_state_summary(self, user_id: str) -> StateSummary:
        """Get a summary of current platform state for Horus."""
        files = await self.get_files_by_user(user_id)
        evidence = await self.get_evidence_by_user(user_id)
        gaps = await self.get_gaps_by_user(user_id)
        metrics = await self.get_metrics_by_user(user_id)
        events = await self.get_recent_events(user_id, 1)
        
        unlinked = [f for f in files if not f.linked_evidence_ids]
        addressable = await self.get_addressable_gaps(user_id)
        
        return StateSummary(
            total_files=len(files),
            analyzed_files=len([f for f in files if f.status == FileStatus.ANALYZED]),
            unlinked_files=len(unlinked),
            total_evidence=len(evidence),
            linked_evidence=len([e for e in evidence if e.source_file_ids]),
            total_gaps=len(gaps),
            addressed_gaps=len([g for g in gaps if g.status == GapStatus.ADDRESSED]),
            closed_gaps=len([g for g in gaps if g.status == GapStatus.CLOSED]),
            total_metrics=len(metrics),
            last_event_type=events[0].type if events else None,
            last_event_time=events[0].timestamp if events else None,
            orphan_files=unlinked[:5],
            addressable_gaps=addressable[:5]
        )
