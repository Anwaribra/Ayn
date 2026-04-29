"""Progressive background analysis for temporary Horus attachments."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from app.core.events import event_bus
from app.core.jobs import enqueue_job, register_job_handler
from app.core.metrics import record_ai_usage
from app.horus.document_intelligence import DocumentIntelligencePipeline
from app.horus.extraction import extract_text_cached

logger = logging.getLogger(__name__)


class ProgressiveFileAnalysis:
    """Runs a cheap post-response pass and streams progress to the client."""

    @staticmethod
    async def enqueue(
        *,
        user_id: str,
        attachment: dict[str, Any],
        message: str | None = None,
    ) -> str:
        return await enqueue_job(
            "horus.progressive_file_analysis",
            {
                "user_id": user_id,
                "attachment": {
                    "id": attachment.get("temp_attachment_id") or attachment.get("id"),
                    "filename": attachment.get("filename"),
                    "mime_type": attachment.get("mime_type") or attachment.get("content_type"),
                    "sha256": attachment.get("sha256"),
                    "size": attachment.get("size"),
                    "temp_path": attachment.get("temp_path"),
                },
                "message": message,
            },
            priority=55,
            max_attempts=2,
        )

    @staticmethod
    async def run_job(payload: dict[str, Any]) -> None:
        user_id = payload.get("user_id")
        attachment = payload.get("attachment") or {}
        attachment_id = attachment.get("id")
        filename = attachment.get("filename") or "file"
        if not user_id or not attachment_id:
            return

        async def progress(status: str, **data: Any) -> None:
            await event_bus.emit(
                user_id,
                "file_analysis_progress",
                {
                    "attachmentId": attachment_id,
                    "filename": filename,
                    "status": status,
                    **data,
                },
                durable=status == "complete",
                source="horus_progressive_analysis",
            )

        await progress("started")
        temp_path = attachment.get("temp_path")
        content = b""
        if temp_path and Path(temp_path).exists():
            content = Path(temp_path).read_bytes()
        if not content:
            await progress("skipped", reason="attachment expired or unavailable")
            return

        await progress("extracting")
        extraction = extract_text_cached(
            content=content,
            filename=filename,
            mime_type=attachment.get("mime_type") or "application/octet-stream",
            sha256=attachment.get("sha256"),
            max_chars=12000,
        )
        text = extraction.get("text") or ""
        intelligence = DocumentIntelligencePipeline.analyze(
            filename=filename,
            mime_type=attachment.get("mime_type") or "application/octet-stream",
            text=text,
            size=int(attachment.get("size") or len(content)),
        )
        await progress("classified", cacheHit=bool(extraction.get("cache_hit")), characters=len(text), intelligence=intelligence)

        summary = ProgressiveFileAnalysis._summarize(filename, text, int(attachment.get("size") or len(content)))
        await progress("complete", summary=summary, findings=ProgressiveFileAnalysis._findings(text), intelligence=intelligence)
        await record_ai_usage(
            operation="document_intelligence",
            provider="local",
            model="rules-v1",
            route_reason="deterministic document intelligence avoids AI call",
            input_tokens=max(1, len(text) // 4),
            output_tokens=0,
            estimated_cost_usd=0,
            latency_ms=0,
            user_id=user_id,
            feature="horus_document_intelligence",
            cache_hit=bool(extraction.get("cache_hit")),
            metadata={"documentType": intelligence["documentType"], "riskLevel": intelligence["riskLevel"]},
        )

    @staticmethod
    def _summarize(filename: str, text: str, size: int) -> str:
        if not text.strip():
            return f"{filename} was received ({size} bytes), but no searchable text was extracted in the background pass."
        words = len(text.split())
        return f"{filename} background pass extracted about {words} words for follow-up analysis."

    @staticmethod
    def _findings(text: str) -> list[str]:
        lowered = text.lower()
        findings: list[str] = []
        for label, needles in (
            ("Mentions policy or procedure content", ("policy", "procedure", "سياسة", "إجراء")),
            ("Likely evidence for compliance mapping", ("standard", "criterion", "compliance", "معيار", "امتثال")),
            ("May contain gaps or corrective actions", ("gap", "risk", "corrective", "فجوة", "مخاطر", "تصحيح")),
        ):
            if any(needle in lowered for needle in needles):
                findings.append(label)
        return findings[:3]


register_job_handler("horus.progressive_file_analysis", ProgressiveFileAnalysis.run_job)
