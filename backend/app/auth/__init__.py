# Authentication module
from app.auth.router import router
from app.auth.dependencies import require_roles, require_admin, require_teacher, require_auditor

__all__ = ["router", "require_roles", "require_admin", "require_teacher", "require_auditor"]
