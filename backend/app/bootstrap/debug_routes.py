"""Debug-only routes registration."""

from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException, Request

from app.core.config import settings
from app.core.middlewares import get_current_user


def debug_routes_enabled() -> bool:
    """Return whether debug routes should be mounted."""
    return bool(settings.DEBUG and settings.ENABLE_DEBUG_ENDPOINTS)


def register_debug_routes(app: FastAPI) -> None:
    """Register debug routes only when explicitly enabled."""
    if not debug_routes_enabled():
        return

    async def require_admin(current_user: dict = Depends(get_current_user)):
        if current_user["role"] != "ADMIN":
            raise HTTPException(status_code=403, detail="Admin access required")
        return current_user

    @app.get("/api/debug/ai-status")
    async def ai_status(admin: dict = Depends(require_admin)):
        """Check AI service configuration (ADMIN only, debug only)."""
        import os

        gemini_key = getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY")
        openrouter_key = getattr(settings, "OPENROUTER_API_KEY", None) or os.getenv("OPENROUTER_API_KEY")

        result = {
            "gemini_key_set": bool(gemini_key),
            "gemini_key_prefix": (gemini_key[:8] + "...") if gemini_key else None,
            "openrouter_key_set": bool(openrouter_key),
            "openrouter_key_prefix": (openrouter_key[:8] + "...") if openrouter_key else None,
            "openrouter_model": getattr(settings, "OPENROUTER_MODEL", "not set"),
            "gemini_sdk_available": False,
            "jwt_secret_set": bool(getattr(settings, "JWT_SECRET", None)),
            "database_url_set": bool(getattr(settings, "DATABASE_URL", None)),
        }

        try:
            from app.ai.service import GEMINI_AVAILABLE, get_gemini_client

            result["gemini_sdk_available"] = GEMINI_AVAILABLE

            try:
                client = get_gemini_client()
                result["ai_client"] = "initialized"
                result["ai_provider"] = client.provider
            except Exception as exc:
                result["ai_client"] = f"error: {str(exc)}"
        except Exception as exc:
            result["ai_import_error"] = str(exc)

        try:
            from app.ai.service import get_gemini_client

            client = get_gemini_client()
            test_result = client.chat(
                messages=[{"role": "user", "content": "Say hello in one word"}],
                context=None,
            )
            result["ai_test"] = "success"
            result["ai_test_response"] = test_result[:100]
        except Exception as exc:
            result["ai_test"] = "failed"
            result["ai_test_error"] = str(exc)[:500]

        return result

    @app.post("/api/debug/test-chat")
    async def test_chat_no_auth(request: Request, admin: dict = Depends(require_admin)):
        """Test chat endpoint (ADMIN only, debug only)."""
        try:
            body = await request.json()
            messages = body.get("messages", [])

            if not messages:
                return {"error": "No messages provided", "body": body}

            from app.ai.service import get_gemini_client

            client = get_gemini_client()

            result = await client.chat(
                messages=[{"role": m["role"], "content": m["content"]} for m in messages],
                context=body.get("context"),
            )

            return {"result": result[:200], "status": "success"}
        except Exception:
            return {"error": "Debug chat test failed"}
