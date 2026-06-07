import uuid
import json
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from redis.asyncio import Redis

from v2.modules.notifications.models import Notification, NotificationPreference, NotificationStatus, NotificationChannel
from v2.core.logging import setup_logger

logger = setup_logger("v2.modules.notifications.services")

class NotificationService:
    @staticmethod
    async def create_and_dispatch_notification(
        db: AsyncSession,
        redis_client: Redis,
        title: str,
        message: str,
        notif_type: str,
        user_id: uuid.UUID | None = None,
        campus_id: uuid.UUID | None = None,
        severity: str = "MEDIUM"
    ) -> Notification | None:
        """
        Creates and dispatches a notification, checking user preferences and publishing to Redis Pub/Sub for SSE.
        """
        # 1. Preferences check
        # If directed to a specific user, check preferences
        if user_id:
            pref_stmt = select(NotificationPreference).where(
                NotificationPreference.user_id == user_id,
                NotificationPreference.channel == NotificationChannel.IN_APP
            )
            pref = (await db.execute(pref_stmt)).scalar_one_or_none()
            
            # Gating filter logic
            if pref:
                if not pref.enabled:
                    logger.info(f"Skipping notification for user {user_id}: IN_APP channel disabled.")
                    return None
                    
                severity_ranks = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
                pref_rank = severity_ranks.get(pref.min_severity, 1)
                notif_rank = severity_ranks.get(severity, 2)
                
                if notif_rank < pref_rank:
                    logger.info(f"Skipping notification for user {user_id}: severity {severity} below min threshold {pref.min_severity}.")
                    return None

        # 2. Persist in DB
        notification = Notification(
            user_id=user_id,
            campus_id=campus_id,
            title=title,
            message=message,
            type=notif_type,
            status=NotificationStatus.UNREAD
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        
        # 3. Publish to Redis Pub/Sub channel for SSE stream
        pub_payload = {
            "id": str(notification.id),
            "user_id": str(user_id) if user_id else None,
            "campus_id": str(campus_id) if campus_id else None,
            "title": title,
            "message": message,
            "type": notif_type,
            "status": notification.status.value,
            "created_at": notification.created_at.isoformat()
        }
        
        # We channel broadcast to either a user-specific topic or campus-wide topic
        channel_name = f"notifications:campus:{campus_id}" if campus_id else "notifications:global"
        if user_id:
            channel_name = f"notifications:user:{user_id}"
            
        await redis_client.publish(channel_name, json.dumps(pub_payload))
        logger.info(f"Persisted and broadcast notification {notification.id} to Redis channel {channel_name}.")
        return notification
