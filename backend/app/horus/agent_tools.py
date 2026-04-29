"""
Horus Agent Tools

Typed tool registry used by the Horus planner/executor loop.

All exposed tools are read-only: they fetch existing tenant-scoped snapshots and
never create or update mappings, gaps, reports, or evidence.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Awaitable, Callable, Dict

logger = logging.getLogger(__name__)
TOOL_RETRY_ATTEMPTS = 2
TOOL_RETRY_BASE_DELAY_SEC = 1

from app.horus.agent_graph import ConstrainedAgentExecutionGraph
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
        "description": "Fetch a complete read-only snapshot for the current user/institution.",
        "args_schema": {},
        "estimated_duration_ms": 2000,
        "handler": tool_get_platform_snapshot,
    },
    "run_full_audit": {
        "mutating": False,
        "title": "Summarize latest reports & mappings",
        "prepare_text": "an audit-style summary from existing reports",
        "description": "Summarize completed gap-analysis reports and criteria mappings already in the system (no new analysis run).",
        "args_schema": {},
        "estimated_duration_ms": 5000,
        "handler": tool_run_full_audit,
    },
    "check_compliance_gaps": {
        "mutating": False,
        "title": "List compliance gaps from mappings",
        "prepare_text": "the criteria mapping / gap table",
        "description": "Return criteria-level rows from existing CriteriaMapping data (explains why items appear as gaps or met).",
        "args_schema": {},
        "estimated_duration_ms": 3000,
        "handler": tool_check_compliance_gaps,
    },
    "generate_remediation_report": {
        "mutating": False,
        "title": "Suggest remediation actions",
        "prepare_text": "action-oriented remediation suggestions",
        "description": "Read open PlatformGap records and produce natural-language remediation suggestions only (does not change gaps or reports).",
        "args_schema": {},
        "estimated_duration_ms": 8000,
        "handler": tool_generate_remediation_report,
    },
    "generate_report_export_link": {
        "mutating": False,
        "title": "Open report export link",
        "prepare_text": "a link to export an existing report",
        "description": "Return the export URL for an existing gap-analysis report id the user already has.",
        "args_schema": {"report_id": "string"},
        "estimated_duration_ms": 1000,
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


def get_tool_ui_meta(tool_name: str) -> dict[str, str | int]:
    spec = TOOL_REGISTRY.get(tool_name, {})
    return {
        "title": spec.get("title", tool_name),
        "prepare_text": spec.get("prepare_text", f"preparing {tool_name}"),
        "description": spec.get("description", ""),
        "estimated_duration_ms": spec.get("estimated_duration_ms", 3000),
    }


async def execute_tool(
    *,
    tool_name: str,
    args: dict,
    db: Any,
    user_id: str,
    institution_id: str | None,
    current_user: dict,
    request_mode: str | None = None,
    confirmed: bool = False,
) -> dict:
    spec = TOOL_REGISTRY.get(tool_name)
    if not spec:
        return {
            "type": "action_error",
            "payload": {
                "message": f"Unknown tool '{tool_name}'",
                "suggested_fix": "Check the available tools using the slash command palette.",
            },
        }
    decision = ConstrainedAgentExecutionGraph.evaluate(
        tool_name=tool_name,
        args=args or {},
        request_mode=request_mode,
        confirmed=confirmed or not spec.get("mutating"),
    )
    if not decision.allowed:
        return {
            "type": "action_error",
            "payload": {
                "message": decision.reason,
                "suggested_fix": _default_suggested_fix(tool_name, decision.reason),
            },
            "_meta": {"tool": tool_name, "graph": "blocked"},
        }

    handler: ToolFn = spec["handler"]
    last_error: str | None = None
    start_time = time.monotonic()
    for attempt in range(TOOL_RETRY_ATTEMPTS + 1):
        try:
            result = await handler(
                db=db,
                user_id=user_id,
                institution_id=institution_id,
                current_user=current_user,
                args=args or {},
            )
            # Inject execution metadata
            elapsed_ms = round((time.monotonic() - start_time) * 1000)
            if isinstance(result, dict):
                result["_meta"] = {
                    "tool": tool_name,
                    "elapsed_ms": elapsed_ms,
                    "user_id": user_id,
                }
                # For mutating tools, add undo hint
                if spec.get("mutating") and result.get("type") not in ("action_error", None):
                    result["_meta"]["undoable"] = True
                    result["_meta"]["undo_tool"] = f"undo_{tool_name}"

            if result.get("type") == "action_error":
                payload = result.get("payload") or {}
                last_error = payload.get("message") or result.get("message") or str(result)
                # Inject suggested_fix if not already present
                if "suggested_fix" not in payload:
                    payload["suggested_fix"] = _default_suggested_fix(tool_name, last_error)
                    result["payload"] = payload
                if attempt < TOOL_RETRY_ATTEMPTS:
                    delay = TOOL_RETRY_BASE_DELAY_SEC * (2**attempt)
                    logger.warning(
                        "Tool %s failed (attempt %d/%d): %s; retrying in %.1fs",
                        tool_name,
                        attempt + 1,
                        TOOL_RETRY_ATTEMPTS + 1,
                        last_error,
                        delay,
                    )
                    await asyncio.sleep(delay)
                    continue
            return result
        except Exception as exc:
            last_error = str(exc)
            if attempt < TOOL_RETRY_ATTEMPTS:
                delay = TOOL_RETRY_BASE_DELAY_SEC * (2**attempt)
                logger.warning(
                    "Tool %s raised (attempt %d/%d): %s; retrying in %.1fs",
                    tool_name,
                    attempt + 1,
                    TOOL_RETRY_ATTEMPTS + 1,
                    last_error,
                    delay,
                )
                await asyncio.sleep(delay)
                continue
            return {
                "type": "action_error",
                "payload": {
                    "message": last_error or "Unknown error",
                    "suggested_fix": _default_suggested_fix(tool_name, last_error),
                },
            }
    return {
        "type": "action_error",
        "payload": {
            "message": last_error or "Unknown error",
            "suggested_fix": _default_suggested_fix(tool_name, last_error),
        },
    }


def _default_suggested_fix(tool_name: str, error_msg: str | None) -> str:
    """Generate a default recovery suggestion based on the tool and error."""
    fixes: dict[str, str] = {
        "run_full_audit": "Run a gap analysis from the main Gap Analysis workflow first so reports exist to summarize.",
        "check_compliance_gaps": "Link your institution to standards and complete mapping in the core workflow before viewing gap rows.",
        "generate_remediation_report": "Run a gap analysis first so platform gaps exist to base suggestions on.",
        "generate_report_export_link": "Use a report id from an existing completed gap-analysis report.",
        "get_platform_snapshot": "Ensure your account is linked to an institution with data in the system.",
    }
    return fixes.get(tool_name, "Try again or contact support if the issue persists.")
