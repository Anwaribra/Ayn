"""Run Ayn durable async workers.

Usage:
    python backend/scripts/run_worker.py
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.db import connect_db, disconnect_db
from app.core.jobs import run_worker_loop

# Import modules that register job handlers.
import app.evidence.service  # noqa: F401
import app.horus.observer  # noqa: F401
import app.horus.progressive_analysis  # noqa: F401
import app.rag.service  # noqa: F401

logging.basicConfig(level=logging.INFO)


async def main() -> None:
    await connect_db()
    try:
        await run_worker_loop(
            worker_id=os.getenv("AYN_WORKER_ID"),
            poll_interval=float(os.getenv("AYN_WORKER_POLL_INTERVAL", "1.0")),
            limit=int(os.getenv("AYN_WORKER_BATCH_SIZE", "5")),
        )
    finally:
        await disconnect_db()


if __name__ == "__main__":
    asyncio.run(main())
