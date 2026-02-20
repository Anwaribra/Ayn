"""Pydantic models for gap analysis."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ─── Request Models ───────────────────────────────────────────────────────────

class UserDTO(BaseModel):
    id: str
    institutionId: Optional[str] = None
    role: str
    email: str


class GapAnalysisRequest(BaseModel):
    """Request model for generating a gap analysis."""
    standardId: str = Field(..., description="Standard ID to analyze against")

    class Config:
        json_schema_extra = {
            "example": {
                "standardId": "standard-uuid"
            }
        }


class ArchiveRequest(BaseModel):
    """Request model for archiving a gap analysis."""
    archived: bool = Field(True, description="Whether to archive or unarchive")


# ─── Response Models ──────────────────────────────────────────────────────────

class GapItem(BaseModel):
    """Individual gap item for a criterion."""
    criterionId: str
    criterionTitle: str
    status: str  # "aligned", "partially_aligned", "needs_improvement", "no_evidence"
    currentState: str  # AI summary of what exists
    gap: str  # What's missing
    recommendation: str  # AI recommendation
    priority: str  # "high", "medium", "low"


class GapAnalysisResponse(BaseModel):
    """Full gap analysis response."""
    id: str
    institutionId: str
    standardId: str
    standardTitle: str
    overallScore: float  # 0-100
    summary: str  # AI executive summary
    gaps: List[GapItem]
    recommendations: List[str]  # Top-level recommendations
    archived: bool = False
    createdAt: datetime

    class Config:
        from_attributes = True


class GapAnalysisListItem(BaseModel):
    """Lightweight gap analysis item for list views."""
    id: str
    standardTitle: str
    overallScore: float
    summary: str
    archived: bool
    createdAt: datetime

    class Config:
        from_attributes = True
