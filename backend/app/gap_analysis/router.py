"""Gap analysis router - AI-powered gap report generation and management."""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
import json
import logging
from datetime import datetime

from app.core.db import get_db
from app.core.middlewares import get_current_user
from app.gap_analysis.models import (
    GapAnalysisRequest,
    GapAnalysisResponse,
    GapAnalysisListItem,
    GapItem,
    ArchiveRequest,
)
from app.gap_analysis.service import generate_gap_analysis

logger = logging.getLogger(__name__)

router = APIRouter()


def _build_response(record, standard_title: str) -> GapAnalysisResponse:
    """Build a GapAnalysisResponse from a DB record."""
    try:
        gaps_data = json.loads(record.gapsJson) if record.gapsJson else []
    except json.JSONDecodeError:
        gaps_data = []

    try:
        recommendations_data = json.loads(record.recommendationsJson) if record.recommendationsJson else []
    except json.JSONDecodeError:
        recommendations_data = []

    return GapAnalysisResponse(
        id=record.id,
        institutionId=record.institutionId,
        standardId=record.standardId,
        standardTitle=standard_title,
        assessmentId=record.assessmentId,
        overallScore=record.overallScore,
        summary=record.summary,
        gaps=[GapItem(**g) for g in gaps_data],
        recommendations=recommendations_data,
        archived=record.archived,
        createdAt=record.createdAt,
    )


# ─── Generate Gap Analysis ────────────────────────────────────────────────────

