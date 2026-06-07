import json
import logging
import uuid
from datetime import datetime, UTC
from typing import Any, Awaitable, Callable
from redis.asyncio import Redis

from v2.core.logging import setup_logger, set_correlation_id

logger = setup_logger("v2.events.bus")

class EventPublisher:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    async def publish(
        self, 
        stream: str, 
        event_type: str, 
        payload: dict[str, Any], 
        correlation_id: str | None = None,
        actor_id: str | None = None,
        version: str = "v1"
    ) -> str:
        """
        Publish an event to a Redis Stream with strict schema versioning and correlation tracing.
        """
        event_id = str(uuid.uuid4())
        trace_id = correlation_id or str(uuid.uuid4())
        
        event_data = {
            "event_id": event_id,
            "correlation_id": trace_id,
            "type": f"{event_type}.{version}",
            "version": version,
            "timestamp": datetime.now(UTC).isoformat(),
            "actor_id": actor_id or "system",
            "payload": json.dumps(payload),
        }
        
        await self.redis.xadd(stream, event_data)
        logger.info(f"Published event {event_type}.{version} with ID {event_id} (Trace: {trace_id}) to {stream}")
        return event_id


class EventSubscriber:
    EVENT_TIMEOUTS = {
        "evidence.file.uploaded": 300,   # 5 mins for OCR
        "evidence.text.extracted": 120,  # 2 mins for AI signals
        "ai.signal.generated": 30,       # 30s for Validation
        "validation.completed": 30,      # 30s for Readiness
        "task.created": 30,              # 30s for notifications
    }

    def __init__(self, redis_client: Redis, group_name: str, consumer_name: str):
        self.redis = redis_client
        self.group_name = group_name
        self.consumer_name = consumer_name

    async def _ensure_group(self, stream: str):
        try:
            await self.redis.xgroup_create(stream, self.group_name, id="0", mkstream=True)
        except Exception as e:
            if "BUSYGROUP" not in str(e):
                logger.error(f"Error creating group for stream {stream}: {e}")
                raise

    def _get_lock_ttl(self, event_type: str) -> int:
        base_type = event_type
        if "." in event_type:
            parts = event_type.split(".")
            if parts[-1].startswith("v") and parts[-1][1:].isdigit():
                base_type = ".".join(parts[:-1])
        return self.EVENT_TIMEOUTS.get(base_type, 30)

    async def is_processed(self, event_id: str) -> bool:
        """
        Idempotency guard. Checks if the event has already been successfully processed.
        """
        key = f"processed_event_ids:{self.group_name}:{event_id}"
        val = await self.redis.get(key)
        if val:
            decoded = val.decode("utf-8") if isinstance(val, bytes) else val
            return decoded == "completed"
        return False

    async def acquire_processing_lock(self, event_id: str, lock_ttl: int) -> bool:
        """
        Atomically acquire a lock for processing this event to prevent concurrent runs.
        """
        key = f"processed_event_ids:{self.group_name}:{event_id}"
        success = await self.redis.set(key, "processing", ex=lock_ttl, nx=True)
        return success is True or success == 1

    async def mark_completed(self, event_id: str, ttl_seconds: int = 86400):
        """
        Mark the event as completed (processed successfully) with a default 24h TTL.
        """
        key = f"processed_event_ids:{self.group_name}:{event_id}"
        await self.redis.setex(key, ttl_seconds, "completed")

    async def release_lock(self, event_id: str):
        """
        Release lock on failure to allow retry.
        """
        key = f"processed_event_ids:{self.group_name}:{event_id}"
        val = await self.redis.get(key)
        if val:
            decoded = val.decode("utf-8") if isinstance(val, bytes) else val
            if decoded == "processing":
                await self.redis.delete(key)

    async def listen(self, stream: str, handler: Callable[[dict[str, Any]], Awaitable[None]]):
        """
        Listen to a Redis Stream with built-in tracing context extraction and idempotency protection.
        """
        await self._ensure_group(stream)
        logger.info(f"Consumer {self.consumer_name} listening to stream {stream} in group {self.group_name}")
        
        while True:
            try:
                # Block for 5 seconds waiting for new messages
                messages = await self.redis.xreadgroup(
                    groupname=self.group_name,
                    consumername=self.consumer_name,
                    streams={stream: ">"},
                    count=10,
                    block=5000
                )
                
                for stream_name, msg_list in messages:
                    for message_id, message_data in msg_list:
                        # Decode bytes to strings
                        decoded_data = {
                            k.decode('utf-8') if isinstance(k, bytes) else k: 
                            v.decode('utf-8') if isinstance(v, bytes) else v 
                            for k, v in message_data.items()
                        }
                        
                        event_id = decoded_data.get("event_id")
                        correlation_id = decoded_data.get("correlation_id")
                        event_type = decoded_data.get("type", "unknown")
                        
                        # Establish correlation context for logging
                        set_correlation_id(correlation_id)
                        
                        if event_id:
                            # 1. Check if already completed
                            if await self.is_processed(event_id):
                                logger.info(f"Skipping duplicate event {event_id} (already completed by group {self.group_name})")
                                await self.redis.xack(stream, self.group_name, message_id)
                                continue
                            
                            # 2. Acquire atomic processing lock
                            lock_ttl = self._get_lock_ttl(event_type)
                            if not await self.acquire_processing_lock(event_id, lock_ttl):
                                logger.info(f"Skipping event {event_id} (already being processed by another worker in group {self.group_name})")
                                # Do NOT ACK the message so it remains in PEL and can be retried later
                                continue
                        
                        try:
                            if "payload" in decoded_data and isinstance(decoded_data["payload"], str):
                                decoded_data["payload"] = json.loads(decoded_data["payload"])
                                
                            await handler(decoded_data)
                            
                            # Mark completed and ACK
                            if event_id:
                                await self.mark_completed(event_id)
                            await self.redis.xack(stream, self.group_name, message_id)
                            
                        except Exception as e:
                            logger.error(f"Error processing message {message_id} in {self.consumer_name}: {e}", exc_info=True)
                            # Release the lock so it can be retried/replayed
                            if event_id:
                                await self.release_lock(event_id)
                            # Let it remain un-ACKed in PEL (Pending Entries List) for worker retry or DLQ routing
            except Exception as e:
                logger.error(f"Error reading from stream {stream}: {e}")
                import asyncio
                await asyncio.sleep(5)
