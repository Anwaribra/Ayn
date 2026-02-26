"use client"

import { AuditReportCard } from "./cards/audit-report-card"
import { GapTableCard } from "./cards/gap-table-card"
import { RemediationPlanCard } from "./cards/remediation-plan-card"

interface AgentResultRendererProps {
  result: { type: string; payload: any }
}

export function AgentResultRenderer({ result }: AgentResultRendererProps) {
  switch (result.type) {
    case "audit_report":
      return <AuditReportCard payload={result.payload} />
    case "gap_table":
      return <GapTableCard payload={result.payload} />
    case "remediation_plan":
      return <RemediationPlanCard payload={result.payload} />
    case "job_started":
      return (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/80 p-4">
          <p className="text-sm font-semibold text-foreground">Gap Analysis Started</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Job <span className="font-mono text-xs">{result.payload?.job_id}</span> is {result.payload?.status || "queued"}.
          </p>
        </div>
      )
    default:
      return null
  }
}
