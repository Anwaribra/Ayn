"""Horus observer worker for durable platform awareness."""

from __future__ import annotations

import logging
from typing import Any

from app.core.event_outbox import mark_event_failed, mark_event_processed
from app.core.events import event_bus
from app.core.jobs import register_job_handler
from app.horus.suggestions import SuggestionRankingEngine

logger = logging.getLogger(__name__)


class HorusObserverWorker:
    """Turns raw platform events into lightweight proactive Horus signals."""

    ACTIONABLE_TYPES = {
        "activity",
        "evidence_uploaded",
        "analysis_finished",
        "gap_detected",
        "score_updated",
        "file_analysis_progress",
    }

    @classmethod
    async def handle_event(cls, payload: dict[str, Any]) -> None:
        event_id = payload.get("event_id")
        user_id = payload.get("user_id")
        event_type = payload.get("type")
        data = payload.get("payload") or {}
        try:
            if not user_id or not event_type:
                return
            suggestion = cls._build_suggestion(event_type, data)
            if suggestion:
                ranked = SuggestionRankingEngine.rank(suggestion, data)
                await event_bus.emit(
                    user_id,
                    "horus_suggestion",
                    ranked.payload,
                    durable=False,
                    source="horus_observer",
                )
            if event_id:
                await mark_event_processed(event_id)
        except Exception as exc:
            if event_id:
                await mark_event_failed(event_id, exc)
            raise

    @classmethod
    def _build_suggestion(cls, event_type: str, data: dict[str, Any]) -> dict[str, Any] | None:
        activity_type = str(data.get("type") or event_type)
        title = str(data.get("title") or "")
        entity_id = data.get("entityId") or data.get("entity_id")
        entity_type = data.get("entityType") or data.get("entity_type")

        if activity_type in {"evidence_uploaded", "file_uploaded"} or entity_type == "evidence":
            return {
                "priority": "high",
                "intent": "analyze_evidence",
                "title": "New evidence is ready for analysis",
                "message": f"{title or 'A new file'} can be checked for standards coverage and gaps.",
                "entityId": entity_id,
                "entityType": entity_type or "evidence",
                "actions": ["analyze", "map_to_criteria", "save_to_vault"],
            }
        if activity_type in {"gap_detected", "gap_created"}:
            return {
                "priority": "high",
                "intent": "remediate_gap",
                "title": "Horus found a compliance gap",
                "message": title or "Review the gap and generate a remediation plan.",
                "entityId": entity_id,
                "entityType": entity_type or "gap",
                "actions": ["review_gap", "draft_remediation"],
            }
        if activity_type == "score_updated":
            return {
                "priority": "medium",
                "intent": "explain_score",
                "title": "Compliance score changed",
                "message": title or "Ask Horus to explain what changed and what to do next.",
                "entityId": entity_id,
                "entityType": entity_type or "analytics",
                "actions": ["explain", "prioritize_next_steps"],
            }
        if event_type == "file_analysis_progress" and data.get("status") == "complete":
            return {
                "priority": "medium",
                "intent": "continue_file_workflow",
                "title": "Background file analysis finished",
                "message": data.get("summary") or "Horus finished the deeper background pass.",
                "entityId": entity_id,
                "entityType": entity_type or "attachment",
                "actions": ["view_findings", "save_to_vault"],
            }
        return None


register_job_handler("horus.observe_event", HorusObserverWorker.handle_event)
