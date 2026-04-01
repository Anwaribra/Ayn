"use client"

import Link from "next/link"
import useSWR from "swr"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { DashboardMetrics, StateSummary } from "@/lib/types"
import { ArrowLeft, Activity, BarChart3, Database, FileText, ShieldCheck } from "lucide-react"

export default function SubscriptionPage() {
  return (
    <ProtectedRoute>
      <SubscriptionContent />
    </ProtectedRoute>
  )
}

function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`
}

function SubscriptionContent() {
  const { user } = useAuth()

  const { data: metrics, error: metricsError, isLoading: metricsLoading } = useSWR<DashboardMetrics>(
    user ? [`subscription-dashboard-metrics`, user.id] : null,
    () => api.getDashboardMetrics(),
    { refreshInterval: 30000 }
  )

  const { data: state, error: stateError, isLoading: stateLoading } = useSWR<StateSummary>(
    user ? [`subscription-state-summary`, user.id] : null,
    () => api.getStateSummary(),
    { refreshInterval: 30000 }
  )

  const { data: analytics, error: analyticsError, isLoading: analyticsLoading } = useSWR<any>(
    user ? [`subscription-analytics`, user.id] : null,
    () => api.getAnalytics(30),
    { refreshInterval: 60000 }
  )

  const isLoading = metricsLoading || stateLoading || analyticsLoading
  const error = metricsError || stateError || analyticsError

  const evidenceCount = metrics?.evidenceCount ?? 0
  const analysisCount = metrics?.totalGapAnalyses ?? 0
  const alignmentScore = metrics?.alignmentPercentage ?? analytics?.alignmentPercentage ?? 0
  const linkedEvidence = state?.linked_evidence ?? 0
  const totalEvidence = state?.total_evidence ?? evidenceCount
  const linkedEvidenceRatio = totalEvidence > 0 ? (linkedEvidence / totalEvidence) * 100 : 0
  const analyzedFiles = state?.analyzed_files ?? 0
  const totalFiles = state?.total_files ?? 0
  const analyzedFilesRatio = totalFiles > 0 ? (analyzedFiles / totalFiles) * 100 : 0
  const totalReports = analytics?.totalReports ?? analysisCount
  const avgScore = analytics?.avgScore ?? alignmentScore
  const totalCriteria = analytics?.totalCriteria ?? 0
  const alignedCriteria = analytics?.alignedCriteria ?? metrics?.alignedCriteriaCount ?? 0

  const stats = [
    {
      label: "Evidence In Workspace",
      value: evidenceCount.toString(),
      helper: `${linkedEvidence} linked to compliance records`,
      icon: FileText,
    },
    {
      label: "Gap Analysis Reports",
      value: totalReports.toString(),
      helper: `${analysisCount} total reports visible in dashboard`,
      icon: BarChart3,
    },
    {
      label: "Avg Compliance Score",
      value: formatPercent(avgScore),
      helper: `${alignedCriteria}/${totalCriteria || alignedCriteria} criteria aligned`,
      icon: ShieldCheck,
    },
    {
      label: "Tracked Files",
      value: totalFiles.toString(),
      helper: `${analyzedFiles} analyzed by the platform`,
      icon: Database,
    },
  ]

  return (
    <div className="animate-fade-in-up pb-20 max-w-4xl px-4">
      <Link
        href="/platform/settings"
        className="inline-flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-medium mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      <header className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
          Subscription <span className="text-[var(--text-tertiary)] font-light">Layer</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Live workspace metrics for your current Horus environment
        </p>
      </header>

      <div className="glass-panel p-6 rounded-2xl glass-border space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Current Workspace</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">Horus Workspace</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              This view shows real platform usage and readiness data. Billing and invoice management are not wired in this build yet.
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg status-success border text-[10px] font-bold uppercase w-fit">
            Active
          </span>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Failed to load live workspace metrics. Some backend services may be unavailable right now.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl glass-panel glass-border p-5 animate-pulse">
                <div className="h-4 w-28 rounded bg-[var(--surface-subtle)] mb-4" />
                <div className="h-8 w-20 rounded bg-[var(--surface-subtle)] mb-2" />
                <div className="h-3 w-40 rounded bg-[var(--surface-subtle)]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl glass-panel glass-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{stat.label}</p>
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-black text-[var(--text-primary)]">{stat.value}</p>
                <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{stat.helper}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl glass-panel glass-border p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Evidence Link Coverage</p>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="h-2 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500/70 transition-[width] duration-500"
                style={{ width: formatPercent(linkedEvidenceRatio) }}
              />
            </div>
            <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
              {linkedEvidence} of {totalEvidence} evidence records are linked in workspace state.
            </p>
          </div>

          <div className="rounded-2xl glass-panel glass-border p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">File Analysis Coverage</p>
              <Database className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="h-2 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500/70 transition-[width] duration-500"
                style={{ width: formatPercent(analyzedFilesRatio) }}
              />
            </div>
            <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
              {analyzedFiles} of {totalFiles} tracked files have been analyzed by the platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
