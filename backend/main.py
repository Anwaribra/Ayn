"""Main FastAPI application entry point."""
from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
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
from app.evidence.router import router as evidence_router
from app.dashboard.router import router as dashboard_router
from app.notifications.router import router as notifications_router
from app.ai.router import router as ai_router
from app.gap_analysis.router import router as gap_analysis_router
from app.platform_state.router import router as platform_state_router
from app.horus.router import router as horus_router
from app.activity.router import router as activity_router
from app.compliance.router import router as compliance_router
from app.analytics.router import router as analytics_router
from app.calendar.router import router as calendar_router
from app.drafts.router import router as drafts_router
from app.deepagents.router import router as deepagents_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def seed_missing_standards() -> None:
    """Ensure all built-in public standards exist in the database (idempotent)."""
    from app.core.db import get_db

    BUILT_IN_STANDARDS = [
        {
            "id": "ncaaa",
            "title": "NCAAA Institutional Standards",
            "code": "NCAAA-2024",
            "category": "Higher Education",
            "description": "National Commission for Academic Accreditation and Assessment standards for Saudi Arabian universities and colleges.",
            "region": "Saudi Arabia",
            "icon": "GraduationCap",
            "color": "from-emerald-600 to-teal-600",
            "estimatedSetup": "2-3 days",
            "criteria": [
                ("Standard 1", "Mission, Vision, and Strategic Planning"),
                ("Standard 2", "Governance, Leadership, and Management"),
                ("Standard 3", "Teaching and Learning"),
                ("Standard 4", "Students"),
                ("Standard 5", "Faculty and Staff"),
                ("Standard 6", "Institutional Resources"),
                ("Standard 7", "Research and Innovation"),
                ("Standard 8", "Community Partnership"),
                ("Standard 9", "Quality Assurance"),
                ("Standard 10", "Scientific Integrity and Ethics"),
                ("Standard 11", "Financial Management"),
            ],
        },
        {
            "id": "iso21001",
            "title": "ISO 21001:2018",
            "code": "ISO-21001",
            "category": "International",
            "description": "Educational organizations management systems — international standard for educational management excellence.",
            "region": "International",
            "icon": "Globe",
            "color": "from-blue-600 to-indigo-600",
            "estimatedSetup": "5-7 days",
            "criteria": [
                ("Clause 4", "Context of the organization"),
                ("Clause 5", "Leadership and commitment"),
                ("Clause 6", "Planning"),
                ("Clause 7", "Support: Resources, competence, awareness"),
                ("Clause 8", "Operation: planning and control"),
                ("Clause 9", "Performance evaluation"),
                ("Clause 10", "Improvement"),
            ],
        },
        {
            "id": "advanced",
            "title": "AdvancED Standards",
            "code": "ADV-ED",
            "category": "K-12 Education",
            "description": "Comprehensive K-12 accreditation standards used by 40,000+ institutions across 80 countries.",
            "region": "Global",
            "icon": "Building2",
            "color": "from-amber-600 to-orange-600",
            "estimatedSetup": "3-5 days",
            "criteria": [(f"Standard {i}", f"AdvancED Criterion {i}") for i in range(1, 32)],
        },
        {
            "id": "moe",
            "title": "Ministry of Education UAE",
            "code": "MOE-UAE",
            "category": "Government Framework",
            "description": "United Arab Emirates Ministry of Education standards for institutional licensing and accreditation.",
            "region": "UAE",
            "icon": "Shield",
            "color": "from-rose-600 to-pink-600",
            "estimatedSetup": "2-4 days",
            "criteria": [(f"Standard {i}", f"MOE UAE Criterion {i}") for i in range(1, 19)],
        },
        {
            "id": "qaa",
            "title": "QAA UK Standards",
            "code": "QAA-UK",
            "category": "Higher Education",
            "description": "Quality Assurance Agency for Higher Education standards used across UK universities.",
            "region": "United Kingdom",
            "icon": "Award",
            "color": "from-purple-600 to-violet-600",
            "estimatedSetup": "4-6 days",
            "criteria": [(f"Expectation {i}", f"QAA UK Expectation {i}") for i in range(1, 29)],
        },
        {
            "id": "naqaa",
            "title": "NAQAAE Egypt",
            "code": "NAQAAE-EG",
            "category": "National Authority",
            "description": "National Authority for Quality Assurance and Accreditation of Education framework for Egyptian institutions.",
            "region": "Egypt",
            "icon": "FileCheck",
            "color": "from-cyan-600 to-blue-600",
            "estimatedSetup": "3-4 days",
            "criteria": [
                ("Domain 1", "Strategic Planning"),
                ("Domain 2", "Governance and Leadership"),
                ("Domain 3", "Management of Quality Assurance"),
                ("Domain 4", "Academic Programs"),
                ("Domain 5", "Students and Graduates"),
                ("Domain 6", "Faculty Members"),
                ("Domain 7", "Scientific Research and Other Scholarly Activities"),
                ("Domain 8", "Community Involvement"),
                ("Domain 9", "Educational Resources"),
            ],
        },
    ]

    try:
        db = get_db()
        for std in BUILT_IN_STANDARDS:
            existing = await db.standard.find_unique(where={"id": std["id"]})
            if existing:
                continue  # already seeded
            logger.info(f"Seeding missing standard: {std['id']}")
            created = await db.standard.create(
                data={
                    "id": std["id"],
                    "title": std["title"],
                    "code": std["code"],
                    "category": std["category"],
                    "description": std["description"],
                    "region": std["region"],
                    "icon": std["icon"],
                    "color": std["color"],
                    "estimatedSetup": std["estimatedSetup"],
                    "isPublic": True,
                }
            )
            for title, description in std["criteria"]:
                await db.criterion.create(
                    data={"standardId": created.id, "title": title, "description": description}
                )
            logger.info(f"Seeded standard {std['id']} with {len(std['criteria'])} criteria")
    except Exception as e:
        logger.warning(f"Standard seeding skipped due to error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Starting Ayn Platform API...")
    await connect_db()
    await seed_missing_standards()
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

# Configure CORS with FastAPI built-in middleware (also supports preflight and headers efficiently)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Perf monitoring middleware
from app.core.middlewares import request_timing_middleware
app.middleware("http")(request_timing_middleware)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    tb = traceback.format_exc()
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}\n{tb}")
    
    # In production/default, never leak error details to client
    detail = "Internal Server Error"
    if settings.DEBUG:
        detail = f"Server error: {str(exc)}"
        
    return JSONResponse(
        status_code=500,
        content={"detail": detail},
    )
app.add_middleware(SlowAPIMiddleware)

# Include routers
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


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Ayn Platform API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "healthy"
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


# Debug endpoints - only enabled when DEBUG is True
if settings.DEBUG:
    from app.core.middlewares import get_current_user
    
    async def require_admin(current_user: dict = Depends(get_current_user)):
        if current_user["role"] != "ADMIN":
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Admin access required")
        return current_user

    @app.get("/api/debug/ai-status")
    async def ai_status(admin: dict = Depends(require_admin)):
        """Check AI service configuration (ADMIN only, debug only)."""
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
            
            try:
                client = get_gemini_client()
                result["ai_client"] = "initialized"
                result["ai_provider"] = client.provider
            except Exception as e:
                result["ai_client"] = f"error: {str(e)}"
        except Exception as e:
            result["ai_import_error"] = str(e)
        
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
        except Exception as e:
            import traceback
            return {"error": str(e), "traceback": traceback.format_exc()[-500:]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
