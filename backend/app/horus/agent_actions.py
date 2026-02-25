"""
Horus Agent Actions

Each function is a named compliance agent action that fetches real data
from the database and returns a structured AgentResult dict.

The AgentResult is serialized to JSON and prefixed with __ACTION_RESULT__:
in the streaming response so the frontend can render a typed card component
instead of plain markdown text.

Decision notes:
- run_full_audit: Shows cached GapAnalysis reports + CriteriaMapping summary.
  Does NOT auto-trigger a new analysis. Shows a "Run New Analysis" CTA if no data.
- generate_remediation_report: Uses Gemini AI to produce one concise actionable
  sentence per gap (not just the raw description).
- check_compliance_gaps: Uses CriteriaMapping table for per-criterion status.
"""

import json
import logging
from typing import Any, Optional
from app.ai.service import get_gemini_client

logger = logging.getLogger(__name__)


# ─── Result Types (typed dicts as plain dicts for JSON serialization) ─────────

def _audit_report_result(
    overall_score: float,
    total_criteria: int,
    passed: list[dict],
    failed: list[dict],
    recommendations: list[str],
    has_data: bool,
    report_ids: list[str],
) -> dict:
    return {
        "type": "audit_report",
        "payload": {
            "overall_score": overall_score,
            "total_criteria": total_criteria,
            "passed": passed,       # [{"title": str, "standard": str}]
            "failed": failed,       # [{"title": str, "standard": str}]
            "recommendations": recommendations,
            "has_data": has_data,
            "report_ids": report_ids,
        },
    }


def _gap_table_result(rows: list[dict]) -> dict:
    return {
        "type": "gap_table",
        "payload": {
            "rows": rows,  # [{"criterion": str, "standard": str, "status": str, "evidence_found": bool, "action_required": str}]
        },
    }


def _remediation_plan_result(rows: list[dict]) -> dict:
    return {
        "type": "remediation_plan",
        "payload": {
            "rows": rows,  # [{"gap": str, "standard": str, "clause": str, "priority": str, "recommended_action": str, "deadline": str}]
        },
    }


# ─── Action: Run Full Audit ─────────────────────────────────────────────────

async def run_full_audit(user_id: str, institution_id: Optional[str], db: Any) -> dict:
    """
    Aggregate audit data from GapAnalysis reports + CriteriaMapping.
    Returns an AuditReportCard payload.
    """
    if not institution_id:
        return _audit_report_result(
            overall_score=0, total_criteria=0,
            passed=[], failed=[], recommendations=[],
            has_data=False, report_ids=[]
        )

    try:
        # 1. Load latest completed GapAnalysis reports
        reports = await db.gapanalysis.find_many(
            where={"institutionId": institution_id, "status": "completed", "archived": False},
            order={"createdAt": "desc"},
            include={"standard": True},
            take=5,
        )

        if not reports:
            return _audit_report_result(
                overall_score=0, total_criteria=0,
                passed=[], failed=[], recommendations=[],
                has_data=False, report_ids=[]
            )

        # 2. Aggregate scores across all reports
        scores = [r.overallScore for r in reports]
        overall_score = round(sum(scores) / len(scores), 1)
        report_ids = [r.id for r in reports]

        # 3. Load CriteriaMapping for passed/failed breakdown
        mappings = await db.criteriamapping.find_many(
            where={"institutionId": institution_id},
            include={"criterion": {"include": {"standard": True}}},
        )

        passed = []
        failed = []
        for m in mappings:
            if not m.criterion:
                continue
            standard_title = m.criterion.standard.title if m.criterion.standard else "Unknown"
            entry = {"title": m.criterion.title, "standard": standard_title}
            if m.status == "met":
                passed.append(entry)
            else:
                failed.append(entry)

        # 4. Aggregate recommendations from all reports
        recommendations: list[str] = []
        for r in reports:
            try:
                recs = json.loads(r.recommendationsJson) if r.recommendationsJson else []
                for rec in recs[:3]:
                    if isinstance(rec, str):
                        recommendations.append(rec)
                    elif isinstance(rec, dict):
                        recommendations.append(rec.get("text") or rec.get("recommendation") or str(rec))
            except Exception:
                pass

        # Deduplicate + cap at 6 recommendations
        seen: set[str] = set()
        unique_recs: list[str] = []
        for rec in recommendations:
            key = rec[:80]
            if key not in seen:
                seen.add(key)
                unique_recs.append(rec)
            if len(unique_recs) >= 6:
                break

        return _audit_report_result(
            overall_score=overall_score,
            total_criteria=len(mappings),
            passed=passed,
            failed=failed,
            recommendations=unique_recs,
            has_data=True,
            report_ids=report_ids,
        )

    except Exception as e:
        logger.error(f"run_full_audit failed: {e}", exc_info=True)
        return _audit_report_result(
            overall_score=0, total_criteria=0,
            passed=[], failed=[], recommendations=[],
            has_data=False, report_ids=[]
        )


