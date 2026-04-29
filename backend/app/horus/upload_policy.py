"""Backward-compatible imports for Horus upload handling."""

from app.horus import attachments
from app.horus.attachments import TemporaryAttachmentService, normalize_content_type, validate_horus_upload

HORUS_MEMORY_FILE_LIMIT = attachments.HORUS_MEMORY_FILE_LIMIT
HORUS_MAX_FILE_LIMIT = attachments.HORUS_MAX_FILE_LIMIT

async def buffer_horus_upload(upload, user_id: str = "__anonymous__"):
    """Compatibility wrapper for tests/older callers."""
    attachments.HORUS_MEMORY_FILE_LIMIT = HORUS_MEMORY_FILE_LIMIT
    attachments.HORUS_MAX_FILE_LIMIT = HORUS_MAX_FILE_LIMIT
    return await TemporaryAttachmentService.create_from_upload(upload, user_id)


def cleanup_horus_uploads(files):
    """No-op retained for older router code; temp attachments expire by TTL."""
    return None
