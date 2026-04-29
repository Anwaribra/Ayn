"""Custom middleware for FastAPI."""
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.core.utils import decode_access_token
from app.core.db import get_db
import logging

from app.ai.provider_context import request_ai_provider

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """Get the current authenticated user from JWT token."""
    token = None
    if request.cookies.get("ayn_session"):
        token = request.cookies.get("ayn_session")
    elif credentials:
        token = credentials.credentials
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    # Fetch user from database
    db = get_db()
    user = await db.user.find_unique(where={"id": user_id})
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    # Prisma returns dict - handle both dict and object access
    user_id = user["id"] if isinstance(user, dict) else user.id
    user_name = user.get("name") if isinstance(user, dict) else getattr(user, "name", None)
    user_email = user["email"] if isinstance(user, dict) else user.email
    user_role = user["role"] if isinstance(user, dict) else user.role
    user_institution = user.get("institutionId") if isinstance(user, dict) else user.institutionId

    # Derive first name from email when name is missing or generic (e.g. anwarmousa80@gmail.com -> Anwar)
    if not user_name or (isinstance(user_name, str) and user_name.strip().lower() == "user"):
        email_str = (user_email or "").strip()
        if email_str and "@" in email_str:
            local = email_str.split("@")[0]
            alpha_part = "".join(c for c in local if c.isalpha())
            if alpha_part:
                first_name = alpha_part[:5]
                user_name = first_name[0].upper() + first_name[1:].lower()

    return {
        "id": user_id,
        "name": user_name or "User",
        "email": user_email,
        "role": user_role or "USER",
        "institutionId": user_institution,
    }


async def request_timing_middleware(request: Request, call_next):
    start_time = request.state.start_time if hasattr(request.state, 'start_time') else None
    if start_time is None:
        from time import perf_counter
        start_time = perf_counter()
        request.state.start_time = start_time

    response = await call_next(request)

    from time import perf_counter
    elapsed_ms = (perf_counter() - start_time) * 1000
    response.headers["X-Response-Time-ms"] = f"{elapsed_ms:.2f}"
    logger.info(f"{request.method} {request.url.path} status={response.status_code} {elapsed_ms:.2f}ms")

    return response


async def ai_provider_preference_middleware(request: Request, call_next):
    """Honor X-AI-Provider: gemini | openrouter to reorder model fallback (still falls back on failure)."""
    raw = (request.headers.get("x-ai-provider") or "").strip().lower()
    pref = raw if raw in ("gemini", "openrouter") else None
    token = request_ai_provider.set(pref)
    try:
        return await call_next(request)
    finally:
        request_ai_provider.reset(token)


def require_role(allowed_roles: list[str]):
    """Decorator to require specific roles."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get("current_user")
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                )
            
            user_role = current_user.get("role")
            if user_role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required roles: {allowed_roles}",
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

