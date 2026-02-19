"""Evidence service."""
import base64
import json
import re
from datetime import datetime
from fastapi import HTTPException, status, UploadFile, BackgroundTasks
from typing import List
from app.core.db import get_db
from app.core.storage import upload_file_to_supabase, delete_file_from_supabase
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
import logging

logger = logging.getLogger(__name__)

ALLOWED_FILE_TYPES = {
    "application/pdf", "image/jpeg", "image/png", "image/jpg",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
}
MAX_FILE_SIZE = 10 * 1024 * 1024

class EvidenceService:
    """Service for evidence management business logic."""
    
    @staticmethod
    async def upload_evidence(file: UploadFile, current_user: dict, background_tasks: BackgroundTasks) -> UploadEvidenceResponse:
        """
        Upload evidence file with background AI analysis.
        Fault-tolerant: Upload succeeds even if AI fails.
        """
        # 1. Validation
        if file.content_type not in ALLOWED_FILE_TYPES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File type not allowed")
        
        # Read content for validation and analysis
        try:
            file_content = await file.read()
            if len(file_content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=f"File too large (max {MAX_FILE_SIZE//1024//1024}MB)")
        except Exception as e:
            logger.error(f"File read error: {e}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to read file")

        # Reset stream for upload
        db = get_db()
        try:
            # 2. Critical Path: Storage + DB
            # Upload to Supabase
            public_url, _ = await upload_file_to_supabase(
                file_content=file_content,
                filename=file.filename,
                content_type=file.content_type
            )
            
            # Create Record
            evidence = await db.evidence.create(
                data={
                    "fileUrl": public_url, 
                    "uploadedById": current_user["id"],
                    "ownerId": current_user.get("institutionId"), # Use institutionId as ownerId for isolation
                    "originalFilename": file.filename,
                    "title": file.filename, # Default title is filename until AI analysis completes
                    "status": "processing"
                }
            )
            logger.info(f"User {current_user.get('email', 'unknown')} uploaded: {evidence.id}")
            
            # 2.5 Trigger Notification & Activity
            try:
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
            
            # 3. Non-Critical Path: Background Analysis
            # We assume text/pdf/image analysis.
            try:
                background_tasks.add_task(
                    EvidenceService.analyze_evidence_task,
                    evidence_id=evidence.id,
                    file_content=file_content,
                    filename=file.filename,
                    mime_type=file.content_type,
                    user_id=current_user["id"]
                )
                analysis_triggered = True
            except Exception as bg_error:
                logger.error(f"Failed to schedule background analysis: {bg_error}")
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
    async def analyze_evidence_task(evidence_id: str, file_content: bytes, filename: str, mime_type: str, user_id: str):
        """
        Background task: Analyze evidence using AI and update state.
        Never throws exceptions to the caller — all errors are caught and logged.
        """
        from app.ai.service import get_gemini_client
        from app.platform_state.service import StateService
        from app.core.db import db as prisma_client

        logger.info(f"Starting background analysis for {evidence_id}")

        try:
            # Ensure DB is connected (singleton, usually already connected)
            if not prisma_client.is_connected():
                await prisma_client.connect()

            # 1. AI Analysis
            client = get_gemini_client()

            prompt = """
            Analyze this uploaded evidence file for educational accreditation compliance (ISO 21001 / NAQAAE).

            Identify:
            1. Document Type (e.g., Policy, Meeting Minutes, Strategic Plan, Student Record)
            2. Specific Standards & Clauses it likely supports.
            3. A confidence score (0-100) based on content relevance.
            4. A clear, concise summary of the document content.

            CRITICAL: Return ONLY valid JSON. No markdown. No code blocks.
            Format:
            {
               "document_type": "string",
               "related_standard": "string (e.g. ISO 21001)",
               "mapped_criteria": ["clause_number_or_id"],
               "confidence": number,
               "risk_flag": boolean,
               "summary": "string",
               "title": "Suggested Title (e.g. 'Strategic Plan 2024')"
            }
            """

            b64_data = base64.b64encode(file_content).decode("utf-8")
            files_payload = [{
                "type": "image" if mime_type.startswith("image") else "text",
                "mime_type": mime_type,
                "data": b64_data,
                "filename": filename
            }]

            # FIX P1.1: chat_with_files is async — await it directly, never wrap in asyncio.to_thread
            raw_response = await client.chat_with_files(message=prompt, files=files_payload)

            # 2. Parse Response
            match = re.search(r'(\{.*\}|\[.*\])', raw_response, re.DOTALL)
            if not match:
                logger.warning(f"No JSON found in AI response for {evidence_id}")
                await prisma_client.evidence.update(where={"id": evidence_id}, data={"status": "failed"})
                await _notify_error(user_id, evidence_id, f"AI could not extract data from '{filename}'.")
                return

            try:
                parsed = json.loads(match.group(1))
            except json.JSONDecodeError:
                logger.error(f"AI returned invalid JSON for {evidence_id}")
                await prisma_client.evidence.update(where={"id": evidence_id}, data={"status": "failed"})
                await _notify_error(user_id, evidence_id, f"AI could not analyze '{filename}'. Invalid response format.")
                return

            doc_type = parsed.get("document_type", "Unknown")
            summary = parsed.get("summary", "No summary provided.")
            title = parsed.get("title", filename)
            confidence = float(parsed.get("confidence", 0))

            # 3. Update Evidence Record with AI results
            await prisma_client.evidence.update(
                where={"id": evidence_id},
                data={
                    "title": title,
                    "summary": summary,
                    "documentType": doc_type,
                    "confidenceScore": confidence,
                    "status": "analyzed",
                    "updatedAt": datetime.utcnow()
                }
            )

            # 4. Criteria Mapping
            mapped_codes = parsed.get("mapped_criteria", [])
            standard_name = parsed.get("related_standard", "")
            mapping_status = "unmapped"
            matched_criteria_ids = []

            if mapped_codes:
                standard = None
                if standard_name:
                    standards = await prisma_client.standard.find_many(
                        where={"title": {"contains": standard_name, "mode": "insensitive"}}
                    )
                    if standards:
                        standard = standards[0]

                criteria_query = {"standardId": standard.id} if standard else {}
                all_criteria = await prisma_client.criterion.find_many(where=criteria_query)

                for code in mapped_codes:
                    norm_code = str(code).strip().lower()
                    for crit in all_criteria:
                        if crit.title and crit.title.strip().lower().startswith(norm_code):
                            matched_criteria_ids.append(crit.id)
                            break

                if matched_criteria_ids:
                    mapping_status = "analyzed"
                    for crit_id in set(matched_criteria_ids):
                        try:
                            await prisma_client.evidencecriterion.create(
                                data={"evidenceId": evidence_id, "criterionId": crit_id}
                            )
                        except Exception:
                            pass  # Ignore duplicates

            await prisma_client.evidence.update(
                where={"id": evidence_id},
                data={"status": mapping_status}
            )

            await ActivityService.log_activity(
                user_id=user_id,
                type="analysis_finished",
                title="AI Analysis Complete",
                description=f"Evidence '{title}' analyzed and mapped to {len(matched_criteria_ids)} criteria.",
                entity_id=evidence_id,
                entity_type="evidence",
                metadata={"confidence": confidence, "docType": doc_type, "criteriaCount": len(matched_criteria_ids)}
            )

            if mapping_status == "analyzed":
                logger.info(f"Evidence {evidence_id} mapped to {len(matched_criteria_ids)} criteria.")
            else:
                logger.warning(f"Evidence {evidence_id} analyzed but unmapped (codes: {mapped_codes})")

            # 5. Auto-address matching open gaps
            state_service = StateService(prisma_client)
            gaps_addressed = 0

            if standard_name and mapped_codes:
                for code in mapped_codes:
                    matching_gaps = await state_service.find_open_gaps_for_evidence(
                        user_id=user_id,
                        standard_name=standard_name,
                        clause_code=code
                    )
                    for gap in matching_gaps:
                        await state_service.record_gap_addressed(gap.id, evidence_id)
                        gaps_addressed += 1
                        logger.info(f"Gap {gap.id} addressed by evidence {evidence_id}")

            # 6. Update Metrics
            await state_service.record_metric_update(
                user_id=user_id,
                metric_id="evidence_processed",
                name="Evidence Processed",
                value=1,
                source_module="ai_worker"
            )

            if gaps_addressed > 0:
                await state_service.record_metric_update(
                    user_id=user_id,
                    metric_id="gaps_addressed_by_ai",
                    name="Gaps Auto-Addressed",
                    value=gaps_addressed,
                    source_module="ai_worker"
                )
                try:
                    await NotificationService.create_notification(NotificationCreateRequest(
                        userId=user_id,
                        type="success",
                        title="Gap Addressed",
                        message=f"{gaps_addressed} gap(s) were addressed by '{title}'.",
                        relatedEntityId=evidence_id,
                        relatedEntityType="gap"
                    ))
                except Exception:
                    pass

            # 7. Notify success
            try:
                await NotificationService.create_notification(NotificationCreateRequest(
                    userId=user_id,
                    type="success",
                    title="Analysis Complete",
                    message=f"'{title}' analyzed successfully. Confidence: {confidence:.0f}%.",
                    relatedEntityId=evidence_id,
                    relatedEntityType="evidence"
                ))
            except Exception:
                pass

        except Exception as e:
            # Top-level safety net — never crash the background worker
            logger.error(f"Background analysis failed for {evidence_id}: {e}", exc_info=True)
            try:
                if prisma_client.is_connected():
                    await prisma_client.evidence.update(
                        where={"id": evidence_id},
                        data={"status": "failed"}
                    )
                    await _notify_error(user_id, evidence_id, f"System error while processing '{filename}'.")
            except Exception:
                pass

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
        except Exception:
            pass

    @staticmethod
    async def delete_evidence(evidence_id: str, current_user: dict):
        """Delete evidence."""
        db = get_db()
        evidence = await db.evidence.find_unique(where={"id": evidence_id})
        if not evidence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        
        if current_user["role"] != "ADMIN" and evidence.uploadedById != current_user["id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        try:
            file_url = evidence.fileUrl
            file_path = None
            if "/public/" in file_url:
                file_path = file_url.split("/public/")[-1]
            elif settings.SUPABASE_BUCKET in file_url:
                file_path = file_url.split(settings.SUPABASE_BUCKET + "/")[-1]
            
            if file_path:
                await delete_file_from_supabase(file_path)
                
            await db.evidence.delete(where={"id": evidence_id})
            logger.info(f"User {current_user['email']} deleted: {evidence_id}")
            return {"message": "Deleted successfully"}
        except Exception as e:
            logger.error(f"Delete error: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Delete failed")

    @staticmethod
    async def attach_evidence(evidence_id: str, request: AttachEvidenceRequest, current_user: dict) -> AttachEvidenceResponse:
        """Attach evidence to a criterion."""
        db = get_db()
        evidence = await db.evidence.find_unique(where={"id": evidence_id})
        if not evidence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
            
        if current_user["role"] != "ADMIN" and evidence.uploadedById != current_user["id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
        if not await db.criterion.find_unique(where={"id": request.criterionId}):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Criterion not found")
            
        try:
            await db.evidence.update(where={"id": evidence_id}, data={"criterionId": request.criterionId})
            return AttachEvidenceResponse(message="Attached successfully", evidenceId=evidence_id, criterionId=request.criterionId)
        except Exception as e:
            logger.error(f"Attach error: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Attach failed")

    @staticmethod
    async def get_evidence(evidence_id: str) -> EvidenceResponse:
        """Get evidence metadata."""
        db = get_db()
        evidence = await db.evidence.find_unique(where={"id": evidence_id})
        if not evidence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        return EvidenceResponse.model_validate(evidence)

    @staticmethod
    async def list_evidence(current_user: dict, page: int = 1, limit: int = 20) -> List[EvidenceResponse]:
        """List evidence with isolation and pagination."""
        db = get_db()
        try:
            # Isolation: Admin sees all, User sees their own or their institution's
            if current_user["role"] == "ADMIN":
                where = {}
            else:
                institution_id = current_user.get("institutionId")
                if institution_id:
                    where = {"OR": [{"uploadedById": current_user["id"]}, {"ownerId": institution_id}]}
                else:
                    where = {"uploadedById": current_user["id"]}

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

