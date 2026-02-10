"""AI router."""
import asyncio
from fastapi import APIRouter, HTTPException, status, Depends, Request, File, UploadFile, Form
from typing import List, Optional
from app.core.middlewares import get_current_user
from app.core.rate_limit import limiter
from app.auth.dependencies import require_roles
from app.ai.models import (
    GenerateAnswerRequest,
    ChatRequest,
    SummarizeRequest,
    CommentRequest,
    ExplainRequest,
    ExtractEvidenceRequest,
    AIResponse
)
from app.ai.service import get_gemini_client
import logging
import base64

logger = logging.getLogger(__name__)

router = APIRouter()

# Allowed roles for AI endpoints
ALLOWED_AI_ROLES = ["ADMIN", "TEACHER", "AUDITOR"]


@router.post("/chat", response_model=AIResponse)
@limiter.limit("30/minute")
async def chat(
    request: Request,
    body: ChatRequest,
    current_user: dict = Depends(require_roles(ALLOWED_AI_ROLES))
):
    """
    Multi-turn chat with Horus AI.
    
    **Teacher, Auditor, and Admin only** - Requires TEACHER, AUDITOR, or ADMIN role.
    
    Sends the full conversation history to Horus AI for context-aware responses.
    
    - **messages**: List of conversation messages [{role, content}]
    - **context**: Optional context hint (e.g. 'gap_analysis', 'evidence_analysis')
    """
    try:
        client = get_gemini_client()
        messages_dicts = [{"role": m.role, "content": m.content} for m in body.messages]
        result = await asyncio.to_thread(
            client.chat,
            messages=messages_dicts,
            context=body.context,
        )
        
        logger.info(f"User {current_user['email']} used Horus AI chat ({len(body.messages)} messages)")
        
        return AIResponse(
            result=result,
            model="gemini-2.0-flash"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate chat response: {str(e)}"
        )


@router.post("/chat-with-files", response_model=AIResponse)
@limiter.limit("20/minute")
async def chat_with_files(
    request: Request,
    message: str = Form(..., description="User message text"),
    files: List[UploadFile] = File(..., description="Attached files (images, PDFs, etc.)"),
    current_user: dict = Depends(require_roles(ALLOWED_AI_ROLES))
):
    """
    Multi-modal chat with Horus AI - supports text + images/documents.
    
    **Teacher, Auditor, and Admin only** - Requires TEACHER, AUDITOR, or ADMIN role.
    
    Analyzes uploaded files (images, documents) along with text message.
    
    - **message**: User's text message/question
    - **files**: Attached files (images for now, PDF support coming)
    """
    try:
        client = get_gemini_client()
        
        # Read files and prepare them
        file_contents = []
        for file in files:
            content = await file.read()
            # For images, encode as base64
            if file.content_type and file.content_type.startswith("image/"):
                b64_content = base64.b64encode(content).decode("utf-8")
                file_contents.append({
                    "type": "image",
                    "mime_type": file.content_type,
                    "data": b64_content,
                    "filename": file.filename
                })
            else:
                # For other files, try to extract text (basic support for now)
                try:
                    text_content = content.decode("utf-8")
                    file_contents.append({
                        "type": "text",
                        "data": text_content,
                        "filename": file.filename
                    })
                except:
                    logger.warning(f"Could not decode file: {file.filename}")
        
        # Call AI with multimodal input
        result = await asyncio.to_thread(
            client.chat_with_files,
            message=message,
            files=file_contents
        )
        
        logger.info(f"User {current_user['email']} used Horus AI with {len(files)} file(s)")
        
        return AIResponse(
            result=result,
            model="gemini-2.0-flash-multimodal"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in chat with files: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process files: {str(e)}"
        )


@router.post("/generate-answer", response_model=AIResponse)
@limiter.limit("30/minute")
async def generate_answer(
    request: Request,
    body: GenerateAnswerRequest,
    current_user: dict = Depends(require_roles(ALLOWED_AI_ROLES))
):
    """
    Generate an answer using AI.
    
    **Teacher, Auditor, and Admin only** - Requires TEACHER, AUDITOR, or ADMIN role.
    
    Generates an AI-powered answer based on the provided prompt and context.
    
    - **prompt**: Question or prompt to generate answer for
    - **context**: Optional additional context
    """
    try:
        client = get_gemini_client()
        result = await asyncio.to_thread(
            client.generate_text,
            prompt=body.prompt,
            context=body.context,
        )
        
        logger.info(f"User {current_user['email']} generated AI answer")
        
        return AIResponse(
            result=result,
            model="gemini-pro"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generating answer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate answer: {str(e)}"
        )


