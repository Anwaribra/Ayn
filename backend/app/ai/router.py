"""AI router."""
from fastapi import APIRouter, HTTPException, status, Depends, Request
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

logger = logging.getLogger(__name__)

router = APIRouter()

# Allowed roles for AI endpoints
ALLOWED_AI_ROLES = ["ADMIN", "TEACHER", "AUDITOR"]


@router.post("/chat", response_model=AIResponse)
@limiter.limit("30/minute")
async def chat(
    req: Request,
    request: ChatRequest,
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
        messages_dicts = [{"role": m.role, "content": m.content} for m in request.messages]
        result = client.chat(
            messages=messages_dicts,
            context=request.context
        )
        
        logger.info(f"User {current_user['email']} used Horus AI chat ({len(request.messages)} messages)")
        
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


@router.post("/generate-answer", response_model=AIResponse)
@limiter.limit("30/minute")
async def generate_answer(
    req: Request,
    request: GenerateAnswerRequest,
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
        result = client.generate_text(
            prompt=request.prompt,
            context=request.context
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
    req: Request,
    request: SummarizeRequest,
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
        result = client.summarize(
            content=request.content,
            max_length=request.maxLength
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
    req: Request,
    request: CommentRequest,
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
        result = client.generate_comment(
            text=request.text,
            focus=request.focus
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
    req: Request,
    request: ExplainRequest,
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
        result = client.explain(
            topic=request.topic,
            level=request.level
        )
        
        logger.info(f"User {current_user['email']} requested AI explanation for: {request.topic}")
        
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
    req: Request,
    request: ExtractEvidenceRequest,
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
        result = client.extract_evidence(
            text=request.text,
            criteria=request.criteria
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
