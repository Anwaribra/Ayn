"""Pydantic models for AI module."""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class ChatMessage(BaseModel):
    """A single message in a conversation."""
    role: Literal["user", "assistant"] = Field(..., description="Role of the message sender")
    content: str = Field(..., min_length=1, max_length=10000, description="Message content")


class ChatRequest(BaseModel):
    """Request model for multi-turn chat."""
    messages: List[ChatMessage] = Field(..., min_length=1, max_length=500, description="Conversation history")
    context: Optional[str] = Field(None, max_length=200, description="Context hint (e.g. 'gap_analysis', 'evidence_analysis')")

    class Config:
        json_schema_extra = {
            "example": {
                "messages": [
                    {"role": "user", "content": "What are the key requirements for ISO 21001 compliance?"}
                ],
                "context": "alignment_help"
            }
        }


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
                "content": "Long framework analysis text here...",
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
                "text": "Alignment analysis text...",
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
    result: Optional[str] = Field(None, description="DEPRECATED: Use raw_text instead. Kept for backward compatibility.")
    raw_text: Optional[str] = Field(None, description="Raw text output from the model")
    structured: Optional[dict] = Field(None, description="Parsed JSON structure if available")
    error: Optional[str] = Field(None, description="Error message if parsing failed")
    analysis_id: Optional[str] = Field(None, description="ID of persisted gap analysis if saved")
    metrics_updated: bool = Field(False, description="Whether platform metrics were updated")
    model: str = Field(default="gemini-pro", description="Model used")

    class Config:
        json_schema_extra = {
            "example": {
                "raw_text": "Here is the analysis: {...}",
                "structured": {"score": 85, "summary": "Good..."},
                "model": "gemini-pro"
            }
        }

class DraftRequest(BaseModel):
    """Request model for auto-drafting a document based on a gap."""
    gap_id: str = Field(..., description="ID of the PlatformGap to remediate")
    institution_id: str = Field(..., description="ID of the institution")
    custom_instructions: Optional[str] = Field(None, description="Optional extra instructions for the AI")

class MockAuditStartRequest(BaseModel):
    """Request model to initialize a mock audit session."""
    institution_id: str = Field(..., description="ID of the institution being audited")
    standard_id: Optional[str] = Field(None, description="Optional specific standard to audit against")

class MockAuditMessageRequest(BaseModel):
    """Request model to send a message in a mock audit."""
    session_id: str = Field(..., description="ID of the active MockAuditSession")
    content: str = Field(..., description="The user's response to the auditor")

