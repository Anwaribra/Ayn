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
        # Prefer Service Key for backend operations to bypass RLS
        key = settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY
        supabase = create_client(settings.SUPABASE_URL, key)
    return supabase


async def upload_file_to_supabase(
    file_content: bytes,
    filename: str,
    content_type: str = "application/octet-stream",
    folder: str = "evidence"
) -> tuple[str, str]:
    """
    Upload a file to Supabase Storage.
    
    Args:
        file_content: Raw bytes of the file
        filename: Original filename
        content_type: MIME type
        folder: Folder path in the bucket
    
    Returns:
        tuple: (public_url, file_path)
    """
    import asyncio
    client = get_supabase_client()
    
    # Generate unique filename
    file_extension = filename.split(".")[-1] if "." in filename else ""
    unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())
    file_path = f"{folder}/{unique_filename}"
    
    # Upload to Supabase Storage (run blocking call in thread)
    # Upload to Supabase Storage (run blocking call in thread)
    try:
        def _ensure_and_upload():
            bucket_exists = False
            try:
                # Some clients return list, others throw. List is safer.
                buckets = client.storage.list_buckets()
                bucket_exists = any(b.name == settings.SUPABASE_BUCKET for b in buckets)
            except Exception:
                # If list fails, fallback to get_bucket or assume checks failed
                pass

            if not bucket_exists:
                try:
                    client.storage.create_bucket(settings.SUPABASE_BUCKET, options={"public": True})
                except Exception as e:
                    logger.warning(f"Bucket creation failed/exists: {e}")

            return client.storage.from_(settings.SUPABASE_BUCKET).upload(
                path=file_path,
                file=file_content,
                file_options={
                    "content-type": content_type,
                    "upsert": "false"
                }
            )
            
        await asyncio.to_thread(_ensure_and_upload)
        
        # Construct public URL
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

