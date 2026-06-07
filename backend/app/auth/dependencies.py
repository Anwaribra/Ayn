"""Role-based access control dependencies."""
from fastapi import HTTPException, status, Depends
from typing import List
from app.core.middlewares import get_current_user


def require_roles(allowed_roles: List[str]):
    """
    Dependency factory for role-based access control.
    
    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(current_user = Depends(require_roles(["ADMIN"]))):
            ...
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        
        return current_user
    
    return role_checker


# Convenience dependencies for common role checks
require_admin = require_roles(["ADMIN"])
require_teacher = require_roles(["TEACHER"])
require_auditor = require_roles(["AUDITOR"])
require_admin_or_teacher = require_roles(["ADMIN", "TEACHER"])
require_admin_or_auditor = require_roles(["ADMIN", "AUDITOR"])


async def require_horus_access(current_user: dict = Depends(get_current_user)):
    """
    Check if user has Horus AI access.
    Access is granted if:
    - User has role = ADMIN (always has access)
    - User has horusAccess = true (approved by admin)
    """
    if current_user.get("role") == "ADMIN":
        return current_user

    from app.core.db import get_db
    db = get_db()
    user = await db.user.find_unique(where={"id": current_user["id"]})
    if not user or not user.horusAccess:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Horus AI access not granted. Please submit an access request.",
        )
    return current_user
