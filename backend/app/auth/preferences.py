"""User preferences service - persists settings like MFA, alerts, data residency."""
import json
import logging
from typing import Optional, Dict, Any
from app.core.db import get_db

logger = logging.getLogger(__name__)

class PreferencesService:
    @staticmethod
    async def get_preferences(user_id: str) -> Dict[str, Any]:
        db = get_db()
        activity = await db.activity.find_first(
            where={"userId": user_id, "type": "user_preferences", "entityType": "preferences"},
            order={"createdAt": "desc"}
        )
        if activity and activity.metadata:
            meta = activity.metadata if isinstance(activity.metadata, dict) else json.loads(activity.metadata)
            return meta.get("preferences", {})
        return {}

    @staticmethod
    async def save_preferences(user_id: str, preferences: Dict[str, Any]) -> Dict[str, Any]:
        db = get_db()
        existing = await PreferencesService.get_preferences(user_id)
        merged = {**existing, **preferences}
        await db.activity.create(data={
            "userId": user_id,
            "type": "user_preferences",
            "title": "Preferences updated",
            "entityType": "preferences",
            "metadata": json.dumps({"preferences": merged}),
        })
        return merged
