"""Horus API — stateless, read-only intelligence over accreditation data."""

import logging
from datetime import datetime, timezone
from typing import Any, Optional, List
from uuid import uuid4
from pydantic import BaseModel, Field
import json
import asyncio
from fastapi import APIRouter, Depends, Query, HTTPException, File, UploadFile, Form, BackgroundTasks
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

from app.auth.dependencies import get_current_user
from app.core.db import get_db, Prisma
router = APIRouter(prefix="/horus", tags=["horus"])

HORUS_READ_ONLY_ATTACHMENT_LIMIT_BYTES = 10 * 1024 * 1024
LOW_CONFIDENCE_THRESHOLD = 0.5
CRITICAL_CRITERION_TERMS = (
    "policy",
    "procedure",
    "risk",
    "governance",
    "leadership",
    "assessment",
    "safety",
    "security",
    "complaint",
    "corrective",
)


async def _buffer_upload_files(files: List[UploadFile] | None, user_id: str = "__anonymous__") -> list[dict]:
    """Read UploadFile objects into request-local descriptors without persistence."""
    buffered: list[dict] = []
    if not files:
        return buffered

    for upload in files:
        body = await upload.read()
        if len(body) > HORUS_READ_ONLY_ATTACHMENT_LIMIT_BYTES:
            raise HTTPException(status_code=413, detail="Attachment too large for read-only Horus.")
        buffered.append(
            {
                "filename": upload.filename or "file",
                "content_type": upload.content_type or "application/octet-stream",
                "size": len(body),
            }
        )
    return buffered


class Observation(BaseModel):
    """A response from Horus."""
    content: str
    chat_id: str
    timestamp: datetime
    state_hash: str
    structured: Optional[dict] = None
    suggested_actions: List[dict] = []


class GoalUpdateRequest(BaseModel):
    goal: str
    chat_id: Optional[str] = None


class GoalResponse(BaseModel):
    chat_id: str
    goal: Optional[str] = None
    goal_updated_at: Optional[datetime] = None


class TranscriptionResponse(BaseModel):
    text: str


class AnalyticsExplainRequest(BaseModel):
    analytics: dict[str, Any] = Field(default_factory=dict)
    horus: dict[str, Any] = Field(default_factory=dict)


class AnalyticsExplainResponse(BaseModel):
    summary: list[str]
    topProblems: list[str]
    impact: str
    recommendedPlan: list[str]
    links: list[dict[str, str]]
    confidence: str


def get_user_id(current_user):
    """Safely extract user_id from current_user."""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if isinstance(current_user, dict):
        return current_user.get("id")
    if hasattr(current_user, 'id'):
        return current_user.id
    raise HTTPException(status_code=401, detail="Invalid user format")


def _institution_id(current_user: Any) -> str | None:
    if isinstance(current_user, dict):
        return current_user.get("institutionId")
    return getattr(current_user, "institutionId", None)


def _empty_snapshot() -> dict[str, Any]:
    return {
        "institution_id": None,
        "counts": {
            "evidence": 0,
            "reports": 0,
            "mappings": 0,
            "gaps": 0,
            "met": 0,
            "unmapped_evidence": 0,
            "criteria": 0,
        },
        "evidence": [],
        "reports": [],
        "gaps": [],
        "mappings": [],
        "criteria": [],
        "analysis": {
            "gap_breakdown": {"total": 0, "without_evidence": 0, "low_confidence": 0},
            "coverage": {"covered": 0, "total": 0, "percent": 0.0, "uncovered": []},
            "risk_signals": {"high_severity": [], "missing_critical_evidence": []},
            "progress": None,
            "confidence": "Low",
        },
    }


