"""User/institution context brain cache."""

from __future__ import annotations

import json
from typing import Any

from app.core.redis import redis_client

CONTEXT_CACHE_PREFIX = "horus:brain_context:"
CONTEXT_CACHE_TTL_SECONDS = 5 * 60
_LOCAL_CONTEXT_CACHE: dict[str, dict[str, str]] = {}


class HorusContextCache:
    @staticmethod
    def key(user_id: str) -> str:
        return f"{CONTEXT_CACHE_PREFIX}{user_id}"

    @classmethod
    def get(cls, user_id: str) -> dict[str, str] | None:
        key = cls.key(user_id)
        raw = redis_client.get(key) if redis_client.enabled else None
        if raw:
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                pass
        return _LOCAL_CONTEXT_CACHE.get(key)

    @classmethod
    def set(cls, user_id: str, value: dict[str, Any]) -> None:
        normalized = {k: "" if v is None else str(v) for k, v in value.items()}
        key = cls.key(user_id)
        _LOCAL_CONTEXT_CACHE[key] = normalized
        if redis_client.enabled:
            redis_client.set(key, json.dumps(normalized), ex=CONTEXT_CACHE_TTL_SECONDS)

    @classmethod
    def invalidate(cls, user_id: str) -> None:
        key = cls.key(user_id)
        _LOCAL_CONTEXT_CACHE.pop(key, None)
        if redis_client.enabled:
            redis_client.delete(key)
