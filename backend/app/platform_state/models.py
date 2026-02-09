"""
Platform State Models

Database-backed state storage for platform modules.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class PlatformFile(BaseModel):
    id: str
    name: str
    type: str
    size: int
    user_id: str
    detected_standards: List[str] = []
    document_type: Optional[str] = None
    clauses: List[str] = []
    analysis_confidence: float = 0.0
    status: str = "uploaded"
    linked_evidence_ids: List[str] = []
    linked_gap_ids: List[str] = []
    created_at: datetime
    updated_at: datetime


class PlatformEvidence(BaseModel):
    id: str
    title: str
    type: str
    user_id: str
    status: str = "defined"
    source_file_ids: List[str] = []
    criteria_refs: List[str] = []
    created_at: datetime
    updated_at: datetime


class PlatformGap(BaseModel):
    id: str
    standard: str
    clause: str
    description: str
    severity: str = "medium"
    user_id: str
    status: str = "defined"
    evidence_ids: List[str] = []
    related_file_ids: List[str] = []
    created_at: datetime
    closed_at: Optional[datetime] = None


class PlatformMetric(BaseModel):
    id: str
    name: str
    value: float
    previous_value: Optional[float] = None
    source_module: str
    user_id: str
    updated_at: datetime


class PlatformEvent(BaseModel):
    id: str
    type: str
    user_id: str
    entity_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    timestamp: datetime


class StateSummary(BaseModel):
    total_files: int = 0
    analyzed_files: int = 0
    unlinked_files: int = 0
    total_evidence: int = 0
    linked_evidence: int = 0
    total_gaps: int = 0
    addressed_gaps: int = 0
    closed_gaps: int = 0
    total_metrics: int = 0
    last_event_type: Optional[str] = None
    last_event_time: Optional[datetime] = None
    orphan_files: List[PlatformFile] = []
    addressable_gaps: List[PlatformGap] = []


class PlatformStateManager:
    """
    Manages platform state.
    Gracefully handles missing database tables.
    """
    
    def __init__(self, db):
        self.db = db
        self._tables_exist = None
    
    async def _check_tables(self) -> bool:
        """Check if platform state tables exist."""
        if self._tables_exist is not None:
            return self._tables_exist
        
        try:
            # Try to query one of the tables
            await self.db.platform_files.find_first(take=1)
            self._tables_exist = True
        except Exception:
            # Tables don't exist yet
            self._tables_exist = False
        
        return self._tables_exist
    
    # ═══════════════════════════════════════════════════════════════════════════
    # FILE OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_file(self, file_data: dict) -> Optional[PlatformFile]:
        """Record a file upload."""
        if not await self._check_tables():
            return None  # Tables don't exist yet
        
        try:
            file = await self.db.platform_files.create(data=file_data)
            return PlatformFile.model_validate(file)
        except Exception as e:
            print(f"Error creating file: {e}")
            return None
    
    async def analyze_file(self, file_id: str, analysis: dict) -> Optional[PlatformFile]:
        """Record file analysis."""
        if not await self._check_tables():
            return None
        
        try:
            file = await self.db.platform_files.update(
                where={"id": file_id},
                data={
                    "detected_standards": analysis.get("standards", []),
                    "document_type": analysis.get("document_type"),
                    "clauses": analysis.get("clauses", []),
                    "analysis_confidence": analysis.get("confidence", 0),
                    "status": "analyzed",
                    "updated_at": datetime.utcnow()
                }
            )
            return PlatformFile.model_validate(file)
        except Exception as e:
            print(f"Error analyzing file: {e}")
            return None
    
    async def get_files_by_user(self, user_id: str) -> List[PlatformFile]:
        """Get all files for user."""
        if not await self._check_tables():
            return []
        
        try:
            files = await self.db.platform_files.find_many(where={"user_id": user_id})
            return [PlatformFile.model_validate(f) for f in files]
        except Exception:
            return []
    
    # ═══════════════════════════════════════════════════════════════════════════
    # EVIDENCE OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_evidence(self, evidence_data: dict) -> Optional[PlatformEvidence]:
        """Record evidence creation."""
        if not await self._check_tables():
            return None
        
        try:
            evidence = await self.db.platform_evidence.create(data=evidence_data)
            return PlatformEvidence.model_validate(evidence)
        except Exception as e:
            print(f"Error creating evidence: {e}")
            return None
    
    async def get_evidence_by_user(self, user_id: str) -> List[PlatformEvidence]:
        """Get all evidence for user."""
        if not await self._check_tables():
            return []
        
        try:
            evidence = await self.db.platform_evidence.find_many(where={"user_id": user_id})
            return [PlatformEvidence.model_validate(e) for e in evidence]
        except Exception:
            return []
    
    # ═══════════════════════════════════════════════════════════════════════════
    # GAP OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_gap(self, gap_data: dict) -> Optional[PlatformGap]:
        """Record gap definition."""
        if not await self._check_tables():
            return None
        
        try:
            gap = await self.db.platform_gaps.create(data=gap_data)
            return PlatformGap.model_validate(gap)
        except Exception as e:
            print(f"Error creating gap: {e}")
            return None
    
    async def get_gaps_by_user(self, user_id: str) -> List[PlatformGap]:
        """Get all gaps for user."""
        if not await self._check_tables():
            return []
        
        try:
            gaps = await self.db.platform_gaps.find_many(where={"user_id": user_id})
            return [PlatformGap.model_validate(g) for g in gaps]
        except Exception:
            return []
    
    # ═══════════════════════════════════════════════════════════════════════════
    # METRIC OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def update_metric(self, metric_data: dict) -> Optional[PlatformMetric]:
        """Update metric."""
        if not await self._check_tables():
            return None
        
        try:
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
            
            return PlatformMetric.model_validate(metric)
        except Exception as e:
            print(f"Error updating metric: {e}")
            return None
    
    async def get_metrics_by_user(self, user_id: str) -> List[PlatformMetric]:
        """Get all metrics for user."""
        if not await self._check_tables():
            return []
        
        try:
            metrics = await self.db.platform_metrics.find_many(where={"user_id": user_id})
            return [PlatformMetric.model_validate(m) for m in metrics]
        except Exception:
            return []
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STATE SUMMARY
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def get_state_summary(self, user_id: str) -> StateSummary:
        """Get state summary. Returns empty if tables don't exist."""
        if not await self._check_tables():
            # Return empty summary - frontend will show appropriate message
            return StateSummary()
        
        files = await self.get_files_by_user(user_id)
        evidence = await self.get_evidence_by_user(user_id)
        gaps = await self.get_gaps_by_user(user_id)
        metrics = await self.get_metrics_by_user(user_id)
        
        unlinked = [f for f in files if not f.linked_evidence_ids]
        addressable = [g for g in gaps if g.status == "defined" and g.related_file_ids]
        
        return StateSummary(
            total_files=len(files),
            analyzed_files=len([f for f in files if f.status == "analyzed"]),
            unlinked_files=len(unlinked),
            total_evidence=len(evidence),
            linked_evidence=len([e for e in evidence if e.source_file_ids]),
            total_gaps=len(gaps),
            addressed_gaps=len([g for g in gaps if g.status == "addressed"]),
            closed_gaps=len([g for g in gaps if g.status == "closed"]),
            total_metrics=len(metrics),
            orphan_files=unlinked[:5],
            addressable_gaps=addressable[:5]
        )
