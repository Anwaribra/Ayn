"""Cost-aware multi-model routing policy for Horus AI."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

from app.core.metrics import estimate_message_tokens, estimate_tokens


@dataclass(frozen=True)
class ModelRoute:
    providers: tuple[str, ...]
    openrouter_model: str | None
    task: str
    reason: str
    estimated_input_tokens: int
    estimated_cost_usd: float


class MultiModelAIRouter:
    """Selects the cheapest capable model route for each Horus operation."""

    # Rough blended rates per 1M tokens. Kept configurable and intentionally
    # conservative; metrics are for directional cost control, not billing.
    GEMINI_FLASH_COST = float(os.getenv("AI_COST_GEMINI_FLASH_PER_1M", "0.20"))
    OPENROUTER_FAST_COST = float(os.getenv("AI_COST_OPENROUTER_FAST_PER_1M", "0.12"))
    OPENROUTER_REASONING_COST = float(os.getenv("AI_COST_OPENROUTER_REASONING_PER_1M", "1.20"))
    DIFY_COST = float(os.getenv("AI_COST_DIFY_PER_1M", "0.30"))

    FAST_MODEL = os.getenv("OPENROUTER_FAST_MODEL", os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001"))
    REASONING_MODEL = os.getenv("OPENROUTER_REASONING_MODEL", "google/gemini-2.0-flash-001")
    VISION_MODEL = os.getenv("OPENROUTER_VISION_MODEL", FAST_MODEL)

    @classmethod
    def route(
        cls,
        operation: str,
        *,
        messages: list[dict[str, Any]] | None = None,
        message: str | None = None,
        files: list[dict[str, Any]] | None = None,
        context: str | None = None,
    ) -> ModelRoute:
        text = " ".join(
            [
                message or "",
                context or "",
                " ".join(str(m.get("content", "")) for m in messages or []),
            ]
        ).lower()
        input_tokens = estimate_message_tokens(messages, context) + estimate_tokens(message)
        has_files = bool(files)
        has_images = any((f.get("type") == "image") or str(f.get("mime_type", "")).startswith("image/") for f in files or [])
        complex_task = any(
            token in text
            for token in (
                "audit", "gap analysis", "remediation", "strategy", "compare", "rank",
                "multi-step", "workflow", "risk", "root cause", "خطة", "تحليل", "مخاطر",
            )
        )

        if operation in {"create_embedding"}:
            return ModelRoute(("gemini",), None, "embedding", "embeddings require Gemini vector model", input_tokens, 0)
        if has_files or has_images:
            return ModelRoute(
                ("gemini", "openrouter", "dify"),
                cls.VISION_MODEL,
                "multimodal",
                "file/image analysis needs multimodal capability",
                input_tokens,
                cls._estimate(input_tokens, cls.GEMINI_FLASH_COST),
            )
        if input_tokens < 900 and not complex_task:
            return ModelRoute(
                ("openrouter", "gemini", "dify"),
                cls.FAST_MODEL,
                "fast_chat",
                "short general turn routed to lowest-latency low-cost model",
                input_tokens,
                cls._estimate(input_tokens, cls.OPENROUTER_FAST_COST),
            )
        if complex_task or input_tokens > 3500:
            return ModelRoute(
                ("gemini", "openrouter", "dify"),
                cls.REASONING_MODEL,
                "reasoning",
                "complex compliance reasoning needs stronger primary route",
                input_tokens,
                cls._estimate(input_tokens, cls.GEMINI_FLASH_COST),
            )
        return ModelRoute(
            ("gemini", "openrouter", "dify"),
            cls.FAST_MODEL,
            "balanced",
            "balanced compliance chat",
            input_tokens,
            cls._estimate(input_tokens, cls.GEMINI_FLASH_COST),
        )

    @staticmethod
    def _estimate(tokens: int, rate_per_1m: float) -> float:
        return round((tokens / 1_000_000) * rate_per_1m, 8)

    @classmethod
    def provider_rate(cls, provider: str, model: str | None = None) -> float:
        if provider == "openrouter":
            if model == cls.REASONING_MODEL:
                return cls.OPENROUTER_REASONING_COST
            return cls.OPENROUTER_FAST_COST
        if provider == "dify":
            return cls.DIFY_COST
        return cls.GEMINI_FLASH_COST
