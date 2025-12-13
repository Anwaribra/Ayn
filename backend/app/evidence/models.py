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
    message: str
    evidence: EvidenceResponse


class AttachEvidenceResponse(BaseModel):
    """Response for attaching evidence to criterion."""
    message: str
    evidenceId: str
    criterionId: str


