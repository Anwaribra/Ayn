"""Assessments router."""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime
from app.core.db import get_db
from app.core.middlewares import get_current_user
from app.auth.dependencies import require_admin, require_roles
from app.assessments.models import (
    AssessmentCreateRequest,
    AssessmentResponse,
    AssessmentAnswersRequest,
    AssessmentAnswerRequest,
    AssessmentAnswerResponse,
    ReviewRequest,
    SubmitResponse,
    ReviewResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    request: AssessmentCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new assessment.
    
    Creates an assessment in DRAFT status for the current user's institution.
    
    - **institutionId**: Institution ID
    - **standardId**: Standard ID to assess against
    """
    db = get_db()
    
    # Auto-fill institutionId from current user if not provided
    institution_id = request.institutionId or current_user.get("institutionId")
    if not institution_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No institution associated with your account. Please provide institutionId."
        )
    
    # Verify institution exists
    institution = await db.institution.find_unique(where={"id": institution_id})
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    # Verify standard exists
    standard = await db.standard.find_unique(where={"id": request.standardId})
    if not standard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Standard not found"
        )
    
    # Check if user belongs to the institution (unless admin)
    if current_user["role"] != "ADMIN":
        if current_user.get("institutionId") != institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create assessments for your own institution"
            )
    
    try:
        assessment = await db.assessment.create(
            data={
                "institutionId": institution_id,
                "userId": current_user["id"],
                "standardId": request.standardId,
                "status": "DRAFT",
            }
        )
        
        logger.info(f"User {current_user['email']} created assessment: {assessment.id}")
        
        assessment_with_answers = await db.assessment.find_unique(
            where={"id": assessment.id},
            include={"answers": True}
        )
        
        return AssessmentResponse(
            id=assessment_with_answers.id,
            institutionId=assessment_with_answers.institutionId,
            userId=assessment_with_answers.userId,
            status=assessment_with_answers.status,
            createdAt=assessment_with_answers.createdAt,
            updatedAt=assessment_with_answers.updatedAt,
            submittedAt=getattr(assessment_with_answers, 'submittedAt', None),
            reviewedAt=getattr(assessment_with_answers, 'reviewedAt', None),
            reviewerComment=getattr(assessment_with_answers, 'reviewerComment', None),
            standardId=getattr(assessment_with_answers, 'standardId', None),
            answers=[
                AssessmentAnswerResponse(
                    id=ans.id,
                    assessmentId=ans.assessmentId,
                    criterionId=ans.criterionId,
                    answer=ans.answer,
                    reviewerComment=ans.reviewerComment
                )
                for ans in (assessment_with_answers.answers or [])
            ]
        )
    except Exception:
        logger.exception("Error creating assessment")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create assessment"
        )


@router.get("/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get assessment by ID.
    
    Returns assessment details with all answers.
    """
    db = get_db()
    
    assessment = await db.assessment.find_unique(
        where={"id": assessment_id},
        include={"answers": {"include": {"criterion": True}}}
    )
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    # Check access: Admin can access all, others can only access their institution's assessments
    if current_user["role"] != "ADMIN":
        if current_user.get("institutionId") != assessment.institutionId:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only view assessments for your institution"
            )
    
    standard_id = getattr(assessment, 'standardId', None)
    if standard_id is None and assessment.answers:
        first_answer = assessment.answers[0]
        if getattr(first_answer, "criterion", None) is not None:
            standard_id = first_answer.criterion.standardId

    return AssessmentResponse(
        id=assessment.id,
        institutionId=assessment.institutionId,
        userId=assessment.userId,
        status=assessment.status,
        createdAt=assessment.createdAt,
        updatedAt=assessment.updatedAt,
        submittedAt=getattr(assessment, 'submittedAt', None),
        reviewedAt=getattr(assessment, 'reviewedAt', None),
        reviewerComment=getattr(assessment, 'reviewerComment', None),
        standardId=standard_id,
        answers=[
            AssessmentAnswerResponse(
                id=ans.id,
                assessmentId=ans.assessmentId,
                criterionId=ans.criterionId,
                answer=ans.answer,
                reviewerComment=ans.reviewerComment
            )
            for ans in (assessment.answers or [])
        ]
    )