async def _build_read_only_snapshot(db: Prisma, current_user: Any) -> dict[str, Any]:
    _ = get_user_id(current_user)
    institution_id = _institution_id(current_user)
    if not institution_id:
        return _empty_snapshot()

    evidence_scope = {"ownerId": institution_id}
    report_scope = {"institutionId": institution_id}

    evidence, reports, mappings, institution_standards = await asyncio.gather(
        db.evidence.find_many(
            where=evidence_scope,
            order={"createdAt": "desc"},
            take=25,
        ),
        db.gapanalysis.find_many(
            where={**report_scope, "archived": False},
            include={"standard": True},
            order={"createdAt": "desc"},
            take=10,
        ),
        db.criteriamapping.find_many(
            where=report_scope,
            include={"criterion": {"include": {"standard": True}}},
            order={"createdAt": "desc"},
            take=100,
        ),
        db.institutionstandard.find_many(
            where={"institutionId": institution_id},
            include={"standard": {"include": {"criteria": True}}},
            order={"createdAt": "desc"},
        ),
    )

    mapped_evidence_ids = {m.evidenceId for m in mappings if getattr(m, "evidenceId", None)}
    evidence_by_id = {e.id: e for e in evidence}
    gaps = [m for m in mappings if (getattr(m, "status", "") or "").lower() != "met"]
    met = [m for m in mappings if (getattr(m, "status", "") or "").lower() == "met"]
    criteria = [
        criterion
        for link in institution_standards
        if getattr(link, "standard", None)
        for criterion in (getattr(link.standard, "criteria", None) or [])
    ]
    mapped_criterion_ids = {m.criterionId for m in mappings}
    covered_criterion_ids = {m.criterionId for m in mappings if getattr(m, "evidenceId", None)}
    uncovered_criteria = [
        criterion
        for criterion in criteria
        if criterion.id not in covered_criterion_ids
    ]
    low_confidence_mappings = [
        m for m in mappings if float(getattr(m, "confidenceScore", 0.0) or 0.0) < LOW_CONFIDENCE_THRESHOLD
    ]
    gaps_without_evidence = [m for m in gaps if not getattr(m, "evidenceId", None)]
    missing_critical = [
        criterion
        for criterion in uncovered_criteria
        if any(term in ((criterion.title or "") + " " + (criterion.description or "")).lower() for term in CRITICAL_CRITERION_TERMS)
    ]

    serialized_reports = [
        {
            "id": r.id,
            "standard_id": r.standardId,
            "standard": r.standard.title if getattr(r, "standard", None) else "Unknown standard",
            "score": r.overallScore,
            "status": r.status,
            "summary": r.summary,
            "created_at": r.createdAt.isoformat() if r.createdAt else None,
            "high_severity_gaps": _high_severity_from_report(r),
        }
        for r in reports
    ]
    latest_score = serialized_reports[0]["score"] if serialized_reports else None
    previous_score = serialized_reports[1]["score"] if len(serialized_reports) > 1 else None
    progress = None
    if latest_score is not None and previous_score is not None:
        progress = {
            "latest_report_id": serialized_reports[0]["id"],
            "previous_report_id": serialized_reports[1]["id"],
            "latest_score": latest_score,
            "previous_score": previous_score,
            "delta": round(float(latest_score) - float(previous_score), 1),
        }
    total_criteria = len(criteria)
    coverage_percent = round((len(covered_criterion_ids) / total_criteria) * 100, 1) if total_criteria else 0.0
    confidence = _confidence_level(
        evidence_count=len(evidence),
        mapping_count=len(mappings),
        total_criteria=total_criteria,
        report_count=len(reports),
    )

    snapshot = {
        "institution_id": institution_id,
        "counts": {
            "evidence": len(evidence),
            "reports": len(reports),
            "mappings": len(mappings),
            "gaps": len(gaps),
            "met": len(met),
            "unmapped_evidence": len([e for e in evidence if e.id not in mapped_evidence_ids]),
            "criteria": total_criteria,
        },
        "evidence": [
            {
                "id": e.id,
                "title": e.title or e.originalFilename or "Untitled evidence",
                "filename": e.originalFilename,
                "document_type": e.documentType,
                "status": e.status,
                "summary": e.summary,
                "created_at": e.createdAt.isoformat() if e.createdAt else None,
            }
            for e in evidence
        ],
        "reports": serialized_reports,
        "mappings": [
            {
                "id": m.id,
                "criterion_id": m.criterionId,
                "evidence_id": m.evidenceId,
                "standard_id": m.standardId,
                "status": m.status,
                "confidence": m.confidenceScore,
            }
            for m in mappings
        ],
        "criteria": [
            {
                "id": criterion.id,
                "standard_id": criterion.standardId,
                "title": criterion.title,
                "mapped": criterion.id in mapped_criterion_ids,
                "covered": criterion.id in covered_criterion_ids,
            }
            for criterion in criteria
        ],
        "gaps": [
            {
                "mapping_id": m.id,
                "criterion": m.criterion.title if getattr(m, "criterion", None) else "Unknown criterion",
                "criterion_id": m.criterionId,
                "evidence_id": m.evidenceId,
                "standard_id": m.standardId,
                "standard": (
                    m.criterion.standard.title
                    if getattr(m, "criterion", None) and getattr(m.criterion, "standard", None)
                    else "Unknown standard"
                ),
                "status": m.status,
                "confidence": m.confidenceScore,
                "reasoning": m.aiReasoning,
                "evidence": (
                    evidence_by_id[m.evidenceId].title or evidence_by_id[m.evidenceId].originalFilename
                    if getattr(m, "evidenceId", None) in evidence_by_id
                    else None
                ),
            }
            for m in gaps[:30]
        ],
        "analysis": {
            "gap_breakdown": {
                "total": len(gaps),
                "without_evidence": len(gaps_without_evidence),
                "low_confidence": len([m for m in gaps if m in low_confidence_mappings]),
                "low_confidence_threshold": LOW_CONFIDENCE_THRESHOLD,
            },
            "coverage": {
                "covered": len(covered_criterion_ids),
                "mapped": len(mapped_criterion_ids),
                "total": total_criteria,
                "percent": coverage_percent,
                "uncovered": [
                    {
                        "criterion_id": criterion.id,
                        "standard_id": criterion.standardId,
                        "title": criterion.title,
                    }
                    for criterion in uncovered_criteria[:20]
                ],
            },
            "risk_signals": {
                "high_severity": [
                    {**gap, "report_id": report["id"]}
                    for report in serialized_reports
                    for gap in report["high_severity_gaps"]
                ][:10],
                "missing_critical_evidence": [
                    {
                        "criterion_id": criterion.id,
                        "standard_id": criterion.standardId,
                        "title": criterion.title,
                    }
                    for criterion in missing_critical[:10]
                ],
            },
            "progress": progress,
            "confidence": confidence,
        },
    }
    return snapshot


