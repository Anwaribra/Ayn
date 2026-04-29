"""Smart retrieval planning for Horus chat paths."""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class RetrievalPlan:
    mode: str
    should_retrieve: bool
    limit: int
    budget_seconds: float
    reason: str


class SmartRetrievalPlanner:
    """Cheap deterministic planner that avoids embedding calls unless useful."""

    _SKIP_PATTERNS = (
        r"^\s*(hi|hello|hey|thanks|thank you|ok|okay)\b",
        r"^\s*(مرحبا|أهلا|اهلا|شكرا|تمام)\b",
    )
    _DOC_PATTERNS = (
        "evidence", "uploaded", "document", "file", "policy", "procedure",
        "criteria", "criterion", "standard", "iso", "ncaaa", "naqaae",
        "accreditation", "gap", "audit", "report", "compliance",
        "دليل", "وثيقة", "ملف", "معيار", "امتثال", "اعتماد", "فجوة", "تقرير",
    )
    _BROAD_PATTERNS = (
        "compare", "across", "all", "history", "previous", "vault", "coverage",
        "map", "mapping", "criteria", "show me", "find",
        "كل", "قارن", "السابقة", "التغطية", "اربط", "ابحث",
    )

    @classmethod
    def plan(cls, message: str | None, *, has_files: bool = False, explicit: bool = False) -> RetrievalPlan:
        text = " ".join((message or "").lower().split())
        if has_files:
            return RetrievalPlan("skip_file_turn", False, 0, 0.0, "attached files are the primary context")
        if explicit:
            return RetrievalPlan("full", True, 6, 1.2, "retrieval explicitly requested")
        if not text:
            return RetrievalPlan("skip_empty", False, 0, 0.0, "empty message")
        if len(text) < 20 or any(re.search(pattern, text) for pattern in cls._SKIP_PATTERNS):
            return RetrievalPlan("skip_smalltalk", False, 0, 0.0, "small conversational turn")
        if any(token in text for token in cls._BROAD_PATTERNS) and any(token in text for token in cls._DOC_PATTERNS):
            return RetrievalPlan("full", True, 5, 1.0, "broad document/platform retrieval")
        if any(token in text for token in cls._DOC_PATTERNS):
            return RetrievalPlan("budgeted", True, 3, 0.55, "targeted compliance/document retrieval")
        return RetrievalPlan("skip_general", False, 0, 0.0, "general answer does not need vector search")
