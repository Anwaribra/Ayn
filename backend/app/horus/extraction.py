"""Fast file text extraction with cache."""

from __future__ import annotations

import hashlib
import io
import json
import logging
from typing import Any

from app.core.redis import redis_client

logger = logging.getLogger(__name__)

EXTRACT_CACHE_PREFIX = "horus:file_extract:"
EXTRACT_CACHE_TTL = 24 * 60 * 60
_LOCAL_EXTRACT_CACHE: dict[str, dict[str, Any]] = {}


def _cache_key(sha256: str) -> str:
    return f"{EXTRACT_CACHE_PREFIX}{sha256}"


def _sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _extract_pdf_text(content: bytes, max_pages: int) -> tuple[str, dict[str, Any]]:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(content))
    pages = []
    for page in reader.pages[:max_pages]:
        pages.append(page.extract_text() or "")
    text = "\n".join(pages).strip()
    return text, {"page_count": len(reader.pages), "pages_read": min(len(reader.pages), max_pages)}


def extract_text_cached(
    *,
    content: bytes,
    filename: str,
    mime_type: str,
    sha256: str | None = None,
    max_pages: int = 8,
    max_chars: int = 40_000,
) -> dict[str, Any]:
    sha = sha256 or _sha256(content)
    key = _cache_key(sha)
    cached = redis_client.get(key)
    if cached:
        try:
            payload = json.loads(cached)
            payload["cache_hit"] = True
            return payload
        except json.JSONDecodeError:
            pass
    if key in _LOCAL_EXTRACT_CACHE:
        payload = dict(_LOCAL_EXTRACT_CACHE[key])
        payload["cache_hit"] = True
        return payload

    text = ""
    meta: dict[str, Any] = {"page_count": None, "pages_read": None}
    try:
        if mime_type == "application/pdf" or filename.lower().endswith(".pdf"):
            text, meta = _extract_pdf_text(content, max_pages=max_pages)
        elif mime_type.startswith("text/") or filename.lower().endswith((".txt", ".md", ".csv")):
            text = content.decode("utf-8", errors="replace")
        else:
            text = ""
    except Exception as exc:
        logger.debug("File extraction failed for %s: %s", filename, exc)
        text = ""

    payload = {
        "sha256": sha,
        "filename": filename,
        "mime_type": mime_type,
        "text": text[:max_chars],
        "text_length": len(text),
        "cache_hit": False,
        **meta,
    }
    redis_client.set(key, json.dumps(payload), ex=EXTRACT_CACHE_TTL)
    _LOCAL_EXTRACT_CACHE[key] = dict(payload)
    return payload