@router.post("/{assessment_id}/answers", response_model=List[AssessmentAnswerResponse])
async def save_assessment_answers(
    assessment_id: str,
    request: AssessmentAnswersRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Save or update assessment answers (draft mode).
    
    Only works if assessment is in DRAFT status.
    Teachers and Admins can save answers.
    
    - **answers**: List of answers with criterionId and answer text
    """
    db = get_db()
    
    # Check if assessment exists
    assessment = await db.assessment.find_unique(where={"id": assessment_id})
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    # Check access
    if current_user["role"] != "ADMIN":
        if current_user.get("institutionId") != assessment.institutionId:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        # Only the creator or admin can edit
        if assessment.userId != current_user["id"] and current_user["role"] != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only edit your own assessments"
            )
    
    # Only allow editing in DRAFT status
    if assessment.status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit assessment in {assessment.status} status. Only DRAFT assessments can be edited."
        )
    
    # Verify all criteria exist and belong to the same standard
    criterion_ids = [ans.criterionId for ans in request.answers]
    criteria = await db.criterion.find_many(where={"id": {"in": criterion_ids}})
    
    if len(criteria) != len(criterion_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more criteria not found"
        )
    
    try:
        saved_answers = []
        
        # Upsert each answer
        for answer_req in request.answers:
            # Check if answer already exists
            existing = await db.assessmentanswer.find_unique(
                where={
                    "assessmentId_criterionId": {
                        "assessmentId": assessment_id,
                        "criterionId": answer_req.criterionId
                    }
                }
            )
            
            if existing:
                # Update existing answer
                updated = await db.assessmentanswer.update(
                    where={"id": existing.id},
                    data={"answer": answer_req.answer}
                )
                saved_answers.append(updated)
            else:
                # Create new answer
                new_answer = await db.assessmentanswer.create(
                    data={
                        "assessmentId": assessment_id,
                        "criterionId": answer_req.criterionId,
                        "answer": answer_req.answer
                    }
                )
                saved_answers.append(new_answer)
        
        logger.info(f"User {current_user['email']} saved answers for assessment: {assessment_id}")
        
        return [
            AssessmentAnswerResponse(
                id=ans.id,
                assessmentId=ans.assessmentId,
                criterionId=ans.criterionId,
                answer=ans.answer,
                reviewerComment=ans.reviewerComment
            )
            for ans in saved_answers
        ]
    except Exception as e:
        logger.error(f"Error saving answers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save answers"
        )


@router.post("/{assessment_id}/submit", response_model=SubmitResponse)
async def submit_assessment(
    assessment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit assessment for review.
    
    Changes status from DRAFT to SUBMITTED. Any authenticated user can submit their own assessment.
    """
    db = get_db()
    
    assessment = await db.assessment.find_unique(where={"id": assessment_id})
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    # Only the creator or admin can submit
    if current_user["role"] != "ADMIN" and assessment.userId != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit your own assessments"
        )
    
    # Only allow submission from DRAFT status
    if assessment.status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit assessment in {assessment.status} status. Only DRAFT assessments can be submitted."
        )
    
    try:
        updated_assessment = await db.assessment.update(
            where={"id": assessment_id},
            data={
                "status": "SUBMITTED",
                "submittedAt": datetime.utcnow()
            }
        )
        
        logger.info(f"User {current_user['email']} submitted assessment: {assessment_id}")
        
        return SubmitResponse(
            message="Assessment submitted successfully",
            assessmentId=assessment_id,
            status=updated_assessment.status
        )
    except Exception as e:
        logger.error(f"Error submitting assessment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit assessment"
        )


@router.post("/{assessment_id}/review", response_model=ReviewResponse)
async def review_assessment(
    assessment_id: str,
    request: ReviewRequest,
    current_user: dict = Depends(require_roles(["ADMIN", "AUDITOR"]))
):
    """
    Review an assessment.
    
    Adds reviewer comment and changes status from SUBMITTED to REVIEWED.
    
    **Reviewers and Admins only** - Requires AUDITOR or ADMIN role.
    
    - **reviewerComment**: Reviewer's comment/feedback
    """
    db = get_db()
    
    assessment = await db.assessment.find_unique(where={"id": assessment_id})
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    # Only allow review from SUBMITTED status
    if assessment.status != "SUBMITTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot review assessment in {assessment.status} status. Only SUBMITTED assessments can be reviewed."
        )
    
    try:
        updated_assessment = await db.assessment.update(
            where={"id": assessment_id},
            data={
                "status": "REVIEWED",
                "reviewedAt": datetime.utcnow(),
                "reviewerComment": request.reviewerComment
            }
        )
        
        logger.info(f"User {current_user['email']} reviewed assessment: {assessment_id}")
        
        return ReviewResponse(
            message="Assessment reviewed successfully",
            assessmentId=assessment_id,
            status=updated_assessment.status,
            reviewerComment=getattr(updated_assessment, 'reviewerComment', request.reviewerComment)
        )
    except Exception as e:
        logger.error(f"Error reviewing assessment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to review assessment"
        )


@router.get("/", response_model=List[AssessmentResponse])
async def list_assessments(
    current_user: dict = Depends(get_current_user)
):
    """
    List assessments.
    
    - Admins: See all assessments
    - Others: See only their institution's assessments
    """
    db = get_db()
    
    try:
        if current_user["role"] == "ADMIN":
            # Admin sees all
            assessments = await db.assessment.find_many(
                include={"answers": True},
                order={"createdAt": "desc"}
            )
        else:
            # Others see only their institution's assessments
            institution_id = current_user.get("institutionId")
            if not institution_id:
                return []
            
            assessments = await db.assessment.find_many(
                where={"institutionId": institution_id},
                include={"answers": True},
                order={"createdAt": "desc"}
            )
        
        return [
            AssessmentResponse(
                id=assess.id,
                institutionId=assess.institutionId,
                userId=assess.userId,
                status=assess.status,
                createdAt=assess.createdAt,
                updatedAt=assess.updatedAt,
                submittedAt=getattr(assess, 'submittedAt', None),
                reviewedAt=getattr(assess, 'reviewedAt', None),
                reviewerComment=getattr(assess, 'reviewerComment', None),
                standardId=getattr(assess, 'standardId', None),
                answers=[
                    AssessmentAnswerResponse(
                        id=ans.id,
                        assessmentId=ans.assessmentId,
                        criterionId=ans.criterionId,
                        answer=ans.answer,
                        reviewerComment=ans.reviewerComment
                    )
                    for ans in (assess.answers or [])
                ]
            )
            for assess in assessments
        ]
    except Exception as e:
        logger.error(f"Error listing assessments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch assessments"
        )
