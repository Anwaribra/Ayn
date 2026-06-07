"""Business logic for access request management."""
import json
import logging
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.core.db import get_db
from app.access_request.schemas import AccessRequestCreate

logger = logging.getLogger(__name__)

ROLE_LABELS = {
    "admin": "Administrator",
    "faculty": "Faculty Dean",
    "compliance": "Compliance Officer",
    "consultant": "Consultant",
    "other": "Other Role",
}

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
REQUESTS_LOG = DATA_DIR / "access_requests.jsonl"


def _role_display(role: str) -> str:
    return ROLE_LABELS.get(role.lower(), role.replace("_", " ").title())


class AccessRequestService:
    """Service for access request CRUD and approval workflow."""

    @staticmethod
    async def create_request(data: AccessRequestCreate):
        """Create a new access request and auto-link to existing user if email matches."""
        db = get_db()

        # Auto-link to existing user by email
        user_id = None
        existing_user = await db.user.find_unique(where={"email": str(data.email)})
        if existing_user:
            user_id = existing_user.id

        request = await db.accessrequest.create(
            data={
                "name": data.name,
                "email": str(data.email),
                "institution": data.institution,
                "role": data.role,
                "type": data.type,
                "message": data.message,
                "userId": user_id,
            }
        )

        logger.info(
            "Access request created: %s <%s> — %s (linked_user=%s)",
            data.name, data.email, data.type, user_id,
        )
        return request

    @staticmethod
    async def get_requests(
        status_filter: Optional[str] = None,
        skip: int = 0,
        take: int = 50,
    ) -> tuple[list, int]:
        """List all access requests with optional status filter, paginated."""
        db = get_db()

        where = {}
        if status_filter:
            where["status"] = status_filter.upper()

        total = await db.accessrequest.count(where=where)
        requests = await db.accessrequest.find_many(
            where=where,
            skip=skip,
            take=take,
            order={"createdAt": "desc"},
        )

        return requests, total

    @staticmethod
    async def get_request_by_id(request_id: str):
        """Get a single access request by ID."""
        db = get_db()
        return await db.accessrequest.find_unique(where={"id": request_id})

    @staticmethod
    async def get_user_request_status(user_id: str):
        """Get the most recent access request for a user."""
        db = get_db()
        requests = await db.accessrequest.find_many(
            where={"userId": user_id},
            order={"createdAt": "desc"},
            take=1,
        )
        return requests[0] if requests else None

    @staticmethod
    async def get_request_by_email(email: str):
        """Get the most recent access request for an email."""
        db = get_db()
        requests = await db.accessrequest.find_many(
            where={"email": email},
            order={"createdAt": "desc"},
            take=1,
        )
        return requests[0] if requests else None

    @staticmethod
    async def review_request(
        request_id: str,
        action: str,
        admin_user_id: str,
        note: Optional[str] = None,
    ):
        """Approve or reject an access request."""
        db = get_db()

        access_request = await db.accessrequest.find_unique(where={"id": request_id})
        if not access_request:
            return None

        new_status = "APPROVED" if action == "approve" else "REJECTED"

        # Update the request
        updated = await db.accessrequest.update(
            where={"id": request_id},
            data={
                "status": new_status,
                "reviewedBy": admin_user_id,
                "reviewNote": note,
                "reviewedAt": datetime.now(timezone.utc),
            },
        )

        # If approved, grant Horus access to the linked user
        if new_status == "APPROVED":
            target_user_id = access_request.userId

            # Try to find user by email if not linked
            if not target_user_id:
                user = await db.user.find_unique(where={"email": access_request.email})
                if user:
                    target_user_id = user.id
                    # Also link the request to the user
                    await db.accessrequest.update(
                        where={"id": request_id},
                        data={"userId": target_user_id},
                    )

            if target_user_id:
                await db.user.update(
                    where={"id": target_user_id},
                    data={"horusAccess": True},
                )
                logger.info(
                    "Horus access granted to user %s via request %s",
                    target_user_id, request_id,
                )
            else:
                logger.warning(
                    "Access request %s approved but no user found for email %s — "
                    "access will be granted when they register.",
                    request_id, access_request.email,
                )

        logger.info(
            "Access request %s reviewed: %s by admin %s",
            request_id, new_status, admin_user_id,
        )
        return updated

    @staticmethod
    def persist_request(data: AccessRequestCreate) -> None:
        """Append request to a local JSONL log (backup)."""
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            record = {
                "submitted_at": datetime.now(timezone.utc).isoformat(),
                "name": data.name,
                "email": str(data.email),
                "institution": data.institution,
                "role": data.role,
                "role_label": _role_display(data.role),
                "type": data.type,
                "message": data.message,
            }
            with REQUESTS_LOG.open("a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        except OSError as e:
            logger.error("Failed to persist access request to JSONL: %s", e)

    @staticmethod
    def send_admin_notification_email(data: AccessRequestCreate) -> bool:
        """Send notification email to admin about new access request."""
        recipient = settings.DEMO_REQUEST_RECIPIENT
        role_label = _role_display(data.role)
        subject = f"[Ayn] New {data.type.capitalize()} request — {data.name} ({data.institution})"
        submitted_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        message_row = ""
        if data.message:
            message_row = f'<tr><td style="padding:10px 0; color:#64748b;">Message</td><td style="padding:10px 0; color:#f8fafc;">{data.message}</td></tr>'

        text_content = (
            f"New {data.type} request on Ayn Platform\n\n"
            f"Name: {data.name}\n"
            f"Email: {data.email}\n"
            f"Institution: {data.institution}\n"
            f"Role: {role_label}\n"
            f"Request type: {data.type.capitalize()}\n"
            f"Message: {data.message or '(none)'}\n"
            f"Submitted: {submitted_at}\n"
        )

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0b0c12; color:#e2e8f0; margin:0; padding:32px 16px;">
          <div style="max-width:560px; margin:0 auto; background:#11131e; border:1px solid rgba(255,255,255,0.08); border-radius:16px; overflow:hidden;">
            <div style="background:linear-gradient(135deg,#1e1b4b,#311042); padding:28px 32px; text-align:center;">
              <h1 style="margin:0; font-size:22px; color:#fff;">New Access Request</h1>
              <span style="display:inline-block; margin-top:10px; padding:6px 14px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; background:#3b82f6; color:#fff; border-radius:999px;">
                {data.type.capitalize()} Request
              </span>
            </div>
            <div style="padding:28px 32px;">
              <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <tr><td style="padding:10px 0; color:#64748b; width:38%;">Name</td><td style="padding:10px 0; color:#f8fafc; font-weight:600;">{data.name}</td></tr>
                <tr><td style="padding:10px 0; color:#64748b;">Email</td><td style="padding:10px 0;"><a href="mailto:{data.email}" style="color:#60a5fa; text-decoration:none;">{data.email}</a></td></tr>
                <tr><td style="padding:10px 0; color:#64748b;">Institution</td><td style="padding:10px 0; color:#f8fafc; font-weight:600;">{data.institution}</td></tr>
                <tr><td style="padding:10px 0; color:#64748b;">Role</td><td style="padding:10px 0; color:#f8fafc; font-weight:600;">{role_label}</td></tr>
                {message_row}
                <tr><td style="padding:10px 0; color:#64748b;">Submitted</td><td style="padding:10px 0; color:#f8fafc;">{submitted_at}</td></tr>
              </table>
            </div>
            <div style="padding:16px 32px; border-top:1px solid rgba(255,255,255,0.06); text-align:center; font-size:12px; color:#475569;">
              Ayn Platform · Access Request Notification
            </div>
          </div>
        </body>
        </html>
        """

        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning(
                "SMTP not configured — access request saved but email not sent to %s.",
                recipient,
            )
            return False

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
        msg["To"] = recipient
        msg["Reply-To"] = str(data.email)

        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(msg["From"], [recipient], msg.as_string())
            logger.info("Access request email sent to %s for %s", recipient, data.email)
            return True
        except Exception as e:
            logger.error("SMTP failed for access request: %s", e)
            return False
