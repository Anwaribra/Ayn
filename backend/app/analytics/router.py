"""Analytics router — dedicated endpoints for the analytics dashboard."""
from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.core.middlewares import get_current_user
from app.analytics.models import AnalyticsResponse
from app.analytics.service import AnalyticsService

import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=AnalyticsResponse)
async def get_analytics(
    period: Optional[int] = Query(
        30,
        description="Number of days to analyze. Pass null or omit for all-time.",
        ge=1,
        le=365,
    ),
    current_user: dict = Depends(get_current_user),
):
    """
    Get comprehensive analytics computed from real database data.

    Returns KPIs, time-series trends, standard performance, status breakdown,
    score distribution histogram, anomaly detection, growth metrics,
    and auto-generated actionable insights.

    **Period options**: 7, 30, 90, or omit for all-time.
    """
    return await AnalyticsService.get_analytics(current_user, period_days=period)


@router.get("/all", response_model=AnalyticsResponse)
async def get_analytics_all_time(
    current_user: dict = Depends(get_current_user),
):
    """
    Get all-time analytics (no period filter).
    """
    return await AnalyticsService.get_analytics(current_user, period_days=None)
