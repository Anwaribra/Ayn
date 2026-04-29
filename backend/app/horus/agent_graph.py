"""Constrained execution graph for Horus tools.

Horus is read-only: every registered tool only reads existing tenant-scoped data.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class AgentGraphDecision:
    allowed: bool
    reason: str
    max_duration_ms: int


class ConstrainedAgentExecutionGraph:
    """Guards tool execution by mode and required arguments."""

    READ_TOOLS = {
        "get_platform_snapshot",
        "run_full_audit",
        "check_compliance_gaps",
        "generate_remediation_report",
        "generate_report_export_link",
    }
    MUTATING_TOOLS: set[str] = set()
    REQUIRED_ARGS = {
        "generate_report_export_link": ("report_id",),
    }

    @classmethod
    def evaluate(
        cls,
        *,
        tool_name: str,
        args: dict[str, Any] | None,
        request_mode: str | None,
        confirmed: bool = False,
    ) -> AgentGraphDecision:
        args = args or {}
        missing = [name for name in cls.REQUIRED_ARGS.get(tool_name, ()) if not args.get(name)]
        if missing:
            return AgentGraphDecision(False, f"missing required arguments: {', '.join(missing)}", 0)
        if tool_name in cls.MUTATING_TOOLS and not confirmed:
            return AgentGraphDecision(False, "mutating tool requires explicit confirmation", 0)
        if tool_name not in cls.READ_TOOLS and tool_name not in cls.MUTATING_TOOLS:
            return AgentGraphDecision(False, "tool is not in the constrained execution graph", 0)
        if request_mode not in {"agent", "think", None} and tool_name in cls.MUTATING_TOOLS:
            return AgentGraphDecision(False, "mutating tools are only available in agent mode", 0)
        return AgentGraphDecision(True, "allowed", 20_000 if tool_name in cls.MUTATING_TOOLS else 8_000)
