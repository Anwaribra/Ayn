"""Criteria coverage helpers for dashboard and analytics (distinct criteria, not raw link rows)."""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


async def count_distinct_criteria_with_evidence(
    db: Any,
    evidence_where: Optional[Dict[str, Any]] = None,
) -> int:
    """
    Unique criteria that have at least one EvidenceCriterion row whose parent evidence
    matches `evidence_where`. When `evidence_where` is None, counts across all links.
    """
    try:
        if evidence_where:
            rows = await db.evidencecriterion.find_many(
                where={"evidence": evidence_where},
                distinct=["criterionId"],
            )
        else:
            rows = await db.evidencecriterion.find_many(distinct=["criterionId"])
        return len(rows)
    except Exception as e:
        logger.warning("distinct criterion count failed, falling back to row count: %s", e)
        if evidence_where:
            return await db.evidencecriterion.count(where={"evidence": evidence_where})
        return await db.evidencecriterion.count()


def institution_evidence_visibility_filter(
    institution_id: str,
    user_id: str,
    member_user_ids: List[str],
) -> Dict[str, Any]:
    """
    Evidence visible to an institution: explicit ownerId OR uploaded by a user in the org.
    Always includes `user_id` so solo members still match their uploads.
    """
    uid_set = set(member_user_ids) | {user_id}
    or_clause: List[Dict[str, Any]] = [{"ownerId": institution_id}]
    if uid_set:
        or_clause.append({"uploadedById": {"in": list(uid_set)}})
    return {"OR": or_clause}
