"""Pydantic models for institutions."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Request Models
class InstitutionCreateRequest(BaseModel):
    """Request model for creating an institution."""
    name: str = Field(..., min_length=2, max_length=200, description="Institution name")
    description: Optional[str] = Field(None, max_length=1000, description="Institution description")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Cairo University",
                "description": "Leading educational institution in Egypt"
            }
        }


class InstitutionUpdateRequest(BaseModel):
    """Request model for updating an institution."""
    name: Optional[str] = Field(None, min_length=2, max_length=200, description="Institution name")
    description: Optional[str] = Field(None, max_length=1000, description="Institution description")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Cairo University - Updated",
                "description": "Updated description"
            }
        }


class AssignUserRequest(BaseModel):
    """Request model for assigning a user to an institution."""
    userId: str = Field(..., description="User ID to assign to institution")

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "uuid-here"
            }
        }


# Response Models
class InstitutionResponse(BaseModel):
    """Institution information response."""
    id: str
    name: str
    description: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class InstitutionWithUsersResponse(InstitutionResponse):
    """Institution response with user count."""
    userCount: int = 0

    class Config:
        from_attributes = True


class AssignUserResponse(BaseModel):
    """Response for assigning user to institution."""
    message: str
    userId: str
    institutionId: str

