"""Lightweight AI/product metrics hooks for Horus."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.core.db import get_db

logger = logging.getLogger(__name__)

CREATE_AI_USAGE_METRIC_SQL = """
CREATE TABLE IF NOT EXISTS "AIUsageMetric" (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    "institutionId" TEXT,
    feature TEXT NOT NULL DEFAULT 'horus',
    operation TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT,
    "routeReason" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "cacheHit" BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
"""

AI_USAGE_INDEX_SQL = [
    'CREATE INDEX IF NOT EXISTS "idx_ai_usage_created" ON "AIUsageMetric"("createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS "idx_ai_usage_user_created" ON "AIUsageMetric"("userId", "createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS "idx_ai_usage_feature_operation" ON "AIUsageMetric"(feature, operation, "createdAt" DESC)',
]

_ENSURED = False


async def ensure_ai_usage_metric_table() -> None:
    global _ENSURED
    if _ENSURED:
        return
    db = get_db()
    await db.execute_raw(CREATE_AI_USAGE_METRIC_SQL)
    for sql in AI_USAGE_INDEX_SQL:
        await db.execute_raw(sql)
    _ENSURED = True


def estimate_tokens(text: str | None) -> int:
    if not text:
        return 0
    return max(1, int(len(text) / 4))


def estimate_message_tokens(messages: list[dict[str, Any]] | None, context: str | None = None) -> int:
    total = estimate_tokens(context)
    for msg in messages or []:
        content = msg.get("content", "")
        if isinstance(content, str):
            total += estimate_tokens(content)
        else:
            total += estimate_tokens(json.dumps(content, default=str))
    return total


async def record_ai_usage(
    *,
    operation: str,
    provider: str,
    model: str | None,
    route_reason: str | None,
    input_tokens: int,
    output_tokens: int,
    estimated_cost_usd: float,
    latency_ms: int,
    user_id: str | None = None,
    institution_id: str | None = None,
    feature: str = "horus",
    cache_hit: bool = False,
    metadata: dict[str, Any] | None = None,
) -> None:
    try:
        await ensure_ai_usage_metric_table()
        db = get_db()
        await db.execute_raw(
            """
            INSERT INTO "AIUsageMetric"
              (id, "userId", "institutionId", feature, operation, provider, model, "routeReason",
               "inputTokens", "outputTokens", "estimatedCostUsd", "latencyMs", "cacheHit", metadata, "createdAt")
            VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15)
            """,
            str(uuid4()),
            user_id,
            institution_id,
            feature,
            operation,
            provider,
            model,
            route_reason,
            int(input_tokens or 0),
            int(output_tokens or 0),
            float(estimated_cost_usd or 0),
            int(latency_ms or 0),
            bool(cache_hit),
            json.dumps(metadata or {}),
            datetime.now(timezone.utc),
        )
    except Exception as exc:
        logger.debug("AI usage metric skipped: %s", exc)
