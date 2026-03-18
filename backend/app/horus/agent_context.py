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
    user_identity: Dict[str, str] | None = None,
) -> Dict[str, Any]:
    """
    Build a compact platform snapshot for one user/institution.
    """
    state_service = StateService(db)
    owner_filter = {
        "OR": [
            {"uploadedById": user_id},
            {"ownerId": institution_id} if institution_id else {"uploadedById": user_id},
        ]
    }
    gap_filter = {"institutionId": institution_id} if institution_id else {"institutionId": "__none__"}
    standards_filter = (
        {"institutionStandards": {"some": {"institutionId": institution_id}}}
        if institution_id
        else {}
    )

    (
        summary,
        recent_activity,
        unread_notifications,
        evidence_count,
        analyzed_evidence,
        gap_reports,
        open_platform_gaps,
        standards,
        mappings,
        all_ga,
    ) = await __import__("asyncio").gather(
        state_service.get_state_summary(user_id),
        ActivityService.get_recent_activities(user_id, limit=10),
        NotificationService.get_unread_count(user_id),
        db.evidence.count(where=owner_filter),
        db.evidence.count(
            where={
                "status": {"in": ["analyzed", "linked"]},
                **owner_filter,
            }
        ),
        db.gapanalysis.find_many(
            where=gap_filter,
            include={"standard": True},
            order={"createdAt": "desc"},
            take=5,
        ),
        db.platformgap.count(
            where={"userId": user_id, "status": {"not": "closed"}}
        ),
        db.standard.find_many(
            where=standards_filter,
            include={"criteria": True},
            take=10,
        ),
        db.criteriamapping.find_many(
            where=gap_filter,
            include={"criterion": {"include": {"standard": True}}},
        ),
        db.gapanalysis.find_many(
            where=gap_filter,
            include={"standard": True},
            order={"createdAt": "desc"},
        ),
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

    # ── Analytics summary (lightweight — reuses data already fetched) ────
    ga_scores = [r.overallScore for r in all_ga]
    ga_total = len(ga_scores)
    ga_avg = round(sum(ga_scores) / ga_total, 1) if ga_total > 0 else 0
    ga_latest = round(ga_scores[0], 1) if ga_scores else 0
    ga_unique_stds = len({r.standardId for r in all_ga if r.standardId})

    total_evidence_all = evidence_count

    # Growth (compare first half vs second half)
    mid = ga_total // 2
    first_half = ga_scores[mid:] if mid > 0 else []
    second_half = ga_scores[:mid] if mid > 0 else []
    first_avg = sum(first_half) / len(first_half) if first_half else 0
    second_avg = sum(second_half) / len(second_half) if second_half else 0
    growth_pct = round(((second_avg - first_avg) / first_avg) * 100, 1) if first_avg > 0 else 0

    # Top/bottom standard
    std_avgs = {}
    for sid, row in by_standard.items():
        total_mapped = row["total_mapped"]
        if total_mapped > 0:
            std_avgs[row["standard_title"]] = round(row["met"] / total_mapped * 100, 1)

    top_std = max(std_avgs, key=std_avgs.get) if std_avgs else None
    bottom_std = min(std_avgs, key=std_avgs.get) if std_avgs else None

    analytics_summary = {
        "total_reports": ga_total,
        "avg_score": ga_avg,
        "latest_score": ga_latest,
        "unique_standards_analyzed": ga_unique_stds,
        "total_evidence": total_evidence_all,
        "growth_percent": growth_pct,
        "growth_direction": "up" if growth_pct > 2 else ("down" if growth_pct < -2 else "stable"),
        "top_standard": {"name": top_std, "score": std_avgs.get(top_std)} if top_std else None,
        "bottom_standard": {"name": bottom_std, "score": std_avgs.get(bottom_std)} if bottom_std else None,
    }

    resolved_identity = user_identity or {}
    if not resolved_identity:
        try:
            user_obj = await db.user.find_unique(where={"id": user_id})
            if user_obj:
                resolved_identity = {
                    "name": getattr(user_obj, "name", "User"),
                    "email": getattr(user_obj, "email", ""),
                    "role": str(getattr(user_obj, "role", "USER")),
                }
        except Exception:
            resolved_identity = {"name": "User", "email": "", "role": "USER"}

    return {
        "user": resolved_identity,
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
        "analytics": analytics_summary,
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