def _high_severity_from_report(report: Any) -> list[dict[str, Any]]:
    try:
        raw_gaps = json.loads(report.gapsJson or "[]")
    except (TypeError, json.JSONDecodeError):
        return []
    if not isinstance(raw_gaps, list):
        return []
    high = []
    for item in raw_gaps:
        if not isinstance(item, dict):
            continue
        severity = str(item.get("severity") or item.get("priority") or item.get("risk") or "").lower()
        if severity not in {"high", "critical", "severe"}:
            continue
        high.append(
            {
                "title": str(item.get("title") or item.get("criterion") or item.get("description") or "High severity gap")[:160],
                "severity": severity,
                "criterion_id": item.get("criterionId") or item.get("criterion_id"),
                "mapping_id": item.get("mappingId") or item.get("mapping_id"),
                "evidence_id": item.get("evidenceId") or item.get("evidence_id"),
            }
        )
    return high


def _confidence_level(evidence_count: int, mapping_count: int, total_criteria: int, report_count: int) -> str:
    if evidence_count > 0 and mapping_count > 0 and total_criteria > 0 and report_count > 0:
        return "High"
    if evidence_count > 0 and (mapping_count > 0 or total_criteria > 0):
        return "Medium"
    return "Low"


def _infer_missing_evidence_label(criterion: str) -> str:
    text = criterion.lower()
    if any(token in text for token in ("policy", "procedure", "governance")):
        return "approved policy or procedure document"
    if any(token in text for token in ("training", "competenc", "staff", "faculty")):
        return "training records or competency evidence"
    if any(token in text for token in ("assessment", "evaluation", "measure", "kpi", "performance")):
        return "assessment results, KPI records, or evaluation evidence"
    if any(token in text for token in ("meeting", "committee", "review")):
        return "meeting minutes, review records, or committee evidence"
    if any(token in text for token in ("student", "learner", "beneficiar")):
        return "student or learner support records"
    return "direct documentary evidence for the criterion"


def _intent(message: str) -> str:
    text = message.lower()
    if any(token in text for token in ("next", "do now", "start", "workflow", "what should")):
        return "next_step"
    if any(token in text for token in ("why", "reason", "because", "here")):
        return "explain_gap"
    if any(token in text for token in ("missing", "evidence", "upload", "document")):
        return "missing_evidence"
    if any(token in text for token in ("gap", "gaps", "criteria", "criterion")):
        return "gaps"
    return "summary"


def _direct_answer(intent: str, snapshot: dict[str, Any]) -> str:
    counts = snapshot["counts"]
    analysis = snapshot["analysis"]
    gap_breakdown = analysis["gap_breakdown"]
    coverage = analysis["coverage"]
    progress = analysis["progress"]
    if not snapshot["institution_id"]:
        return "No institution-scoped accreditation data is available for this session. Horus cannot answer without tenant-scoped records."
    if counts["evidence"] == 0 and counts["mappings"] == 0 and counts["reports"] == 0:
        return "No evidence, mappings, gaps, or reports are available yet. Upload evidence or run mapping before relying on Horus analysis."
    if intent == "next_step":
        if counts["evidence"] == 0:
            return "Your next step is evidence upload. No institution-scoped evidence records are available."
        if counts["mappings"] == 0:
            return "Your next step is mapping review. Evidence exists, but no mappings connect it to criteria."
        if counts["gaps"] > 0:
            return f"Your next step is gap review. You have {counts['gaps']} open gap(s), including {gap_breakdown['without_evidence']} with no linked evidence."
        if counts["reports"] == 0:
            return "Your next step is report generation. Mappings exist, but no report snapshot is available."
        return "Your next step is remediation tracking from the latest report. Current mappings show no open gaps in the scoped snapshot."
    if intent == "explain_gap":
        return f"You have {counts['gaps']} gap(s) because mapped criteria are not marked met. {gap_breakdown['without_evidence']} gap(s) have no linked evidence."
    if intent == "missing_evidence":
        return f"You have {coverage['total'] - coverage['covered']} uncovered criterion/criteria. Coverage is {coverage['percent']:.1f}% across {coverage['total']} linked criteria."
    if intent == "gaps":
        return f"You have {counts['gaps']} open gap(s) across {counts['mappings']} mapping(s). {gap_breakdown['low_confidence']} gap mapping(s) are below confidence {LOW_CONFIDENCE_THRESHOLD}."
    if progress:
        direction = "improved" if progress["delta"] > 0 else ("declined" if progress["delta"] < 0 else "held steady")
        return f"Your latest report score {direction} by {abs(progress['delta']):.1f} points. The current scoped snapshot contains {counts['gaps']} open gap(s)."
    return f"Your scoped accreditation snapshot has {counts['evidence']} evidence item(s), {counts['mappings']} mapping(s), {counts['gaps']} gap(s), and {counts['reports']} report(s)."


