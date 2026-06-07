"""Demo and pricing requests router."""
import json
import logging
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

ROLE_LABELS = {
    "admin": "Administrator",
    "faculty": "Faculty Dean",
    "compliance": "Compliance Officer",
    "consultant": "Consultant",
    "other": "Other Role",
}

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
REQUESTS_LOG = DATA_DIR / "demo_requests.jsonl"


class DemoRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    institution: str = Field(..., min_length=1, max_length=300)
    role: str = Field(..., min_length=1, max_length=80)
    type: Literal["demo", "pricing"]


def role_display(role: str) -> str:
    return ROLE_LABELS.get(role.lower(), role.replace("_", " ").title())


def persist_demo_request(data: DemoRequest) -> None:
    """Append every submission to a local log (backup when SMTP is unavailable)."""
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        record = {
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "name": data.name,
            "email": str(data.email),
            "institution": data.institution,
            "role": data.role,
            "role_label": role_display(data.role),
            "type": data.type,
        }
        with REQUESTS_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except OSError as e:
        logger.error("Failed to persist demo request: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save your request. Please try again.",
        ) from e


def send_demo_email(data: DemoRequest) -> bool:
    """Send notification to DEMO_REQUEST_RECIPIENT (default: anwarmousa100@gmail.com)."""
    recipient = settings.DEMO_REQUEST_RECIPIENT
    role_label = role_display(data.role)
    subject = f"[Ayn] New {data.type.capitalize()} request — {data.name} ({data.institution})"
    submitted_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    text_content = (
        f"New {data.type} request on Ayn landing page\n\n"
        f"Name: {data.name}\n"
        f"Email: {data.email}\n"
        f"Institution: {data.institution}\n"
        f"Role: {role_label}\n"
        f"Request type: {data.type.capitalize()}\n"
        f"Submitted: {submitted_at}\n"
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0b0c12; color:#e2e8f0; margin:0; padding:32px 16px;">
      <div style="max-width:560px; margin:0 auto; background:#11131e; border:1px solid rgba(255,255,255,0.08); border-radius:16px; overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1e1b4b,#311042); padding:28px 32px; text-align:center;">
          <h1 style="margin:0; font-size:22px; color:#fff;">New Ayn request</h1>
          <span style="display:inline-block; margin-top:10px; padding:6px 14px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; background:#3b82f6; color:#fff; border-radius:999px;">
            {data.type.capitalize()}
          </span>
        </div>
        <div style="padding:28px 32px;">
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr><td style="padding:10px 0; color:#64748b; width:38%;">Name</td><td style="padding:10px 0; color:#f8fafc; font-weight:600;">{data.name}</td></tr>
            <tr><td style="padding:10px 0; color:#64748b;">Email</td><td style="padding:10px 0;"><a href="mailto:{data.email}" style="color:#60a5fa; text-decoration:none;">{data.email}</a></td></tr>
            <tr><td style="padding:10px 0; color:#64748b;">Institution</td><td style="padding:10px 0; color:#f8fafc; font-weight:600;">{data.institution}</td></tr>
            <tr><td style="padding:10px 0; color:#64748b;">Role</td><td style="padding:10px 0; color:#f8fafc; font-weight:600;">{role_label}</td></tr>
            <tr><td style="padding:10px 0; color:#64748b;">Submitted</td><td style="padding:10px 0; color:#f8fafc;">{submitted_at}</td></tr>
          </table>
        </div>
        <div style="padding:16px 32px; border-top:1px solid rgba(255,255,255,0.06); text-align:center; font-size:12px; color:#475569;">
          Ayn Platform · Landing page notification
        </div>
      </div>
    </body>
    </html>
    """

    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            "SMTP not configured — request saved to %s but email not sent to %s. "
            "Set SMTP_USER and SMTP_PASSWORD in backend/.env (Gmail app password).",
            REQUESTS_LOG,
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
        logger.info("Demo request email sent to %s for %s", recipient, data.email)
        return True
    except Exception as e:
        logger.error("SMTP failed for demo request: %s", e)
        return False


@router.post("/demo-request", status_code=status.HTTP_200_OK)
async def handle_demo_request(body: DemoRequest):
    """Receive landing-page demo/pricing form; notify admin by email."""
    logger.info("Demo request: %s <%s> — %s", body.name, body.email, body.type)

    persist_demo_request(body)
    email_sent = send_demo_email(body)

    return {
        "status": "success",
        "message": "Request received",
        "email_sent": email_sent,
        "recipient": settings.DEMO_REQUEST_RECIPIENT,
    }
