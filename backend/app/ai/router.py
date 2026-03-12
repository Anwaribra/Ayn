from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, Request, BackgroundTasks
from typing import List
from app.auth.dependencies import require_roles
from app.ai.models import ChatRequest, AIResponse, DraftRequest, MockAuditStartRequest, MockAuditMessageRequest
from app.ai.service import get_gemini_client
from app.ai.remediation_service import draft_remediation_document
from app.ai.mock_audit_service import start_mock_audit, submit_mock_audit_message
from app.core.rate_limit import limiter
import base64

from app.core.middlewares import get_current_user
from app.core.db import get_db, Prisma

router = APIRouter()



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
                                import logging
                                import json
                                from app.platform_state.service import StateService

                                # Persist ad-hoc analysis as a GapAnalysis record for the user's institution.
                                user = await db.user.find_unique(where={"id": usr_id})
                                if not user or not getattr(user, "institutionId", None):
                                    logging.getLogger(__name__).warning(
                                        "Skipping analysis persistence for user %s: no institution.",
                                        usr_id,
                                    )
                                    return

                                score = float(parsed_data.get("score") or 0.0)
                                gaps = parsed_data.get("gaps") or []
                                if not isinstance(gaps, list):
                                    gaps = []

                                recommendations = parsed_data.get("recommendations") or []
                                if not isinstance(recommendations, list):
                                    recommendations = []

                                summary_text = parsed_data.get("summary") or "AI Generated Analysis"
                                institution_standard = await db.institutionstandard.find_first(
                                    where={"institutionId": user.institutionId}
                                )
                                standard_id = institution_standard.standardId if institution_standard else None

                                record = await db.gapanalysis.create(
                                    data={
                                        "institutionId": user.institutionId,
                                        "standardId": standard_id,
                                        "overallScore": score,
                                        "summary": summary_text,
                                        "status": "completed",
                                        "gapsJson": json.dumps(gaps),
                                        "recommendationsJson": json.dumps(recommendations),
                                    }
                                )

                                state_service = StateService(db)
                                await state_service.record_metric_update(
                                    user_id=usr_id,
                                    metric_id="alignment_score",
                                    name="Compliance Alignment Score",
                                    value=score,
                                    source_module="gap_analysis"
                                )
                                logging.getLogger(__name__).info(
                                    "Saved chat-with-files analysis record %s for user %s",
                                    record.id,
                                    usr_id,
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


@router.post("/draft-document")
@limiter.limit("5/minute")
async def create_document_draft(
    request: Request,
    body: DraftRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate an AI document draft to mediate a specific Gap."""
    # Enforce role checking optionally here
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    try:
        draft = await draft_remediation_document(
            gap_id=body.gap_id,
            institution_id=body.institution_id,
            user_id=user_id,
            custom_instructions=body.custom_instructions
        )
        return {"status": "success", "draft_id": draft.id, "content": draft.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mock-audit/start")
@limiter.limit("3/minute")
async def api_start_mock_audit(
    request: Request,
    body: MockAuditStartRequest,
    current_user: dict = Depends(get_current_user)
):
    """Start a new Mock Audit session with the Horus Virtual Auditor."""
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    try:
        result = await start_mock_audit(
            institution_id=body.institution_id,
            user_id=user_id,
            standard_id=body.standard_id
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mock-audit/message")
@limiter.limit("10/minute")
async def api_mock_audit_message(
    request: Request,
    body: MockAuditMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send a message to the Virtual Auditor in an ongoing session."""
    try:
        result = await submit_mock_audit_message(
            session_id=body.session_id,
            content=body.content
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mock-audit/sessions")
async def list_mock_audit_sessions(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    sessions = await db.mockauditsession.find_many(
        where={"userId": user_id},
        order={"createdAt": "desc"},
        include={"standard": True, "_count": {"select": {"messages": True}}},
    )
    return [{"id": s.id, "status": s.status, "score": s.score, "summary": s.summary, "standardTitle": s.standard.title if s.standard else None, "messageCount": s.messages_count if hasattr(s, 'messages_count') else 0, "createdAt": s.createdAt.isoformat()} for s in sessions]

@router.get("/mock-audit/sessions/{session_id}")
async def get_mock_audit_session(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    session = await db.mockauditsession.find_unique(
        where={"id": session_id},
        include={"messages": {"order_by": {"createdAt": "asc"}}, "standard": True},
    )
    if not session or session.userId != current_user["id"]:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "id": session.id, "status": session.status, "score": session.score, "summary": session.summary,
        "standardTitle": session.standard.title if session.standard else None,
        "messages": [{"id": m.id, "role": m.role, "content": m.content, "confidence": m.confidence, "createdAt": m.createdAt.isoformat()} for m in session.messages],
        "createdAt": session.createdAt.isoformat(),
    }

@router.post("/mock-audit/sessions/{session_id}/complete")
async def complete_mock_audit(session_id: str, current_user: dict = Depends(get_current_user)):
    from app.ai.service import get_gemini_client
    db = get_db()
    session = await db.mockauditsession.find_unique(
        where={"id": session_id},
        include={"messages": True, "standard": True},
    )
    if not session or session.userId != current_user["id"]:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status == "completed":
        return {"id": session.id, "score": session.score, "summary": session.summary, "status": "completed"}
    
    history_text = "\n".join([f"{m.role}: {m.content}" for m in session.messages[-20:]])
    standard_name = session.standard.title if session.standard else "general quality assurance"
    
    prompt = f"""You are an expert auditor. Based on the following mock audit conversation about {standard_name}, provide:
1. A score from 0-100 representing how well the user demonstrated compliance knowledge
2. A brief summary (2-3 sentences) of their performance

Conversation:
{history_text}

Return ONLY valid JSON: {{"score": number, "summary": "string"}}"""
    
    client = get_gemini_client()
    try:
        raw = await client.generate_text(prompt=prompt)
        import json, re
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        parsed = json.loads(match.group()) if match else {"score": 50, "summary": "Session completed."}
    except Exception:
        parsed = {"score": 50, "summary": "Session completed. Unable to generate detailed assessment."}
    
    score = min(100, max(0, float(parsed.get("score", 50))))
    summary = parsed.get("summary", "Session completed.")
    
    await db.mockauditsession.update(
        where={"id": session_id},
        data={"status": "completed", "score": score, "summary": summary}
    )
    return {"id": session.id, "score": score, "summary": summary, "status": "completed"}
