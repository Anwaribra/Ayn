"""Pydantic models for dashboard."""
from pydantic import BaseModel, Field
from typing import Optional


class DashboardMetricsResponse(BaseModel):
    """Dashboard metrics response."""
    alignedCriteriaCount: int = Field(..., description="Number of criteria with linked evidence")
    evidenceCount: int = Field(..., description="Total number of evidence files")
    alignmentPercentage: float = Field(..., ge=0, le=100, description="Overall alignment coverage percentage")
    totalGapAnalyses: int = Field(..., description="Total number of alignment analyses performed")

    class Config:
        json_schema_extra = {
            "example": {
                "completedCriteriaCount": 45,
                "evidenceCount": 120,
                "assessmentProgressPercentage": 67.5,
                "totalAssessments": 15
            }
        }


