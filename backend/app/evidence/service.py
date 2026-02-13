"""Evidence service."""
from fastapi import HTTPException, status, UploadFile
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
                    "title": file.filename, # Default title
                    "type": file.content_type
                }
            )
            logger.info(f"User {current_user.get('email', 'unknown')} uploaded: {evidence.id}")
            
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
        Never throws exceptions to the caller.
        """
        import asyncio
        from app.ai.service import get_gemini_client
        from app.platform_state.service import StateService
        # Re-get DB session for background task
        # Note: get_db() yields, so we need to use it as context manager or similar mechanism if tailored for bg tasks.
        # But typically for simple scripts we can instantiate Prisma or use logic that handles its own connection.
        # However, `StateService` expects a `db` object (Prisma client).
        # We need a fresh DB session for the background task context.
        from app.core.db import db as prisma_client

        logger.info(f"Starting background analysis for {evidence_id}")
        
        try:
             # Connect if not connected (Prisma client is singleton mostly)
            if not prisma_client.is_connected():
                await prisma_client.connect()

            # 1. AI Analysis
            client = get_gemini_client()
            
            # Prepare prompt
            prompt = """
            Analyze this uploaded evidence file.
            Identify:
            1. Document Type (Policy, Record, Meeting Minutes, etc.)
            2. Key Standards/Clauses it likely supports (ISO 21001, etc.)
            3. Confidence Score (0-100)
            
            Return ONLY JSON:
            {
               "document_type": "...",
               "standards": ["..."],
               "clauses": ["..."],
               "confidence": 85,
               "summary": "..."
            }
            """
            
            # Prepare file for AI (mocking the structure chat_with_files uses)
            import base64
            b64_data = base64.b64encode(file_content).decode("utf-8")
            
            # We reuse chat_with_files logic or call gemini directly
            # Here we construct the file object manually
            files_payload = [{
                "type": "image" if mime_type.startswith("image") else "text",
                "mime_type": mime_type,
                "data": b64_data,
                "filename": filename
            }]
            
            # Call AI
            raw_response = await asyncio.to_thread(
                client.chat_with_files, 
                message=prompt, 
                files=files_payload
            )
            
            # Parse Response
            import json
            import re
            
            # Extract JSON
            match = re.search(r'(\{.*\}|\[.*\])', raw_response, re.DOTALL)
            if match:
                parsed = json.loads(match.group(1))
                
                # 2. Update State
                state_service = StateService(prisma_client)
                
                # Record File Analysis (updates PlatformFile) 
                # Note: We need a file_id. 
                # Currently Evidence and PlatformFile are separate entities in this system 
                # (Evidence is the compliance asset, PlatformFile is the raw file).
                # But `record_file_upload` logic normally happens.
                # Here we have `evidence_id`. 
                # Let's see if we can update the Evidence record directly or create a PlatformFile record.
                
                # For this fix, let's assuming we strictly update the Evidence record 
                # or call the generic state analysis recorder.
                
                # Let's try to update the Evidence title/type if generic
                await prisma_client.evidence.update(
                    where={"id": evidence_id},
                    data={
                        "title": f"{parsed.get('document_type', 'Document')} - {filename}",
                        # We could store metadata here if schema allows
                    }
                )
                
                # Record Metric
                await state_service.record_metric_update(
                    user_id=user_id,
                    metric_id="evidence_processed",
                    name="Evidence Processed",
                    value=1,
                    source_module="ai_worker"
                )
                
                logger.info(f"Background analysis complete for {evidence_id}")
            else:
                logger.warning(f"AI returned invalid JSON for {evidence_id}")

        except Exception as e:
            # Swallow error to keep worker alive
            logger.error(f"Background analysis failed for {evidence_id}: {e}")

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
    async def list_evidence(current_user: dict) -> List[EvidenceResponse]:
        """List evidence."""
        db = get_db()
        try:
            where = {} if current_user["role"] == "ADMIN" else {"uploadedById": current_user["id"]}
            evidence_list = await db.evidence.find_many(where=where, order={"createdAt": "desc"})
            return [EvidenceResponse.model_validate(ev) for ev in evidence_list]
        except Exception as e:
            logger.error(f"List error: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="List failed")
