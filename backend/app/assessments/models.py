"""Pydantic models for assessments."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# Assessment Request Models
class AssessmentCreateRequest(BaseModel):
    """Request model for creating an assessment."""
    institutionId: str = Field(..., description="Institution ID")
    standardId: str = Field(..., description="Standard ID")

    class Config:
        json_schema_extra = {
            "example": {
                "institutionId": "institution-uuid",
                "standardId": "standard-uuid"
            }
        }


class AssessmentAnswerRequest(BaseModel):
    """Request model for saving/updating assessment answers."""
    criterionId: str = Field(..., description="Criterion ID")
    answer: Optional[str] = Field(None, max_length=5000, description="Answer text")

    class Config:
        json_schema_extra = {
            "example": {
                "criterionId": "criterion-uuid",
                "answer": "Our institution has implemented..."
            }
        }


class AssessmentAnswersRequest(BaseModel):
    """Request model for saving multiple answers."""
    answers: List[AssessmentAnswerRequest] = Field(..., description="List of answers")

    class Config:
        json_schema_extra = {
            "example": {
                "answers": [
                    {
                        "criterionId": "criterion-uuid-1",
                        "answer": "Answer for criterion 1"
                    },
                    {
                        "criterionId": "criterion-uuid-2",
                        "answer": "Answer for criterion 2"
                    }
                ]
            }
        }


class ReviewRequest(BaseModel):
    """Request model for reviewing an assessment."""
    reviewerComment: str = Field(..., min_length=1, max_length=5000, description="Reviewer comment")

    class Config:
        json_schema_extra = {
            "example": {
                "reviewerComment": "Assessment looks good. Minor improvements needed."
            }
        }


# Assessment Response Models
class AssessmentAnswerResponse(BaseModel):
    """Assessment answer response."""
    id: str
    assessmentId: str
    criterionId: str
    answer: Optional[str] = None
    reviewerComment: Optional[str] = None

    class Config:
        from_attributes = True


class AssessmentResponse(BaseModel):
    """Assessment information response."""
    id: str
    institutionId: str
    userId: str
    status: str
    createdAt: datetime
    updatedAt: datetime
    submittedAt: Optional[datetime] = None
    reviewedAt: Optional[datetime] = None
    reviewerComment: Optional[str] = None
    answers: List[AssessmentAnswerResponse] = []

    class Config:
        from_attributes = True


class SubmitResponse(BaseModel):
    """Response for submitting an assessment."""
    message: str
    assessmentId: str
    status: str


class ReviewResponse(BaseModel):
    """Response for reviewing an assessment."""
    message: str
    assessmentId: str
    status: str
    reviewerComment: str


