"""Supabase Storage utility functions."""
from supabase import create_client, Client
from app.core.config import settings
import logging
import uuid
from typing import Optional
from fastapi import UploadFile

logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase: Optional[Client] = None


def get_supabase_client() -> Client:
    """Get or create Supabase client."""
    global supabase
    if supabase is None:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return supabase


async def upload_file_to_supabase(
    file: UploadFile,
    folder: str = "evidence"
) -> tuple[str, str]:
    """
    Upload a file to Supabase Storage.
    
    Args:
        file: FastAPI UploadFile object
        folder: Folder path in the bucket (default: "evidence")
    
    Returns:
        tuple: (public_url, file_path)
    
    Raises:
        Exception: If upload fails
    """
    client = get_supabase_client()
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1] if "." in file.filename else ""
    unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())
    file_path = f"{folder}/{unique_filename}"
    
    # Read file content
    file_content = await file.read()
    
    # Upload to Supabase Storage
    try:
        response = client.storage.from_(settings.SUPABASE_BUCKET).upload(
            path=file_path,
            file=file_content,
            file_options={
                "content-type": file.content_type or "application/octet-stream",
                "upsert": "false"
            }
        )
        
        # Construct public URL
        # Format: https://project.supabase.co/storage/v1/object/public/bucket/path
        public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_BUCKET}/{file_path}"
        
        logger.info(f"File uploaded successfully: {file_path}")
        return public_url, file_path
    
    except Exception as e:
        logger.error(f"Error uploading file to Supabase: {e}")
        raise Exception(f"Failed to upload file: {str(e)}")


async def delete_file_from_supabase(file_path: str) -> bool:
    """
    Delete a file from Supabase Storage.
    
    Args:
        file_path: Path to the file in the bucket
    
    Returns:
        bool: True if successful, False otherwise
    """
    client = get_supabase_client()
    
    try:
        # Remove the bucket prefix if present
        if file_path.startswith(settings.SUPABASE_BUCKET + "/"):
            file_path = file_path[len(settings.SUPABASE_BUCKET + "/"):]
        
        client.storage.from_(settings.SUPABASE_BUCKET).remove([file_path])
        logger.info(f"File deleted successfully: {file_path}")
        return True
    except Exception as e:
        logger.error(f"Error deleting file from Supabase: {e}")
        return False

