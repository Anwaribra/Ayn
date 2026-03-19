"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AuditReportCard } from "./cards/audit-report-card"
import { GapTableCard } from "./cards/gap-table-card"
import { RemediationPlanCard } from "./cards/remediation-plan-card"
import { AnalyticsReportCard } from "./cards/analytics-report-card"
import { Skeleton } from "@/components/ui/skeleton"

interface AgentResultRendererProps {
  result: { type: string; payload: any }
}

function StructuredResultSkeleton({ type }: { type: string }) {
  const isReport = type === "audit_report" || type === "analytics_report"
  const isTable = type === "gap_table"
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--glass-panel)]/80 p-4 space-y-3">
      <Skeleton className="h-5 w-24" />
      {isReport && (
        <>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[90%]" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </>
      )}
      {isTable && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-4/5" />
        </div>
      )}
    </div>
  )
}

export function AgentResultRenderer({ result }: AgentResultRendererProps) {
  const [showSkeleton, setShowSkeleton] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowSkeleton(false), 120)
    return () => clearTimeout(t)
  }, [])

  const content = (() => {
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
    case "analytics_report":
      return <AnalyticsReportCard payload={result.payload} />
    case "link_result":
      return (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/80 p-4">
          <p className="text-sm font-semibold text-foreground">Evidence Linked</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Evidence has been linked to the criterion successfully.
          </p>
          {result.payload?.evidenceId && (
            <a
              href={`/platform/evidence?highlight=${result.payload.evidenceId}`}
              className="mt-2 inline-block text-xs text-primary hover:underline"
            >
              View in Evidence Vault →
            </a>
          )}
        </div>
      )
    case "report_export":
      return (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/80 p-4">
          <p className="text-sm font-semibold text-foreground">Report Export Ready</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your report is ready for download.
          </p>
          {result.payload?.relative_export_url && (
            <a
              href={result.payload.relative_export_url}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20"
              download
            >
              Download Report
            </a>
          )}
        </div>
      )
    case "action_error":
      return (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-semibold text-destructive">Action Failed</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.payload?.message || "The action could not be completed."}
          </p>
        </div>
      )
    default:
      return null
  }
  })()

  return (
    <AnimatePresence mode="wait">
      {showSkeleton ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <StructuredResultSkeleton type={result.type} />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
