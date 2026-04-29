"""Durable lightweight job queue backed by PostgreSQL.

The project currently avoids adding a worker dependency. This module provides a
production-friendly queue boundary using raw SQL so it works before Prisma model
generation and can later be swapped for ARQ/Celery without changing callers.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable
from uuid import uuid4

from app.core.db import get_db

logger = logging.getLogger(__name__)

JobHandler = Callable[[dict[str, Any]], Awaitable[None]]
_HANDLERS: dict[str, JobHandler] = {}
_ENSURED = False


CREATE_JOBS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS "AsyncJob" (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    priority INTEGER NOT NULL DEFAULT 100,
    attempts INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    payload JSONB NOT NULL DEFAULT '{}',
    "lastError" TEXT,
    "runAfter" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "lockedAt" TIMESTAMPTZ,
    "lockedBy" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
"""

JOB_INDEX_SQL = [
    'CREATE INDEX IF NOT EXISTS "idx_async_job_status_run_after" ON "AsyncJob"(status, "runAfter", priority)',
    'CREATE INDEX IF NOT EXISTS "idx_async_job_type_status" ON "AsyncJob"(type, status)',
    'CREATE INDEX IF NOT EXISTS "idx_async_job_created_at" ON "AsyncJob"("createdAt" DESC)',
]


async def ensure_jobs_table() -> None:
    global _ENSURED
    if _ENSURED:
        return
    db = get_db()
    await db.execute_raw(CREATE_JOBS_TABLE_SQL)
    for sql in JOB_INDEX_SQL:
        await db.execute_raw(sql)
    _ENSURED = True


def register_job_handler(job_type: str, handler: JobHandler) -> None:
    _HANDLERS[job_type] = handler


async def enqueue_job(
    job_type: str,
    payload: dict[str, Any],
    *,
    priority: int = 100,
    max_attempts: int = 3,
    run_after: datetime | None = None,
) -> str:
    await ensure_jobs_table()
    job_id = str(uuid4())
    db = get_db()
    await db.execute_raw(
        """
        INSERT INTO "AsyncJob"
          (id, type, status, priority, attempts, "maxAttempts", payload, "runAfter", "createdAt", "updatedAt")
        VALUES
          ($1, $2, 'queued', $3, 0, $4, $5::jsonb, COALESCE($6, NOW()), NOW(), NOW())
        """,
        job_id,
        job_type,
        priority,
        max_attempts,
        json.dumps(payload),
        run_after,
    )
    return job_id


async def claim_jobs(*, worker_id: str, limit: int = 5) -> list[dict[str, Any]]:
    await ensure_jobs_table()
    db = get_db()
    rows = await db.query_raw(
        """
        WITH picked AS (
            SELECT id
            FROM "AsyncJob"
            WHERE status = 'queued' AND "runAfter" <= NOW()
            ORDER BY priority ASC, "createdAt" ASC
            LIMIT $1
            FOR UPDATE SKIP LOCKED
        )
        UPDATE "AsyncJob" j
        SET status = 'running',
            "lockedAt" = NOW(),
            "lockedBy" = $2,
            attempts = attempts + 1,
            "updatedAt" = NOW()
        FROM picked
        WHERE j.id = picked.id
        RETURNING j.id, j.type, j.payload, j.attempts, j."maxAttempts"
        """,
        limit,
        worker_id,
    )
    return list(rows or [])


async def complete_job(job_id: str) -> None:
    db = get_db()
    await db.execute_raw(
        """
        UPDATE "AsyncJob"
        SET status = 'succeeded', "updatedAt" = NOW(), "lockedAt" = NULL, "lockedBy" = NULL
        WHERE id = $1
        """,
        job_id,
    )


async def fail_job(job: dict[str, Any], error: Exception) -> None:
    db = get_db()
    attempts = int(job.get("attempts") or 1)
    max_attempts = int(job.get("maxAttempts") or job.get("max_attempts") or 3)
    terminal = attempts >= max_attempts
    delay_seconds = min(60 * attempts, 300)
    await db.execute_raw(
        """
        UPDATE "AsyncJob"
        SET status = $2,
            "lastError" = $3,
            "runAfter" = CASE WHEN $2 = 'queued' THEN NOW() + ($4 || ' seconds')::interval ELSE "runAfter" END,
            "updatedAt" = NOW(),
            "lockedAt" = NULL,
            "lockedBy" = NULL
        WHERE id = $1
        """,
        job["id"],
        "failed" if terminal else "queued",
        str(error)[:4000],
        delay_seconds,
    )


async def run_claimed_job(job: dict[str, Any]) -> None:
    handler = _HANDLERS.get(job["type"])
    if not handler:
        raise RuntimeError(f"No handler registered for job type {job['type']}")
    payload = job.get("payload") or {}
    if isinstance(payload, str):
        payload = json.loads(payload)
    await handler(payload)


async def run_worker_once(*, worker_id: str | None = None, limit: int = 5) -> int:
    worker_id = worker_id or f"worker-{os.getpid()}"
    jobs = await claim_jobs(worker_id=worker_id, limit=limit)
    for job in jobs:
        try:
            await run_claimed_job(job)
            await complete_job(job["id"])
        except Exception as exc:
            logger.error("Async job failed: %s (%s)", job.get("type"), exc, exc_info=True)
            await fail_job(job, exc)
    return len(jobs)


async def run_worker_loop(*, worker_id: str | None = None, poll_interval: float = 1.0, limit: int = 5) -> None:
    while True:
        count = await run_worker_once(worker_id=worker_id, limit=limit)
        if count == 0:
            await asyncio.sleep(poll_interval)
