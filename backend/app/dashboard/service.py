"""Dashboard service."""
from fastapi import HTTPException, status
from app.core.db import get_db
from app.dashboard.models import DashboardMetricsResponse
import logging

logger = logging.getLogger(__name__)

class DashboardService:
    """Service for dashboard analytics business logic."""
    
    @staticmethod
    async def get_metrics(current_user: dict) -> DashboardMetricsResponse:
        """Get dashboard metrics based on user scope."""
        db = get_db()
        try:
            is_admin = current_user["role"] == "ADMIN"
            institution_id = None if is_admin else current_user.get("institutionId")
            
            if not is_admin and not institution_id:
                return DashboardMetricsResponse(
                    alignedCriteriaCount=0,
                    evidenceCount=0,
                    alignmentPercentage=0.0,
                    totalGapAnalyses=0
                )
            
            # Evidence count logic
            if is_admin:
                evidence_count = await db.evidence.count()
                total_gap_analyses = await db.gapanalysis.count()
                aligned_criteria_count = await db.evidence.count(where={"criterionId": {"not": None}})
                total_criteria = await db.criterion.count()
            else:
                users = await db.user.find_many(where={"institutionId": institution_id})
                user_ids = [u.id for u in users]
                evidence_count = await db.evidence.count(where={"uploadedById": {"in": user_ids}}) if user_ids else 0
                total_gap_analyses = await db.gapanalysis.count(where={"institutionId": institution_id})
                
                # For aligned criteria, we count how many distinct criteria have evidence uploaded by this institution's users
                # This is a bit complex with find_many, but we can approximate or use a query
                # Simpler: Count criteria in standards linked to this institution that have at least one evidence
                institution_standards = await db.institutionstandard.find_many(where={"institutionId": institution_id})
                standard_ids = [s.standardId for s in institution_standards]
                
                criteria = await db.criterion.find_many(where={"standardId": {"in": standard_ids}}) if standard_ids else []
                total_criteria = len(criteria)
                
                # Find which of these criteria have evidence
                criteria_ids = [c.id for c in criteria]
                evidence_with_criteria = await db.evidence.find_many(where={"criterionId": {"in": criteria_ids}}) if criteria_ids else []
                aligned_criteria_ids = {e.criterionId for e in evidence_with_criteria if e.criterionId}
                aligned_criteria_count = len(aligned_criteria_ids)

            alignment_percentage = round((aligned_criteria_count / total_criteria) * 100, 2) if total_criteria > 0 else 0.0
            
            return DashboardMetricsResponse(
                alignedCriteriaCount=aligned_criteria_count,
                evidenceCount=evidence_count,
                alignmentPercentage=alignment_percentage,
                totalGapAnalyses=total_gap_analyses
            )
        except Exception as e:
            logger.error(f"Error fetching dashboard metrics: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch dashboard metrics")