def _supporting_facts(snapshot: dict[str, Any]) -> list[str]:
    counts = snapshot["counts"]
    analysis = snapshot["analysis"]
    gap_breakdown = analysis["gap_breakdown"]
    coverage = analysis["coverage"]
    risk = analysis["risk_signals"]
    reports = snapshot["reports"]
    mappings = snapshot["mappings"]
    evidence = snapshot["evidence"]
    gaps = snapshot["gaps"]
    facts = [
        f"{counts['evidence']} evidence record(s), {counts['criteria']} linked criterion/criteria, {counts['mappings']} mapping record(s), {counts['reports']} report record(s).",
        f"{gap_breakdown['total']} total gap(s); {gap_breakdown['without_evidence']} gap(s) have no evidenceId; {gap_breakdown['low_confidence']} gap(s) have confidence below {LOW_CONFIDENCE_THRESHOLD}.",
        f"Evidence coverage is {coverage['percent']:.1f}%: {coverage['covered']} covered criterion/criteria out of {coverage['total']}.",
    ]
    if reports:
        facts.append("Latest report trace: reportId `" + reports[0]["id"] + "`.")
    else:
        facts.append("No reportId found in the current institution-scoped report set.")
    if evidence:
        facts.append("Recent evidence trace: evidenceId `" + evidence[0]["id"] + "`.")
    else:
        facts.append("No evidenceId found for the current institution.")
    if mappings:
        facts.append("Recent mapping trace: mappingId `" + mappings[0]["id"] + "`, criterionId `" + mappings[0]["criterion_id"] + "`.")
    else:
        facts.append("No mappingId found for the current institution.")
    if gaps:
        gap = gaps[0]
        evidence_ref = f", evidenceId `{gap['evidence_id']}`" if gap.get("evidence_id") else ", no evidenceId"
        facts.append(f"Top gap trace: mappingId `{gap['mapping_id']}`, criterionId `{gap['criterion_id']}`{evidence_ref}.")
    else:
        facts.append("No open gap mappingId found in the current snapshot.")
    if coverage["uncovered"]:
        uncovered = ", ".join(f"`{item['criterion_id']}`" for item in coverage["uncovered"][:5])
        facts.append(f"Uncovered criterionId values: {uncovered}.")
    if risk["high_severity"]:
        high = risk["high_severity"][0]
        trace = [f"reportId `{high['report_id']}`"]
        if high.get("criterion_id"):
            trace.append(f"criterionId `{high['criterion_id']}`")
        if high.get("mapping_id"):
            trace.append(f"mappingId `{high['mapping_id']}`")
        if high.get("evidence_id"):
            trace.append(f"evidenceId `{high['evidence_id']}`")
        facts.append(f"High-severity signal found: {high['title']}. Trace: {', '.join(trace)}.")
    if risk["missing_critical_evidence"]:
        missing = ", ".join(f"`{item['criterion_id']}`" for item in risk["missing_critical_evidence"][:5])
        facts.append(f"Missing critical evidence signal for criterionId values: {missing}.")
    progress = analysis["progress"]
    if progress:
        facts.append(
            f"Progress trace: reportId `{progress['previous_report_id']}` score {progress['previous_score']:.1f} -> "
            f"reportId `{progress['latest_report_id']}` score {progress['latest_score']:.1f}; delta {progress['delta']:+.1f}."
        )
    return facts


def _why_this_matters(snapshot: dict[str, Any]) -> str:
    counts = snapshot["counts"]
    analysis = snapshot["analysis"]
    coverage = analysis["coverage"]
    risk = analysis["risk_signals"]
    if not snapshot["institution_id"]:
        return "Tenant isolation prevents Horus from using global or unscoped records. This protects institutional data boundaries."
    if counts["mappings"] == 0:
        return "Without mappings, auditors cannot trace evidence to criteria. Accreditation readiness cannot be defended from the system record."
    if counts["gaps"] > 0:
        return f"Open gaps create audit exposure because criteria remain unsupported or weakly supported. Current evidence coverage is {coverage['percent']:.1f}%."
    if risk["missing_critical_evidence"]:
        return "Critical criteria without evidence increase audit risk even if other mappings are complete."
    return "The current record is more defensible because scoped mappings and reports provide traceable audit evidence."


def _recommended_actions(snapshot: dict[str, Any]) -> list[str]:
    counts = snapshot["counts"]
    analysis = snapshot["analysis"]
    coverage = analysis["coverage"]
    gaps = snapshot["gaps"]
    actions: list[str] = []
    if not snapshot["institution_id"]:
        return ["Sign in through an institution-scoped session.", "Upload evidence after tenant context is available.", "Run mapping only from the core workflow."]
    if counts["evidence"] == 0:
        return ["Upload institution evidence.", "Select the relevant accreditation standard.", "Run mapping review after upload."]
    if counts["mappings"] == 0:
        return ["Run mapping review for uploaded evidence.", "Approve or reject mapping suggestions in the core Mapping screen.", "Generate gaps after mappings exist."]
    for gap in gaps:
        if len(actions) >= 3:
            break
        if not gap.get("evidence_id"):
            actions.append(f"Upload {_infer_missing_evidence_label(gap['criterion'])} for criterionId `{gap['criterion_id']}`.")
        elif float(gap.get("confidence") or 0.0) < LOW_CONFIDENCE_THRESHOLD:
            actions.append(f"Review low-confidence mappingId `{gap['mapping_id']}` for criterionId `{gap['criterion_id']}`.")
    if len(actions) < 3 and coverage["uncovered"]:
        for item in coverage["uncovered"]:
            if len(actions) >= 3:
                break
            actions.append(f"Upload evidence for uncovered criterionId `{item['criterion_id']}`.")
    if len(actions) < 3 and counts["reports"] == 0:
        actions.append("Generate a report snapshot from the core Report screen.")
    if not actions:
        actions.append("Use the latest report as the audit reference.")
        actions.append("Review remediation tasks linked to any remaining gaps.")
        actions.append("Keep evidence immutable and traceable.")
    return actions[:3]