@router.post("/summarize", response_model=AIResponse)
@limiter.limit("30/minute")
async def summarize(
    request: Request,
    body: SummarizeRequest,
    current_user: dict = Depends(require_roles(ALLOWED_AI_ROLES))
):
    """
    Summarize content using AI.
    
    **Teacher, Auditor, and Admin only** - Requires TEACHER, AUDITOR, or ADMIN role.
    
    Generates a concise summary of the provided content.
    
    - **content**: Content to summarize
    - **maxLength**: Maximum length of summary (default: 100 words)
    """
    try:
        client = get_gemini_client()
        result = await asyncio.to_thread(
            client.summarize,
            content=body.content,
            max_length=body.maxLength,
        )
        
        logger.info(f"User {current_user['email']} summarized content with AI")
        
        return AIResponse(
            result=result,
            model="gemini-pro"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error summarizing: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to summarize: {str(e)}"
        )


@router.post("/comment", response_model=AIResponse)
@limiter.limit("30/minute")
async def generate_comment(
    request: Request,
    body: CommentRequest,
    current_user: dict = Depends(require_roles(ALLOWED_AI_ROLES))
):
    """
    Generate comments/feedback using AI.
    
    **Teacher, Auditor, and Admin only** - Requires TEACHER, AUDITOR, or ADMIN role.
    
    Generates constructive comments and feedback on the provided text.
    
    - **text**: Text to generate comments for
    - **focus**: Optional focus area (e.g., 'quality', 'compliance')
    """
    try:
        client = get_gemini_client()
        result = await asyncio.to_thread(
            client.generate_comment,
            text=body.text,
            focus=body.focus,
        )
        
        logger.info(f"User {current_user['email']} generated AI comments")
        
        return AIResponse(
            result=result,
            model="gemini-pro"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generating comments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate comments: {str(e)}"
        )


@router.post("/explain", response_model=AIResponse)
@limiter.limit("30/minute")
async def explain(
    request: Request,
    body: ExplainRequest,
    current_user: dict = Depends(require_roles(ALLOWED_AI_ROLES))
):
    """
    Explain a topic or concept using AI.
    
    **Teacher, Auditor, and Admin only** - Requires TEACHER, AUDITOR, or ADMIN role.
    
    Provides an explanation of the given topic at the specified level.
    
    - **topic**: Topic or concept to explain
    - **level**: Explanation level (basic, intermediate, advanced)
    """
    try:
        client = get_gemini_client()
        result = await asyncio.to_thread(
            client.explain,
            topic=body.topic,
            level=body.level,
        )
        
        logger.info(f"User {current_user['email']} requested AI explanation for: {body.topic}")
        
        return AIResponse(
            result=result,
            model="gemini-pro"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error explaining: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to explain: {str(e)}"
        )


@router.post("/evidence/extract", response_model=AIResponse)
@limiter.limit("30/minute")
async def extract_evidence(
    request: Request,
    body: ExtractEvidenceRequest,
    current_user: dict = Depends(require_roles(ALLOWED_AI_ROLES))
):
    """
    Extract evidence from text using AI.
    
    **Teacher, Auditor, and Admin only** - Requires TEACHER, AUDITOR, or ADMIN role.
    
    Extracts and identifies evidence points from the provided text.
    
    - **text**: Text to extract evidence from
    - **criteria**: Optional specific criteria to look for
    """
    try:
        client = get_gemini_client()
        result = await asyncio.to_thread(
            client.extract_evidence,
            text=body.text,
            criteria=body.criteria,
        )
        
        logger.info(f"User {current_user['email']} extracted evidence with AI")
        
        return AIResponse(
            result=result,
            model="gemini-pro"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error extracting evidence: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract evidence: {str(e)}"
        )
