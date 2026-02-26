"""
Horus Agent Context Builder

Builds a compact, structured platform snapshot that can be passed to Horus
for planning and reasoning across modules.
"""

from __future__ import annotations

from typing import Any, Dict

from app.activity.service import ActivityService
from app.notifications.service import NotificationService
from app.platform_state.service import StateService


async def build_agent_context(
    db: Any,
    user_id: str,
    institution_id: str | None,
) -> Dict[str, Any]:
    """
    Build a compact platform snapshot for one user/institution.
    """
    state_service = StateService(db)
    summary = await state_service.get_state_summary(user_id)

    recent_activity = await ActivityService.get_recent_activities(user_id, limit=10)
    unread_notifications = await NotificationService.get_unread_count(user_id)

    evidence_count = await db.evidence.count(
        where={
            "OR": [
                {"uploadedById": user_id},
                {"ownerId": institution_id} if institution_id else {"uploadedById": user_id},
            ]
        }
    )
    analyzed_evidence = await db.evidence.count(
        where={
            "status": {"in": ["analyzed", "linked"]},
            "OR": [
                {"uploadedById": user_id},
                {"ownerId": institution_id} if institution_id else {"uploadedById": user_id},
            ],
        }
    )

    gap_reports = await db.gapanalysis.find_many(
        where={"institutionId": institution_id} if institution_id else {"institutionId": "__none__"},
        include={"standard": True},
        order={"createdAt": "desc"},
        take=5,
    )

    open_platform_gaps = await db.platformgap.count(
        where={"userId": user_id, "status": {"not": "closed"}}
    )

    standards = await db.standard.find_many(
        where={"institutionStandards": {"some": {"institutionId": institution_id}}}
        if institution_id
        else {},
        include={"criteria": True},
        take=10,
    )

    mappings = await db.criteriamapping.find_many(
        where={"institutionId": institution_id} if institution_id else {"institutionId": "__none__"},
        include={"criterion": {"include": {"standard": True}}},
    )

    standards_summary: list[dict[str, Any]] = []
    by_standard: dict[str, dict[str, Any]] = {}
    for m in mappings:
        if not m.criterion or not m.criterion.standard:
            continue
        sid = m.criterion.standard.id
        if sid not in by_standard:
            by_standard[sid] = {
                "standard_id": sid,
                "standard_title": m.criterion.standard.title,
                "met": 0,
                "gap": 0,
                "partial": 0,
                "total_mapped": 0,
            }
        row = by_standard[sid]
        row["total_mapped"] += 1
        status = (m.status or "").lower()
        if status == "met":
            row["met"] += 1
        elif status == "partial":
            row["partial"] += 1
        else:
            row["gap"] += 1

    standards_summary = list(by_standard.values())[:8]

    return {
        "state_summary": {
            "total_files": summary.total_files,
            "analyzed_files": summary.analyzed_files,
            "total_evidence": summary.total_evidence,
            "linked_evidence": summary.linked_evidence,
            "total_gaps": summary.total_gaps,
            "addressed_gaps": summary.addressed_gaps,
            "closed_gaps": summary.closed_gaps,
            "total_score": summary.total_score,
        },
        "evidence": {
            "total": evidence_count,
            "analyzed_or_linked": analyzed_evidence,
        },
        "gaps": {
            "open_platform_gaps": open_platform_gaps,
            "recent_reports": [
                {
                    "id": r.id,
                    "standard": r.standard.title if r.standard else "Unknown",
                    "score": r.overallScore,
                    "status": r.status,
                    "created_at": r.createdAt.isoformat(),
                }
                for r in gap_reports
            ],
        },
        "standards": {
            "linked_count": len(standards),
            "mapped_overview": standards_summary,
        },
        "notifications": {
            "unread_count": unread_notifications,
        },
        "recent_activity": [
            {
                "type": a.type,
                "title": a.title,
                "description": a.description,
                "created_at": a.createdAt.isoformat(),
            }
            for a in recent_activity
        ],
    }