def _follow_up_questions(snapshot: dict[str, Any]) -> list[str]:
    if not snapshot["institution_id"]:
        return ["What data is available after I sign in?", "What should I upload first?"]
    questions = ["What should I do next?"]
    if snapshot["counts"]["gaps"]:
        questions.append("Why is the top gap here?")
    if snapshot["analysis"]["coverage"]["uncovered"]:
        questions.append("What evidence is missing?")
    if snapshot["analysis"]["progress"]:
        questions.append("Did our report score improve?")
    return questions[:3]


def _analytics_key_insights(snapshot: dict[str, Any]) -> list[dict[str, Any]]:
    analysis = snapshot["analysis"]
    counts = snapshot["counts"]
    coverage = analysis["coverage"]
    gap_breakdown = analysis["gap_breakdown"]
    risk = analysis["risk_signals"]
    progress = analysis["progress"]
    insights: list[dict[str, Any]] = []

    if not snapshot["institution_id"]:
        return [
            {
                "id": "tenant-required",
                "severity": "critical",
                "title": "Institution context required",
                "description": "No institution-scoped records are available, so analytics intelligence is blocked by tenant isolation.",
                "metric": "0 scoped records",
                "actions": [{"label": "Go to evidence", "href": "/platform/evidence"}],
            }
        ]

    if risk["missing_critical_evidence"]:
        item = risk["missing_critical_evidence"][0]
        insights.append(
            {
                "id": "critical-evidence",
                "severity": "critical",
                "title": "Critical evidence is missing",
                "description": f"Criterion `{item['criterion_id']}` is uncovered and matches a critical audit term.",
                "metric": f"{len(risk['missing_critical_evidence'])} critical",
                "actions": [
                    {"label": "Show affected criteria", "href": "/platform/standards"},
                    {"label": "Go to evidence", "href": "/platform/evidence"},
                ],
            }
        )

    if gap_breakdown["without_evidence"] > 0:
        insights.append(
            {
                "id": "gaps-no-evidence",
                "severity": "warning" if gap_breakdown["without_evidence"] < 5 else "critical",
                "title": "Gaps are driven by missing evidence",
                "description": f"{gap_breakdown['without_evidence']} of {gap_breakdown['total']} gap(s) have no linked evidenceId.",
                "metric": f"{gap_breakdown['without_evidence']} missing evidence",
                "actions": [
                    {"label": "Show affected criteria", "href": "/platform/standards"},
                    {"label": "Go to evidence", "href": "/platform/evidence"},
                ],
            }
        )

    if gap_breakdown["low_confidence"] > 0:
        insights.append(
            {
                "id": "low-confidence",
                "severity": "warning",
                "title": "Weak mappings need review",
                "description": f"{gap_breakdown['low_confidence']} gap mapping(s) are below confidence {LOW_CONFIDENCE_THRESHOLD}.",
                "metric": f"{gap_breakdown['low_confidence']} weak mappings",
                "actions": [{"label": "Review mappings", "href": "/platform/standards"}],
            }
        )

    if coverage["total"] > 0 and coverage["percent"] < 70:
        insights.append(
            {
                "id": "coverage-risk",
                "severity": "warning",
                "title": "Coverage is below audit-ready range",
                "description": f"{coverage['covered']} of {coverage['total']} criteria are covered by evidence ({coverage['percent']:.1f}%).",
                "metric": f"{coverage['percent']:.1f}% coverage",
                "actions": [
                    {"label": "Show affected criteria", "href": "/platform/standards"},
                    {"label": "Go to evidence", "href": "/platform/evidence"},
                ],
            }
        )

    if progress:
        severity = "positive" if progress["delta"] > 0 else ("critical" if progress["delta"] < 0 else "info")
        direction = "improved" if progress["delta"] > 0 else ("declined" if progress["delta"] < 0 else "held steady")
        insights.append(
            {
                "id": "report-progress",
                "severity": severity,
                "title": "Readiness trend updated",
                "description": f"Latest report {direction} by {abs(progress['delta']):.1f} points from report `{progress['previous_report_id']}` to `{progress['latest_report_id']}`.",
                "metric": f"{progress['delta']:+.1f} pts",
                "actions": [{"label": "Review mappings", "href": "/platform/gap-analysis"}],
            }
        )

    if not insights:
        insights.append(
            {
                "id": "stable-record",
                "severity": "positive" if counts["reports"] else "info",
                "title": "No major analytics blocker detected",
                "description": f"Current scoped record has {counts['evidence']} evidence item(s), {counts['mappings']} mapping(s), and {counts['gaps']} open gap(s).",
                "metric": f"{counts['gaps']} gaps",
                "actions": [{"label": "Review mappings", "href": "/platform/gap-analysis"}],
            }
        )

    severity_rank = {"critical": 0, "warning": 1, "info": 2, "positive": 3}
    return sorted(insights, key=lambda item: severity_rank.get(item["severity"], 9))[:4]


