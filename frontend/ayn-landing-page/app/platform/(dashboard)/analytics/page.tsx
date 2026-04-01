"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { useMemo, useState } from "react"
import {
  Filter, Target, Download, RefreshCw,
  TrendingUp, Activity, FileText, AlertTriangle,
  Microscope, ArrowUpRight, ShieldCheck, Clock3
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { EmptyState } from "@/components/platform/empty-state"
import { cn } from "@/lib/utils"

import { AnalyticsKpiCards, type KpiCardData } from "@/components/platform/analytics/analytics-kpi-cards"
import { AnalyticsInsights, type Insight } from "@/components/platform/analytics/analytics-insights"
import {
  TrendAreaChart, DistributionBarChart, DonutChart,
  ComplianceRadar, ScoreHeatmap,
} from "@/components/platform/analytics/analytics-charts"

/* ─── Types & Constants ──────────────────────────────────────── */
type PeriodKey = "7d" | "30d" | "90d" | "all"

const PERIOD_OPTIONS: { key: PeriodKey; label: string; days: number | null }[] = [
  { key: "7d", label: "7 Days", days: 7 },
  { key: "30d", label: "30 Days", days: 30 },
  { key: "90d", label: "90 Days", days: 90 },
  { key: "all", label: "All Time", days: null },
]

/* ─── CSV Export ──────────────────────────────────────────────── */
function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

/* ─── Main Export ────────────────────────────────────────────── */
export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  )
}

