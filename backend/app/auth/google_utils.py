"""Helpers for verifying Google ID tokens."""

from typing import Any, Dict, List

from fastapi import HTTPException, status
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.core.config import settings


def _get_allowed_domains() -> List[str]:
    raw = settings.GOOGLE_ALLOWED_DOMAINS or ""
    return [d.strip().lower() for d in raw.split(",") if d.strip()]


def verify_google_id_token(id_token_str: str) -> Dict[str, Any]:
    """
    Verify a Google ID token and return its payload.

    Raises HTTPException if the token is invalid or from a disallowed domain.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google sign-in is not configured on the server.",
        )

    try:
        request = google_requests.Request()
        payload = id_token.verify_oauth2_token(
            id_token_str,
            request,
            settings.GOOGLE_CLIENT_ID,
        )

        # Extra issuer safety check
        iss = payload.get("iss")
        if iss not in ("accounts.google.com", "https://accounts.google.com"):
            raise ValueError("Wrong issuer")

        # Optional hosted-domain restriction
        allowed_domains = _get_allowed_domains()
        if allowed_domains:
            hd = (payload.get("hd") or "").lower()
            if hd not in allowed_domains:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email domain is not allowed for this workspace.",
                )

        return payload
    except HTTPException:
        # Propagate controlled errors
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID token.",
        )

