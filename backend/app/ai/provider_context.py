"""Per-request AI provider preference (set from X-AI-Provider header via middleware)."""

from __future__ import annotations

from contextvars import ContextVar, Token
from typing import Optional

from app.ai.model_router import ModelRoute

request_ai_provider: ContextVar[Optional[str]] = ContextVar("request_ai_provider", default=None)
# When "single", only the preferred provider is tried (no Gemini↔OpenRouter fallback for that request).
request_ai_provider_mode: ContextVar[str] = ContextVar("request_ai_provider_mode", default="fallback")


def apply_provider_preference(route: ModelRoute) -> ModelRoute:
    """Reorder fallback chain for gemini/openrouter; optionally use a single provider only."""
    pref = request_ai_provider.get()
    mode = request_ai_provider_mode.get() or "fallback"

    if pref == "alt_llm":
        return ModelRoute(
            ("alt_llm",),
            None,
            route.task,
            route.reason,
            route.estimated_input_tokens,
            route.estimated_cost_usd,
        )

    providers = list(route.providers)
    if pref in ("gemini", "openrouter") and pref in providers:
        providers = [pref] + [p for p in providers if p != pref]
    elif pref not in ("gemini", "openrouter"):
        return route

    if mode == "single" and pref in ("gemini", "openrouter") and pref in providers:
        providers = [pref]

    new_tuple = tuple(providers)
    if new_tuple == route.providers:
        return route
    return ModelRoute(
        new_tuple,
        route.openrouter_model,
        route.task,
        route.reason,
        route.estimated_input_tokens,
        route.estimated_cost_usd,
    )


def set_request_ai_provider_for_tests(value: Optional[str]) -> Token:
    """Reset token for tests; production uses middleware only."""
    return request_ai_provider.set(value)
