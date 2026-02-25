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
    default:
      return null
  }
}
