"""Access request API router."""
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.access_request.schemas import (
    AccessRequestCreate,
    AccessRequestListResponse,
    AccessRequestResponse,
    AccessRequestReviewRequest,
)
from app.access_request.service import AccessRequestService
from app.auth.dependencies import require_admin
from app.core.middlewares import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/access-requests", tags=["Access Requests"])


@router.post("", status_code=status.HTTP_200_OK)
async def create_access_request(body: AccessRequestCreate):
    """
    Submit a new access request (public endpoint — no auth required).
    Sends notification email to admin and persists to DB + JSONL backup.
    """
    logger.info("Access request: %s <%s> — %s", body.name, body.email, body.type)

    # Persist to database
    request = await AccessRequestService.create_request(body)

    # Backup to JSONL
    AccessRequestService.persist_request(body)

    # Send admin email notification
    email_sent = AccessRequestService.send_admin_notification_email(body)

    return {
        "status": "success",
        "message": "Request received. We will review your request shortly.",
        "request_id": request.id,
        "email_sent": email_sent,
    }


@router.get("", response_model=AccessRequestListResponse)
async def list_access_requests(
    request_status: str | None = Query(None, alias="status", description="Filter by status: PENDING, APPROVED, REJECTED"),
    skip: int = Query(0, ge=0),
    take: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(require_admin),
):
    """List all access requests (admin only)."""
    requests, total = await AccessRequestService.get_requests(
        status_filter=request_status,
        skip=skip,
        take=take,
    )

    return AccessRequestListResponse(
        requests=[AccessRequestResponse.model_validate(r) for r in requests],
        total=total,
    )


@router.get("/me")
async def get_my_access_request(
    current_user: dict = Depends(get_current_user),
):
    """Get the current user's most recent access request status."""
    request = await AccessRequestService.get_user_request_status(current_user["id"])

    if not request:
        # Also check by email in case request was made before registration
        email_request = await AccessRequestService.get_request_by_email(current_user["email"])
        if email_request:
            return AccessRequestResponse.model_validate(email_request)
        return None

    return AccessRequestResponse.model_validate(request)


@router.patch("/{request_id}/review")
async def review_access_request(
    request_id: str,
    body: AccessRequestReviewRequest,
    current_user: dict = Depends(require_admin),
):
    """Approve or reject an access request (admin only)."""
    updated = await AccessRequestService.review_request(
        request_id=request_id,
        action=body.action,
        admin_user_id=current_user["id"],
        note=body.note,
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access request not found",
        )

    return AccessRequestResponse.model_validate(updated)
