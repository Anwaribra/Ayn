"""Analytics router — dedicated endpoints for the analytics dashboard."""
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
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


@router.get("/export/csv")
async def export_analytics_csv(
    period: Optional[int] = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
):
    """Export analytics data as CSV."""
    data = await AnalyticsService.get_analytics(current_user, period_days=period)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Ayn Platform Analytics Report"])
    writer.writerow(["Period", f"{period} days" if period else "All time"])
    writer.writerow([])
    writer.writerow(["KPI", "Value"])
    writer.writerow(["Total Reports", data.totalReports])
    writer.writerow(["Average Score", f"{data.avgScore}%"])
    writer.writerow(["Latest Score", f"{data.latestScore}%"])
    writer.writerow(["Score Delta", f"{data.scoreDelta}%"])
    writer.writerow(["Std Deviation", f"{data.stdDeviation}%"])
    writer.writerow(["Total Evidence", data.totalEvidence])
    writer.writerow(["Alignment", f"{data.alignmentPercentage}%"])
    writer.writerow(["Unique Standards", data.uniqueStandards])
    writer.writerow([])
    
    writer.writerow(["Score Trend"])
    writer.writerow(["Date", "Score", "Standard"])
    for point in data.scoreTrend:
        writer.writerow([point.date, point.score, point.label])
    writer.writerow([])
    
    writer.writerow(["Standard Performance"])
    writer.writerow(["Standard", "Avg Score", "Min", "Max", "Reports", "Trend"])
    for sp in data.standardPerformance:
        writer.writerow([sp.standardTitle, sp.avgScore, sp.minScore, sp.maxScore, sp.reportCount, sp.trend])
    writer.writerow([])
    
    writer.writerow(["Insights"])
    writer.writerow(["Title", "Description", "Severity"])
    for insight in data.insights:
        writer.writerow([insight.title, insight.description, insight.severity])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=ayn-analytics-{period or 'all'}d.csv"}
    )


@router.get("/all", response_model=AnalyticsResponse)
async def get_analytics_all_time(
    current_user: dict = Depends(get_current_user),
):
    """
    Get all-time analytics (no period filter).
    """
    return await AnalyticsService.get_analytics(current_user, period_days=None)


@router.get("/ai")
async def get_ai_analytics(
    period: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
):
    """AI analytics are disabled in enterprise core mode."""
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="AI analytics are disabled in core analytics mode.")
