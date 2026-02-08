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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class CORSEverythingMiddleware:
    """
    Raw ASGI middleware that injects CORS headers into EVERY HTTP response.
    
    This runs at the ASGI level, so it catches responses from all sources:
    FastAPI exception handlers, HTTPBearer 403s, SlowAPI, etc.
    BaseHTTPMiddleware has a known bug where call_next misses some error responses.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Extract Origin header from request
        origin = None
        for header_name, header_value in scope.get("headers", []):
            if header_name == b"origin":
                origin = header_value.decode("latin-1")
                break

        # Check if origin is allowed
        allowed = origin and origin in settings.cors_origins_list

        # Handle preflight OPTIONS
        if scope["method"] == "OPTIONS" and allowed:
            response = JSONResponse(
                content="OK",
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD",
                    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Origin, X-Requested-With",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Max-Age": "600",
                },
            )
            await response(scope, receive, send)
            return

        # For ALL requests, intercept the response to add CORS headers
        async def send_with_cors(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))

                # Debug headers
                headers.append((b"x-cors-middleware", b"active"))
                headers.append((b"x-cors-debug", f"origin={origin},allowed={allowed},list_len={len(settings.cors_origins_list)}".encode("latin-1")))

                if allowed:
                    # Remove any existing CORS headers to avoid duplicates
                    headers = [
                        (k, v) for k, v in headers
                        if k.lower() not in (
                            b"access-control-allow-origin",
                            b"access-control-allow-credentials",
                        )
                    ]

                    # Add CORS headers
                    headers.append((b"access-control-allow-origin", origin.encode("latin-1")))
                    headers.append((b"access-control-allow-credentials", b"true"))
                    headers.append((b"vary", b"Origin"))
                    headers.append((b"x-cors-origin-check", f"origin={origin},allowed={allowed}".encode("latin-1")))

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
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
