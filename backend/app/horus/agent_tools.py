"""
Horus Agent Tools

Typed tool registry used by the Horus planner/executor loop.
"""

from __future__ import annotations

import asyncio
from typing import Any, Awaitable, Callable, Dict

from app.evidence.models import AttachEvidenceRequest
from app.evidence.service import EvidenceService
from app.gap_analysis.models import GapAnalysisRequest, UserDTO
from app.gap_analysis.service import GapAnalysisService
from app.horus.agent_actions import ACTION_REGISTRY
from app.horus.agent_context import build_agent_context


ToolFn = Callable[..., Awaitable[dict]]


async def tool_get_platform_snapshot(
    *,
    db: Any,
    user_id: str,
    institution_id: str | None,
    current_user: dict,
    args: dict,
) -> dict:
    snapshot = await build_agent_context(db=db, user_id=user_id, institution_id=institution_id)
    return {"type": "platform_snapshot", "payload": snapshot}


async def tool_run_full_audit(
    *,
    db: Any,
    user_id: str,
    institution_id: str | None,
    current_user: dict,
    args: dict,
) -> dict:
    return await ACTION_REGISTRY["run_full_audit"](
        db=db, user_id=user_id, institution_id=institution_id
    )


async def tool_check_compliance_gaps(
    *,
    db: Any,
    user_id: str,
    institution_id: str | None,
    current_user: dict,
    args: dict,
) -> dict:
    return await ACTION_REGISTRY["check_compliance_gaps"](
        db=db, user_id=user_id, institution_id=institution_id
    )


async def tool_generate_remediation_report(
    *,
    db: Any,
    user_id: str,
    institution_id: str | None,
    current_user: dict,
    args: dict,
) -> dict:
    return await ACTION_REGISTRY["generate_remediation_report"](
        db=db, user_id=user_id, institution_id=institution_id
    )


async def tool_start_gap_analysis_run(
    *,
    db: Any,
    user_id: str,
    institution_id: str | None,
    current_user: dict,
    args: dict,
) -> dict:
    standard_id = args.get("standard_id")
    if not standard_id:
        return {
            "type": "action_error",
            "payload": {"message": "Missing required argument: standard_id"},
        }

    if not institution_id:
        return {
            "type": "action_error",
            "payload": {"message": "No institution is associated with this user."},
        }

    user_dto = UserDTO(
        id=user_id,
        institutionId=institution_id,
        role=current_user.get("role", "USER"),
        email=current_user.get("email", "unknown"),
    )
    req = GapAnalysisRequest(standardId=standard_id)

    job = await GapAnalysisService.queue_report(req, user_dto)
    asyncio.create_task(
        GapAnalysisService.run_report_background(
            job_id=job["jobId"],
            user_id=user_id,
            institution_id=institution_id,
            standard_id=standard_id,
            current_user=user_dto,
        )
    )

    return {
        "type": "job_started",
        "payload": {
            "job_id": job["jobId"],
            "status": job["status"],
            "standard_id": standard_id,
        },
    }


async def tool_link_evidence_to_criterion(
    *,
    db: Any,
    user_id: str,
    institution_id: str | None,
    current_user: dict,
    args: dict,
) -> dict:
    evidence_id = args.get("evidence_id")
    criterion_id = args.get("criterion_id")
    if not evidence_id or not criterion_id:
        return {
            "type": "action_error",
            "payload": {"message": "Missing required arguments: evidence_id and criterion_id"},
        }

    req = AttachEvidenceRequest(criterionId=criterion_id)
    result = await EvidenceService.attach_evidence(evidence_id, req, current_user)
    return {"type": "link_result", "payload": result.model_dump()}


async def tool_generate_report_export_link(
    *,
    db: Any,
    user_id: str,
    institution_id: str | None,
    current_user: dict,
    args: dict,
) -> dict:
    report_id = args.get("report_id")
    if not report_id:
        return {
            "type": "action_error",
            "payload": {"message": "Missing required argument: report_id"},
        }
    return {
        "type": "report_export",
        "payload": {
            "report_id": report_id,
            "relative_export_url": f"/api/gap-analysis/{report_id}/export",
        },
    }


TOOL_REGISTRY: Dict[str, dict[str, Any]] = {
    "get_platform_snapshot": {
        "mutating": False,
        "title": "Read platform snapshot",
        "prepare_text": "a full platform snapshot",
        "description": "Fetch a complete platform snapshot for the current user/institution.",
        "args_schema": {},
        "handler": tool_get_platform_snapshot,
    },
    "run_full_audit": {
        "mutating": False,
        "title": "Run full audit",
        "prepare_text": "a full compliance audit report",
        "description": "Generate an audit report card from existing institution analysis data.",
        "args_schema": {},
        "handler": tool_run_full_audit,
    },
    "check_compliance_gaps": {
        "mutating": False,
        "title": "Check compliance gaps",
        "prepare_text": "the compliance gap table",
        "description": "Return criteria-level compliance gap rows for the institution.",
        "args_schema": {},
        "handler": tool_check_compliance_gaps,
    },
    "generate_remediation_report": {
        "mutating": False,
        "title": "Generate remediation report",
        "prepare_text": "the remediation action plan",
        "description": "Generate remediation actions for current open platform gaps.",
        "args_schema": {},
        "handler": tool_generate_remediation_report,
    },
    "start_gap_analysis_run": {
        "mutating": True,
        "title": "Start gap analysis run",
        "prepare_text": "a new gap analysis run",
        "description": "Queue and run a new gap analysis for a specific standard id.",
        "args_schema": {"standard_id": "string"},
        "handler": tool_start_gap_analysis_run,
    },
    "link_evidence_to_criterion": {
        "mutating": True,
        "title": "Link evidence to criterion",
        "prepare_text": "evidence-to-criterion linking",
        "description": "Attach one evidence item to one criterion.",
        "args_schema": {"evidence_id": "string", "criterion_id": "string"},
        "handler": tool_link_evidence_to_criterion,
    },
    "generate_report_export_link": {
        "mutating": False,
        "title": "Generate report export link",
        "prepare_text": "the report export link",
        "description": "Create an export link for an existing gap analysis report id.",
        "args_schema": {"report_id": "string"},
        "handler": tool_generate_report_export_link,
    },
}


def build_tool_manifest() -> list[dict[str, Any]]:
    return [
        {
            "name": name,
            "description": spec["description"],
            "mutating": spec["mutating"],
            "args_schema": spec["args_schema"],
        }
        for name, spec in TOOL_REGISTRY.items()
    ]


def requires_explicit_confirmation(tool_name: str) -> bool:
    spec = TOOL_REGISTRY.get(tool_name)
    return bool(spec and spec.get("mutating"))


def get_tool_ui_meta(tool_name: str) -> dict[str, str]:
    spec = TOOL_REGISTRY.get(tool_name, {})
    return {
        "title": spec.get("title", tool_name),
        "prepare_text": spec.get("prepare_text", f"preparing {tool_name}"),
        "description": spec.get("description", ""),
    }


async def execute_tool(
    *,
    tool_name: str,
    args: dict,
    db: Any,
    user_id: str,
    institution_id: str | None,
    current_user: dict,
) -> dict:
    spec = TOOL_REGISTRY.get(tool_name)
    if not spec:
        return {"type": "action_error", "payload": {"message": f"Unknown tool '{tool_name}'"}}
    handler: ToolFn = spec["handler"]
    return await handler(
        db=db,
        user_id=user_id,
        institution_id=institution_id,
        current_user=current_user,
        args=args or {},
    )
