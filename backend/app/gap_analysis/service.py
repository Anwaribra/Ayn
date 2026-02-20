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
    UserDTO,
)
from app.notifications.service import NotificationService
from app.notifications.models import NotificationCreateRequest
from app.gap_analysis.ai_service import generate_gap_analysis as ai_generate_gap_analysis

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
    async def queue_report(request: GapAnalysisRequest, current_user: UserDTO) -> dict:
        """
        Create a stub GapAnalysis record immediately and return the job ID.
        The actual AI analysis runs as a background task.
        """
        db = get_db()
        institution_id = current_user.institutionId
        if not institution_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account is not associated with an institution. Please contact your administrator."
            )

        standard = await db.standard.find_unique(where={"id": request.standardId})
        if not standard:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Standard not found")

        # Create a stub record — the background task will update it
        record = await db.gapanalysis.create(
            data={
                "institutionId": institution_id,
                "standardId": request.standardId,
                "overallScore": 0.0,           # Sentinel: 0.0 = queued/processing
                "summary": "queued",            # Sentinel: "queued" = in progress
                "gapsJson": "[]",
                "recommendationsJson": "[]",
            }
        )
        logger.info(f"Queued gap analysis job {record.id} for user {current_user.email}")
        return {"jobId": record.id, "status": "queued"}

    @staticmethod
    async def run_report_background(
        job_id: str,
        user_id: str,
        institution_id: str,
        standard_id: str,
        current_user: UserDTO,
    ) -> None:
        """
        Background task: run the AI gap analysis and update the stub record.
        Never raises — all errors are caught, logged, and stored in the record.
        """
        from app.core.db import db as prisma_client
        db = prisma_client

        logger.info(f"Starting background gap analysis for job {job_id}")
        try:
            # Ensure DB is connected (singleton, usually already connected)
            if not db.is_connected():
                await db.connect()

            standard = await db.standard.find_unique(where={"id": standard_id})
            if not standard:
                logger.error(f"Standard {standard_id} not found for job {job_id}")
                await db.gapanalysis.update(
                    where={"id": job_id},
                    data={"summary": "failed", "gapsJson": "[]", "recommendationsJson": "[]"}
                )
                return

            criteria = await db.criterion.find_many(where={"standardId": standard_id})
            criterion_ids = [c.id for c in criteria]
            evidence = []
            if criterion_ids:
                evidence_criteria = await db.evidencecriterion.find_many(
                    where={"criterionId": {"in": criterion_ids}},
                    include={"evidence": True}
                )
                seen_ids = set()
                for ec in evidence_criteria:
                    if ec.evidence and ec.evidence.id not in seen_ids:
                        evidence.append(ec.evidence)
                        seen_ids.add(ec.evidence.id)
                legacy_evidence = await db.evidence.find_many(
                    where={"criterionId": {"in": criterion_ids}, "id": {"notIn": list(seen_ids)}}
                )
                evidence.extend(legacy_evidence)

            result = await ai_generate_gap_analysis(standard, criteria, evidence)

            # Update the stub record with real results
            await db.gapanalysis.update(
                where={"id": job_id},
                data={
                    "overallScore": result["overallScore"],
                    "summary": result["summary"],
                    "gapsJson": json.dumps(result["gaps"]),
                    "recommendationsJson": json.dumps(result["recommendations"]),
                }
            )

            # Notify the user so the SSE stream / notification bell picks it up
            try:
                await NotificationService.create_notification(NotificationCreateRequest(
                    userId=user_id,
                    type="success",
                    title="Gap Analysis Ready",
                    message=f"Gap analysis for '{standard.title}' is complete. Click to view.",
                    relatedEntityId=job_id,
                    relatedEntityType="report"
                ))
            except Exception as notify_err:
                logger.error(f"Failed to send completion notification: {notify_err}")

            logger.info(f"Background gap analysis {job_id} completed successfully.")

        except Exception as e:
            logger.error(f"Background gap analysis {job_id} failed: {e}", exc_info=True)
            try:
                await db.gapanalysis.update(
                    where={"id": job_id},
                    data={"summary": "failed", "gapsJson": "[]", "recommendationsJson": "[]"}
                )
                await NotificationService.create_notification(NotificationCreateRequest(
                    userId=user_id,
                    type="error",
                    title="Gap Analysis Failed",
                    message="The gap analysis could not be completed. Please try again.",
                    relatedEntityId=job_id,
                    relatedEntityType="report"
                ))
            except Exception:
                pass  # Last resort — never crash the background worker


    @staticmethod
    async def list_reports(current_user: UserDTO, archived: bool = False) -> List[GapAnalysisListItem]:
        """List gap analysis reports."""
        db = get_db()
        institution_id = current_user.institutionId
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
    async def get_report(gap_analysis_id: str, current_user: UserDTO) -> GapAnalysisResponse:
        """Get a specific report."""
        db = get_db()
        record = await db.gapanalysis.find_unique(where={"id": gap_analysis_id}, include={"standard": True})
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
            
        if current_user.role != "ADMIN" and record.institutionId != current_user.institutionId:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
        return GapAnalysisService._build_response(record, record.standard.title if record.standard else "Unknown")

    @staticmethod
    async def delete_report(gap_analysis_id: str, current_user: UserDTO):
        """Delete a report."""
        db = get_db()
        record = await db.gapanalysis.find_unique(where={"id": gap_analysis_id})
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
            
        if current_user.role != "ADMIN" and record.institutionId != current_user.institutionId:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
        await db.gapanalysis.delete(where={"id": gap_analysis_id})
        logger.info(f"User {current_user.email} deleted gap analysis {gap_analysis_id}")

    @staticmethod
    async def archive_report(gap_analysis_id: str, archived: bool, current_user: UserDTO):
        """Archive or unarchive a report."""
        db = get_db()
        record = await db.gapanalysis.find_unique(where={"id": gap_analysis_id})
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
            
        if current_user.role != "ADMIN" and record.institutionId != current_user.institutionId:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
        await db.gapanalysis.update(where={"id": gap_analysis_id}, data={"archived": archived})
        logger.info(f"User {current_user.email} archived/unarchived {gap_analysis_id}")
