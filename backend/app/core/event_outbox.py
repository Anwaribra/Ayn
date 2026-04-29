"""Durable event outbox for Horus-aware platform events."""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any
from uuid import uuid4

from app.core.db import get_db
from app.core.jobs import enqueue_job

logger = logging.getLogger(__name__)

CREATE_EVENT_OUTBOX_SQL = """
CREATE TABLE IF NOT EXISTS "EventOutbox" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'backend',
    payload JSONB NOT NULL DEFAULT '{}',
    "streamId" TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "processedAt" TIMESTAMPTZ
)
"""

EVENT_OUTBOX_INDEX_SQL = [
    'CREATE INDEX IF NOT EXISTS "idx_event_outbox_status_created" ON "EventOutbox"(status, "createdAt")',
    'CREATE INDEX IF NOT EXISTS "idx_event_outbox_user_created" ON "EventOutbox"("userId", "createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS "idx_event_outbox_type_status" ON "EventOutbox"(type, status)',
]

_ENSURED = False


async def ensure_event_outbox_table() -> None:
    global _ENSURED
    if _ENSURED:
        return
    db = get_db()
    await db.execute_raw(CREATE_EVENT_OUTBOX_SQL)
    for sql in EVENT_OUTBOX_INDEX_SQL:
        await db.execute_raw(sql)
    _ENSURED = True


async def append_event(
    *,
    user_id: str,
    event_type: str,
    payload: dict[str, Any],
    stream_id: str | None = None,
    source: str = "backend",
) -> str:
    """Persist a durable event and enqueue Horus observation."""
    await ensure_event_outbox_table()
    event_id = str(uuid4())
    db = get_db()
    await db.execute_raw(
        """
        INSERT INTO "EventOutbox"
          (id, "userId", type, source, payload, "streamId", status, attempts, "createdAt")
        VALUES
          ($1, $2, $3, $4, $5::jsonb, $6, 'pending', 0, NOW())
        """,
        event_id,
        user_id,
        event_type,
        source,
        json.dumps(payload),
        stream_id,
    )
    try:
        await enqueue_job(
            "horus.observe_event",
            {
                "event_id": event_id,
                "user_id": user_id,
                "type": event_type,
                "payload": payload,
                "stream_id": stream_id,
                "source": source,
            },
            priority=40,
        )
    except Exception as exc:
        logger.debug("Could not enqueue Horus observer job for event %s: %s", event_id, exc)
    return event_id


async def mark_event_processed(event_id: str) -> None:
    db = get_db()
    await db.execute_raw(
        """
        UPDATE "EventOutbox"
        SET status = 'processed', "processedAt" = NOW(), "lastError" = NULL
        WHERE id = $1
        """,
        event_id,
    )


async def mark_event_failed(event_id: str, error: Exception) -> None:
    db = get_db()
    await db.execute_raw(
        """
        UPDATE "EventOutbox"
        SET status = 'failed', attempts = attempts + 1, "lastError" = $2
        WHERE id = $1
        """,
        event_id,
        str(error)[:4000],
    )


def serialize_event_for_model(row: dict[str, Any]) -> dict[str, Any]:
    payload = row.get("payload") or {}
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            payload = {"raw": payload}
    created_at = row.get("createdAt") or row.get("created_at")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()
    return {
        "event_id": row.get("id"),
        "user_id": row.get("userId") or row.get("user_id"),
        "type": row.get("type"),
        "payload": payload,
        "source": row.get("source"),
        "stream_id": row.get("streamId") or row.get("stream_id"),
        "created_at": created_at,
    }
