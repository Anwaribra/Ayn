from datetime import datetime
from typing import List, Optional, Any, Dict
from app.core.db import get_db
from prisma import Json
from prisma.models import Activity

class ActivityService:
    @staticmethod
    async def log_activity(
        user_id: str, 
        type: str, 
        title: str, 
        description: Optional[str] = None,
        entity_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        metadata: Dict[str, Any] = None
    ) -> Activity:
        db = get_db()
        activity = await db.activity.create(
            data={
                "user": {"connect": {"id": user_id}},
                "type": type,
                "title": title,
                "description": description,
                "entityId": entity_id,
                "entityType": entity_type,
                "metadata": Json(metadata or {})
            }
        )
        
        # Emit to real-time event bus
        try:
            from app.core.events import event_bus
            await event_bus.emit(user_id, "activity", {
                "id": activity.id,
                "type": type,
                "title": title,
                "description": description,
                "entityId": entity_id,
                "entityType": entity_type
            })
        except Exception as e:
            print(f"Failed to emit event: {e}")

        # Post as system message to Horus last chat
        if type not in ["chat_message"]: # Avoid redundant chat logs
             try:
                from app.chat.service import ChatService
                await ChatService.add_system_message(
                    user_id=user_id, 
                    content=f"System: {title}. {description or ''}"
                )
             except Exception as e:
                print(f"Failed to post system message to Horus: {e}")

        return activity

    @staticmethod
    async def get_recent_activities(user_id: str, limit: int = 10) -> List[Activity]:
        db = get_db()
        return await db.activity.find_many(
            where={"userId": user_id},
            take=limit,
            order={"createdAt": "desc"}
        )

    @staticmethod
    async def list_activities(user_id: str, skip: int = 0, take: int = 20) -> List[Activity]:
        db = get_db()
        return await db.activity.find_many(
            where={"userId": user_id},
            skip=skip,
            take=take,
            order={"createdAt": "desc"}
        )
