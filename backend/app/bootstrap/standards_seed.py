"""Startup seeding for built-in standards."""

from __future__ import annotations

import logging

from app.core.db import get_db
from app.standards.builtin_standards import BUILT_IN_STANDARDS

logger = logging.getLogger(__name__)


def _is_placeholder(desc: str) -> bool:
    """Detect auto-generated placeholder criterion descriptions."""
    low = desc.lower()
    return (
        low.startswith("requirement for ")
        or "criterion " in low
        or "advancedcriterion" in low.replace(" ", "")
        or "moeuaecriterion" in low.replace(" ", "")
        or "qaaukexpectation" in low.replace(" ", "")
    )


async def seed_missing_standards() -> None:
    """Ensure all built-in public standards exist in the database (idempotent)."""
    try:
        db = get_db()
        for std in BUILT_IN_STANDARDS:
            existing = await db.standard.find_unique(
                where={"id": std["id"]},
                include={"criteria": True},
            )
            if not existing:
                logger.info("Seeding missing standard: %s", std["id"])
                created = await db.standard.create(
                    data={
                        "id": std["id"],
                        "title": std["title"],
                        "code": std["code"],
                        "category": std["category"],
                        "description": std["description"],
                        "region": std["region"],
                        "icon": std["icon"],
                        "color": std["color"],
                        "estimatedSetup": std["estimatedSetup"],
                        "isPublic": True,
                    }
                )
                for title, description in std["criteria"]:
                    await db.criterion.create(
                        data={"standardId": created.id, "title": title, "description": description}
                    )
                logger.info("Seeded standard %s with %d criteria", std["id"], len(std["criteria"]))
            else:
                existing_criteria = existing.criteria or []
                has_placeholders = any(_is_placeholder(c.description or "") for c in existing_criteria)
                if has_placeholders:
                    logger.info("Replacing placeholder criteria for standard: %s", std["id"])
                    await db.criterion.delete_many(where={"standardId": existing.id})
                    for title, description in std["criteria"]:
                        await db.criterion.create(
                            data={"standardId": existing.id, "title": title, "description": description}
                        )
                    logger.info("Updated %d criteria for %s", len(std["criteria"]), std["id"])
    except Exception as exc:
        logger.warning("Standard seeding skipped due to error: %s", exc)
