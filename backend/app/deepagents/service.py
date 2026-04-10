"""Optional DeepAgents runtime wrapper for experimental research flows.

This module is intentionally isolated from the main Horus chat path so the
production assistant can remain stable while we evaluate DeepAgents for
multi-step planning and deep research jobs.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status

from app.core.config import settings
from app.horus.agent_context import build_agent_context

logger = logging.getLogger(__name__)


class DeepAgentsService:
    """Thin wrapper around the optional DeepAgents runtime."""

    @staticmethod
    def _effective_api_key() -> str | None:
        """Prefer explicit DeepAgents credentials, then fall back to OpenRouter."""
        return settings.DEEPAGENTS_API_KEY or settings.OPENROUTER_API_KEY

    @staticmethod
    def _effective_base_url() -> str | None:
        """Prefer explicit DeepAgents base URL, then fall back to OpenRouter."""
        return settings.DEEPAGENTS_BASE_URL or (
            "https://openrouter.ai/api/v1" if settings.OPENROUTER_API_KEY else None
        )

    @staticmethod
    def _effective_model() -> str:
        """Prefer explicit DeepAgents model, then fall back to OpenRouter's configured model."""
        return settings.DEEPAGENTS_MODEL or settings.OPENROUTER_MODEL

    @staticmethod
    def is_enabled() -> bool:
        return settings.DEEPAGENTS_ENABLED

    @staticmethod
    def _import_runtime() -> tuple[Any, Any, Any]:
        try:
            from deepagents import create_deep_agent
            from langchain.chat_models import init_chat_model
        except ImportError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "DeepAgents is not installed. Install the optional dependencies from "
                    "backend/requirements-deepagents.txt and set DEEPAGENTS_ENABLED=true."
                ),
            ) from exc

        try:
            from langchain_core.tools import tool
        except ImportError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="DeepAgents dependencies are incomplete. langchain-core is required.",
            ) from exc

        return create_deep_agent, init_chat_model, tool

    @staticmethod
    def _build_model():
        api_key = DeepAgentsService._effective_api_key()
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No provider API key is configured for DeepAgents. Set DEEPAGENTS_API_KEY or OPENROUTER_API_KEY.",
            )

        create_deep_agent, init_chat_model, tool = DeepAgentsService._import_runtime()

        model_name = DeepAgentsService._effective_model()
        kwargs: dict[str, Any] = {"api_key": api_key}
        base_url = DeepAgentsService._effective_base_url()
        if base_url:
            kwargs["base_url"] = base_url

        try:
            model = init_chat_model(model_name, **kwargs)
        except Exception as exc:
            logger.error("Failed to initialize DeepAgents model %s: %s", model_name, exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to initialize DeepAgents model '{model_name}'.",
            ) from exc

        return create_deep_agent, tool, model

    @staticmethod
    async def run_research(
        *,
        prompt: str,
        db: Any,
        user_id: str,
        institution_id: str | None,
    ) -> dict[str, Any]:
        """Run an isolated deep research flow with read-only Ayn context."""
        if not settings.DEEPAGENTS_ENABLED:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="DeepAgents is disabled for this environment.",
            )

        create_deep_agent, tool, model = DeepAgentsService._build_model()
        context_snapshot = await build_agent_context(
            db=db,
            user_id=user_id,
            institution_id=institution_id,
        )

        @tool
        def get_ayn_context() -> str:
            """Return a serialized read-only snapshot of the current Ayn workspace."""
            return str(context_snapshot)

        try:
            agent = create_deep_agent(
                model=model,
                tools=[get_ayn_context],
                system_prompt=settings.DEEPAGENTS_SYSTEM_PROMPT,
            )
            result = await agent.ainvoke(
                {
                    "messages": [
                        {
                            "role": "user",
                            "content": (
                                f"{prompt}\n\n"
                                "Use the get_ayn_context tool before making institution-specific claims. "
                                "Do not mutate data. Return a concise research memo with findings, risks, and next steps."
                            ),
                        }
                    ]
                }
            )
        except HTTPException:
            raise
        except Exception as exc:
            logger.error("DeepAgents research run failed: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="DeepAgents research run failed.",
            ) from exc

        output = DeepAgentsService._extract_result_text(result)
        return {
            "enabled": True,
            "provider_ready": True,
            "mode": "live",
            "result": output,
            "metadata": {
                "model": DeepAgentsService._effective_model(),
                "tools": ["get_ayn_context"],
            },
        }

    @staticmethod
    def preview_configuration() -> dict[str, Any]:
        """Return a safe readiness summary without touching the runtime."""
        return {
            "enabled": settings.DEEPAGENTS_ENABLED,
            "provider_ready": bool(DeepAgentsService._effective_api_key()),
            "mode": "preview",
            "result": None,
            "metadata": {
                "model": DeepAgentsService._effective_model(),
                "base_url_configured": bool(DeepAgentsService._effective_base_url()),
                "using_openrouter_fallback": bool(
                    settings.OPENROUTER_API_KEY and not settings.DEEPAGENTS_API_KEY
                ),
            },
        }

    @staticmethod
    def _extract_result_text(result: Any) -> str:
        """Normalize LangGraph/LangChain result payloads into plain text."""
        if isinstance(result, str):
            return result
        if isinstance(result, dict):
            messages = result.get("messages") or []
            if messages:
                last = messages[-1]
                content = getattr(last, "content", None)
                if isinstance(content, str):
                    return content
                if isinstance(last, dict):
                    raw_content = last.get("content")
                    if isinstance(raw_content, str):
                        return raw_content
                    if isinstance(raw_content, list):
                        text_parts = [part.get("text", "") for part in raw_content if isinstance(part, dict)]
                        joined = "\n".join(part for part in text_parts if part)
                        if joined:
                            return joined
            for key in ("output", "result", "content"):
                value = result.get(key)
                if isinstance(value, str) and value.strip():
                    return value
        return str(result)
