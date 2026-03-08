"""Pydantic models for the analytics module."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class TimeSeriesPoint(BaseModel):
    """A single point in a time-series chart."""
    date: str
    score: float
    label: Optional[str] = None


class StandardPerformance(BaseModel):
    """Aggregated performance metrics for a single standard."""
    standardId: Optional[str] = None
    standardTitle: str
    avgScore: float
    minScore: float
    maxScore: float
    reportCount: int
    latestScore: float
    trend: str  # "up", "down", "stable"


class StatusBreakdown(BaseModel):
    """Report status distribution."""
    name: str
    value: int


class InsightItem(BaseModel):
    """An auto-generated insight from data analysis."""
    id: str
    title: str
    description: str
    severity: str  # "positive", "warning", "critical", "info"
    metric: Optional[str] = None
    action: Optional[str] = None


class GrowthMetrics(BaseModel):
    """Growth comparison between periods."""
    currentPeriodAvg: float
    previousPeriodAvg: float
    growthPercent: float
    direction: str  # "up", "down", "stable"


class AnomalyItem(BaseModel):
    """An anomalous report detected by statistical analysis."""
    reportId: str
    standardTitle: str
    score: float
    deviation: float
    createdAt: datetime


class EvidenceTrend(BaseModel):
    """Evidence upload counts grouped by period."""
    date: str
    count: int
    cumulativeCount: int


class AnalyticsResponse(BaseModel):
    """Complete analytics response — real data, zero mocks."""

    # KPIs
    totalReports: int
    avgScore: float
    stdDeviation: float
    latestScore: float
    scoreDelta: float  # difference between latest and previous
    uniqueStandards: int
    totalEvidence: int
    alignmentPercentage: float
    totalCriteria: int
    alignedCriteria: int

    # Growth
    growth: GrowthMetrics

    # Time-series
    scoreTrend: List[TimeSeriesPoint]
    evidenceTrend: List[EvidenceTrend]

    # Distributions
    standardPerformance: List[StandardPerformance]
    statusBreakdown: List[StatusBreakdown]
    scoreDistribution: List[Dict[str, Any]]  # histogram buckets

    # Anomalies
    anomalies: List[AnomalyItem]

    # Auto-generated insights
    insights: List[InsightItem]

    # Metadata
    periodDays: Optional[int] = None
    generatedAt: datetime

    class Config:
        from_attributes = True
