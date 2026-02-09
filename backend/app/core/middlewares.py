"""Custom middleware for FastAPI."""
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.core.utils import decode_access_token
from app.core.db import get_db
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Get the current authenticated user from JWT token."""
    token = credentials.credentials
    
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
    user_email = user["email"] if isinstance(user, dict) else user.email
    user_role = user["role"] if isinstance(user, dict) else user.role
    user_institution = user.get("institutionId") if isinstance(user, dict) else user.institutionId
    
    return {
        "id": user_id,
        "email": user_email,
        "role": user_role,
        "institutionId": user_institution,
    }


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

