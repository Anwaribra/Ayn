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
                "user": {"connect": {"id": user_id}},
                "title": title
            }
        )

    @staticmethod
    async def get_chat(chat_id: str, user_id: str, message_limit: int = 50) -> Optional[Chat]:
        db = get_db()
        return await db.chat.find_first(
            where={
                "id": chat_id,
                "userId": user_id
            },
            include={
                "messages": {
                    "take": -message_limit,  # Last N messages
                    "order_by": {"timestamp": "asc"}
                }
            }
        )

    @staticmethod
    async def list_chats(user_id: str) -> List[Chat]:
        db = get_db()
        return await db.chat.find_many(
            where={"userId": user_id},
            order={"updatedAt": "desc"}
        )

    @staticmethod
    async def get_last_chat(user_id: str, message_limit: int = 20) -> Optional[Chat]:
        db = get_db()
        return await db.chat.find_first(
            where={"userId": user_id},
            order={"updatedAt": "desc"},
            include={
                "messages": {
                    "take": -message_limit,
                    "order_by": {"timestamp": "asc"}
                }
            }
        )

    @staticmethod
    async def save_message(chat_id: str, user_id: str, role: str, content: str) -> Message:
        db = get_db()
        message = await db.message.create(
            data={
                "chat": {"connect": {"id": chat_id}},
                "userId": user_id, 
                "role": role,
                "content": content
            }
        )
        await db.chat.update(
            where={"id": chat_id},
            data={"updatedAt": datetime.utcnow()}
        )
        return message

    @staticmethod
    async def add_system_message(user_id: str, content: str, chat_id: Optional[str] = None) -> Optional[Message]:
        """Add a system message to the current or last chat."""
        if not chat_id:
            last_chat = await ChatService.get_last_chat(user_id)
            if not last_chat:
                last_chat = await ChatService.create_chat(user_id, title="System Activity")
            chat_id = last_chat.id
        
        return await ChatService.save_message(chat_id, user_id, "system", content)

    @staticmethod
    async def delete_chat(chat_id: str, user_id: str):
        db = get_db()
        return await db.chat.delete_many(
            where={
                "id": chat_id,
                "userId": user_id
            }
        )
