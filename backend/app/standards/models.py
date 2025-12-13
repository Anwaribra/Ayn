"""Pydantic models for standards and criteria."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# Standard Request Models
class StandardCreateRequest(BaseModel):
    """Request model for creating a standard."""
    title: str = Field(..., min_length=2, max_length=200, description="Standard title")
    description: Optional[str] = Field(None, max_length=1000, description="Standard description")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "ISO 21001",
                "description": "Educational Organizations Management System"
            }
        }


class StandardUpdateRequest(BaseModel):
    """Request model for updating a standard."""
    title: Optional[str] = Field(None, min_length=2, max_length=200, description="Standard title")
    description: Optional[str] = Field(None, max_length=1000, description="Standard description")

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
    description: Optional[str] = None

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

