"""Per-request AI provider preference (set from X-AI-Provider header via middleware)."""

from __future__ import annotations

from contextvars import ContextVar, Token
from typing import Optional

from app.ai.model_router import ModelRoute

request_ai_provider: ContextVar[Optional[str]] = ContextVar("request_ai_provider", default=None)


def apply_provider_preference(route: ModelRoute) -> ModelRoute:
    """Move preferred provider (gemini / openrouter) to the front of the fallback chain when set."""
    pref = request_ai_provider.get()
    if pref not in ("gemini", "openrouter"):
        return route
    providers = list(route.providers)
    if pref not in providers:
        return route
    new_order = (pref,) + tuple(p for p in providers if p != pref)
    if new_order == route.providers:
        return route
    return ModelRoute(
        new_order,
        route.openrouter_model,
        route.task,
        route.reason,
        route.estimated_input_tokens,
        route.estimated_cost_usd,
    )


def set_request_ai_provider_for_tests(value: Optional[str]) -> Token:
    """Reset token for tests; production uses middleware only."""
    return request_ai_provider.set(value)
