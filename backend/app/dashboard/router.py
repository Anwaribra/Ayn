"""Dashboard router."""
from fastapi import APIRouter, Depends
from app.core.middlewares import get_current_user
from app.dashboard.models import DashboardMetricsResponse
from app.dashboard.service import DashboardService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/metrics", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(
    current_user: dict = Depends(get_current_user)
):
    """
    Get dashboard metrics.
    """
    return await DashboardService.get_metrics(current_user)
