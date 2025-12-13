"""Pydantic models for AI module."""
from pydantic import BaseModel, Field
from typing import Optional


class GenerateAnswerRequest(BaseModel):
    """Request model for generating an answer."""
    prompt: str = Field(..., min_length=1, max_length=5000, description="Prompt/question to generate answer for")
    context: Optional[str] = Field(None, max_length=10000, description="Additional context for the prompt")

    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "What are the key requirements for ISO 21001 compliance?",
                "context": "Educational institution seeking accreditation"
            }
        }


class SummarizeRequest(BaseModel):
    """Request model for summarizing content."""
    content: str = Field(..., min_length=1, max_length=50000, description="Content to summarize")
    maxLength: Optional[int] = Field(100, ge=10, le=5000, description="Maximum length of summary")

    class Config:
        json_schema_extra = {
            "example": {
                "content": "Long assessment text here...",
                "maxLength": 200
            }
        }


class CommentRequest(BaseModel):
    """Request model for generating comments/feedback."""
    text: str = Field(..., min_length=1, max_length=10000, description="Text to generate comments for")
    focus: Optional[str] = Field(None, max_length=500, description="Focus area for comments (e.g., 'quality', 'compliance')")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Assessment answer text...",
                "focus": "compliance with ISO 21001"
            }
        }


class ExplainRequest(BaseModel):
    """Request model for explaining concepts."""
    topic: str = Field(..., min_length=1, max_length=500, description="Topic or concept to explain")
    level: Optional[str] = Field("intermediate", description="Explanation level: basic, intermediate, advanced")

    class Config:
        json_schema_extra = {
            "example": {
                "topic": "ISO 21001 Educational Management System",
                "level": "intermediate"
            }
        }


class ExtractEvidenceRequest(BaseModel):
    """Request model for extracting evidence from text."""
    text: str = Field(..., min_length=1, max_length=50000, description="Text to extract evidence from")
    criteria: Optional[str] = Field(None, max_length=1000, description="Specific criteria to look for")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Document text containing evidence...",
                "criteria": "Leadership and commitment requirements"
            }
        }


# Response Models
class AIResponse(BaseModel):
    """Generic AI response."""
    result: str = Field(..., description="AI-generated result")
    model: str = Field(default="gemini-pro", description="Model used")

    class Config:
        json_schema_extra = {
            "example": {
                "result": "AI-generated response text...",
                "model": "gemini-pro"
            }
        }


