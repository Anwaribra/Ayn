"""Pydantic models for authentication."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# Request Models
class RegisterRequest(BaseModel):
    """User registration request."""
    name: str = Field(..., min_length=2, max_length=100, description="User full name")
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=100, description="User password (min 8 characters)")
    role: str = Field(..., description="User role: ADMIN, TEACHER, or AUDITOR")
    institutionId: Optional[str] = Field(None, description="Institution ID (optional)")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "password": "securepassword123",
                "role": "TEACHER",
                "institutionId": None
            }
        }


class LoginRequest(BaseModel):
    """User login request."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "john.doe@example.com",
                "password": "securepassword123"
            }
        }


# Response Models
class UserResponse(BaseModel):
    """User information response."""
    id: str
    name: str
    email: str
    role: str
    institutionId: Optional[str] = None
    createdAt: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Authentication token response."""
    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    """Complete authentication response with user info and token."""
    user: UserResponse
    access_token: str
    token_type: str = "bearer"

    class Config:
        json_schema_extra = {
            "example": {
                "user": {
                    "id": "uuid-here",
                    "name": "John Doe",
                    "email": "john.doe@example.com",
                    "role": "TEACHER",
                    "institutionId": None,
                    "createdAt": "2025-12-05T23:00:00Z"
                },
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }


class LogoutResponse(BaseModel):
    """Logout response."""
    message: str = "Successfully logged out"

