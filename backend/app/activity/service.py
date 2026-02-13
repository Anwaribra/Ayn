from datetime import datetime
from typing import List, Optional, Any, Dict
from app.core.db import get_db
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
        metadata: Dict[str, Any] = {}
    ) -> Activity:
        db = get_db()
        return await db.activity.create(
            data={
                "userId": user_id,
                "type": type,
                "title": title,
                "description": description,
                "entityId": entity_id,
                "entityType": entity_type,
                "metadata": metadata
            }
        )

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
