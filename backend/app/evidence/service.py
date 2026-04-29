"""Evidence service."""
import base64
import json
import re
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status, UploadFile, BackgroundTasks
from typing import List, Optional
from app.core.db import get_db
from app.core.storage import upload_file_to_supabase, delete_file_from_supabase, create_signed_url
from app.core.config import settings
from app.evidence.models import (
    EvidenceResponse,
    UploadEvidenceResponse,
    AttachEvidenceRequest,
    AttachEvidenceResponse
)
from app.notifications.service import NotificationService
from app.notifications.models import NotificationCreateRequest
from app.activity.service import ActivityService
from app.core.redis import redis_client
from app.core.jobs import enqueue_job, register_job_handler
from app.core.job_files import cleanup_job_file, read_job_file, write_job_file
import logging
import asyncio

logger = logging.getLogger(__name__)

ALLOWED_FILE_TYPES = {
    "application/pdf", "image/jpeg", "image/png", "image/jpg",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
}
MAX_FILE_SIZE = 25 * 1024 * 1024

class EvidenceService:
    """Service for evidence management business logic."""

    @staticmethod
    def _evidence_scope(current_user: dict) -> dict:
        institution_id = current_user.get("institutionId")
        if not institution_id:
            return {"uploadedById": current_user["id"]}
        return {"ownerId": institution_id}

    @staticmethod
    def _evidence_access_where(evidence_id: str, current_user: dict) -> dict:
        return {
            "AND": [
                {"id": evidence_id},
                EvidenceService._evidence_scope(current_user),
            ]
        }

    @staticmethod
    async def list_archived_evidence(current_user: dict):
        """List deleted evidence snapshots from activity log."""
        db = get_db()
        where_clause = {"type": "evidence_snapshot_deleted"}
        if current_user.get("role") != "ADMIN":
            where_clause["userId"] = current_user["id"]

        rows = await db.activity.find_many(
            where=where_clause,
            order={"createdAt": "desc"},
            take=200,
        )

        archived = []
        for row in rows:
            meta = row.metadata if isinstance(row.metadata, dict) else {}
            snapshot = meta.get("snapshot", {}) if isinstance(meta.get("snapshot"), dict) else {}
            archived.append(
                {
                    "id": row.entityId or row.id,
                    "activityId": row.id,
                    "title": snapshot.get("title") or row.title,
                    "documentType": snapshot.get("documentType"),
                    "status": snapshot.get("status"),
                    "confidenceScore": snapshot.get("confidenceScore"),
                    "fileUrl": snapshot.get("fileUrl"),
                    "deletedAt": row.createdAt.isoformat(),
                    "deletedBy": current_user.get("name") or current_user.get("email") or "User",
                    "originalLocation": "Evidence Vault",
                    "type": "evidence",
                }
            )
        return archived
    
    @staticmethod
    async def upload_evidence(
        file: UploadFile,
        current_user: dict,
        background_tasks: BackgroundTasks,
        *,
        file_content: Optional[bytes] = None,
    ) -> UploadEvidenceResponse:
        """
        Upload evidence file with background AI analysis.
        Fault-tolerant: Upload succeeds even if AI fails.

        If ``file_content`` is provided (already read body), it is used as-is and
        ``file.read()`` is skipped. Callers that already consumed the stream (e.g.
        Horus ``process_file``) must pass bytes to avoid a second read / seek, which
        breaks on Starlette spooled files and causes "I/O operation on closed file".
        """
        # 1. Validation
        if file.content_type not in ALLOWED_FILE_TYPES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File type not allowed")

        # Read content for validation and analysis (single read — never seek/rewind UploadFile)
        try:
            if file_content is None:
                file_content = await file.read()
            if len(file_content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=f"File too large (max {MAX_FILE_SIZE//1024//1024}MB)")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"File read error: {e}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to read file")

        db = get_db()
        try:
            # 2. Critical Path: Storage + DB
            # Upload to Supabase
            storage_path, _ = await upload_file_to_supabase(
                file_content=file_content,
                filename=file.filename,
                content_type=file.content_type
            )
            
            # Create Record
            evidence = await db.evidence.create(
                data={
                    "fileUrl": storage_path,
                    "uploadedById": current_user["id"],
                    "ownerId": current_user.get("institutionId"), # Use institutionId as ownerId for isolation
                    "originalFilename": file.filename,
                    "title": file.filename, # Default title is filename until AI analysis completes
                    "status": "uploaded"
                }
            )
            try:
                redis_client.invalidate_dashboard_cache()
            except Exception as cache_err:
                logger.warning(f"Failed to invalidate dashboard cache after evidence create: {cache_err}")

            try:
                await ActivityService.log_activity(
                    user_id=current_user["id"],
                    type="evidence_snapshot_created",
                    title=f"Evidence created: {evidence.title or evidence.originalFilename or evidence.id}",
                    description="Initial evidence record created",
                    entity_id=evidence.id,
                    entity_type="evidence",
                    metadata={
                        "snapshot": {
                            "id": evidence.id,
                            "title": evidence.title,
                            "status": evidence.status,
                            "documentType": evidence.documentType,
                            "confidenceScore": evidence.confidenceScore,
                            "storagePath": evidence.fileUrl,
                        }
                    },
                )
            except Exception as e:
                logger.warning(f"Failed to log evidence creation activity: {e}")
            logger.info(f"User {current_user.get('email', 'unknown')} uploaded: {evidence.id}")
            
            # 2.5 Trigger Notification & Activity
            try:
                existing = await db.notification.find_first(
                    where={
                        "userId": current_user["id"],
                        "type": "info",
                        "title": "Evidence Uploaded",
                        "relatedEntityId": evidence.id,
                        "createdAt": {
                            "gte": datetime.now(timezone.utc) - timedelta(hours=24)
                        }
                    }
                )
                
                if not existing:
                    await NotificationService.create_notification(NotificationCreateRequest(
                        userId=current_user["id"],
                        type="info",
                        title="Evidence Uploaded",
                        message=f"File '{file.filename}' has been uploaded.",
                        relatedEntityId=evidence.id,
                        relatedEntityType="evidence"
                    ))
                await ActivityService.log_activity(
                    user_id=current_user["id"],
                    type="evidence_uploaded",
                    title="Evidence Uploaded",
                    description=f"File '{file.filename}' added to vault.",
                    entity_id=evidence.id,
                    entity_type="evidence"
                )
            except Exception as e:
                logger.error(f"Failed to record event: {e}")
            
            # Security + Domain Freeze: uploaded evidence is immutable and no AI job is
            # allowed to mutate evidence, mapping, gap, report, or remediation state.
            analysis_triggered = False

            return UploadEvidenceResponse(
                success=True,
                message="Uploaded successfully",
                evidenceId=evidence.id,
                analysisTriggered=analysis_triggered,
                evidence=EvidenceResponse.model_validate(evidence)
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Upload error details: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail={"error": "Valid upload failed", "stage": "persistence", "detail": str(e)}
            )

    @staticmethod
    async def queue_evidence_analysis(
        *,
        evidence_id: str,
        file_content: bytes,
        filename: str,
        mime_type: str,
        user_id: str,
        background_tasks: BackgroundTasks | None = None,
    ) -> bool:
        logger.warning("Evidence AI analysis is disabled during Security + Domain Freeze.")
        return False

    @staticmethod
    async def analyze_evidence_job(payload: dict):
        cleanup_job_file(payload.get("job_file_path"))
        logger.warning("Skipped legacy evidence AI job during Security + Domain Freeze.")

    @staticmethod
    async def _chat_with_files_with_retry(client, message: str, files_payload: List[dict], retries: int = 2) -> str:
        """AI call with bounded retries for transient provider failures."""
        last_error = None
        for attempt in range(retries + 1):
            try:
                return await client.chat_with_files(message=message, files=files_payload)
            except Exception as e:
                last_error = e
                if attempt < retries:
                    await asyncio.sleep(1.5 * (attempt + 1))
                    continue
                raise last_error

    @staticmethod
    async def analyze_evidence_task(evidence_id: str, file_content: bytes, filename: str, mime_type: str, user_id: str):
        """
        Background task: Analyze evidence using AI and update state.
        Never throws exceptions to the caller — all errors are caught and logged.
        """
        logger.warning("Legacy evidence AI mutation blocked for evidence %s.", evidence_id)
        return

    @staticmethod
    async def _notify_error(user_id: str, evidence_id: str, message: str):
        """Helper to send an error notification without raising."""
        try:
            await NotificationService.create_notification(NotificationCreateRequest(
                userId=user_id,
                type="error",
                title="Analysis Failed",
                message=message,
                relatedEntityId=evidence_id,
                relatedEntityType="evidence"
            ))
        except Exception as e:
            logger.warning(f"Failed to send error notification for {evidence_id}: {e}")

    @staticmethod
    async def delete_evidence(evidence_id: str, current_user: dict):
        """Delete evidence."""
        db = get_db()
        evidence = await db.evidence.find_first(where=EvidenceService._evidence_access_where(evidence_id, current_user))
        if not evidence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        
        try:
            try:
                await ActivityService.log_activity(
                    user_id=current_user["id"],
                    type="evidence_snapshot_deleted",
                    title=f"Evidence deleted: {evidence.title or evidence.originalFilename or evidence.id}",
                    description="Evidence record removed",
                    entity_id=evidence_id,
                    entity_type="evidence",
                    metadata={
                        "snapshot": {
                            "id": evidence.id,
                            "title": evidence.title,
                            "status": evidence.status,
                            "documentType": evidence.documentType,
                            "confidenceScore": evidence.confidenceScore,
                            "storagePath": evidence.fileUrl,
                        }
                    },
                )
            except Exception as e:
                logger.warning(f"Failed to log evidence deletion activity: {e}")

            try:
                from app.rag.service import RagService
                rag = RagService()
                await rag.delete_document(evidence_id)
            except Exception as e:
                logger.warning(f"RAG cleanup failed for {evidence_id}: {e}")

            await delete_file_from_supabase(evidence.fileUrl)
                
            await db.evidence.delete(where={"id": evidence_id})
            try:
                redis_client.invalidate_dashboard_cache()
            except Exception as cache_err:
                logger.warning(f"Failed to invalidate dashboard cache after evidence delete: {cache_err}")
            logger.info(f"User {current_user['email']} deleted: {evidence_id}")
            return {"message": "Deleted successfully"}
        except Exception as e:
            logger.error(f"Delete error: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Delete failed")

    @staticmethod
    async def attach_evidence(evidence_id: str, request: AttachEvidenceRequest, current_user: dict) -> AttachEvidenceResponse:
        """Attach evidence to a criterion."""
        db = get_db()
        evidence = await db.evidence.find_first(where=EvidenceService._evidence_access_where(evidence_id, current_user))
        if not evidence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
            
        if not await db.criterion.find_unique(where={"id": request.criterionId}):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Criterion not found")
            
        try:
            # Keep legacy single-link field in sync for backward compatibility,
            # but persist the canonical many-to-many relation used by coverage/mapping.
            await db.evidence.update(where={"id": evidence_id}, data={"criterionId": request.criterionId})
            try:
                await db.evidencecriterion.create(
                    data={"evidenceId": evidence_id, "criterionId": request.criterionId}
                )
            except Exception as e:
                logger.debug(f"Duplicate evidence-criterion link skipped on attach: {e}")
            try:
                redis_client.invalidate_dashboard_cache()
            except Exception as cache_err:
                logger.warning(f"Failed to invalidate dashboard cache after evidence attach: {cache_err}")

            try:
                await ActivityService.log_activity(
                    user_id=current_user["id"],
                    type="evidence_snapshot_updated",
                    title=f"Evidence linked to criterion",
                    description=f"Linked evidence {evidence_id} to criterion {request.criterionId}",
                    entity_id=evidence_id,
                    entity_type="evidence",
                    metadata={
                        "diff": {
                            "criterionId": {"to": request.criterionId}
                        }
                    },
                )
            except Exception as e:
                logger.warning(f"Failed to log evidence attach activity: {e}")
            return AttachEvidenceResponse(message="Attached successfully", evidenceId=evidence_id, criterionId=request.criterionId)
        except Exception as e:
            logger.error(f"Attach error: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Attach failed")

    @staticmethod
    async def get_evidence(evidence_id: str, current_user: dict) -> EvidenceResponse:
        """Get evidence metadata."""
        db = get_db()
        evidence = await db.evidence.find_first(where=EvidenceService._evidence_access_where(evidence_id, current_user))
        if not evidence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        return EvidenceResponse.model_validate(evidence)

    @staticmethod
    async def get_signed_url(evidence_id: str, current_user: dict) -> dict:
        """Return a short-lived signed URL after tenant-scoped evidence lookup."""
        db = get_db()
        evidence = await db.evidence.find_first(where=EvidenceService._evidence_access_where(evidence_id, current_user))
        if not evidence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        signed_url = await create_signed_url(evidence.fileUrl, expires_in=300)
        return {"url": signed_url, "expiresIn": 300}

    @staticmethod
    async def list_evidence(current_user: dict, page: int = 1, limit: int = 20) -> List[EvidenceResponse]:
        """List evidence with isolation and pagination."""
        db = get_db()
        try:
            where = EvidenceService._evidence_scope(current_user)

            skip = (page - 1) * limit
            evidence_list = await db.evidence.find_many(
                where=where,
                order={"createdAt": "desc"},
                include={"criteria": True},
                skip=skip,
                take=limit
            )
            return [EvidenceResponse.model_validate(ev) for ev in evidence_list]
        except Exception as e:
            logger.error(f"List error: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="List failed")


register_job_handler("evidence.analyze", EvidenceService.analyze_evidence_job)
