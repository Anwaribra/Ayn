"""Fast document intelligence pipeline for Horus attachments."""

from __future__ import annotations

import re
from typing import Any


class DocumentIntelligencePipeline:
    @classmethod
    def analyze(cls, *, filename: str, mime_type: str, text: str, size: int = 0) -> dict[str, Any]:
        lower = (text or "").lower()
        doc_type = cls._classify(filename, mime_type, lower)
        standards = cls._standards(lower)
        risk = cls._risk(lower)
        actions = cls._actions(doc_type, standards, risk)
        return {
            "documentType": doc_type,
            "standards": standards,
            "riskLevel": risk,
            "signals": cls._signals(lower),
            "wordCount": len((text or "").split()),
            "size": size,
            "recommendedActions": actions,
        }

    @staticmethod
    def _classify(filename: str, mime_type: str, lower: str) -> str:
        name = filename.lower()
        if "policy" in lower or "سياسة" in lower or "policy" in name:
            return "policy"
        if "procedure" in lower or "process" in lower or "إجراء" in lower:
            return "procedure"
        if "report" in lower or "تقرير" in lower:
            return "report"
        if "minutes" in lower or "meeting" in lower or "محضر" in lower:
            return "meeting_minutes"
        if mime_type.startswith("image/"):
            return "image_evidence"
        return "evidence_document"

    @staticmethod
    def _standards(lower: str) -> list[str]:
        found = []
        for label, pattern in (
            ("ISO 21001", r"iso\s*21001"),
            ("ISO 9001", r"iso\s*9001"),
            ("NCAAA", r"ncaaa|ncaee"),
            ("NAQAAE", r"naqaae|naqa"),
            ("AACSB", r"aacsb"),
            ("ABET", r"abet"),
        ):
            if re.search(pattern, lower):
                found.append(label)
        return found

    @staticmethod
    def _risk(lower: str) -> str:
        high = ("nonconform", "major gap", "overdue", "critical", "مخالفة", "حرج")
        medium = ("gap", "risk", "missing", "corrective", "فجوة", "مفقود", "تصحيح")
        if any(k in lower for k in high):
            return "high"
        if any(k in lower for k in medium):
            return "medium"
        return "low"

    @staticmethod
    def _signals(lower: str) -> list[str]:
        signals = []
        for label, needles in (
            ("has_owner", ("owner", "responsible", "مسؤول")),
            ("has_dates", ("2024", "2025", "2026", "deadline", "date", "تاريخ")),
            ("has_corrective_action", ("corrective", "action plan", "تصحيح")),
            ("has_evidence_language", ("evidence", "record", "دليل", "سجل")),
        ):
            if any(n in lower for n in needles):
                signals.append(label)
        return signals

    @staticmethod
    def _actions(doc_type: str, standards: list[str], risk: str) -> list[str]:
        actions = ["summarize"]
        if standards or doc_type in {"policy", "procedure", "evidence_document"}:
            actions.append("map_to_criteria")
        if risk in {"medium", "high"}:
            actions.append("draft_remediation")
        actions.append("save_to_vault")
        return actions
