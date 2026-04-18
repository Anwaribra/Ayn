"""Dashboard service - Live Data Refactor."""
from fastapi import HTTPException, status
from typing import List, Dict, Any
from app.core.db import get_db
from app.dashboard.models import DashboardMetricsResponse
from app.activity.service import ActivityService
from app.notifications.service import NotificationService
from app.evidence.models import EvidenceResponse
from app.core.redis import redis_client
from app.compliance.alignment_metrics import (
    count_distinct_criteria_with_evidence,
    institution_evidence_visibility_filter,
)
import logging
from datetime import datetime
import json

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
            cache_key = f"dashboard_metrics_counts:{'admin' if is_admin else institution_id or user_id}"
            counts_cache = None
            if redis_client.enabled:
                try:
                    counts_cache = redis_client.get(cache_key)
                except Exception:
                    counts_cache = None

            if counts_cache:
                counts = json.loads(counts_cache)
                evidence_count = counts.get("evidence_count", 0)
                total_gap_analyses = counts.get("total_gap_analyses", 0)
                aligned_criteria_count = counts.get("aligned_criteria_count", 0)
                total_criteria = counts.get("total_criteria", 0)
            else:
                if is_admin:
                    evidence_count = await db.evidence.count()
                    total_gap_analyses = await db.gapanalysis.count()
                    total_criteria = await db.criterion.count()
                    aligned_criteria_count = await count_distinct_criteria_with_evidence(
                        db, evidence_where=None
                    )
                else:
                    evidence_count = await db.evidence.count(where={"uploadedById": user_id})
                    total_gap_analyses = await db.gapanalysis.count(where={"institutionId": institution_id}) if institution_id else 0

                    # Aligned criteria for this institution
                    if institution_id:
                        institution_standards = await db.institutionstandard.find_many(where={"institutionId": institution_id})
                        standard_ids = [s.standardId for s in institution_standards]
                        if standard_ids:
                            total_criteria = await db.criterion.count(where={"standardId": {"in": standard_ids}})
                        else:
                            total_criteria = 0

                        inst_members = await db.user.find_many(
                            where={"institutionId": institution_id},
                            select={"id": True},
                        )
                        member_ids = [u.id for u in inst_members]
                        ev_scope = institution_evidence_visibility_filter(
                            institution_id, user_id, member_ids
                        )
                        aligned_criteria_count = await count_distinct_criteria_with_evidence(
                            db, evidence_where=ev_scope
                        )
                    else:
                        total_criteria = 0
                        aligned_criteria_count = 0

                if redis_client.enabled:
                    try:
                        redis_client.set(
                            cache_key,
                            json.dumps({
                                "evidence_count": evidence_count,
                                "total_gap_analyses": total_gap_analyses,
                                "aligned_criteria_count": aligned_criteria_count,
                                "total_criteria": total_criteria,
                            }),
                            ex=30,
                        )
                    except Exception:
                        pass

            alignment_percentage = round((aligned_criteria_count / total_criteria) * 100, 2) if total_criteria > 0 else 0.0

            # If criterion links are missing but gap analyses exist, surface avg report score
            # so active workspaces don't show a misleading 0%.
            if (
                alignment_percentage == 0.0
                and total_criteria > 0
                and not is_admin
                and institution_id
                and total_gap_analyses > 0
            ):
                recent_ga = await db.gapanalysis.find_many(
                    where={"institutionId": institution_id},
                    order={"createdAt": "desc"},
                    take=10,
                )
                if recent_ga:
                    alignment_percentage = round(
                        sum(float(r.overallScore) for r in recent_ga) / len(recent_ga),
                        2,
                    )

            # Record in platform state for Horus and other consumers
            try:
                from app.platform_state.service import StateService
                state_service = StateService(db)
                await state_service.record_metric_update(
                    user_id=user_id,
                    metric_id=f"compliance_score_{user_id}",
                    name="Compliance Alignment Score",
                    value=alignment_percentage,
                    source_module="dashboard"
                )
            except Exception as se:
                logger.error(f"Failed to update platform state metric: {se}")
            
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
