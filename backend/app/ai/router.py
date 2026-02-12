"""AI router - Fast & Simple."""
import asyncio
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, Request
from typing import List
from app.auth.dependencies import require_roles
from app.ai.models import ChatRequest, AIResponse
from app.ai.service import get_gemini_client
from app.core.rate_limit import limiter
import base64

router = APIRouter()

ALLOWED_AI_ROLES = ["ADMIN", "TEACHER", "AUDITOR"]


@router.post("/chat", response_model=AIResponse)
@limiter.limit("10/minute")
async def chat(
    request: Request,
    body: ChatRequest,
    current_user: dict = Depends(require_roles(ALLOWED_AI_ROLES))
):
    """Multi-turn chat with Horus AI."""
    client = get_gemini_client()
    messages_dicts = [{"role": m.role, "content": m.content} for m in body.messages]
    result = await asyncio.to_thread(client.chat, messages=messages_dicts, context=body.context)
    return AIResponse(result=result, model="gemini-2.0-flash")


@router.post("/chat-with-files", response_model=AIResponse)
@limiter.limit("5/minute")
async def chat_with_files(
    request: Request,
    message: str = Form(...),
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(require_roles(ALLOWED_AI_ROLES))
):
    """Multi-modal chat with Horus AI - text + images/documents."""
    client = get_gemini_client()
    
    file_contents = []
    for file in files:
        content = await file.read()
        if file.content_type and file.content_type.startswith("image/"):
            file_contents.append({
                "type": "image",
                "mime_type": file.content_type,
                "data": base64.b64encode(content).decode("utf-8"),
                "filename": file.filename
            })
        else:
            try:
                file_contents.append({
                    "type": "text",
                    "data": content.decode("utf-8"),
                    "filename": file.filename
                })
            except:
                pass
    
    result = await asyncio.to_thread(client.chat_with_files, message=message, files=file_contents)
    return AIResponse(result=result, model="gemini-2.0-flash-multimodal")