def _analytics_card_insights(snapshot: dict[str, Any]) -> dict[str, str]:
    counts = snapshot["counts"]
    analysis = snapshot["analysis"]
    coverage = analysis["coverage"]
    gap_breakdown = analysis["gap_breakdown"]
    progress = analysis["progress"]
    report_count = counts["reports"]
    latest_report = snapshot["reports"][0] if snapshot["reports"] else None
    total_gaps = gap_breakdown["total"]
    return {
        "total-reports": (
            f"{report_count} report(s) are in scope."
            + (f" Latest reportId `{latest_report['id']}` scored {latest_report['score']:.1f}%." if latest_report else " No reportId found.")
        ),
        "avg-score": (
            f"Readiness is explained by {total_gaps} gap(s), {gap_breakdown['without_evidence']} missing-evidence gap(s), "
            f"and {gap_breakdown['low_confidence']} low-confidence gap mapping(s)."
        ),
        "growth": (
            f"Latest score changed {progress['delta']:+.1f} points between reportId `{progress['previous_report_id']}` and `{progress['latest_report_id']}`."
            if progress
            else "No progress delta is available because fewer than 2 report snapshots exist."
        ),
        "evidence": (
            f"{coverage['covered']} of {coverage['total']} criteria are covered ({coverage['percent']:.1f}%). "
            f"{len(coverage['uncovered'])} uncovered criterion record(s) are visible in this snapshot."
        ),
    }


def _analytics_summary(snapshot: dict[str, Any]) -> dict[str, Any]:
    counts = snapshot["counts"]
    analysis = snapshot["analysis"]
    coverage = analysis["coverage"]
    gap_breakdown = analysis["gap_breakdown"]
    direct = (
        f"Readiness is {coverage['percent']:.1f}% by evidence coverage with {gap_breakdown['total']} open gap(s)."
        if snapshot["institution_id"]
        else "No tenant-scoped analytics summary is available."
    )
    return {
        "directAnswer": direct,
        "topRisks": _analytics_key_insights(snapshot),
        "nextActions": _recommended_actions(snapshot),
        "cardInsights": _analytics_card_insights(snapshot),
        "confidence": analysis["confidence"],
        "counts": counts,
        "analysis": analysis,
    }


def _nested_number(source: dict[str, Any], path: list[str], default: float = 0.0) -> float:
    current: Any = source
    for key in path:
        if not isinstance(current, dict):
            return default
        current = current.get(key)
    try:
        return float(current if current is not None else default)
    except (TypeError, ValueError):
        return default


def _explain_analytics_payload(body: AnalyticsExplainRequest) -> AnalyticsExplainResponse:
    analytics = body.analytics or {}
    horus = body.horus or {}
    horus_analysis = horus.get("analysis") if isinstance(horus.get("analysis"), dict) else {}
    horus_counts = horus.get("counts") if isinstance(horus.get("counts"), dict) else {}

    coverage = _nested_number(horus_analysis, ["coverage", "percent"], _nested_number(analytics, ["alignmentPercentage"]))
    covered_criteria = int(_nested_number(horus_analysis, ["coverage", "covered"], _nested_number(analytics, ["alignedCriteria"])))
    total_criteria = int(_nested_number(horus_analysis, ["coverage", "total"], _nested_number(analytics, ["totalCriteria"])))
    total_gaps = int(_nested_number(horus_analysis, ["gap_breakdown", "total"], _nested_number(horus_counts, ["gaps"])))
    gaps_without_evidence = int(_nested_number(horus_analysis, ["gap_breakdown", "without_evidence"]))
    low_confidence = int(_nested_number(horus_analysis, ["gap_breakdown", "low_confidence"]))
    total_mappings = int(_nested_number(horus_counts, ["mappings"]))
    total_evidence = int(_nested_number(analytics, ["totalEvidence"], _nested_number(horus_counts, ["evidence"])))
    total_reports = int(_nested_number(analytics, ["totalReports"], _nested_number(horus_counts, ["reports"])))
    avg_score = _nested_number(analytics, ["avgScore"])
    growth = _nested_number(analytics, ["growth", "growthPercent"])
    confidence = str(horus.get("confidence") or _nested_number(horus_analysis, ["confidence"], 0) or "Medium")
    if confidence not in {"High", "Medium", "Low"}:
        confidence = "High" if total_reports and total_mappings and total_criteria else ("Medium" if total_evidence or total_mappings else "Low")

    summary = [
        f"Readiness is {coverage:.1f}% by criteria coverage, with {covered_criteria} of {total_criteria} criteria covered.",
        f"The page is based on {total_reports} report(s), {total_evidence} evidence record(s), and {total_mappings} mapping record(s).",
    ]
    if total_reports:
        summary.append(f"Average compliance score is {avg_score:.1f}% with {growth:+.1f}% period growth.")

    problems: list[tuple[int, str]] = []
    if gaps_without_evidence > 0:
        problems.append((0, f"{gaps_without_evidence} gap(s) have no linked evidence."))
    if low_confidence > 0:
        problems.append((1, f"{low_confidence} mapping(s) are below the confidence threshold."))
    uncovered = max(total_criteria - covered_criteria, 0)
    if uncovered > 0:
        problems.append((2, f"{uncovered} criteria have no evidence coverage."))
    if total_reports == 0:
        problems.append((3, "No report snapshot is available for this analytics period."))
    if coverage < 70 and total_criteria > 0:
        problems.append((4, f"Coverage is {coverage:.1f}%, below the 70% audit-readiness threshold."))
    if growth < 0:
        problems.append((5, f"Period growth is negative at {growth:.1f}%."))
    if not problems:
        problems.append((9, "No major analytics blocker is visible in the supplied page data."))
    top_problems = [problem for _, problem in sorted(problems, key=lambda item: item[0])[:3]]

    if total_gaps > 0 or uncovered > 0 or low_confidence > 0:
        impact = "These issues weaken accreditation defensibility because auditors need traceable evidence-to-criterion mappings, stable confidence, and report snapshots."
    elif total_reports == 0:
        impact = "Without a report snapshot, the institution cannot present a frozen readiness view for audit review."
    else:
        impact = "The current analytics state is more defensible because evidence, mappings, and reports are visible in the supplied page data."

    plan: list[str] = []
    if gaps_without_evidence > 0 or uncovered > 0:
        plan.append("Upload evidence for uncovered criteria.")
    if low_confidence > 0:
        plan.append("Review low-confidence mappings.")
    if total_reports == 0:
        plan.append("Generate a report snapshot after mapping review.")
    if not plan:
        plan = ["Review latest report findings.", "Keep evidence coverage current.", "Monitor mapping confidence before audit review."]

    links = [
        {"label": "Go fix this in Evidence", "href": "/platform/evidence"},
        {"label": "Review mappings", "href": "/platform/standards"},
        {"label": "Open reports", "href": "/platform/gap-analysis"},
    ]

    return AnalyticsExplainResponse(
        summary=summary[:3],
        topProblems=top_problems,
        impact=impact,
        recommendedPlan=plan[:3],
        links=links,
        confidence=confidence,
    )


