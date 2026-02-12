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
    async def upload_evidence(file: UploadFile, current_user: dict) -> UploadEvidenceResponse:
        """Upload evidence file."""
        if file.content_type not in ALLOWED_FILE_TYPES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File type not allowed")
        
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large")
        
        await file.seek(0)
        db = get_db()
        try:
            public_url, _ = await upload_file_to_supabase(file)
            evidence = await db.evidence.create(
                data={"fileUrl": public_url, "uploadedById": current_user["id"]}
            )
            logger.info(f"User {current_user['email']} uploaded: {evidence.id}")
            return UploadEvidenceResponse(
                message="Uploaded successfully",
                evidence=EvidenceResponse.model_validate(evidence)
            )
        except Exception as e:
            logger.error(f"Upload error: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Upload failed")

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
