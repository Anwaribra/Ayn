"""Pydantic models for dashboard."""
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

class DashboardMetricsResponse(BaseModel):
    """Dashboard metrics response."""
    alignedCriteriaCount: int
    evidenceCount: int
    alignmentPercentage: float
    totalGapAnalyses: int
    
    # New live data fields
    recentEvidence: List[Any] = []
    recentAnalyses: List[Any] = []
    recentActivities: List[Any] = []
    unreadNotificationsCount: int = 0
    recentScores: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True
