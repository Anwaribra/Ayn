"""Ranking engine for proactive Horus suggestions."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class RankedSuggestion:
    score: float
    payload: dict[str, Any]


class SuggestionRankingEngine:
    WEIGHTS = {
        "high": 0.35,
        "medium": 0.2,
        "low": 0.05,
    }

    @classmethod
    def rank(cls, suggestion: dict[str, Any], event_data: dict[str, Any] | None = None) -> RankedSuggestion:
        event_data = event_data or {}
        priority = str(suggestion.get("priority") or "medium").lower()
        score = 0.35 + cls.WEIGHTS.get(priority, 0.1)
        actions = suggestion.get("actions") or []
        if actions:
            score += min(len(actions), 3) * 0.05
        if suggestion.get("entityId"):
            score += 0.08
        title = f"{suggestion.get('title', '')} {suggestion.get('message', '')}".lower()
        if any(k in title for k in ("gap", "risk", "compliance", "audit", "فجوة", "مخاطر")):
            score += 0.14
        if event_data.get("metadata", {}).get("scoreDelta"):
            score += 0.08
        score = round(min(score, 1.0), 3)
        ranked = {
            **suggestion,
            "rank": {
                "score": score,
                "reason": cls._reason(score),
            },
        }
        return RankedSuggestion(score=score, payload=ranked)

    @staticmethod
    def _reason(score: float) -> str:
        if score >= 0.8:
            return "urgent compliance impact"
        if score >= 0.6:
            return "useful next action"
        return "background awareness"
