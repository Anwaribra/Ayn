"""Main FastAPI application entry point."""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from starlette.types import ASGIApp, Receive, Scope, Send, Message
import logging
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.db import connect_db, disconnect_db
from app.core.rate_limit import limiter

# Import routers
from app.auth.router import router as auth_router
from app.institutions.router import router as institutions_router
from app.standards.router import router as standards_router
from app.assessments.router import router as assessments_router
from app.evidence.router import router as evidence_router
from app.dashboard.router import router as dashboard_router
from app.notifications.router import router as notifications_router
from app.ai.router import router as ai_router
from app.gap_analysis.router import router as gap_analysis_router
from app.platform_state.router import router as platform_state_router
from app.horus.router import router as horus_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class CORSEverythingMiddleware:
    """
    Raw ASGI middleware that injects CORS headers into EVERY HTTP response.
    
    Railway's edge proxy strips the Origin header, so we cannot rely on it.
    Instead, we always add permissive CORS headers using wildcard (*).
    
    NOTE: We use "*" instead of echoing Origin because Railway strips Origin.
    This means we cannot use credentials mode with wildcard — the frontend
    must use Authorization header (Bearer token) instead of cookies, which
    is already the case (HTTPBearer).
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Handle preflight OPTIONS — return immediately with CORS headers
        if scope["method"] == "OPTIONS":
            response = JSONResponse(
                content="OK",
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD",
                    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Origin, X-Requested-With",
                    "Access-Control-Max-Age": "600",
                },
            )
            await response(scope, receive, send)
            return

        # For ALL other requests, intercept the response to add CORS headers
        async def send_with_cors(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))

                # Remove any existing CORS headers to avoid duplicates
                headers = [
                    (k, v) for k, v in headers
                    if k.lower() not in (
                        b"access-control-allow-origin",
                        b"access-control-allow-credentials",
                        b"access-control-allow-methods",
                        b"access-control-allow-headers",
                    )
                ]

                # Always add permissive CORS headers
                headers.append((b"access-control-allow-origin", b"*"))
                headers.append((b"access-control-allow-methods", b"GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD"))
                headers.append((b"access-control-allow-headers", b"Authorization, Content-Type, Accept, Origin, X-Requested-With"))

                message["headers"] = headers

            await send(message)

        await self.app(scope, receive, send_with_cors)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Starting Ayn Platform API...")
    await connect_db()
    yield
    # Shutdown
    logger.info("Shutting down Ayn Platform API...")
    await disconnect_db()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Educational Quality Assurance & Accreditation SaaS Platform",
    lifespan=lifespan,
    redirect_slashes=False,  # Prevent redirect loops when proxied through Vercel
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Global exception handler — shows actual error details instead of generic 500
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    tb = traceback.format_exc()
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}\n{tb}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server error: {str(exc)}"},
    )
app.add_middleware(SlowAPIMiddleware)

# Raw ASGI CORS middleware — the ONLY CORS handler.
# Guarantees headers on ALL responses including 403/401/500 error responses.
# We do NOT use FastAPI's CORSMiddleware because it fails to add headers
# on error responses from HTTPBearer and other exception handlers.
app.add_middleware(CORSEverythingMiddleware)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(institutions_router, prefix="/api/institutions", tags=["Institutions"])
app.include_router(standards_router, prefix="/api/standards", tags=["Standards"])
app.include_router(assessments_router, prefix="/api/assessments", tags=["Assessments"])
app.include_router(evidence_router, prefix="/api/evidence", tags=["Evidence"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI"])
app.include_router(gap_analysis_router, prefix="/api/gap-analysis", tags=["Gap Analysis"])
app.include_router(platform_state_router, prefix="/api", tags=["Platform State"])
app.include_router(horus_router, prefix="/api", tags=["Horus"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Ayn Platform API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "cors": "asgi-v2"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint; verifies DB connectivity."""
    from app.core.db import get_db
    try:
        db = get_db()
        await db.user.find_first()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.warning("Health check DB ping failed: %s", e)
        return {"status": "degraded", "database": "disconnected"}


@app.get("/api/debug/ai-status")
async def ai_status():
    """Check AI service configuration (no auth required, for debugging)."""
    import os
    gemini_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
    openrouter_key = getattr(settings, 'OPENROUTER_API_KEY', None) or os.getenv('OPENROUTER_API_KEY')
    
    result = {
        "gemini_key_set": bool(gemini_key),
        "gemini_key_prefix": (gemini_key[:8] + "...") if gemini_key else None,
        "openrouter_key_set": bool(openrouter_key),
        "openrouter_key_prefix": (openrouter_key[:8] + "...") if openrouter_key else None,
        "openrouter_model": getattr(settings, 'OPENROUTER_MODEL', 'not set'),
        "gemini_sdk_available": False,
        "jwt_secret_set": bool(getattr(settings, 'JWT_SECRET', None)),
        "database_url_set": bool(getattr(settings, 'DATABASE_URL', None)),
    }
    
    try:
        from app.ai.service import GEMINI_AVAILABLE, get_gemini_client
        result["gemini_sdk_available"] = GEMINI_AVAILABLE
        
        # Try to instantiate the AI client
        try:
            client = get_gemini_client()
            result["ai_client"] = "initialized"
            result["ai_provider"] = client.provider
        except Exception as e:
            result["ai_client"] = f"error: {str(e)}"
    except Exception as e:
        result["ai_import_error"] = str(e)
    
    # Also test a quick AI call
    try:
        client = get_gemini_client()
        test_result = client.chat(
            messages=[{"role": "user", "content": "Say hello in one word"}],
            context=None,
        )
        result["ai_test"] = "success"
        result["ai_test_response"] = test_result[:100]
    except Exception as e:
        result["ai_test"] = "failed"
        result["ai_test_error"] = str(e)[:500]
    
    return result


@app.post("/api/debug/test-chat")
async def test_chat_no_auth(request: Request):
    """Test chat endpoint without auth — for debugging only."""
    try:
        body = await request.json()
        messages = body.get("messages", [])
        
        if not messages:
            return {"error": "No messages provided", "body": body}
        
        from app.ai.service import get_gemini_client
        client = get_gemini_client()
        
        import asyncio
        result = await asyncio.to_thread(
            client.chat,
            messages=[{"role": m["role"], "content": m["content"]} for m in messages],
            context=body.get("context"),
        )
        
        return {"result": result[:200], "status": "success"}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()[-500:]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
