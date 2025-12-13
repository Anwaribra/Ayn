"""Pydantic models for dashboard."""
from pydantic import BaseModel, Field
from typing import Optional


class DashboardMetricsResponse(BaseModel):
    """Dashboard metrics response."""
    completedCriteriaCount: int = Field(..., description="Number of criteria with completed answers")
    evidenceCount: int = Field(..., description="Total number of evidence files")
    assessmentProgressPercentage: float = Field(..., ge=0, le=100, description="Overall assessment progress percentage")
    totalAssessments: int = Field(..., description="Total number of assessments")

    class Config:
        json_schema_extra = {
            "example": {
                "completedCriteriaCount": 45,
                "evidenceCount": 120,
                "assessmentProgressPercentage": 67.5,
                "totalAssessments": 15
            }
        }


