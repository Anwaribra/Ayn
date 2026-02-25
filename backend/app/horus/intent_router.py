"""
Horus Intent Router

Lightweight pattern-matching layer that sits in front of the streaming pipeline.
If the user's message matches a known compliance action, we return an intent string.
If not, we return None and the normal AI streaming path runs unchanged.
"""

import re
from typing import Optional

# ─── Intent Definitions ─────────────────────────────────────────────────────────

# Pattern → intent name
INTENT_PATTERNS: list[tuple[re.Pattern, str]] = [
    (
        re.compile(
            r"\b(run\s+(full\s+)?audit|start\s+audit|do\s+(a\s+)?full\s+audit|audit\s+report|full\s+compliance\s+audit)\b",
            re.IGNORECASE,
        ),
        "run_full_audit",
    ),
    (
        re.compile(
            r"\b(check\s+(compliance\s+)?gaps?|show\s+(me\s+)?(the\s+)?gaps?|compliance\s+gaps?|gap\s+analysis|list\s+gaps?|what\s+are\s+(the\s+)?gaps?)\b",
            re.IGNORECASE,
        ),
        "check_compliance_gaps",
    ),
    (
        re.compile(
            r"\b(generate\s+(remediation|remediation\s+report|action\s+plan|remediation\s+plan)|remediation\s+report|create\s+remediation|show\s+remediation|remediation\s+actions?)\b",
            re.IGNORECASE,
        ),
        "generate_remediation_report",
    ),
]


def detect_intent(message: str) -> Optional[str]:
    """
    Detect whether the user's message maps to a known compliance agent action.

    Returns the intent string (e.g. "run_full_audit") or None for free-text.
    Detection is case-insensitive and matches common natural language variations.
    """
    if not message or len(message.strip()) < 3:
        return None

    for pattern, intent in INTENT_PATTERNS:
        if pattern.search(message):
            return intent

    return None
