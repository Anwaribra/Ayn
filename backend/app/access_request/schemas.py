"""Pydantic schemas for access request module."""
from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, EmailStr, Field


class AccessRequestCreate(BaseModel):
    """Create a new access request (public endpoint)."""
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    institution: str = Field(..., min_length=1, max_length=300)
    role: str = Field(..., min_length=1, max_length=80)
    type: Literal["demo", "pricing"]
    message: Optional[str] = Field(None, max_length=2000)


class AccessRequestResponse(BaseModel):
    """Access request response."""
    id: str
    userId: Optional[str] = None
    name: str
    email: str
    institution: str
    role: str
    type: str
    message: Optional[str] = None
    status: str
    reviewedBy: Optional[str] = None
    reviewNote: Optional[str] = None
    reviewedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class AccessRequestReviewRequest(BaseModel):
    """Admin review of an access request."""
    action: Literal["approve", "reject"]
    note: Optional[str] = Field(None, max_length=1000)


class AccessRequestListResponse(BaseModel):
    """Paginated list of access requests."""
    requests: list[AccessRequestResponse]
    total: int
