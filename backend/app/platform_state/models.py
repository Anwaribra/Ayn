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
    # Relations (computed or fetched)
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
    # Relations
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
    # Relations
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
    total_score: float = 0.0
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
            if hasattr(self.db, 'platformfile'): # Prisma Python often creates lowercase usage
                 await self.db.platformfile.find_first(take=1)
                 self._tables_exist = True
            elif hasattr(self.db, 'platform_files'): # Fallback depending on naming
                await self.db.platform_files.find_first(take=1)
                self._tables_exist = True
            else:
                # Attempt to determine via introspection or similar if needed, 
                # but usually attributes exist if client generated
                self._tables_exist = True
        except Exception as e:
            # Tables don't exist yet or other error
            print(f"Platform state tables check failed: {e}")
            self._tables_exist = False
        
        return self._tables_exist
    
    # ═══════════════════════════════════════════════════════════════════════════
    # FILE OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_file(self, file_data: dict) -> Optional[PlatformFile]:
        """Record a file upload."""
        if not await self._check_tables():
            return None
        
        try:
            # Remove relation fields if passed in data to avoid errors
            data = {k: v for k, v in file_data.items() if k not in ['linked_evidence_ids', 'linked_gap_ids']}
            
            # Map snake_case keys to Prisma schema camelCase if needed, 
            # but prisma-python usually handles input data matching schema.
            # Schema: id, name, type, size, userId, detectedStandards...
            
            # We need to ensure keys match Prisma schema
            prisma_data = {
                "id": data["id"],
                "name": data["name"],
                "type": data["type"],
                "size": data["size"],
                "userId": data["user_id"],
                "createdAt": data["created_at"],
                "updatedAt": data["updated_at"]
            }

            file = await self.db.platformfile.create(data=prisma_data)
            return self._map_file(file)
        except Exception as e:
            print(f"Error creating file: {e}")
            return None
    
    async def analyze_file(self, file_id: str, analysis: dict) -> Optional[PlatformFile]:
        """Record file analysis."""
        if not await self._check_tables():
            return None
        
        try:
            file = await self.db.platformfile.update(
                where={"id": file_id},
                data={
                    "detectedStandards": analysis.get("standards", []),
                    "documentType": analysis.get("document_type"),
                    "clauses": analysis.get("clauses", []),
                    "analysisConfidence": analysis.get("confidence", 0),
                    "status": "analyzed",
                    "updatedAt": datetime.utcnow()
                },
                include={"evidence": True, "gaps": True}
            )
            return self._map_file(file)
        except Exception as e:
            print(f"Error analyzing file: {e}")
            return None
    
    async def get_files_by_user(self, user_id: str) -> List[PlatformFile]:
        """Get all files for user."""
        if not await self._check_tables():
            return []
        
        try:
            files = await self.db.platformfile.find_many(
                where={"userId": user_id},
                include={"evidence": True, "gaps": True}
            )
            return [self._map_file(f) for f in files]
        except Exception as e:
            print(f"Error getting files: {e}")
            return []
            
    def _map_file(self, f) -> PlatformFile:
        """Map Prisma result to Pydantic model, handling relations."""
        # relations are lists of objects if included
        ev_ids = [e.id for e in f.evidence] if f.evidence else []
        gap_ids = [g.id for g in f.gaps] if f.gaps else []
        
        return PlatformFile(
            id=f.id,
            name=f.name,
            type=f.type,
            size=f.size,
            user_id=f.userId,
            detected_standards=f.detectedStandards,
            document_type=f.documentType,
            clauses=f.clauses,
            analysis_confidence=f.analysisConfidence,
            status=f.status,
            linked_evidence_ids=ev_ids,
            linked_gap_ids=gap_ids,
            created_at=f.createdAt,
            updated_at=f.updatedAt
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # EVIDENCE OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_evidence(self, evidence_data: dict) -> Optional[PlatformEvidence]:
        """Record evidence creation."""
        if not await self._check_tables():
            return None
        
        try:
            prisma_data = {
                "id": evidence_data["id"],
                "title": evidence_data["title"],
                "type": evidence_data["type"],
                "userId": evidence_data["user_id"],
                "criteriaRefs": evidence_data.get("criteria_refs", []),
                "createdAt": evidence_data["created_at"],
                "updatedAt": evidence_data["updated_at"]
            }
            
            evidence = await self.db.platformevidence.create(data=prisma_data)
            return self._map_evidence(evidence)
        except Exception as e:
            print(f"Error creating evidence: {e}")
            return None
            
    async def link_evidence_to_files(self, evidence_id: str, file_ids: List[str]):
        """Link evidence to multiple files."""
        if not await self._check_tables():
            return
            
        try:
            # Connect existing files
            await self.db.platformevidence.update(
                where={"id": evidence_id},
                data={
                    "files": {
                        "connect": [{"id": fid} for fid in file_ids]
                    }
                }
            )
        except Exception as e:
            print(f"Error linking evidence to files: {e}")
    
    async def get_evidence_by_user(self, user_id: str) -> List[PlatformEvidence]:
        """Get all evidence for user."""
        if not await self._check_tables():
            return []
        
        try:
            evidence = await self.db.platformevidence.find_many(
                where={"userId": user_id},
                include={"files": True}
            )
            return [self._map_evidence(e) for e in evidence]
        except Exception:
            return []

    def _map_evidence(self, e) -> PlatformEvidence:
        file_ids = [f.id for f in e.files] if e.files else []
        return PlatformEvidence(
            id=e.id,
            title=e.title,
            type=e.type,
            user_id=e.userId,
            status=e.status,
            source_file_ids=file_ids,
            criteria_refs=e.criteriaRefs,
            created_at=e.createdAt,
            updated_at=e.updatedAt
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # GAP OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_gap(self, gap_data: dict) -> Optional[PlatformGap]:
        """Record gap definition."""
        if not await self._check_tables():
            return None
        
        try:
            prisma_data = {
                "id": gap_data["id"],
                "standard": gap_data["standard"],
                "clause": gap_data["clause"],
                "description": gap_data["description"],
                "severity": gap_data["severity"],
                "userId": gap_data["user_id"],
                "createdAt": gap_data["created_at"]
            }
            
            gap = await self.db.platformgap.create(data=prisma_data)
            return self._map_gap(gap)
        except Exception as e:
            print(f"Error creating gap: {e}")
            return None

    async def address_gap(self, gap_id: str, evidence_id: str):
        """Address a gap with an evidence item."""
        if not await self._check_tables():
            return
            
        try:
            await self.db.platformgap.update(
                where={"id": gap_id},
                data={
                    "status": "addressed",
                    "evidence": {
                        "connect": [{"id": evidence_id}]
                    }
                }
            )
        except Exception as e:
            print(f"Error addressing gap: {e}")

    async def close_gap(self, gap_id: str):
        """Close a gap."""
        if not await self._check_tables():
            return
            
        try:
            await self.db.platformgap.update(
                where={"id": gap_id},
                data={
                    "status": "closed",
                    "closedAt": datetime.utcnow()
                }
            )
        except Exception as e:
            print(f"Error closing gap: {e}")
    
    async def get_gaps_by_user(self, user_id: str) -> List[PlatformGap]:
        """Get all gaps for user."""
        if not await self._check_tables():
            return []
        
        try:
            gaps = await self.db.platformgap.find_many(
                where={"userId": user_id},
                include={"evidence": True, "files": True}
            )
            return [self._map_gap(g) for g in gaps]
        except Exception:
            return []

    async def find_gaps_by_standard_clause(self, user_id: str, standard_name: str, clause_code: str) -> List[PlatformGap]:
        """Find open gaps for a specific standard clause."""
        if not await self._check_tables():
            return []
            
        try:
            gaps = await self.db.platformgap.find_many(
                where={
                    "userId": user_id,
                    "status": "defined",
                    "standard": {"contains": standard_name, "mode": "insensitive"},
                    "clause": {"contains": clause_code, "mode": "insensitive"}
                },
                include={"evidence": True, "files": True}
            )
            return [self._map_gap(g) for g in gaps]
        except Exception:
            return []

    def _map_gap(self, g) -> PlatformGap:
        ev_ids = [e.id for e in g.evidence] if g.evidence else []
        file_ids = [f.id for f in g.files] if g.files else []
        return PlatformGap(
            id=g.id,
            standard=g.standard,
            clause=g.clause,
            description=g.description,
            severity=g.severity,
            user_id=g.userId,
            status=g.status,
            evidence_ids=ev_ids,
            related_file_ids=file_ids,
            created_at=g.createdAt,
            closed_at=g.closedAt
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # METRIC OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def update_metric(self, metric_data: dict) -> Optional[PlatformMetric]:
        """Update metric."""
        if not await self._check_tables():
            return None
        
        try:
            existing = await self.db.platformmetric.find_unique(
                where={"id": metric_data.get("id")}
            )
            
            # Prisma Python returns objects, handle potential dict fallback if raw
            existing_val = existing.value if existing else None
            
            if existing:
                metric = await self.db.platformmetric.update(
                    where={"id": existing.id},
                    data={
                        "value": metric_data["value"],
                        "previousValue": existing_val,
                        "updatedAt": datetime.utcnow()
                    }
                )
            else:
                metric = await self.db.platformmetric.create(data={
                    "id": metric_data["id"],
                    "name": metric_data["name"],
                    "value": metric_data["value"],
                    "sourceModule": metric_data["source_module"],
                    "userId": metric_data["user_id"],
                    "updatedAt": datetime.utcnow()
                })
            
            return self._map_metric(metric)
        except Exception as e:
            print(f"Error updating metric: {e}")
            return None
    
    async def get_metrics_by_user(self, user_id: str) -> List[PlatformMetric]:
        """Get all metrics for user."""
        if not await self._check_tables():
            return []
        
        try:
            metrics = await self.db.platformmetric.find_many(where={"userId": user_id})
            return [self._map_metric(m) for m in metrics]
        except Exception:
            return []
            
    def _map_metric(self, m) -> PlatformMetric:
        return PlatformMetric(
            id=m.id,
            name=m.name,
            value=m.value,
            previous_value=m.previousValue,
            source_module=m.sourceModule,
            user_id=m.userId,
            updated_at=m.updatedAt
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STATE SUMMARY
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def get_state_summary(self, user_id: str) -> StateSummary:
        """Get state summary."""
        if not await self._check_tables():
            return StateSummary()
        
        # Parallel fetch
        import asyncio
        files, evidence, gaps, metrics = await asyncio.gather(
            self.get_files_by_user(user_id),
            self.get_evidence_by_user(user_id),
            self.get_gaps_by_user(user_id),
            self.get_metrics_by_user(user_id)
        )
        
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
            total_score=next((m.value for m in metrics if "score" in m.name.lower() or "alignment" in m.name.lower()), 0.0),
            orphan_files=unlinked[:5],
            addressable_gaps=addressable[:5]
        )
