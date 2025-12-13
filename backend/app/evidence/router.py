"""Evidence router."""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from typing import List
from app.core.db import get_db
from app.core.middlewares import get_current_user
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

router = APIRouter()

# Allowed file types (you can extend this)
ALLOWED_FILE_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # .xlsx
    "text/plain",
}

# Max file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes


@router.post("/upload", response_model=UploadEvidenceResponse, status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload evidence file to Supabase Storage.
    
    Uploads a file and saves metadata in the database.
    
    - **file**: File to upload (PDF, images, documents)
    - Max size: 10MB
    - Allowed types: PDF, images, Word, Excel, text files
    """
    db = get_db()
    
    # Validate file type
    if file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: PDF, images, Word, Excel, text files"
        )
    
    # Validate file size
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024 * 1024)}MB"
        )
    
    # Reset file pointer for upload
    await file.seek(0)
    
    try:
        # Upload to Supabase Storage
        public_url, file_path = await upload_file_to_supabase(file)
        
        # Save metadata in database
        evidence = await db.evidence.create(
            data={
                "fileUrl": public_url,
                "uploadedById": current_user["id"],
            }
        )
        
        logger.info(f"User {current_user['email']} uploaded evidence: {evidence.id}")
        
        return UploadEvidenceResponse(
            message="Evidence uploaded successfully",
            evidence=EvidenceResponse(
                id=evidence.id,
                criterionId=evidence.criterionId,
                fileUrl=evidence.fileUrl,
                uploadedById=evidence.uploadedById,
                createdAt=evidence.createdAt,
                updatedAt=evidence.updatedAt
            )
        )
    except Exception as e:
        logger.error(f"Error uploading evidence: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload evidence: {str(e)}"
        )


@router.delete("/{evidence_id}", status_code=status.HTTP_200_OK)
async def delete_evidence(
    evidence_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete evidence file.
    
    Deletes the file from Supabase Storage and removes the record from the database.
    
    - Only the uploader or admin can delete
    """
    db = get_db()
    
    # Get evidence record
    evidence = await db.evidence.find_unique(where={"id": evidence_id})
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found"
        )
    
    # Check permissions: only uploader or admin can delete
    if current_user["role"] != "ADMIN" and evidence.uploadedById != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own evidence"
        )
    
    try:
        # Extract file path from URL
        # Supabase public URLs are typically: https://project.supabase.co/storage/v1/object/public/bucket/path
        file_url = evidence.fileUrl
        # Extract path after /public/bucket/
        if "/public/" in file_url:
            file_path = file_url.split("/public/")[-1]
        else:
            # Fallback: try to extract from URL
            file_path = file_url.split(settings.SUPABASE_BUCKET + "/")[-1] if settings.SUPABASE_BUCKET in file_url else None
        
        # Delete from Supabase Storage
        if file_path:
            await delete_file_from_supabase(file_path)
        
        # Delete from database
        await db.evidence.delete(where={"id": evidence_id})
        
        logger.info(f"User {current_user['email']} deleted evidence: {evidence_id}")
        
        return {"message": "Evidence deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting evidence: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete evidence"
        )


@router.post("/{evidence_id}/attach", response_model=AttachEvidenceResponse, status_code=status.HTTP_200_OK)
async def attach_evidence_to_criterion(
    evidence_id: str,
    request: AttachEvidenceRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Attach evidence to a criterion.
    
    Links an uploaded evidence file to a specific criterion.
    
    - **criterionId**: ID of the criterion to attach evidence to
    """
    db = get_db()
    
    # Check if evidence exists
    evidence = await db.evidence.find_unique(where={"id": evidence_id})
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found"
        )
    
    # Check permissions: only uploader or admin can attach
    if current_user["role"] != "ADMIN" and evidence.uploadedById != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only attach your own evidence"
        )
    
    # Check if criterion exists
    criterion = await db.criterion.find_unique(where={"id": request.criterionId})
    if not criterion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Criterion not found"
        )
    
    try:
        # Update evidence with criterion ID
        updated_evidence = await db.evidence.update(
            where={"id": evidence_id},
            data={"criterionId": request.criterionId}
        )
        
        logger.info(f"User {current_user['email']} attached evidence {evidence_id} to criterion {request.criterionId}")
        
        return AttachEvidenceResponse(
            message="Evidence attached to criterion successfully",
            evidenceId=evidence_id,
            criterionId=request.criterionId
        )
    except Exception as e:
        logger.error(f"Error attaching evidence: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to attach evidence to criterion"
        )


@router.get("/{evidence_id}", response_model=EvidenceResponse)
async def get_evidence(
    evidence_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get evidence by ID.
    
    Returns evidence information including file URL.
    """
    db = get_db()
    
    evidence = await db.evidence.find_unique(where={"id": evidence_id})
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found"
        )
    
    return EvidenceResponse(
        id=evidence.id,
        criterionId=evidence.criterionId,
        fileUrl=evidence.fileUrl,
        uploadedById=evidence.uploadedById,
        createdAt=evidence.createdAt,
        updatedAt=evidence.updatedAt
    )


@router.get("/", response_model=List[EvidenceResponse])
async def list_evidence(
    current_user: dict = Depends(get_current_user)
):
    """
    List evidence files.
    
    - Admins: See all evidence
    - Others: See only their own evidence
    """
    db = get_db()
    
    try:
        if current_user["role"] == "ADMIN":
            # Admin sees all
            evidence_list = await db.evidence.find_many(
                order={"createdAt": "desc"}
            )
        else:
            # Others see only their own
            evidence_list = await db.evidence.find_many(
                where={"uploadedById": current_user["id"]},
                order={"createdAt": "desc"}
            )
        
        return [
            EvidenceResponse(
                id=ev.id,
                criterionId=ev.criterionId,
                fileUrl=ev.fileUrl,
                uploadedById=ev.uploadedById,
                createdAt=ev.createdAt,
                updatedAt=ev.updatedAt
            )
            for ev in evidence_list
        ]
    except Exception as e:
        logger.error(f"Error listing evidence: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch evidence"
        )
