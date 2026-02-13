"""Gap analysis service."""
from fastapi import HTTPException, status
from typing import List
import json
import logging
from app.core.db import get_db
from app.gap_analysis.models import (
    GapAnalysisRequest,
    GapAnalysisResponse,
    GapAnalysisListItem,
    GapItem,
    ArchiveRequest,
)
from app.notifications.service import NotificationService
from app.notifications.models import NotificationCreateRequest
from app.gap_analysis.ai_service import generate_gap_analysis as ai_generate_gap_analysis
import logging

logger = logging.getLogger(__name__)

class GapAnalysisService:
    """Service for gap analysis business logic."""
    
    @staticmethod
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
            overallScore=record.overallScore,
            summary=record.summary,
            gaps=[GapItem(**g) for g in gaps_data],
            recommendations=recommendations_data,
            archived=record.archived,
            createdAt=record.createdAt,
        )

    @staticmethod
    async def generate_report(request: GapAnalysisRequest, current_user: dict) -> GapAnalysisResponse:
        """Generate a new AI-powered gap analysis report."""
        db = get_db()
        institution_id = current_user.get("institutionId")
        if not institution_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Institution required")

        standard = await db.standard.find_unique(where={"id": request.standardId})
        if not standard:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Standard not found")

        criteria = await db.criterion.find_many(where={"standardId": request.standardId})

        # Get evidence
        criterion_ids = [c.id for c in criteria]
        evidence = await db.evidence.find_many(where={"criterionId": {"in": criterion_ids}}) if criterion_ids else []

        try:
            result = await ai_generate_gap_analysis(standard, criteria, evidence)
            record = await db.gapanalysis.create(
                data={
                    "institutionId": institution_id,
                    "standardId": request.standardId,
                    "overallScore": result["overallScore"],
                    "summary": result["summary"],
                    "gapsJson": json.dumps(result["gaps"]),
                    "recommendationsJson": json.dumps(result["recommendations"]),
                }
            )
            )
            
            # Trigger Notification
            try:
                await NotificationService.create_notification(NotificationCreateRequest(
                    userId=current_user["id"],
                    type="success",
                    title="Report Generated",
                    message=f"Gap analysis for '{standard.title}' is ready.",
                    relatedEntityId=record.id,
                    relatedEntityType="report"
                ))
            except Exception as e:
                logger.error(f"Failed to send notification: {e}")
                
            logger.info(f"User {current_user.get('email', 'unknown')} generated gap analysis {record.id}")
            return GapAnalysisService._build_response(record, standard.title)
        except Exception as e:
            logger.error(f"Generation error: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def list_reports(current_user: dict, archived: bool = False) -> List[GapAnalysisListItem]:
        """List gap analysis reports."""
        db = get_db()
        institution_id = current_user.get("institutionId")
        if not institution_id: return []
        
        records = await db.gapanalysis.find_many(
            where={"institutionId": institution_id, "archived": archived},
            order={"createdAt": "desc"},
            include={"standard": True},
        )
        return [
            GapAnalysisListItem(
                id=r.id,
                standardTitle=r.standard.title if r.standard else "Unknown",
                overallScore=r.overallScore,
                summary=r.summary,
                archived=r.archived,
                createdAt=r.createdAt,
            )
            for r in records
        ]

    @staticmethod
    async def get_report(gap_analysis_id: str, current_user: dict) -> GapAnalysisResponse:
        """Get a specific report."""
        db = get_db()
        record = await db.gapanalysis.find_unique(where={"id": gap_analysis_id}, include={"standard": True})
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
            
        if current_user["role"] != "ADMIN" and record.institutionId != current_user.get("institutionId"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
        return GapAnalysisService._build_response(record, record.standard.title if record.standard else "Unknown")

    @staticmethod
    async def delete_report(gap_analysis_id: str, current_user: dict):
        """Delete a report."""
        db = get_db()
        record = await db.gapanalysis.find_unique(where={"id": gap_analysis_id})
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
            
        if current_user["role"] != "ADMIN" and record.institutionId != current_user.get("institutionId"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
        await db.gapanalysis.delete(where={"id": gap_analysis_id})
        logger.info(f"User {current_user['email']} deleted gap analysis {gap_analysis_id}")

    @staticmethod
    async def archive_report(gap_analysis_id: str, archived: bool, current_user: dict):
        """Archive or unarchive a report."""
        db = get_db()
        record = await db.gapanalysis.find_unique(where={"id": gap_analysis_id})
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
            
        if current_user["role"] != "ADMIN" and record.institutionId != current_user.get("institutionId"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
        await db.gapanalysis.update(where={"id": gap_analysis_id}, data={"archived": archived})
        logger.info(f"User {current_user['email']} archived/unarchived {gap_analysis_id}")
