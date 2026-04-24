import asyncio
from typing import Dict, List, Any
import json
import logging
import time

logger = logging.getLogger(__name__)

# Maximum SSE subscribers per user — beyond this, evict the oldest queue
MAX_SUBSCRIBERS_PER_USER = 3

# Heartbeat interval (seconds) — stale queues are pruned if no heartbeat received
HEARTBEAT_INTERVAL = 30


class EventBus:
    """
    Real-time platform event bus for real-time updates.
    Supports per-user event streams with automatic cleanup.
    """
    def __init__(self):
        # user_id -> list of queues
        self.subscribers: Dict[str, List[asyncio.Queue]] = {}
        # Track last-active timestamps: id(queue) -> timestamp
        self._last_active: Dict[int, float] = {}

    async def subscribe(self, user_id: str) -> asyncio.Queue:
        """Subscribe to events for a specific user."""
        queue: asyncio.Queue = asyncio.Queue()
        if user_id not in self.subscribers:
            self.subscribers[user_id] = []

        user_queues = self.subscribers[user_id]

        # Evict oldest queues if at capacity
        while len(user_queues) >= MAX_SUBSCRIBERS_PER_USER:
            evicted = user_queues.pop(0)
            self._last_active.pop(id(evicted), None)
            # Signal the evicted consumer to stop
            try:
                evicted.put_nowait({"type": "__evicted__"})
            except asyncio.QueueFull:
                pass
            logger.info(
                f"User {user_id}: evicted oldest SSE subscriber (was at {len(user_queues) + 1})"
            )

        user_queues.append(queue)
        self._last_active[id(queue)] = time.monotonic()
        logger.info(
            f"User {user_id} subscribed to event bus. "
            f"Total subscribers: {len(user_queues)}"
        )
        return queue

    def unsubscribe(self, user_id: str, queue: asyncio.Queue):
        """Unsubscribe from events."""
        self._last_active.pop(id(queue), None)
        if user_id in self.subscribers:
            try:
                self.subscribers[user_id].remove(queue)
                if not self.subscribers[user_id]:
                    del self.subscribers[user_id]
                logger.info(
                    f"User {user_id} unsubscribed. "
                    f"Active subscribers: {len(self.subscribers.get(user_id, []))}"
                )
            except ValueError:
                pass

    def touch(self, queue: asyncio.Queue):
        """Mark a queue as active (called on each heartbeat)."""
        self._last_active[id(queue)] = time.monotonic()

    def prune_stale(self, max_idle_seconds: float = 90.0):
        """Remove queues that haven't been touched within the timeout."""
        now = time.monotonic()
        pruned = 0
        for user_id in list(self.subscribers.keys()):
            surviving: List[asyncio.Queue] = []
            for q in self.subscribers[user_id]:
                last = self._last_active.get(id(q), 0)
                if now - last > max_idle_seconds:
                    self._last_active.pop(id(q), None)
                    pruned += 1
                else:
                    surviving.append(q)
            if surviving:
                self.subscribers[user_id] = surviving
            else:
                del self.subscribers[user_id]
        if pruned:
            logger.info(f"EventBus: pruned {pruned} stale subscriber(s)")

    async def emit(self, user_id: str, event_type: str, data: Any):
        """Emit an event to all subscribers for a user."""
        if user_id in self.subscribers:
            event = {
                "type": event_type,
                "data": data,
                "timestamp": asyncio.get_event_loop().time()
            }
            # Use list copy to avoid modification during iteration
            for queue in self.subscribers[user_id][:]:
                try:
                    queue.put_nowait(event)
                except asyncio.QueueFull:
                    logger.warning(
                        f"EventBus: queue full for user {user_id}, dropping event"
                    )

# Global Event Bus Instance
event_bus = EventBus()
