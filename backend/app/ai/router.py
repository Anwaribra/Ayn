from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, Request, BackgroundTasks
from typing import List
from app.auth.dependencies import require_roles
from app.ai.models import ChatRequest, AIResponse
from app.ai.service import get_gemini_client
from app.core.rate_limit import limiter
import base64

from app.core.middlewares import get_current_user
from app.core.db import get_db, Prisma

router = APIRouter()

# ALLOWED_AI_ROLES = ["ADMIN", "TEACHER", "AUDITOR"]  <-- Removed restriction for demo


@router.post("/chat", response_model=AIResponse)
@limiter.limit("10/minute")
async def chat(
    request: Request,
    body: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Multi-turn chat with Horus AI."""
    client = get_gemini_client()
    messages_dicts = [{"role": m.role, "content": m.content} for m in body.messages]
    result = await client.chat(messages=messages_dicts, context=body.context)
    return AIResponse(raw_text=result, model="gemini-2.0-flash")


@router.post("/chat-with-files", response_model=AIResponse)
@limiter.limit("5/minute")
async def chat_with_files(
    request: Request,
    background_tasks: BackgroundTasks,
    message: str = Form(...),
    files: List[UploadFile] = File(...),
    db: Prisma = Depends(get_db),
    current_user: dict = Depends(get_current_user)
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
        elif file.content_type == "application/pdf":
            file_contents.append({
                "type": "document",
                "mime_type": "application/pdf",
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
    
    # Enforce JSON output for structured data
    json_instruction = """
    CRITICAL INSTRUCTION:
    You must output ONLY valid JSON.
    Do not wrap it in markdown code blocks.
    Do not utilize '```json' tags.
    Just return the raw JSON object.

    If the user asks for analysis, return:
    {
      "summary": "High level summary...",
      "score": 85,
      "gaps": [{"title": "Gap Title", "description": "...", "severity": "high"}],
      "recommendations": ["Rec 1", "Rec 2"]
    }

    If the user asks a general question, return:
    {
      "answer": "Your answer here...",
      "type": "chat"
    }
    """
    
    full_message = f"{message}\n\n{json_instruction}"
    
    raw_result = ""
    try:
        raw_result = await client.chat_with_files(message=full_message, files=file_contents)
        
        # Robust Parsing Strategy
        import re
        import json
        
        # 1. Cleaner
        cleaned = raw_result.strip()
        
        # 2. Regex to find first valid JSON object/array
        match = re.search(r'(\{.*\}|\[.*\])', cleaned, re.DOTALL)
        
        structured_data = None
        error_msg = None
        analysis_id = None
        metrics_updated = False
        
        if match:
            json_str = match.group(1)
            try:
                parsed = json.loads(json_str)
                
                # 3. Minimal Validation
                has_analysis = all(k in parsed for k in ["score", "gaps"])
                has_chat = "answer" in parsed
                
                if has_analysis or has_chat:
                    structured_data = parsed
                    
                    # 4. Persistence (Stage 2)
                    if has_analysis:
                        async def process_analysis(parsed_data, usr_id):
                            try:
                                from app.gap_analysis.service import GapOneService
                                from app.platform_state.service import StateService
                                
                                gap_service = GapOneService(db)
                                state_service = StateService(db)
                                
                                await gap_service.create_analysis(
                                    user_id=usr_id,
                                    standard_id=None, 
                                    score=float(parsed_data["score"]),
                                    gaps=parsed_data["gaps"],
                                    summary=parsed_data.get("summary", "AI Generated Analysis"),
                                    recommendations=parsed_data.get("recommendations", [])
                                )
                                
                                await state_service.record_metric_update(
                                    user_id=usr_id,
                                    metric_id="alignment_score",
                                    value=float(parsed_data["score"]),
                                    source_module="gap_analysis"
                                )
                            except Exception as db_err:
                                import logging
                                logging.getLogger(__name__).error(f"Persistence Failed: {db_err}")
                        
                        user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
                        background_tasks.add_task(process_analysis, parsed, user_id)
                        analysis_id = "background-processing"
                        metrics_updated = True
                else:
                    error_msg = "json_structure_invalid"
            except json.JSONDecodeError:
                error_msg = "json_parse_failed"
        else:
            error_msg = "no_json_found"

        return AIResponse(
            raw_text=raw_result,
            structured=structured_data,
            error=error_msg,
            analysis_id=analysis_id,
            metrics_updated=metrics_updated,
            model="gemini-2.0-flash-multimodal"
        )
        
    except Exception as e:
        return AIResponse(
            raw_text=raw_result if raw_result else str(e),
            structured=None,
            error=f"execution_error: {str(e)}",
            model="gemini-2.0-flash-multimodal-fallback"
        )
