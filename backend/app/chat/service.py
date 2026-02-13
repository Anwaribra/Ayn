from datetime import datetime
from typing import List, Optional
from app.core.db import get_db
from prisma.models import Chat, Message

class ChatService:
    @staticmethod
    async def create_chat(user_id: str, title: Optional[str] = "New Chat") -> Chat:
        db = get_db()
        return await db.chat.create(
            data={
                "userId": user_id,
                "title": title
            }
        )

    @staticmethod
    async def get_chat(chat_id: str, user_id: str) -> Optional[Chat]:
        db = get_db()
        return await db.chat.find_first(
            where={
                "id": chat_id,
                "userId": user_id
            },
            include={"messages": True}
        )

    @staticmethod
    async def list_chats(user_id: str) -> List[Chat]:
        db = get_db()
        return await db.chat.find_many(
            where={"userId": user_id},
            order={"updatedAt": "desc"}
        )

    @staticmethod
    async def save_message(chat_id: str, user_id: str, role: str, content: str) -> Message:
        db = get_db()
        # Save message
        message = await db.message.create(
            data={
                "chatId": chat_id,
                "userId": user_id,
                "role": role,
                "content": content
            }
        )
        # Update chat timestamp
        await db.chat.update(
            where={"id": chat_id},
            data={"updatedAt": datetime.utcnow()}
        )
        return message

    @staticmethod
    async def delete_chat(chat_id: str, user_id: str):
        db = get_db()
        return await db.chat.delete_many(
            where={
                "id": chat_id,
                "userId": user_id
            }
        )