@router.post("/generate", response_model=GapAnalysisResponse, status_code=status.HTTP_201_CREATED)
async def generate_gap_analysis_report(
    request: GapAnalysisRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate a new AI-powered gap analysis report.

    1. Fetches all criteria for the selected standard
    2. Fetches assessment answers for the institution
    3. Fetches evidence linked to those criteria
    4. Sends all data to Gemini AI for analysis
    5. Saves and returns the structured report
    """
    db = get_db()

    # Verify user has an institution
    if not current_user.get("institutionId"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must be associated with an institution to run gap analysis"
        )

    institution_id = current_user["institutionId"]

    # Get the standard
    standard = await db.standard.find_unique(where={"id": request.standardId})
    if not standard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Standard not found"
        )

    # Get all criteria for this standard
    criteria = await db.criterion.find_many(
        where={"standardId": request.standardId}
    )

    # Get assessment answers - either for a specific assessment or all for this institution
    if request.assessmentId:
        assessment = await db.assessment.find_unique(where={"id": request.assessmentId})
        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment not found"
            )
        answers = await db.assessmentanswer.find_many(
            where={"assessmentId": request.assessmentId}
        )
    else:
        # Get all answers from assessments for this institution + standard
        assessments = await db.assessment.find_many(
            where={
                "institutionId": institution_id,
                "standardId": request.standardId,
            }
        )
        assessment_ids = [a.id for a in assessments]
        if assessment_ids:
            answers = await db.assessmentanswer.find_many(
                where={"assessmentId": {"in": assessment_ids}}
            )
        else:
            answers = []

    # Get evidence linked to criteria of this standard
    criterion_ids = [c.id for c in criteria]
    if criterion_ids:
        evidence = await db.evidence.find_many(
            where={"criterionId": {"in": criterion_ids}}
        )
    else:
        evidence = []

    try:
        # Generate the gap analysis using AI
        result = await generate_gap_analysis(standard, criteria, answers, evidence)

        # Save to database
        record = await db.gapanalysis.create(
            data={
                "institutionId": institution_id,
                "standardId": request.standardId,
                "assessmentId": request.assessmentId,
                "overallScore": result["overallScore"],
                "summary": result["summary"],
                "gapsJson": json.dumps(result["gaps"]),
                "recommendationsJson": json.dumps(result["recommendations"]),
            }
        )

        logger.info(f"User {current_user['email']} generated gap analysis {record.id} for standard {request.standardId}")

        return _build_response(record, standard.title)

    except Exception as e:
        logger.error(f"Error generating gap analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate gap analysis: {str(e)}"
        )


# ─── List Gap Analyses ────────────────────────────────────────────────────────

@router.get("/", response_model=List[GapAnalysisListItem])
async def list_gap_analyses(
    current_user: dict = Depends(get_current_user),
):
    """List all gap analysis reports for the user's institution."""
    db = get_db()

    if not current_user.get("institutionId"):
        return []

    records = await db.gapanalysis.find_many(
        where={
            "institutionId": current_user["institutionId"],
            "archived": False,
        },
        order={"createdAt": "desc"},
        include={"standard": True},
    )

    return [
        GapAnalysisListItem(
            id=r.id,
            standardTitle=r.standard.title if r.standard else "Unknown Standard",
            overallScore=r.overallScore,
            summary=r.summary,
            archived=r.archived,
            createdAt=r.createdAt,
        )
        for r in records
    ]


# ─── List Archived Reports (MUST be before /{gap_analysis_id}) ───────────────

@router.get("/archived/list", response_model=List[GapAnalysisListItem])
async def list_archived_gap_analyses(
    current_user: dict = Depends(get_current_user),
):
    """List all archived gap analysis reports for the user's institution."""
    db = get_db()

    if not current_user.get("institutionId"):
        return []

    records = await db.gapanalysis.find_many(
        where={
            "institutionId": current_user["institutionId"],
            "archived": True,
        },
        order={"createdAt": "desc"},
        include={"standard": True},
    )

    return [
        GapAnalysisListItem(
            id=r.id,
            standardTitle=r.standard.title if r.standard else "Unknown Standard",
            overallScore=r.overallScore,
            summary=r.summary,
            archived=r.archived,
            createdAt=r.createdAt,
        )
        for r in records
    ]


# ─── Get Single Gap Analysis ─────────────────────────────────────────────────

@router.get("/{gap_analysis_id}", response_model=GapAnalysisResponse)
async def get_gap_analysis(
    gap_analysis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a specific gap analysis report by ID."""
    db = get_db()

    record = await db.gapanalysis.find_unique(
        where={"id": gap_analysis_id},
        include={"standard": True},
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gap analysis not found"
        )

    # Check access
    if (
        current_user["role"] != "ADMIN"
        and record.institutionId != current_user.get("institutionId")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this gap analysis"
        )

    standard_title = record.standard.title if record.standard else "Unknown Standard"
    return _build_response(record, standard_title)


# ─── Delete Gap Analysis ─────────────────────────────────────────────────────

@router.delete("/{gap_analysis_id}", status_code=status.HTTP_200_OK)
async def delete_gap_analysis(
    gap_analysis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a gap analysis report."""
    db = get_db()

    record = await db.gapanalysis.find_unique(where={"id": gap_analysis_id})
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gap analysis not found"
        )

    if (
        current_user["role"] != "ADMIN"
        and record.institutionId != current_user.get("institutionId")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this gap analysis"
        )

    await db.gapanalysis.delete(where={"id": gap_analysis_id})
    logger.info(f"User {current_user['email']} deleted gap analysis {gap_analysis_id}")

    return {"message": "Gap analysis deleted successfully"}


# ─── Archive / Unarchive ─────────────────────────────────────────────────────

@router.post("/{gap_analysis_id}/archive", status_code=status.HTTP_200_OK)
async def archive_gap_analysis(
    gap_analysis_id: str,
    request: ArchiveRequest,
    current_user: dict = Depends(get_current_user),
):
    """Archive or unarchive a gap analysis report."""
    db = get_db()

    record = await db.gapanalysis.find_unique(where={"id": gap_analysis_id})
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gap analysis not found"
        )

    if (
        current_user["role"] != "ADMIN"
        and record.institutionId != current_user.get("institutionId")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this gap analysis"
        )

    await db.gapanalysis.update(
        where={"id": gap_analysis_id},
        data={"archived": request.archived},
    )

    action = "archived" if request.archived else "unarchived"
    logger.info(f"User {current_user['email']} {action} gap analysis {gap_analysis_id}")

    return {"message": f"Gap analysis {action} successfully"}
