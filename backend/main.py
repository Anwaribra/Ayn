"""Main FastAPI application entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.activity.router import router as activity_router
from app.ai.router import router as ai_router
from app.analytics.router import router as analytics_router
from app.auth.router import router as auth_router
from app.bootstrap.debug_routes import register_debug_routes
from app.bootstrap.standards_seed import seed_missing_standards
from app.calendar.router import router as calendar_router
from app.compliance.router import router as compliance_router
from app.core.config import settings
from app.core.db import connect_db, disconnect_db
from app.core.middlewares import request_timing_middleware
from app.core.rate_limit import limiter
from app.dashboard.router import router as dashboard_router
from app.deepagents.router import router as deepagents_router
from app.drafts.router import router as drafts_router
from app.evidence.router import router as evidence_router
from app.gap_analysis.router import router as gap_analysis_router
from app.horus.router import router as horus_router
from app.institutions.router import router as institutions_router
from app.notifications.router import router as notifications_router
from app.platform_state.router import router as platform_state_router
from app.standards.router import router as standards_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    logger.info("Starting Ayn Platform API...")
    await connect_db()
    await seed_missing_standards()
    yield
    logger.info("Shutting down Ayn Platform API...")
    await disconnect_db()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Educational Quality Assurance & Accreditation SaaS Platform",
    lifespan=lifespan,
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(request_timing_middleware)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback

    tb = traceback.format_exc()
    logger.error("Unhandled exception on %s %s: %s\n%s", request.method, request.url.path, exc, tb)

    detail = "Internal Server Error"
    if settings.DEBUG:
        detail = f"Server error: {str(exc)}"

    return JSONResponse(
        status_code=500,
        content={"detail": detail},
    )


app.add_middleware(SlowAPIMiddleware)

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(institutions_router, prefix="/api/institutions", tags=["Institutions"])
app.include_router(standards_router, prefix="/api/standards", tags=["Standards"])
app.include_router(evidence_router, prefix="/api/evidence", tags=["Evidence"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI"])
app.include_router(gap_analysis_router, prefix="/api/gap-analysis", tags=["Gap Analysis"])
app.include_router(platform_state_router, prefix="/api", tags=["Platform State"])
app.include_router(horus_router, prefix="/api", tags=["Horus"])
app.include_router(activity_router, prefix="/api", tags=["Activities"])
app.include_router(compliance_router, prefix="/api", tags=["Compliance"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(calendar_router, prefix="/api/calendar", tags=["Calendar"])
app.include_router(drafts_router, prefix="/api/drafts", tags=["Drafts"])
app.include_router(deepagents_router, prefix="/api", tags=["DeepAgents"])

register_debug_routes(app)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Ayn Platform API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "healthy",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint; verifies DB connectivity."""
    from app.core.db import get_db

    try:
        db = get_db()
        await db.user.find_first()
        return {"status": "healthy", "database": "connected"}
    except Exception as exc:
        logger.warning("Health check DB ping failed: %s", exc)
        return {"status": "degraded", "database": "disconnected"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