def _format_read_only_response(message: str, snapshot: dict[str, Any], files: list[dict]) -> str:
    focus = (message or "").strip()
    intent = _intent(focus)
    facts = _supporting_facts(snapshot)
    actions = _recommended_actions(snapshot)
    follow_ups = _follow_up_questions(snapshot)

    lines = ["**Direct Answer**", _direct_answer(intent, snapshot)]
    if focus:
        lines += ["", f"Question: {focus}"]
    if files:
        lines += ["", f"Request-scoped attachments: {len(files)} received, 0 saved, 0 indexed."]
    lines += ["", "**Supporting Facts**"]
    lines.extend(f"- {fact}" for fact in facts)
    lines += ["", "**Why This Matters**", _why_this_matters(snapshot)]
    lines += ["", "**Recommended Next Actions**"]
    lines.extend(f"- {action}" for action in actions[:3])
    lines += ["", "**Confidence Level**", snapshot["analysis"]["confidence"]]
    if follow_ups:
        lines += ["", "**Suggested Follow-Up Questions**"]
        lines.extend(f"- {question}" for question in follow_ups)
    return "\n".join(lines)


async def _stream_text(text: str):
    for idx in range(0, len(text), 48):
        yield text[idx : idx + 48]
        await asyncio.sleep(0)


