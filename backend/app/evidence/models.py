"""Pydantic models for evidence."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Request Models
class AttachEvidenceRequest(BaseModel):
    """Request model for attaching evidence to a criterion."""
    criterionId: str = Field(..., description="Criterion ID to attach evidence to")

    class Config:
        json_schema_extra = {
            "example": {
                "criterionId": "criterion-uuid"
            }
        }


# Response Models
class EvidenceResponse(BaseModel):
    """Evidence information response."""
    id: str
    criterionId: Optional[str] = None
    fileUrl: str
    uploadedById: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class UploadEvidenceResponse(BaseModel):
    """Response for uploading evidence."""
    success: bool = True
    message: str
    evidenceId: Optional[str] = None
    analysisTriggered: bool = False
    evidence: Optional[EvidenceResponse] = None


class AttachEvidenceResponse(BaseModel):
    """Response for attaching evidence to criterion."""
    message: str
    evidenceId: str
    criterionId: str


