"""Realtime platform events backed by Redis Streams.

The public `event_bus` API intentionally remains small and compatible with the
old in-memory bus. Redis Streams are used when configured; local development and
tests fall back to process-local queues.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from dataclasses import dataclass
from typing import Any, AsyncGenerator

from app.core.redis import redis_client

logger = logging.getLogger(__name__)

MAX_SUBSCRIBERS_PER_USER = int(os.getenv("HORUS_MAX_SSE_SUBSCRIBERS_PER_USER", "3"))
HEARTBEAT_INTERVAL = int(os.getenv("HORUS_EVENT_HEARTBEAT_SECONDS", "30"))
STREAM_PREFIX = os.getenv("HORUS_EVENT_STREAM_PREFIX", "horus:events:user:")
STREAM_MAXLEN = int(os.getenv("HORUS_EVENT_STREAM_MAXLEN", "1000"))


@dataclass(frozen=True)
class StreamEvent:
    id: str
    payload: dict[str, Any]


class EventBus:
    """Per-user realtime event bus with Redis Streams and local fallback."""

    def __init__(self) -> None:
        self.subscribers: dict[str, list[asyncio.Queue]] = {}
        self._last_active: dict[int, float] = {}

    @staticmethod
    def stream_key(user_id: str) -> str:
        return f"{STREAM_PREFIX}{user_id}"

    async def subscribe(self, user_id: str) -> asyncio.Queue:
        """Backward-compatible process-local subscription for tests/dev."""
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        queues = self.subscribers.setdefault(user_id, [])
        while len(queues) >= MAX_SUBSCRIBERS_PER_USER:
            evicted = queues.pop(0)
            self._last_active.pop(id(evicted), None)
            try:
                evicted.put_nowait({"type": "__evicted__"})
            except asyncio.QueueFull:
                pass
        queues.append(queue)
        self._last_active[id(queue)] = time.monotonic()
        return queue

    def unsubscribe(self, user_id: str, queue: asyncio.Queue) -> None:
        self._last_active.pop(id(queue), None)
        queues = self.subscribers.get(user_id)
        if not queues:
            return
        try:
            queues.remove(queue)
        except ValueError:
            return
        if not queues:
            self.subscribers.pop(user_id, None)

    def touch(self, queue: asyncio.Queue) -> None:
        self._last_active[id(queue)] = time.monotonic()

    def prune_stale(self, max_idle_seconds: float = 90.0) -> None:
        now = time.monotonic()
        for user_id in list(self.subscribers.keys()):
            queues = [
                q for q in self.subscribers[user_id]
                if now - self._last_active.get(id(q), 0) <= max_idle_seconds
            ]
            if queues:
                self.subscribers[user_id] = queues
            else:
                self.subscribers.pop(user_id, None)

    async def emit(
        self,
        user_id: str,
        event_type: str,
        data: Any,
        *,
        durable: bool = True,
        source: str = "backend",
    ) -> dict[str, Any]:
        """Publish an event to Redis Streams, local subscribers, and outbox."""
        event = {
            "type": event_type,
            "data": data,
            "source": source,
            "timestamp": time.time(),
        }

        stream_id: str | None = None
        if redis_client.enabled:
            stream_id = await asyncio.to_thread(self._xadd, user_id, event)
            if stream_id:
                event["streamId"] = stream_id

        await self._emit_local(user_id, event)

        if durable:
            try:
                from app.core.event_outbox import append_event

                await append_event(
                    user_id=user_id,
                    event_type=event_type,
                    payload=data if isinstance(data, dict) else {"value": data},
                    stream_id=stream_id,
                    source=source,
                )
            except Exception as exc:
                logger.debug("Event outbox append skipped: %s", exc)

        return event

    def _xadd(self, user_id: str, event: dict[str, Any]) -> str | None:
        try:
            client = redis_client.redis
            if not client:
                return None
            result = client.xadd(
                self.stream_key(user_id),
                {"event": json.dumps(event, separators=(",", ":"), default=str)},
                maxlen=STREAM_MAXLEN,
                approximate=True,
            )
            return str(result) if result else None
        except TypeError:
            try:
                result = redis_client.redis.xadd(
                    self.stream_key(user_id),
                    {"event": json.dumps(event, separators=(",", ":"), default=str)},
                )
                return str(result) if result else None
            except Exception as exc:
                logger.warning("Redis XADD failed: %s", exc)
                return None
        except Exception as exc:
            logger.warning("Redis XADD failed: %s", exc)
            return None

    async def _emit_local(self, user_id: str, event: dict[str, Any]) -> None:
        for queue in list(self.subscribers.get(user_id, [])):
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                logger.warning("EventBus local queue full for user %s", user_id)

    async def stream(
        self,
        user_id: str,
        *,
        last_id: str = "$",
        heartbeat_interval: int = HEARTBEAT_INTERVAL,
    ) -> AsyncGenerator[StreamEvent | None, None]:
        """Yield Redis Stream events; yield None for heartbeat ticks."""
        if not redis_client.enabled:
            queue = await self.subscribe(user_id)
            try:
                while True:
                    try:
                        item = await asyncio.wait_for(queue.get(), timeout=heartbeat_interval)
                    except asyncio.TimeoutError:
                        self.touch(queue)
                        yield None
                        continue
                    self.touch(queue)
                    if isinstance(item, dict) and item.get("type") == "__evicted__":
                        return
                    yield StreamEvent(id=str(item.get("streamId") or time.time()), payload=item)
            finally:
                self.unsubscribe(user_id, queue)
            return

        current_id = last_id or "$"
        while True:
            rows = await asyncio.to_thread(self._xread, user_id, current_id, heartbeat_interval)
            if not rows:
                yield None
                continue
            for event_id, payload in rows:
                current_id = event_id
                yield StreamEvent(id=event_id, payload=payload)

    def _xread(self, user_id: str, last_id: str, heartbeat_interval: int) -> list[tuple[str, dict[str, Any]]]:
        try:
            client = redis_client.redis
            if not client:
                return []
            response = client.xread(
                {self.stream_key(user_id): last_id},
                count=25,
                block=max(1000, heartbeat_interval * 1000),
            )
        except Exception as exc:
            logger.warning("Redis XREAD failed: %s", exc)
            return []

        parsed: list[tuple[str, dict[str, Any]]] = []
        for _stream_name, entries in response or []:
            for event_id, fields in entries or []:
                raw = fields.get("event") if isinstance(fields, dict) else None
                if isinstance(raw, bytes):
                    raw = raw.decode("utf-8")
                try:
                    payload = json.loads(raw or "{}")
                except json.JSONDecodeError:
                    payload = {"type": "event", "data": raw}
                parsed.append((str(event_id), payload))
        return parsed


event_bus = EventBus()
