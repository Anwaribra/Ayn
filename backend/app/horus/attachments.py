"""Temporary attachment service for Horus.

Attachments analyzed by Horus are retained briefly so the user can explicitly
promote them to Evidence Vault after seeing the initial AI response.
"""

from __future__ import annotations

import hashlib
import json
import mimetypes
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.core.redis import redis_client
from app.evidence.service import ALLOWED_FILE_TYPES, MAX_FILE_SIZE


HORUS_MEMORY_FILE_LIMIT = int(os.getenv("HORUS_MEMORY_FILE_LIMIT_BYTES", str(8 * 1024 * 1024)))
HORUS_MAX_FILE_LIMIT = int(os.getenv("HORUS_MAX_FILE_LIMIT_BYTES", str(MAX_FILE_SIZE)))
HORUS_ATTACHMENT_TTL_SECONDS = int(os.getenv("HORUS_ATTACHMENT_TTL_SECONDS", str(60 * 60)))
HORUS_ATTACHMENT_DIR = Path(os.getenv("HORUS_ATTACHMENT_DIR", "/tmp/ayn-horus-attachments"))
HORUS_UPLOAD_CHUNK_SIZE = 1024 * 1024
ATTACHMENT_KEY_PREFIX = "horus:attachment:"


@dataclass(frozen=True)
class TemporaryAttachment:
    id: str
    user_id: str
    filename: str
    content_type: str
    size: int
    sha256: str
    temp_path: str
    expires_at: datetime
    body: bytes | None = None

    def metadata(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "filename": self.filename,
            "content_type": self.content_type,
            "size": self.size,
            "sha256": self.sha256,
            "temp_path": self.temp_path,
            "expires_at": self.expires_at.isoformat(),
        }

    def as_horus_payload(self) -> dict[str, Any]:
        payload = {
            "temp_attachment_id": self.id,
            "filename": self.filename,
            "content_type": self.content_type,
            "size": self.size,
            "sha256": self.sha256,
            "storage": "memory+tempfile" if self.body is not None else "tempfile",
            "temp_path": self.temp_path,
            "expires_at": self.expires_at.isoformat(),
        }
        if self.body is not None:
            payload["body"] = self.body
        return payload


def normalize_content_type(filename: str, content_type: str | None) -> str:
    provided = (content_type or "").split(";")[0].strip().lower()
    guessed, _ = mimetypes.guess_type(filename or "")
    guessed = (guessed or "").strip().lower()
    if guessed == "application/pdf":
        return guessed
    if provided in ALLOWED_FILE_TYPES:
        return provided
    if guessed in ALLOWED_FILE_TYPES:
        return guessed
    return provided or guessed or "application/octet-stream"


def validate_horus_upload(filename: str, content_type: str, size: int) -> None:
    if content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed for Horus analysis: {content_type}",
        )
    if size <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")
    if size > HORUS_MAX_FILE_LIMIT:
        limit_mb = HORUS_MAX_FILE_LIMIT // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large for instant Horus analysis (max {limit_mb}MB)",
        )


