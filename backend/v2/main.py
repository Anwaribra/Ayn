from fastapi import APIRouter, FastAPI

from v2.modules.evidence.router import router as evidence_router
from v2.modules.notifications.router import router as notifications_router
from v2.modules.standards.router import router as standards_router
from v2.modules.tasks.router import router as tasks_router
from v2.modules.validation.router import router as validation_router
from v2.modules.horus_operations.router import router as horus_operations_router

v2_router = APIRouter(prefix="/v2")
v2_router.include_router(evidence_router)
v2_router.include_router(notifications_router)
v2_router.include_router(standards_router)
v2_router.include_router(tasks_router)
v2_router.include_router(validation_router)
v2_router.include_router(horus_operations_router)

@v2_router.get("/health")
async def health_check():
    return {"status": "ok", "message": "V2 Backend is running"}

def create_v2_app() -> FastAPI:
    app = FastAPI(title="Ayn V2 Architecture", version="2.0.0")
    app.include_router(v2_router)
    return app
