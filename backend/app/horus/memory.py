"""Persistent Horus memory layer."""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any
from uuid import uuid4

from app.core.db import get_db
from app.core.redis import redis_client

logger = logging.getLogger(__name__)

CREATE_HORUS_MEMORY_SQL = """
CREATE TABLE IF NOT EXISTS "HorusMemory" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "institutionId" TEXT,
    scope TEXT NOT NULL DEFAULT 'user',
    kind TEXT NOT NULL,
    content TEXT NOT NULL,
    salience DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "sourceChatId" TEXT,
    "contentHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
"""

HORUS_MEMORY_INDEX_SQL = [
    'CREATE INDEX IF NOT EXISTS "idx_horus_memory_user_salience" ON "HorusMemory"("userId", salience DESC, "updatedAt" DESC)',
    'CREATE INDEX IF NOT EXISTS "idx_horus_memory_institution" ON "HorusMemory"("institutionId", kind, salience DESC)',
    'CREATE UNIQUE INDEX IF NOT EXISTS "idx_horus_memory_user_hash" ON "HorusMemory"("userId", "contentHash")',
]

MEMORY_CACHE_PREFIX = "horus:memory:"
MEMORY_TTL_SECONDS = 10 * 60
_ENSURED = False


async def ensure_horus_memory_table() -> None:
    global _ENSURED
    if _ENSURED:
        return
    db = get_db()
    await db.execute_raw(CREATE_HORUS_MEMORY_SQL)
    for sql in HORUS_MEMORY_INDEX_SQL:
        await db.execute_raw(sql)
    _ENSURED = True


class HorusMemoryService:
    @staticmethod
    def _hash(content: str) -> str:
        return hashlib.sha256(" ".join(content.lower().split()).encode("utf-8")).hexdigest()

    @staticmethod
    def _cache_key(user_id: str, institution_id: str | None) -> str:
        return f"{MEMORY_CACHE_PREFIX}{user_id}:{institution_id or 'none'}"

    @classmethod
    async def remember_exchange(
        cls,
        *,
        user_id: str,
        institution_id: str | None = None,
        chat_id: str | None = None,
        user_message: str | None = None,
        assistant_response: str | None = None,
    ) -> None:
        text = cls._extract_memory(user_message or "", assistant_response or "")
        if not text:
            return
        try:
            await ensure_horus_memory_table()
            db = get_db()
            digest = cls._hash(text)
            await db.execute_raw(
                """
                INSERT INTO "HorusMemory"
                  (id, "userId", "institutionId", scope, kind, content, salience, "sourceChatId", "contentHash", "createdAt", "updatedAt")
                VALUES
                  ($1, $2, $3, 'user', 'preference_or_context', $4, $5, $6, $7, NOW(), NOW())
                ON CONFLICT ("userId", "contentHash") DO UPDATE
                SET salience = LEAST(1.0, "HorusMemory".salience + 0.05),
                    "lastUsedAt" = NOW(),
                    "updatedAt" = NOW()
                """,
                str(uuid4()),
                user_id,
                institution_id,
                text,
                cls._salience(user_message or "", assistant_response or ""),
                chat_id,
                digest,
            )
            if redis_client.enabled:
                redis_client.delete(cls._cache_key(user_id, institution_id))
        except Exception as exc:
            logger.debug("Horus memory write skipped: %s", exc)

    @classmethod
    async def get_context(cls, user_id: str, institution_id: str | None = None, limit: int = 6) -> str:
        cache_key = cls._cache_key(user_id, institution_id)
        cached = redis_client.get(cache_key) if redis_client.enabled else None
        if cached:
            return cached
        try:
            await ensure_horus_memory_table()
            db = get_db()
            rows = await db.query_raw(
                """
                SELECT content
                FROM "HorusMemory"
                WHERE "userId" = $1 AND ("institutionId" = $2 OR "institutionId" IS NULL)
                ORDER BY salience DESC, "updatedAt" DESC
                LIMIT $3
                """,
                user_id,
                institution_id,
                limit,
            )
            lines = [str(row.get("content") or "").strip() for row in rows or [] if row.get("content")]
            result = "Horus memory:\n" + "\n".join(f"- {line}" for line in lines) if lines else ""
            if result and redis_client.enabled:
                redis_client.set(cache_key, result, ex=MEMORY_TTL_SECONDS)
            return result
        except Exception as exc:
            logger.debug("Horus memory read skipped: %s", exc)
            return ""

    @staticmethod
    def _extract_memory(user_message: str, assistant_response: str) -> str:
        text = " ".join((user_message or "").split())
        lowered = text.lower()
        if not text or len(text) < 20:
            return ""
        memory_cues = ("remember", "my institution", "we use", "prefer", "call me", "our standard", "مؤسستي", "نستخدم", "تذكر")
        if any(cue in lowered for cue in memory_cues):
            return text[:500]
        if any(cue in lowered for cue in ("iso", "ncaaa", "naqaae", "aacsb", "abet", "اعتماد", "معيار")):
            return text[:360]
        return ""

    @staticmethod
    def _salience(user_message: str, assistant_response: str) -> float:
        text = f"{user_message} {assistant_response}".lower()
        score = 0.45
        for cue in ("remember", "prefer", "my institution", "critical", "deadline", "audit", "تذكر", "مهم"):
            if cue in text:
                score += 0.1
        return min(score, 0.95)
