import asyncio
from typing import Dict, List, Any
import json
import logging

logger = logging.getLogger(__name__)

class EventBus:
    """
    Real-time platform event bus for real-time updates.
    Supports per-user event streams.
    """
    def __init__(self):
        # user_id -> list of queues
        self.subscribers: Dict[str, List[asyncio.Queue]] = {}

    async def subscribe(self, user_id: str) -> asyncio.Queue:
        """Subscribe to events for a specific user."""
        queue = asyncio.Queue()
        if user_id not in self.subscribers:
            self.subscribers[user_id] = []
        self.subscribers[user_id].append(queue)
        logger.info(f"User {user_id} subscribed to event bus. Total subscribers: {len(self.subscribers[user_id])}")
        return queue

    def unsubscribe(self, user_id: str, queue: asyncio.Queue):
        """Unsubscribe from events."""
        if user_id in self.subscribers:
            try:
                self.subscribers[user_id].remove(queue)
                if not self.subscribers[user_id]:
                    del self.subscribers[user_id]
                logger.info(f"User {user_id} unsubscribed. Active subscribers: {len(self.subscribers.get(user_id, []))}")
            except ValueError:
                pass

    async def emit(self, user_id: str, event_type: str, data: Any):
        """Emit an event to all subscribers for a user."""
        if user_id in self.subscribers:
            event = {
                "type": event_type,
                "data": data,
                "timestamp": asyncio.get_event_loop().time()
            }
            logger.info(f"Emitting {event_type} for user {user_id}")
            # Use list copy to avoid modification during iteration
            for queue in self.subscribers[user_id][:]:
                await queue.put(event)

# Global Event Bus Instance
event_bus = EventBus()
