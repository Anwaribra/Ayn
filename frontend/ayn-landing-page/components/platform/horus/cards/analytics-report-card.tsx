"use client"

import { BarChart3, ExternalLink } from "lucide-react"

interface AnalyticsPayload {
  totalReports?: number
  avgScore?: number
  latestScore?: number
  uniqueStandards?: number
  totalEvidence?: number
  alignmentPercentage?: number
  insights?: { title: string; description: string; severity: string }[]
}

export function AnalyticsReportCard({ payload }: { payload: AnalyticsPayload }) {
  if (!payload) return null

  const hasData = (payload.totalReports ?? 0) > 0 || (payload.totalEvidence ?? 0) > 0

  return (
    <div className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/60 p-5 space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground text-[14px]">Compliance Analytics</p>
            <p className="text-[11px] text-muted-foreground">
              {hasData ? `${payload.totalReports ?? 0} reports · ${payload.uniqueStandards ?? 0} standards` : "No data yet"}
            </p>
          </div>
        </div>
        <a
          href="/platform/analytics"
          className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
        >
          View Analytics <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {hasData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-[var(--glass-panel)]/60 px-3 py-2 border border-[var(--border-subtle)]">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Avg Score</p>
            <p className="text-lg font-bold text-foreground">{payload.avgScore?.toFixed(1) ?? "—"}%</p>
          </div>
          <div className="rounded-xl bg-[var(--glass-panel)]/60 px-3 py-2 border border-[var(--border-subtle)]">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Latest</p>
            <p className="text-lg font-bold text-foreground">{payload.latestScore?.toFixed(1) ?? "—"}%</p>
          </div>
          <div className="rounded-xl bg-[var(--glass-panel)]/60 px-3 py-2 border border-[var(--border-subtle)]">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Evidence</p>
            <p className="text-lg font-bold text-foreground">{payload.totalEvidence ?? 0}</p>
          </div>
          <div className="rounded-xl bg-[var(--glass-panel)]/60 px-3 py-2 border border-[var(--border-subtle)]">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Alignment</p>
            <p className="text-lg font-bold text-foreground">{payload.alignmentPercentage?.toFixed(0) ?? "—"}%</p>
          </div>
        </div>
      )}

      {!hasData && (
        <p className="text-[13px] text-muted-foreground">
          Run gap analysis and upload evidence to see analytics.
        </p>
      )}
    </div>
  )
}