class TemporaryAttachmentService:
    @staticmethod
    def _key(attachment_id: str) -> str:
        return f"{ATTACHMENT_KEY_PREFIX}{attachment_id}"

    @staticmethod
    def _sidecar_path(attachment_id: str) -> Path:
        return HORUS_ATTACHMENT_DIR / f"{attachment_id}.json"

    @staticmethod
    def _file_path(attachment_id: str, filename: str) -> Path:
        suffix = Path(filename).suffix
        return HORUS_ATTACHMENT_DIR / f"{attachment_id}{suffix}"

    @classmethod
    async def create_from_upload(cls, upload: UploadFile, user_id: str) -> TemporaryAttachment:
        HORUS_ATTACHMENT_DIR.mkdir(parents=True, exist_ok=True)
        attachment_id = str(uuid4())
        filename = upload.filename or "file"
        content_type = normalize_content_type(filename, upload.content_type)
        temp_path = cls._file_path(attachment_id, filename)
        hasher = hashlib.sha256()
        memory_chunks: list[bytes] = []
        size = 0

        try:
            with temp_path.open("wb") as handle:
                while True:
                    chunk = await upload.read(HORUS_UPLOAD_CHUNK_SIZE)
                    if not chunk:
                        break
                    size += len(chunk)
                    if size > HORUS_MAX_FILE_LIMIT:
                        validate_horus_upload(filename, content_type, size)
                    hasher.update(chunk)
                    handle.write(chunk)
                    if size <= HORUS_MEMORY_FILE_LIMIT:
                        memory_chunks.append(chunk)
                    else:
                        memory_chunks.clear()

            validate_horus_upload(filename, content_type, size)
            body = b"".join(memory_chunks) if memory_chunks else None
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=HORUS_ATTACHMENT_TTL_SECONDS)
            attachment = TemporaryAttachment(
                id=attachment_id,
                user_id=user_id,
                filename=filename,
                content_type=content_type,
                size=size,
                sha256=hasher.hexdigest(),
                temp_path=str(temp_path),
                expires_at=expires_at,
                body=body,
            )
            cls._persist_metadata(attachment.metadata())
            return attachment
        except Exception:
            try:
                temp_path.unlink()
            except OSError:
                pass
            raise

    @classmethod
    def _persist_metadata(cls, metadata: dict[str, Any]) -> None:
        raw = json.dumps(metadata)
        if redis_client.enabled:
            redis_client.set(cls._key(metadata["id"]), raw, ex=HORUS_ATTACHMENT_TTL_SECONDS)
        cls._sidecar_path(metadata["id"]).write_text(raw, encoding="utf-8")

    @classmethod
    def get_metadata(cls, attachment_id: str) -> dict[str, Any] | None:
        raw = redis_client.get(cls._key(attachment_id)) if redis_client.enabled else None
        if not raw:
            sidecar = cls._sidecar_path(attachment_id)
            if sidecar.exists():
                raw = sidecar.read_text(encoding="utf-8")
        if not raw:
            return None
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return None
        expires_at = datetime.fromisoformat(data["expires_at"])
        if expires_at < datetime.now(timezone.utc):
            cls._delete_metadata(data)
            return None
        if not Path(data["temp_path"]).exists():
            return None
        return data

    @classmethod
    def read_bytes(cls, attachment_id: str, user_id: str) -> tuple[dict[str, Any], bytes]:
        metadata = cls.get_metadata(attachment_id)
        if not metadata:
            raise HTTPException(status_code=404, detail="Temporary attachment not found or expired")
        if metadata.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Attachment does not belong to this user")
        return metadata, Path(metadata["temp_path"]).read_bytes()

    @classmethod
    def delete(cls, attachment_id: str) -> None:
        metadata = cls.get_metadata(attachment_id) if not attachment_id.startswith("__raw__") else None
        cls._delete_metadata(metadata or {"id": attachment_id})

    @classmethod
    def _delete_metadata(cls, metadata: dict[str, Any]) -> None:
        attachment_id = metadata.get("id")
        if metadata:
            try:
                temp_path = metadata.get("temp_path")
                if temp_path:
                    Path(temp_path).unlink()
            except OSError:
                pass
        try:
            cls._sidecar_path(attachment_id).unlink()
        except (OSError, TypeError):
            pass
        if redis_client.enabled and attachment_id:
            redis_client.delete(cls._key(attachment_id))

    @classmethod
    def cleanup_expired(cls) -> int:
        HORUS_ATTACHMENT_DIR.mkdir(parents=True, exist_ok=True)
        now = datetime.now(timezone.utc)
        cleaned = 0
        for sidecar in HORUS_ATTACHMENT_DIR.glob("*.json"):
            try:
                data = json.loads(sidecar.read_text(encoding="utf-8"))
                expires_at = datetime.fromisoformat(data["expires_at"])
                if expires_at >= now:
                    continue
                attachment_id = data["id"]
                try:
                    Path(data["temp_path"]).unlink()
                except OSError:
                    pass
                sidecar.unlink(missing_ok=True)
                if redis_client.enabled:
                    redis_client.delete(cls._key(attachment_id))
                cleaned += 1
            except Exception:
                continue
        return cleaned
