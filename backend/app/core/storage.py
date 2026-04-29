"""Supabase Storage utility functions."""
from supabase import create_client, Client
from app.core.config import settings
import logging
import uuid
from typing import Optional

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
        tuple: (storage_path, file_path)
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
                    client.storage.create_bucket(settings.SUPABASE_BUCKET, options={"public": False})
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
        
        logger.info(f"File uploaded successfully: {file_path}")
        return file_path, file_path
    
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


async def create_signed_url(file_path: str, expires_in: int = 300) -> str:
    """Create a short-lived signed URL for a private evidence object."""
    import asyncio

    client = get_supabase_client()

    try:
        def _sign():
            result = client.storage.from_(settings.SUPABASE_BUCKET).create_signed_url(
                file_path,
                expires_in,
            )
            if isinstance(result, dict):
                return result.get("signedURL") or result.get("signedUrl") or result.get("signed_url")
            return getattr(result, "signed_url", None) or getattr(result, "signedURL", None)

        signed_url = await asyncio.to_thread(_sign)
        if not signed_url:
            raise RuntimeError("Storage provider did not return a signed URL")
        return signed_url
    except Exception as e:
        logger.error(f"Error creating signed URL for {file_path}: {e}")
        raise Exception("Failed to create signed evidence URL")
