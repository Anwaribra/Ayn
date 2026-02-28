"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { useMemo, useState } from "react"
import { BarChart3, Filter, Target, Zap, Globe, Cpu, ChevronRight, Download, RefreshCw, TrendingUp, Activity } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { GapAnalysisListItem } from "@/types"
import { EmptyState } from "@/components/platform/empty-state"
import { cn } from "@/lib/utils"

type PeriodKey = "7d" | "30d" | "90d" | "all"

type DistributionItem = {
  label: string
  score: number
  count: number
  color: string
  icon: React.ComponentType<{ className?: string }>
}

const PERIOD_OPTIONS: { key: PeriodKey; label: string; days: number | null }[] = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "all", label: "All", days: null },
]

function getCutoff(days: number | null): number | null {
  if (days === null) return null
  return Date.now() - days * 24 * 60 * 60 * 1000
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "")
          const escaped = value.replace(/"/g, '""')
          return `"${escaped}"`
        })
        .join(",")
    )
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

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  )
}

function AnalyticsContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [period, setPeriod] = useState<PeriodKey>("30d")

  const {
    data: reports,
    isLoading,
    error,
    mutate,
  } = useSWR<GapAnalysisListItem[]>(user ? "gap-analyses" : null, () => api.getGapAnalyses())

  const allReports = useMemo(() => reports ?? [], [reports])

  const filteredReports = useMemo(() => {
    if (allReports.length === 0) return []
    const cutoff = getCutoff(PERIOD_OPTIONS.find((opt) => opt.key === period)?.days ?? null)

    const result = allReports.filter((r) => {
      if (cutoff === null) return true
      return new Date(r.createdAt).getTime() >= cutoff
    })

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [allReports, period])

  const chartData = useMemo(
    () =>
      [...filteredReports]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((r) => ({
          date: new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          score: Math.round(r.overallScore),
          standard: r.standardTitle,
        })),
    [filteredReports]
  )

  const distributionData = useMemo<DistributionItem[]>(() => {
    if (filteredReports.length === 0) return []

    const grouped = new Map<string, { totalScore: number; count: number }>()
    for (const report of filteredReports) {
      const current = grouped.get(report.standardTitle) ?? { totalScore: 0, count: 0 }
      current.totalScore += report.overallScore
      current.count += 1
      grouped.set(report.standardTitle, current)
    }

    const icons = [Target, Globe, Cpu, Zap]
    const colors = ["var(--primary)", "var(--status-info)", "var(--status-success)", "var(--status-warning)"]

    return [...grouped.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4)
      .map(([label, value], i) => ({
        label,
        score: Math.round(value.totalScore / value.count),
        count: value.count,
        icon: icons[i % icons.length],
        color: colors[i % colors.length],
      }))
  }, [filteredReports])

  const kpis = useMemo(() => {
    const total = filteredReports.length
    const avg = total > 0 ? Math.round(filteredReports.reduce((sum, r) => sum + r.overallScore, 0) / total) : 0
    const latest = filteredReports[0]
    const previous = filteredReports[1]
    const delta = latest && previous ? Math.round(latest.overallScore - previous.overallScore) : 0
    const uniqueStandards = new Set(filteredReports.map((r) => r.standardTitle)).size

    return {
      total,
      avg,
      latest: latest ? Math.round(latest.overallScore) : 0,
      delta,
      uniqueStandards,
      lastCreatedAt: latest?.createdAt,
    }
  }, [filteredReports])

  const syncHealth = useMemo(() => {
    if (!kpis.lastCreatedAt) return "—"
    const ageDays = Math.floor((Date.now() - new Date(kpis.lastCreatedAt).getTime()) / (24 * 60 * 60 * 1000))
    if (ageDays <= 7) return "100%"
    if (ageDays <= 30) return "75%"
    return "50%"
  }, [kpis.lastCreatedAt])

  const handleExportCsv = () => {
    if (filteredReports.length === 0) {
      toast.info("No reports in selected period")
      return
    }

    const rows: string[][] = [
      ["Report ID", "Standard", "Score", "Status", "Summary", "Created At"],
      ...filteredReports.map((r) => [
        r.id,
        r.standardTitle,
        String(Math.round(r.overallScore)),
        r.status ?? "completed",
        r.summary ?? "",
        new Date(r.createdAt).toISOString(),
      ]),
    ]

    downloadCsv(`analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`, rows)
    toast.success("CSV exported")
  }

  return (
    <div className="animate-fade-in-up pb-20">
      <header className="mb-8 pt-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-muted border border-[var(--border-subtle)]">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Analytics Layer</span>
            </div>
            <div className="h-px w-6 bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Institutional Intelligence</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight italic text-[var(--text-primary)]">
            Reports & <span className="text-[var(--text-tertiary)] not-italic font-light">Insights</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="p-1 glass-panel rounded-xl border-[var(--border-subtle)] flex items-center gap-1">
            <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5">
              <Filter className="w-3 h-3" /> Period
            </span>
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => setPeriod(option.key)}
                className={cn(
                  "px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors min-h-[36px]",
                  period === option.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => mutate()}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all border-[var(--border-subtle)] text-muted-foreground"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
          >
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="px-4 grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 border-[var(--border-subtle)] animate-pulse">
              <div className="h-3 w-20 bg-muted rounded mb-3" />
              <div className="h-8 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-10 px-4">
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-border bg-muted/30">
            <p className="text-muted-foreground text-center mb-4">Failed to load analytics data.</p>
            <button
              type="button"
              onClick={() => mutate()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="mt-20">
          <EmptyState type="reports" />
        </div>
      ) : (
        <>
          <section className="px-4 mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel rounded-2xl p-5 border-[var(--border-subtle)]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reports</p>
                <p className="mt-2 text-3xl font-black text-foreground">{kpis.total}</p>
              </div>
              <div className="glass-panel rounded-2xl p-5 border-[var(--border-subtle)]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg Score</p>
                <p className="mt-2 text-3xl font-black text-foreground">{kpis.avg}%</p>
              </div>
              <div className="glass-panel rounded-2xl p-5 border-[var(--border-subtle)]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Latest Trend</p>
                <p className="mt-2 text-3xl font-black text-foreground inline-flex items-center gap-2">
                  {kpis.delta > 0 && <TrendingUp className="w-5 h-5 text-emerald-500" />}
                  {kpis.delta >= 0 ? `+${kpis.delta}` : kpis.delta}%
                </p>
              </div>
              <div className="glass-panel rounded-2xl p-5 border-[var(--border-subtle)]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Standards</p>
                <p className="mt-2 text-3xl font-black text-foreground">{kpis.uniqueStandards}</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 px-4">
            <div className="lg:col-span-2 glass-panel p-8 rounded-[40px] relative overflow-hidden border-[var(--border-subtle)]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Institutional Pulse</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Compliance score over time</p>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Score</span>
                </div>
              </div>

              <div className="h-64 w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "var(--text-secondary)", fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "var(--text-secondary)", fontWeight: 700 }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--surface-modal)",
                        borderColor: "var(--border-subtle)",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      }}
                      itemStyle={{ color: "var(--text-primary)", fontWeight: "bold" }}
                      labelStyle={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "4px" }}
                      formatter={(value) => [`${value}%`, "Score"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorScore)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-[40px] border-[var(--border-subtle)] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl pointer-events-none" />
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-8">Performance Distribution</h3>
              <div className="flex-1 space-y-5 flex flex-col justify-center">
                {distributionData.map((item, i) => (
                  <div key={`${item.label}-${i}`} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight group-hover:text-foreground transition-colors truncate max-w-[140px]">
                          {item.label}
                        </span>
                      </div>
                      <span className="mono text-[10px] font-bold text-[var(--text-primary)]">{item.score}%</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden mb-1.5">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.score}%`, backgroundColor: item.color }} />
                    </div>
                    <div className="text-[10px] text-muted-foreground">{item.count} report{item.count > 1 ? "s" : ""}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sync Health: {syncHealth}</span>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <section className="px-4">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-black italic text-[var(--text-primary)]">Neural Briefings</h2>
              <div className="h-px w-20 bg-[var(--border-subtle)]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReports.map((item, i) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/platform/gap-analysis?report=${item.id}`)}
                  className="glass-panel p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-[var(--surface)] transition-all border-[var(--border-subtle)] animate-fade-in-up opacity-0"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "forwards" }}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-muted border border-[var(--border-subtle)] flex items-center justify-center">
                      <span className="mono text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">RPT</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {item.standardTitle} Analysis
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString()} • {Math.round(item.overallScore)}% Score
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
