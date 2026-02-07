"""Dashboard router."""
from fastapi import APIRouter, HTTPException, status, Depends
from app.core.db import get_db
from app.core.middlewares import get_current_user
from app.dashboard.models import DashboardMetricsResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/metrics", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(
    current_user: dict = Depends(get_current_user)
):
    """
    Get dashboard metrics.
    
    Returns metrics for the dashboard:
    - completedCriteriaCount: Number of criteria with completed answers
    - evidenceCount: Total number of evidence files
    - assessmentProgressPercentage: Overall assessment progress (0-100)
    - totalAssessments: Total number of assessments
    
    **Scoping:**
    - Admins: See metrics for all institutions
    - Others: See metrics only for their institution
    """
    db = get_db()
    
    try:
        # Determine scope based on user role
        is_admin = current_user["role"] == "ADMIN"
        institution_id = None if is_admin else current_user.get("institutionId")
        
        if not is_admin and not institution_id:
            # User has no institution, return zeros
            return DashboardMetricsResponse(
                completedCriteriaCount=0,
                evidenceCount=0,
                assessmentProgressPercentage=0.0,
                totalAssessments=0
            )
        
        # Build assessment filter
        assessment_where = {} if is_admin else {"institutionId": institution_id}
        
        # 1. Get assessment IDs for this scope
        assessments = await db.assessment.find_many(
            where=assessment_where
        )
        assessment_ids = [a.id for a in assessments]
        total_assessments = len(assessments)
        
        # 2. Count answers using Prisma "in" filter (fixes N+1)
        if assessment_ids:
            answer_where = {"assessmentId": {"in": assessment_ids}}
            all_answers = await db.assessmentanswer.find_many(where=answer_where)
            total_answers = len(all_answers)
            completed_criteria_count = sum(1 for ans in all_answers if ans.answer is not None)
        else:
            total_answers = 0
            completed_criteria_count = 0
        
        # 3. Count evidence files (use Prisma "in" filter)
        if is_admin:
            evidence_list = await db.evidence.find_many()
            evidence_count = len(evidence_list)
        else:
            # Get user IDs for this institution
            users = await db.user.find_many(
                where={"institutionId": institution_id}
            )
            user_ids = [u.id for u in users]
            if user_ids:
                evidence_list = await db.evidence.find_many(
                    where={"uploadedById": {"in": user_ids}}
                )
                evidence_count = len(evidence_list)
            else:
                evidence_count = 0
        
        # 4. Calculate assessment progress percentage
        if total_answers > 0:
            assessment_progress = round((completed_criteria_count / total_answers) * 100, 2)
        else:
            assessment_progress = 0.0
        
        logger.info(f"User {current_user['email']} fetched dashboard metrics")
        
        return DashboardMetricsResponse(
            completedCriteriaCount=completed_criteria_count,
            evidenceCount=evidence_count,
            assessmentProgressPercentage=assessment_progress,
            totalAssessments=total_assessments
        )
    
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard metrics"
        )
