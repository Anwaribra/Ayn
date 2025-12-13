"""Main FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.db import connect_db, disconnect_db

# Import routers
from app.auth.router import router as auth_router
from app.institutions.router import router as institutions_router
from app.standards.router import router as standards_router
from app.criteria.router import router as criteria_router
from app.assessments.router import router as assessments_router
from app.evidence.router import router as evidence_router
from app.dashboard.router import router as dashboard_router
from app.notifications.router import router as notifications_router
from app.admin.router import router as admin_router
from app.ai.router import router as ai_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(institutions_router, prefix="/api/institutions", tags=["Institutions"])
app.include_router(standards_router, prefix="/api/standards", tags=["Standards"])
app.include_router(criteria_router, prefix="/api/criteria", tags=["Criteria"])
app.include_router(assessments_router, prefix="/api/assessments", tags=["Assessments"])
app.include_router(evidence_router, prefix="/api/evidence", tags=["Evidence"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Ayn Platform API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

