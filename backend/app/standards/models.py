"""Pydantic models for standards and criteria."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# Standard Request Models
class StandardCreateRequest(BaseModel):
    """Request model for creating a standard."""
    title: str = Field(..., min_length=2, max_length=200, description="Standard title")
    code: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    region: Optional[str] = Field(None, max_length=100)
    icon: Optional[str] = Field("GraduationCap", max_length=100)
    color: Optional[str] = Field("from-blue-600 to-indigo-600", max_length=100)
    features: List[str] = Field(default_factory=list)
    estimatedSetup: Optional[str] = Field(None, max_length=100)

    class Config:
        json_schema_extra = {
            "example": {
                "title": "ISO 21001",
                "description": "Educational Organizations Management System"
            }
        }


class StandardUpdateRequest(BaseModel):
    """Request model for updating a standard."""
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    code: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    region: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    features: Optional[List[str]] = None
    estimatedSetup: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "title": "ISO 21001 - Updated",
                "description": "Updated description"
            }
        }


# Standard Response Models
class StandardResponse(BaseModel):
    """Standard information response."""
    id: str
    title: str
    code: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    region: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    features: List[str] = []
    estimatedSetup: Optional[str] = None
    isPublic: bool = True
    source: Optional[str] = "seeded"
    criteriaCount: int = 0

    class Config:
        from_attributes = True


class StandardWithCriteriaResponse(StandardResponse):
    """Standard response with criteria."""
    criteria: List["CriterionResponse"] = []

    class Config:
        from_attributes = True


# Criterion Request Models
class CriterionCreateRequest(BaseModel):
    """Request model for creating a criterion."""
    title: str = Field(..., min_length=2, max_length=200, description="Criterion title")
    description: Optional[str] = Field(None, max_length=1000, description="Criterion description")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Leadership and Commitment",
                "description": "Top management demonstrates leadership and commitment"
            }
        }


class CriterionUpdateRequest(BaseModel):
    """Request model for updating a criterion."""
    title: Optional[str] = Field(None, min_length=2, max_length=200, description="Criterion title")
    description: Optional[str] = Field(None, max_length=1000, description="Criterion description")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Leadership and Commitment - Updated",
                "description": "Updated description"
            }
        }


# Criterion Response Models
class CriterionResponse(BaseModel):
    """Criterion information response."""
    id: str
    standardId: str
    title: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


# Institution-Standard Linking
class LinkStandardRequest(BaseModel):
    """Request model for linking a standard to an institution."""
    standardId: str = Field(..., description="Standard ID to link")

    class Config:
        json_schema_extra = {
            "example": {
                "standardId": "uuid-here"
            }
        }


class LinkStandardResponse(BaseModel):
    """Response for linking standard to institution."""
    message: str
    institutionId: str
    standardId: str

