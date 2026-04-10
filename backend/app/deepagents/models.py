"""Pydantic models for the experimental DeepAgents endpoints."""

from typing import Any, Optional

from pydantic import BaseModel, Field


class DeepResearchRequest(BaseModel):
    """User request for long-form deep research."""

    prompt: str = Field(..., min_length=3, description="Research prompt to send to the DeepAgents runtime.")
    chat_id: Optional[str] = Field(default=None, description="Existing Horus chat to associate this research run with.")


class DeepResearchResponse(BaseModel):
    """Response envelope for experimental deep research runs."""

    enabled: bool
    provider_ready: bool
    mode: str
    result: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)