@router.post("/chat", response_model=Observation)
async def horus_chat_post(
    background_tasks: BackgroundTasks,
    message: str = Form(...),
    chat_id: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Compatibility path for non-streaming Horus clients."""
    user_id = get_user_id(current_user)
    buffered_files = await _buffer_upload_files(files, user_id)
    snapshot = await _build_read_only_snapshot(db, current_user)
    content = _format_read_only_response(message, snapshot, buffered_files)
    return {
        "content": content,
        "chat_id": chat_id or f"readonly-{uuid4()}",
        "timestamp": datetime.now(timezone.utc),
        "state_hash": json.dumps(snapshot["counts"], sort_keys=True),
        "structured": {"mode": "read_only", "counts": snapshot["counts"], "analysis": snapshot["analysis"]},
        "suggested_actions": [],
    }


@router.post("/chat/stream")
async def horus_chat_stream(
    background_tasks: BackgroundTasks,
    message: str = Form(...),
    chat_id: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Stream a stateless, read-only Horus response."""
    user_id = get_user_id(current_user)
    correlation_id = str(uuid4())
    logger.info("Horus chat/stream request", extra={"correlation_id": correlation_id, "user_id": user_id})
    buffered_files = await _buffer_upload_files(files, user_id)
    
    async def event_generator():
        try:
            snapshot = await _build_read_only_snapshot(db, current_user)
            response_text = _format_read_only_response(message, snapshot, buffered_files)
            yield f"__CHAT_ID__:{chat_id or f'readonly-{correlation_id}'}\n"
            yield "__AGENT_RUN__:{\"mode\":\"read_only\",\"intent\":\"observe_accreditation_state\",\"route\":\"snapshot\",\"step_count\":1}\n"
            async for chunk in _stream_text(response_text):
                yield chunk
        except Exception as e:
            logger.error(f"Horus stream error: {e}", exc_info=True, extra={"correlation_id": correlation_id})
            yield f"__STREAM_ERROR__:{str(e)[:200]}\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/plain; charset=utf-8",
        background=background_tasks,
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/stt", response_model=TranscriptionResponse)
async def horus_speech_to_text(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
    current_user = Depends(get_current_user),
):
    """Speech-to-text is disabled in read-only enterprise mode."""
    _ = get_user_id(current_user)
    raise HTTPException(status_code=410, detail="Horus speech-to-text is disabled in read-only mode.")


@router.get("/events")
async def horus_events_stream(
    last_event_id: Optional[str] = Query(default=None, alias="lastEventId"),
    current_user = Depends(get_current_user)
):
    """Compatibility SSE stream. No persisted events are emitted in read-only mode."""
    _ = get_user_id(current_user)
    
    async def event_generator():
        try:
            yield f"data: {json.dumps({'type': 'sync', 'status': 'read_only', 'transport': 'none'})}\n\n"
            while True:
                await asyncio.sleep(30)
                yield ": keepalive\n\n"
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error(f"Horus read-only SSE error: {e}")

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/observe")
async def horus_observe(
    query: Optional[str] = Query(None),
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Lightweight state observation endpoint for legacy clients.
    """
    snapshot = await _build_read_only_snapshot(db, current_user)
    counts = snapshot["counts"]
    content = (
        _format_read_only_response(
            query or "Summarize the current accreditation state.",
            snapshot,
            [],
        )
    )
    return {
        "content": content,
        "timestamp": datetime.now(timezone.utc).timestamp(),
        "state_hash": json.dumps(counts, sort_keys=True),
    }


@router.get("/analytics/insights")
async def horus_analytics_insights(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Read-only contextual intelligence for the Analytics page."""
    snapshot = await _build_read_only_snapshot(db, current_user)
    payload = _analytics_summary(snapshot)
    return {
        **payload,
        "timestamp": datetime.now(timezone.utc).timestamp(),
        "state_hash": json.dumps(snapshot["counts"], sort_keys=True),
    }


@router.post("/analytics/explain", response_model=AnalyticsExplainResponse)
async def horus_explain_analytics_page(
    body: AnalyticsExplainRequest,
    current_user = Depends(get_current_user),
):
    """Explain the already-loaded Analytics page payload without DB access or side effects."""
    _ = get_user_id(current_user)
    return _explain_analytics_payload(body)


@router.get("/state/files")
async def horus_state_files(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user),
):
    snapshot = await _build_read_only_snapshot(db, current_user)
    return snapshot["evidence"]


@router.get("/state/evidence")
async def horus_state_evidence(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user),
):
    snapshot = await _build_read_only_snapshot(db, current_user)
    return snapshot["evidence"]


@router.get("/state/gaps")
async def horus_state_gaps(
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_user),
):
    snapshot = await _build_read_only_snapshot(db, current_user)
    return snapshot["gaps"]


@router.get("/history/last")
async def get_last_chat(
    current_user = Depends(get_current_user)
):
    """Chat persistence is disabled for read-only Horus."""
    _ = get_user_id(current_user)
    return None


@router.get("/history")
async def get_chat_history(
    current_user = Depends(get_current_user)
):
    """Chat history is disabled for read-only Horus."""
    _ = get_user_id(current_user)
    return []


@router.get("/goal", response_model=GoalResponse)
async def get_goal(
    chat_id: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
):
    _ = get_user_id(current_user)
    raise HTTPException(status_code=410, detail="Horus goals are disabled in read-only mode.")


@router.post("/goal", response_model=GoalResponse)
async def set_goal(
    body: GoalUpdateRequest,
    current_user = Depends(get_current_user),
):
    _ = get_user_id(current_user)
    raise HTTPException(status_code=410, detail="Horus goals are disabled in read-only mode.")


@router.get("/history/{chat_id}")
async def get_chat_messages(
    chat_id: str,
    current_user = Depends(get_current_user)
):
    """Chat persistence is disabled for read-only Horus."""
    _ = get_user_id(current_user)
    raise HTTPException(status_code=404, detail="Chat history is disabled in read-only mode.")


@router.get("/agent/capabilities")
async def get_agent_capabilities(
    current_user = Depends(get_current_user)
):
    """Expose read-only Horus capabilities for UI/clients."""
    _ = get_user_id(current_user)
    return {
        "agent_mode": "read_only_intelligence",
        "tool_count": 1,
        "tools": [
            {
                "name": "observe_accreditation_state",
                "description": "Read tenant-scoped evidence, mappings, gaps, and reports without changing state.",
                "mutating": False,
                "args_schema": {},
                "requires_confirmation": False,
            }
        ],
    }


@router.delete("/history/{chat_id}")
async def delete_chat(
    chat_id: str,
    current_user = Depends(get_current_user)
):
    """Chat deletion is a mutation and is disabled."""
    _ = get_user_id(current_user)
    raise HTTPException(status_code=410, detail="Horus chat deletion is disabled in read-only mode.")


# ─── Feedback ─────────────────────────────────────────────────────────────────

class MessageFeedback(BaseModel):
    message_id: str
    chat_id: str | None = None
    rating: str  # "up" | "down"
    category: str | None = None  # "Inaccurate" | "Not relevant" | "Incomplete" | "Harmful" (tiered feedback)
    comment: str | None = None  # Optional "Tell us more" free text


@router.post("/feedback")
async def submit_message_feedback(
    body: MessageFeedback,
    current_user = Depends(get_current_user)
):
    """Feedback persistence is disabled for read-only Horus."""
    _ = get_user_id(current_user)
    raise HTTPException(status_code=410, detail="Horus feedback persistence is disabled in read-only mode.")