/* ─── Content — consumes backend /api/analytics endpoint ──── */
function AnalyticsContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [period, setPeriod] = useState<PeriodKey>("30d")

  const periodDays = PERIOD_OPTIONS.find((o) => o.key === period)?.days ?? null

  // Single backend call — all computation done server-side
  const { data: analytics, isLoading, error, mutate } = useSWR(
    user ? [`analytics`, periodDays] : null,
    () => api.getAnalytics(periodDays),
    { refreshInterval: 60000 }
  )

  /* ════════════════════════════════════════════════════════════
     KPI CARDS (from backend-computed data)
     ════════════════════════════════════════════════════════════ */
  const kpiCards: KpiCardData[] = useMemo(() => {
    if (!analytics) return []
    const avg = analytics.avgScore ?? 0
    const growth = analytics.growth?.growthPercent ?? 0
    return [
      {
        id: "total-reports",
        label: "Total Reports",
        value: analytics.totalReports ?? 0,
        icon: Microscope,
        color: "#2563eb",
        trend: (analytics.totalReports ?? 0) > 0 ? "up" as const : "neutral" as const,
        trendValue: `${analytics.totalReports ?? 0} analyzed`,
        description: "Gap analysis reports in this period",
      },
      {
        id: "avg-score",
        label: "Avg Compliance Score",
        value: avg,
        suffix: "%",
        icon: Target,
        color: avg >= 70 ? "#0d9668" : avg >= 40 ? "#b45309" : "#c9424a",
        trend: avg >= 70 ? "up" as const : avg >= 40 ? "neutral" as const : "down" as const,
        trendValue: avg >= 70 ? "Healthy" : avg >= 40 ? "Needs work" : "At risk",
        description: `Std deviation: ±${analytics.stdDeviation ?? 0}%`,
      },
      {
        id: "growth",
        label: "Period Growth",
        value: `${growth >= 0 ? "+" : ""}${growth}`,
        suffix: "%",
        icon: TrendingUp,
        color: growth >= 0 ? "#0d9668" : "#c9424a",
        trend: growth >= 0 ? "up" as const : "down" as const,
        trendValue: analytics.growth?.direction === "up" ? "Improving" : analytics.growth?.direction === "down" ? "Declining" : "Stable",
        description: `${analytics.growth?.previousPeriodAvg ?? 0}% → ${analytics.growth?.currentPeriodAvg ?? 0}%`,
      },
      {
        id: "evidence",
        label: "Evidence Collected",
        value: analytics.totalEvidence ?? 0,
        icon: FileText,
        color: "#7c5ce0",
        trend: (analytics.totalEvidence ?? 0) > 0 ? "up" as const : "neutral" as const,
        trendValue: `${analytics.alignmentPercentage ?? 0}% aligned`,
        description: `${analytics.alignedCriteria ?? 0}/${analytics.totalCriteria ?? 0} criteria covered`,
      },
    ]
  }, [analytics])

  /* ════════════════════════════════════════════════════════════
     CHART DATA (from backend — no client-side computation)
     ════════════════════════════════════════════════════════════ */

  // Trend data (already computed server-side)
  const trendData = useMemo(() => analytics?.scoreTrend ?? [], [analytics])

  // Standard performance → bar chart
  const standardDistribution = useMemo(
    () => (analytics?.standardPerformance ?? []).map((s: any) => ({
      name: s.standardTitle.length > 18 ? s.standardTitle.slice(0, 18) + "…" : s.standardTitle,
      value: Math.round(s.avgScore),
    })),
    [analytics]
  )

  // Status breakdown → donut chart
  const statusBreakdown = useMemo(
    () => (analytics?.statusBreakdown ?? []).filter((d: any) => d.value > 0),
    [analytics]
  )

  // Radar chart
  const radarData = useMemo(
    () => (analytics?.standardPerformance ?? []).slice(0, 6).map((s: any) => ({
      subject: s.standardTitle.length > 12 ? s.standardTitle.slice(0, 12) + "…" : s.standardTitle,
      score: Math.round(s.avgScore),
      fullMark: 100,
    })),
    [analytics]
  )

  // Heatmap data
  const heatmapData = useMemo(
    () => (analytics?.standardPerformance ?? []).map((s: any) => ({
      label: s.standardTitle,
      score: Math.round(s.avgScore),
      count: s.reportCount,
    })),
    [analytics]
  )

  // Insights (from backend)
  const insights: Insight[] = useMemo(
    () => (analytics?.insights ?? []).map((ins: any) => ({
      id: ins.id,
      title: ins.title,
      description: ins.description,
      severity: ins.severity,
      metric: ins.metric,
      action: ins.action,
    })),
    [analytics]
  )

  /* ════════════════════════════════════════════════════════════
     CSV EXPORT
     ════════════════════════════════════════════════════════════ */
  const handleExportCsv = () => {
    if (!analytics || analytics.totalReports === 0) {
      toast.info("No reports in selected period")
      return
    }
    const rows: string[][] = [
      ["Standard", "Avg Score", "Min Score", "Max Score", "Report Count", "Trend"],
      ...(analytics.standardPerformance ?? []).map((s: any) => [
        s.standardTitle,
        String(Math.round(s.avgScore)),
        String(Math.round(s.minScore)),
        String(Math.round(s.maxScore)),
        String(s.reportCount),
        s.trend,
      ]),
    ]
    downloadCsv(`ayn-analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`, rows)
    toast.success("Analytics report exported")
  }

  const hasData = analytics && analytics.totalReports > 0

  const standardPerformance = useMemo(() => analytics?.standardPerformance ?? [], [analytics])

  const weakestStandard = useMemo(() => {
    if (!standardPerformance.length) return null
    return [...standardPerformance].sort((a: any, b: any) => a.avgScore - b.avgScore)[0]
  }, [standardPerformance])

  const strongestStandard = useMemo(() => {
    if (!standardPerformance.length) return null
    return [...standardPerformance].sort((a: any, b: any) => b.avgScore - a.avgScore)[0]
  }, [standardPerformance])

  const executiveNotes = useMemo(() => {
    if (!analytics) return []

    return [
      {
        label: "Readiness",
        value: `${Math.round(analytics.avgScore ?? 0)}%`,
        tone: (analytics.avgScore ?? 0) >= 70 ? "text-emerald-300" : (analytics.avgScore ?? 0) >= 40 ? "text-amber-200" : "text-rose-200",
        icon: ShieldCheck,
      },
      {
        label: "Weakest Standard",
        value: weakestStandard?.standardTitle ?? "None yet",
        tone: "text-foreground",
        icon: AlertTriangle,
      },
      {
        label: "Anomalies",
        value: `${analytics.anomalies?.length ?? 0} flagged`,
        tone: (analytics.anomalies?.length ?? 0) > 0 ? "text-amber-200" : "text-emerald-300",
        icon: Activity,
      },
      {
        label: "Window",
        value: PERIOD_OPTIONS.find((option) => option.key === period)?.label ?? "All Time",
        tone: "text-foreground",
        icon: Clock3,
      },
    ]
  }, [analytics, period, weakestStandard])

  const executiveSummary = useMemo(() => {
    if (!analytics) return "Your analytics workspace is syncing the latest reporting signals."

    const avg = Math.round(analytics.avgScore ?? 0)
    const reportCount = analytics.totalReports ?? 0
    const weakest = weakestStandard?.standardTitle ?? "your lowest-performing standard"
    const strongest = strongestStandard?.standardTitle ?? "your best-performing standard"

    if (reportCount === 0) {
      return "Run more gap analyses to unlock trend intelligence, benchmarking, and anomaly detection."
    }

    return `Across ${reportCount} reports, your average compliance score is ${avg}%. ${strongest} is leading performance, while ${weakest} needs the next evidence push.`
  }, [analytics, strongestStandard, weakestStandard])

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  return (
    <div className="animate-fade-in-up pb-20">
      {/* ─── Header ─── */}
      <header className="mb-8 pt-6 px-4">
        <div className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] glass-panel glass-border p-5 sm:p-7 lg:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_35%),radial-gradient(circle_at_78%_18%,rgba(16,185,129,0.10),transparent_26%)] pointer-events-none" />
          <div className="absolute -right-14 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-2 py-0.5 rounded glass-pill">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Analytics Engine</span>
                </div>
                <div className="h-px w-6 bg-border" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Compliance Intelligence</span>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--text-primary)]">
                  Analytics <span className="text-[var(--text-tertiary)] font-light">& Intelligence</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {executiveSummary}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="p-1 glass-panel rounded-xl glass-border flex flex-wrap items-center gap-1">
                <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5"><Filter className="w-3 h-3" /> Period</span>
                {PERIOD_OPTIONS.map((option) => (
                  <button key={option.key} onClick={() => setPeriod(option.key)} className={cn("px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors min-h-[36px]", period === option.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground glass-button")}>
                    {option.label}
                  </button>
                ))}
              </div>
              <button onClick={() => mutate()} className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] glass-panel rounded-xl glass-border text-[10px] font-bold uppercase tracking-widest transition-all text-muted-foreground"><RefreshCw className="w-3 h-3" /> Refresh</button>
              <button onClick={handleExportCsv} className="flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-[0_18px_36px_-20px_rgba(37,99,235,0.45)] transition-all hover:scale-105 active:scale-95"><Download className="w-3 h-3" /> Export CSV</button>
            </div>
          </div>

          <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {executiveNotes.map((note) => (
              <div key={note.label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{note.label}</p>
                    <p className={cn("mt-2 text-sm sm:text-base font-bold truncate", note.tone)}>{note.value}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <note.icon className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ─── Loading State ─── */}
      {isLoading ? (
        <div className="px-4 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-panel rounded-2xl p-5 glass-border animate-pulse">
                <div className="h-9 w-9 bg-[var(--surface)]/60 rounded-xl mb-3" />
                <div className="h-8 w-16 bg-[var(--surface)]/60 rounded mb-2" />
                <div className="h-3 w-24 bg-[var(--surface)]/50 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-panel glass-border h-80 rounded-3xl p-8 animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="mt-10 px-4">
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl glass-panel glass-border">
            <AlertTriangle className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">Failed to load analytics data.</p>
            <button type="button" onClick={() => mutate()} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">Retry</button>
          </div>
        </div>
      ) : !hasData ? (
        <div className="mt-20"><EmptyState type="reports" /></div>
      ) : (
        <div className="px-4 space-y-8">
          {/* ─── KPI Cards ─── */}
          <AnalyticsKpiCards cards={kpiCards} />

          {(weakestStandard || strongestStandard) && (
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {strongestStandard && (
                <div className="glass-panel glass-border rounded-[26px] p-5 sm:p-6 relative overflow-hidden">
                  <div className="absolute inset-y-0 right-0 w-32 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none" />
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">Strongest Standard</p>
                      <h3 className="mt-2 text-xl font-bold text-foreground">{strongestStandard.standardTitle}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        Leading performance this period with an average score of {Math.round(strongestStandard.avgScore)}% across {strongestStandard.reportCount} reports.
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                      <TrendingUp className="w-5 h-5 text-emerald-300" />
                    </div>
                  </div>
                </div>
              )}

              {weakestStandard && (
                <div className="glass-panel glass-border rounded-[26px] p-5 sm:p-6 relative overflow-hidden">
                  <div className="absolute inset-y-0 right-0 w-32 bg-[radial-gradient(circle_at_center,rgba(201,66,74,0.12),transparent_70%)] pointer-events-none" />
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-300">Needs Attention</p>
                      <h3 className="mt-2 text-xl font-bold text-foreground">{weakestStandard.standardTitle}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        Lowest average score in the selected window at {Math.round(weakestStandard.avgScore)}%. This is the best place to focus your next evidence or analysis cycle.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/platform/gap-analysis")}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-white/[0.07]"
                    >
                      Run Analysis
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ─── Row 1: Trend + Donut ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TrendAreaChart data={trendData} title="Compliance Score Trend" subtitle="Score evolution over time" />
            </div>
            <DonutChart data={statusBreakdown} title="Report Status" subtitle="Breakdown by completion status" />
          </div>

          {/* ─── Row 2: Bar + Radar ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DistributionBarChart data={standardDistribution} title="Standards Performance" subtitle="Average score by standard" />
            <ComplianceRadar data={radarData} title="Compliance Radar" subtitle="Multi-dimensional compliance view" />
          </div>

          {/* ─── Row 3: Score Heatmap + Insights ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScoreHeatmap data={heatmapData} title="Score Breakdown" subtitle="Detailed performance by standard" />
            <AnalyticsInsights insights={insights} />
          </div>

          {/* ─── Anomalies Section ─── */}
          {analytics.anomalies && analytics.anomalies.length > 0 && (
            <section className="glass-panel glass-border relative overflow-hidden rounded-[28px] p-5 sm:p-6 lg:p-7">
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(180,83,9,0.85),transparent)] opacity-70" />
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl status-warning border flex items-center justify-center shadow-[0_18px_40px_-28px_rgba(180,83,9,0.45)]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Anomaly Detection</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.16em]">Reports with z-score &gt; 2 (±{Math.round(analytics.stdDeviation * 2)}% from mean)</p>
                </div>
              </div>
              <div className="relative z-10 space-y-3">
                {analytics.anomalies.map((anomaly: any) => (
                  <div key={anomaly.reportId} className="glass-button flex items-center gap-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-4 transition-all hover:-translate-y-0.5">
                    <div className="w-11 h-11 rounded-2xl status-warning border flex items-center justify-center shrink-0 shadow-[0_18px_34px_-28px_rgba(180,83,9,0.45)]">
                      <span className="mono text-[10px] font-bold">{Math.round(anomaly.score)}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-foreground">{anomaly.standardTitle}</h4>
                      <p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-[0.12em]">z-score: {anomaly.deviation} • {new Date(anomaly.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── Score Distribution (histogram) ─── */}
          {analytics.scoreDistribution && (
            <section className="glass-panel glass-border relative overflow-hidden rounded-[28px] p-5 sm:p-6 lg:p-7">
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(124,92,224,0.85),transparent)] opacity-70" />
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Score Distribution</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.16em] mb-6">Histogram of all report scores</p>
              </div>
              <div className="relative z-10 grid grid-cols-2 md:grid-cols-5 gap-3">
                {analytics.scoreDistribution.map((bucket: any) => {
                  const maxCount = Math.max(...analytics.scoreDistribution.map((b: any) => b.count), 1)
                  const heightPct = bucket.count > 0 ? Math.max((bucket.count / maxCount) * 100, 8) : 4
                  const colors: Record<string, string> = { "0-20": "#c9424a", "21-40": "#b45309", "41-60": "#2563eb", "61-80": "#7c5ce0", "81-100": "#0d9668" }
                  return (
                    <div key={bucket.range} className="flex flex-col items-center gap-2 rounded-[22px] border border-white/8 bg-white/[0.03] p-3">
                      <div className="glass-surface flex h-32 w-full items-end justify-center rounded-xl p-1.5">
                        <div className="w-full rounded-lg transition-all duration-700" style={{ height: `${heightPct}%`, backgroundColor: colors[bucket.range] || "#2563eb" }} />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em]">{bucket.range}%</span>
                      <span className="text-sm font-bold text-foreground">{bucket.count}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
