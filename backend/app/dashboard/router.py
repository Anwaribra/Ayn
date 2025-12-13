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
    
    Returns simple metrics for the dashboard:
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
        if current_user["role"] == "ADMIN":
            # Admin sees all
            institution_filter = None
        else:
            # Others see only their institution
            institution_id = current_user.get("institutionId")
            if not institution_id:
                # User has no institution, return zeros
                return DashboardMetricsResponse(
                    completedCriteriaCount=0,
                    evidenceCount=0,
                    assessmentProgressPercentage=0.0,
                    totalAssessments=0
                )
            institution_filter = institution_id
        
        # 1. Count completed criteria (AssessmentAnswer records with non-null answers)
        if institution_filter:
            # Get assessments for this institution
            assessments = await db.assessment.find_many(
                where={"institutionId": institution_filter}
            )
            assessment_ids = [assess.id for assess in assessments]
            
            if assessment_ids:
                # Get all answers for these assessments and filter for non-null
                # Prisma Python doesn't support {"in": ...} syntax, so we query all and filter
                all_answers = await db.assessmentanswer.find_many()
                # Filter to only answers for these assessments
                filtered_answers = [ans for ans in all_answers if ans.assessmentId in assessment_ids]
                completed_criteria = [ans for ans in filtered_answers if ans.answer is not None]
                completed_criteria_count = len(completed_criteria)
            else:
                completed_criteria_count = 0
        else:
            # Admin: count all
            all_answers = await db.assessmentanswer.find_many()
            completed_criteria = [ans for ans in all_answers if ans.answer is not None]
            completed_criteria_count = len(completed_criteria)
        
        # 2. Count evidence files
        if institution_filter:
            # For evidence, we need to check through users in the institution
            users = await db.user.find_many(
                where={"institutionId": institution_filter}
            )
            user_ids = [user.id for user in users]
            
            if user_ids:
                # Prisma Python doesn't support {"in": ...} syntax, so we query all and filter
                all_evidence = await db.evidence.find_many()
                evidence_list = [ev for ev in all_evidence if ev.uploadedById in user_ids]
                evidence_count = len(evidence_list)
            else:
                evidence_count = 0
        else:
            # Admin: count all
            evidence_list = await db.evidence.find_many()
            evidence_count = len(evidence_list)
        
        # 3. Count total assessments
        if institution_filter:
            assessments_list = await db.assessment.find_many(
                where={"institutionId": institution_filter}
            )
            total_assessments = len(assessments_list)
        else:
            # Admin: count all
            assessments_list = await db.assessment.find_many()
            total_assessments = len(assessments_list)
        
        # 4. Calculate assessment progress percentage
        # Progress = (completed criteria / total criteria in assessments) * 100
        if institution_filter:
            if assessment_ids:
                # Get all criteria for assessments in this institution
                # First, get all criteria IDs from assessment answers
                # Prisma Python doesn't support {"in": ...} syntax, so we query all and filter
                all_answers_raw = await db.assessmentanswer.find_many()
                all_answers = [ans for ans in all_answers_raw if ans.assessmentId in assessment_ids]
                total_criteria_in_assessments = len(all_answers)
                
                if total_criteria_in_assessments > 0:
                    assessment_progress = (completed_criteria_count / total_criteria_in_assessments) * 100
                else:
                    assessment_progress = 0.0
            else:
                assessment_progress = 0.0
        else:
            # Admin: calculate for all
            all_answers = await db.assessmentanswer.find_many()
            total_criteria_in_assessments = len(all_answers)
            
            if total_criteria_in_assessments > 0:
                assessment_progress = (completed_criteria_count / total_criteria_in_assessments) * 100
            else:
                assessment_progress = 0.0
        
        # Round to 2 decimal places
        assessment_progress = round(assessment_progress, 2)
        
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
