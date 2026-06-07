import asyncio
import json
import logging
import uuid
from fastapi import APIRouter, Query, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from v2.core.redis import get_redis_client
from v2.core.database import get_db_session
from v2.modules.notifications.services import NotificationService
from v2.core.logging import setup_logger

logger = setup_logger("v2.modules.notifications.router")

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/stream")
async def stream_notifications(
    user_id: uuid.UUID | None = Query(None),
    campus_id: uuid.UUID | None = Query(None),
    redis_client: Redis = Depends(get_redis_client)
):
    """
    Server-Sent Events (SSE) streaming endpoint for real-time notifications.
    Listens to Redis Pub/Sub channels. Hardened with backpressure queue limits, heartbeats, and client evictions.
    """
    async def event_generator():
        # Decouple message receiving from yielding using an asyncio.Queue (backpressure max limit 100)
        queue = asyncio.Queue(maxsize=100)
        pubsub = redis_client.pubsub()
        
        channels = ["notifications:global"]
        if campus_id:
            channels.append(f"notifications:campus:{campus_id}")
        if user_id:
            channels.append(f"notifications:user:{user_id}")
            
        await pubsub.subscribe(*channels)
        logger.info(f"SSE client subscribed to Redis channels: {channels}")
        
        # Reader task to continuously pull messages from Redis pubsub and push them to queue
        async def pubsub_reader():
            try:
                while True:
                    message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                    if message:
                        data = message["data"]
                        if isinstance(data, bytes):
                            data = data.decode("utf-8")
                        try:
                            queue.put_nowait(data)
                        except asyncio.QueueFull:
                            # Drop oldest notification to manage queue size and memory limits
                            try:
                                queue.get_nowait()
                            except asyncio.QueueEmpty:
                                pass
                            await queue.put(data)
                            logger.warning("[SSE] Notification queue full. Dropping oldest notification.")
                    await asyncio.sleep(0.01) # Yield execution control
            except asyncio.CancelledError:
                pass
            except Exception as e:
                logger.error(f"[SSE] Error in pubsub reader: {e}")
                
        reader_task = asyncio.create_task(pubsub_reader())
        
        try:
            # Yield initial connection confirmation
            yield "data: {\"event\": \"connected\"}\n\n"
            
            last_heartbeat = asyncio.get_event_loop().time()
            heartbeat_interval = 15.0 # Keepalive ping every 15s to maintain stable connection
            
            while True:
                now = asyncio.get_event_loop().time()
                time_until_heartbeat = max(0.1, heartbeat_interval - (now - last_heartbeat))
                
                try:
                    # Wait for items in queue
                    data = await asyncio.wait_for(queue.get(), timeout=time_until_heartbeat)
                    yield f"data: {data}\n\n"
                    queue.task_done()
                except asyncio.TimeoutError:
                    # Heartbeat interval reached with no message: send keepalive ping to prevent connection timeout
                    yield ": keepalive\n\n"
                    last_heartbeat = asyncio.get_event_loop().time()
                    
        except asyncio.CancelledError:
            logger.info("SSE client disconnected, evicting client resources.")
        except Exception as e:
            logger.error(f"Error yielding SSE notification (client evicted): {e}")
        finally:
            reader_task.cancel()
            try:
                await reader_task
            except asyncio.CancelledError:
                pass
            await pubsub.unsubscribe(*channels)
            await pubsub.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/send")
async def send_manual_notification(
    title: str,
    message: str,
    notif_type: str,
    user_id: uuid.UUID | None = None,
    campus_id: uuid.UUID | None = None,
    severity: str = "MEDIUM",
    db: AsyncSession = Depends(get_db_session),
    redis_client: Redis = Depends(get_redis_client)
):
    """
    Manual dispatch endpoint for development and testing.
    """
    notif = await NotificationService.create_and_dispatch_notification(
        db=db,
        redis_client=redis_client,
        title=title,
        message=message,
        notif_type=notif_type,
        user_id=user_id,
        campus_id=campus_id,
        severity=severity
    )
    return {"status": "dispatched", "notification_id": str(notif.id) if notif else None}
