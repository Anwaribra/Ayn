"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AuditReportCard } from "./cards/audit-report-card"
import { GapTableCard } from "./cards/gap-table-card"
import { RemediationPlanCard } from "./cards/remediation-plan-card"
import { AnalyticsReportCard } from "./cards/analytics-report-card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ShieldCheck, AlertTriangle, Info } from "lucide-react"

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

function getConfidenceLevel(result: { type: string; payload: any }): { level: "high" | "medium" | "low"; reason: string } | null {
  const p = result.payload
  if (!p) return null

  switch (result.type) {
    case "audit_report": {
      if (!p.has_data) return { level: "low", reason: "No analysis data available" }
      if ((p.total_criteria ?? 0) === 0) return { level: "low", reason: "No criteria mapped yet" }
      if ((p.passed?.length ?? 0) + (p.failed?.length ?? 0) < 5) return { level: "medium", reason: "Limited criteria data" }
      return { level: "high", reason: "Based on complete analysis data" }
    }
    case "gap_table": {
      const rows = p.rows ?? []
      if (rows.length === 0) return { level: "low", reason: "No criteria mappings found" }
      if (rows.length < 5) return { level: "medium", reason: "Partial criteria coverage" }
      return { level: "high", reason: `${rows.length} criteria analyzed` }
    }
    case "remediation_plan": {
      const rows = p.rows ?? []
      if (rows.length === 0) return { level: "low", reason: "No open gaps found" }
      return { level: "high", reason: `${rows.length} gaps with AI recommendations` }
    }
    case "analytics_report": {
      if (!p.totalReports && !p.kpis) return { level: "low", reason: "No analytics data" }
      return { level: "high", reason: "Real-time analytics" }
    }
    case "action_error":
      return { level: "low", reason: p.message || "Action failed" }
    default:
      return null
  }
}

function ConfidenceBadge({ confidence }: { confidence: { level: "high" | "medium" | "low"; reason: string } }) {
  const config = {
    high: { icon: ShieldCheck, bg: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400", label: "High confidence" },
    medium: { icon: Info, bg: "border-amber-500/20 bg-amber-500/10 text-amber-400", label: "Medium confidence" },
    low: { icon: AlertTriangle, bg: "border-red-500/20 bg-red-500/10 text-red-400", label: "Low confidence" },
  }[confidence.level]
  const Icon = config.icon

  return (
    <div className={cn("mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium", config.bg)}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
      <span className="text-[10px] opacity-70">— {confidence.reason}</span>
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
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-destructive">Action Failed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.payload?.message || "The action could not be completed."}
              </p>
              {result.payload?.suggested_fix && (
                <p className="mt-2 text-[12px] font-medium text-foreground/80 border-l-2 border-primary/40 pl-2.5">
                  💡 {result.payload.suggested_fix}
                </p>
              )}
              {result.payload?.recovery_url && (
                <a
                  href={result.payload.recovery_url}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  Go to fix →
                </a>
              )}
            </div>
          </div>
        </div>
      )
    default:
      return null
  }
  })()

  const confidence = getConfidenceLevel(result)

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
          {confidence && <ConfidenceBadge confidence={confidence} />}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
