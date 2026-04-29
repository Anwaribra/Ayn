"""Temporary file handoff for queued jobs."""

from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

JOB_FILE_DIR = Path(os.getenv("AYN_JOB_FILE_DIR", "/tmp/ayn-job-files"))


def write_job_file(content: bytes, suffix: str = "") -> str:
    JOB_FILE_DIR.mkdir(parents=True, exist_ok=True)
    path = JOB_FILE_DIR / f"{uuid4()}{suffix}"
    path.write_bytes(content)
    return str(path)


def read_job_file(path: str) -> bytes:
    return Path(path).read_bytes()


def cleanup_job_file(path: str | None) -> None:
    if not path:
        return
    try:
        Path(path).unlink()
    except FileNotFoundError:
        pass
    except OSError:
        pass
