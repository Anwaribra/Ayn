"use client"

import { Check, X, AlertTriangle, TrendingUp, BarChart3, ListChecks, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuditReportPayload {
  overall_score: number
  total_criteria: number
  passed: { title: string; standard: string }[]
  failed: { title: string; standard: string }[]
  recommendations: string[]
  has_data: boolean
  report_ids: string[]
}

export function AuditReportCard({ payload }: { payload: AuditReportPayload }) {
  if (!payload.has_data) {
    return (
      <div className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/60 p-6 space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-bold text-foreground text-[15px]">Full Compliance Audit</h3>
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          No completed gap analysis reports found for your institution yet.
        </p>
        <a
          href="/platform/gap-analysis"
          className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-primary text-primary-foreground text-[13px] font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          Run New Analysis
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    )
  }

  const scoreColor =
    payload.overall_score >= 75
      ? "text-green-600 dark:text-green-400"
      : payload.overall_score >= 50
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400"

  const ringColor =
    payload.overall_score >= 75
      ? "stroke-green-500 dark:stroke-green-400"
      : payload.overall_score >= 50
      ? "stroke-amber-500 dark:stroke-amber-400"
      : "stroke-red-500 dark:stroke-red-400"

  // SVG ring values
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (payload.overall_score / 100) * circumference

  return (
    <div className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/60 overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground text-[14px]">Full Compliance Audit</p>
            <p className="text-[11px] text-muted-foreground">{payload.total_criteria} criteria evaluated</p>
          </div>
        </div>
        <a
          href="/platform/gap-analysis"
          className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
        >
          View Reports <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6">
        {/* Score Ring */}
        <div className="flex flex-col items-center gap-2 self-start">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-[var(--border-subtle)]" />
              <circle
                cx="50" cy="50" r={radius} fill="none"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className={cn("transition-all duration-700", ringColor)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-xl font-black", scoreColor)}>{payload.overall_score.toFixed(0)}%</span>
              <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide">Score</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><Check className="w-3 h-3" />{payload.passed.length}</span>
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><X className="w-3 h-3" />{payload.failed.length}</span>
          </div>
        </div>

        {/* Lists */}
        <div className="space-y-4 min-w-0">
          {/* Passed */}
          {payload.passed.length > 0 && (
            <div>
              <p className="text-[11px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Check className="w-3 h-3" /> Passed ({payload.passed.length})
              </p>
              <ul className="space-y-1">
                {payload.passed.slice(0, 4).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-foreground">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="truncate">{item.title}</span>
                    <span className="text-muted-foreground text-[10px] ml-auto flex-shrink-0">{item.standard}</span>
                  </li>
                ))}
                {payload.passed.length > 4 && (
                  <li className="text-[11px] text-muted-foreground pl-5">+{payload.passed.length - 4} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Failed */}
          {payload.failed.length > 0 && (
            <div>
              <p className="text-[11px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <X className="w-3 h-3" /> Failed ({payload.failed.length})
              </p>
              <ul className="space-y-1">
                {payload.failed.slice(0, 4).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-foreground">
                    <X className="w-3 h-3 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="truncate">{item.title}</span>
                    <span className="text-muted-foreground text-[10px] ml-auto flex-shrink-0">{item.standard}</span>
                  </li>
                ))}
                {payload.failed.length > 4 && (
                  <li className="text-[11px] text-muted-foreground pl-5">+{payload.failed.length - 4} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {payload.recommendations.length > 0 && (
        <div className="px-5 pb-5">
          <div className="border-t border-[var(--border-subtle)] pt-4">
            <p className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Recommendations
            </p>
            <ul className="space-y-2">
              {payload.recommendations.slice(0, 4).map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--text-secondary)] leading-relaxed">
                  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