# ─── Action: Check Compliance Gaps ──────────────────────────────────────────

async def check_compliance_gaps(user_id: str, institution_id: Optional[str], db: Any) -> dict:
    """
    Returns a gap table from the CriteriaMapping table.
    Each row: criterion title, standard, status (gap/met), evidence found, action required.
    """
    if not institution_id:
        return _gap_table_result([])

    try:
        mappings = await db.criteriamapping.find_many(
            where={"institutionId": institution_id},
            include={
                "criterion": {"include": {"standard": True}},
                "evidence": True,
            },
            order={"status": "asc"},  # gaps first (alphabetically "gap" < "met")
        )

        rows = []
        for m in mappings:
            if not m.criterion:
                continue

            standard_title = m.criterion.standard.title if m.criterion.standard else "Unknown"
            evidence_found = m.evidence is not None

            # Determine action required based on status and AI reasoning
            if m.status == "met":
                action = "No action required — criterion satisfied."
            else:
                action = "Upload supporting evidence or policy document."
                if m.aiReasoning:
                    # Extract a short actionable hint from the reasoning
                    lines = [l.strip() for l in m.aiReasoning.split(".") if l.strip()]
                    if lines:
                        action = lines[0][:120]

            rows.append({
                "criterion": m.criterion.title,
                "standard": standard_title,
                "status": m.status,           # "gap" | "met"
                "evidence_found": evidence_found,
                "action_required": action,
            })

        return _gap_table_result(rows)

    except Exception as e:
        logger.error(f"check_compliance_gaps failed: {e}", exc_info=True)
        return _gap_table_result([])


# ─── Action: Generate Remediation Report ────────────────────────────────────

async def generate_remediation_report(user_id: str, institution_id: Optional[str], db: Any) -> dict:
    """
    Reads PlatformGap records for the user, then uses Gemini AI to generate
    one concise actionable recommendation sentence per gap.
    Returns a RemediationPlanCard payload.
    """
    try:
        gaps = await db.platformgap.find_many(
            where={"userId": user_id, "status": {"not": "closed"}},
            order=[{"severity": "desc"}, {"createdAt": "desc"}],
            take=20,
        )

        if not gaps:
            return _remediation_plan_result([])

        # Generate AI recommendations in a single batch call
        client = get_gemini_client()
        rows: list[dict] = []

        gap_list_text = "\n".join(
            f"{i+1}. Standard: {g.standard} | Clause: {g.clause} | Gap: {g.description} | Severity: {g.severity}"
            for i, g in enumerate(gaps)
        )

        prompt = f"""You are a compliance remediation specialist for educational institutions.

Below is a list of compliance gaps. For EACH gap, write exactly ONE concise actionable sentence 
(max 20 words) that tells the institution what specific action to take immediately.

Be direct and prescriptive. Do NOT repeat the gap description. 
Start each with an action verb (e.g. "Develop", "Implement", "Assign", "Document", "Create").

Output ONLY a numbered list matching the input exactly:
1. [action sentence]
2. [action sentence]
...

Gaps:
{gap_list_text}
"""

        try:
            raw_response = await client.generate_text(prompt=prompt)
            # Parse numbered list from response
            import re
            lines = raw_response.strip().split("\n")
            actions: list[str] = []
            for line in lines:
                match = re.match(r"^\d+\.\s*(.+)", line.strip())
                if match:
                    actions.append(match.group(1).strip())
        except Exception as ai_err:
            logger.error(f"AI recommendation generation failed: {ai_err}")
            actions = []

        # Map priority from severity
        priority_map = {
            "critical": "🔴 Critical",
            "high": "🟠 High",
            "medium": "🟡 Medium",
            "low": "🟢 Low",
        }

        # Deadline heuristic: critical=1 week, high=2 weeks, medium=1 month, low=3 months
        deadline_map = {
            "critical": "Within 1 week",
            "high": "Within 2 weeks",
            "medium": "Within 1 month",
            "low": "Within 3 months",
        }

        for i, g in enumerate(gaps):
            severity_key = (g.severity or "medium").lower()
            action = actions[i] if i < len(actions) else f"Address the {g.clause} requirement for {g.standard}."
            rows.append({
                "gap": g.description[:100],
                "standard": g.standard,
                "clause": g.clause,
                "priority": priority_map.get(severity_key, "🟡 Medium"),
                "recommended_action": action,
                "deadline": deadline_map.get(severity_key, "Within 1 month"),
            })

        return _remediation_plan_result(rows)

    except Exception as e:
        logger.error(f"generate_remediation_report failed: {e}", exc_info=True)
        return _remediation_plan_result([])


# ─── Registry ────────────────────────────────────────────────────────────────

ACTION_REGISTRY: dict[str, Any] = {
    "run_full_audit": run_full_audit,
    "check_compliance_gaps": check_compliance_gaps,
    "generate_remediation_report": generate_remediation_report,
}
