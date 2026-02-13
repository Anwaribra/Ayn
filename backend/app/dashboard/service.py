"""Dashboard service - Live Data Refactor."""
from fastapi import HTTPException, status
from typing import List, Dict, Any
from app.core.db import get_db
from app.dashboard.models import DashboardMetricsResponse
from app.activity.service import ActivityService
from app.notifications.service import NotificationService
from app.evidence.models import EvidenceResponse
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class DashboardService:
    """Service for dashboard analytics business logic."""
    
    @staticmethod
    async def get_metrics(current_user: dict) -> DashboardMetricsResponse:
        """Get dashboard metrics based on user scope with live data."""
        db = get_db()
        try:
            is_admin = current_user["role"] == "ADMIN"
            user_id = current_user["id"]
            institution_id = current_user.get("institutionId")
            
            # --- 1. Basic Metrics ---
            if is_admin:
                evidence_count = await db.evidence.count()
                total_gap_analyses = await db.gapanalysis.count()
                aligned_criteria_count = await db.evidence.count(where={"criteria": {"some": {}}})
                total_criteria = await db.criterion.count()
            else:
                evidence_count = await db.evidence.count(where={"uploadedById": user_id})
                total_gap_analyses = await db.gapanalysis.count(where={"institutionId": institution_id}) if institution_id else 0
                
                # Aligned criteria for this institution
                if institution_id:
                    institution_standards = await db.institutionstandard.find_many(where={"institutionId": institution_id})
                    standard_ids = [s.standardId for s in institution_standards]
                    criteria = await db.criterion.find_many(where={"standardId": {"in": standard_ids}})
                    total_criteria = len(criteria)
                    
                    # Criteria that have evidence from this institution
                    aligned_criteria_count = await db.evidencecriterion.count(
                        where={"evidence": {"ownerId": institution_id}}
                    )
                else:
                    total_criteria = 0
                    aligned_criteria_count = 0

            alignment_percentage = round((aligned_criteria_count / total_criteria) * 100, 2) if total_criteria > 0 else 0.0
            
            # --- 2. Live Data Fetches ---
            
            # Recent Evidence
            recent_evidence = await db.evidence.find_many(
                where={} if is_admin else {"uploadedById": user_id},
                take=5,
                order={"createdAt": "desc"}
            )
            
            # Recent Analyses
            recent_analyses = await db.gapanalysis.find_many(
                where={} if is_admin else {"institutionId": institution_id} if institution_id else {"id": "none"},
                take=5,
                order={"createdAt": "desc"},
                include={"standard": True}
            )
            
            # Recent activities
            recent_activities = await ActivityService.get_recent_activities(user_id, limit=10)
            
            # Unread notifications count
            unread_count = await NotificationService.get_unread_count(user_id)
            
            # Recent Scores
            recent_scores = []
            for ana in recent_analyses:
                recent_scores.append({
                    "standard": ana.standard.title if ana.standard else "General",
                    "score": ana.overallScore,
                    "date": ana.createdAt.isoformat()
                })

            return DashboardMetricsResponse(
                alignedCriteriaCount=aligned_criteria_count,
                evidenceCount=evidence_count,
                alignmentPercentage=alignment_percentage,
                totalGapAnalyses=total_gap_analyses,
                recentEvidence=recent_evidence,
                recentAnalyses=recent_analyses,
                recentActivities=recent_activities,
                unreadNotificationsCount=unread_count,
                recentScores=recent_scores
            )
        except Exception as e:
            logger.error(f"Error fetching dashboard metrics: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to fetch dashboard metrics: {str(e)}")
