"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { BarChart3, Filter, Target, Zap, Globe, Cpu, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { GapAnalysisListItem } from "@/types"

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

  const { data: reports } = useSWR<GapAnalysisListItem[]>(
    user ? "gap-analyses" : null,
    () => api.getGapAnalyses(),
  )

  // Derive chart data from reports (reversed to show chronological left-to-right)
  // If no reports, we show a greyed out "No Data" placeholder
  const chartValues = reports && reports.length > 0
    ? reports.slice(0, 12).reverse().map(r => Math.round(r.overallScore))
    : []

  const chartLabels = reports && reports.length > 0
    ? reports.slice(0, 12).reverse().map(r => new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))
    : []

  // Derive distribution from unique standards in reports
  const distributionData = reports?.slice(0, 4).map((r, i) => {
    const colors = ["bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-cyan-500"]
    const icons = [Target, Globe, Cpu, Zap]
    return {
      label: r.standardTitle,
      score: Math.round(r.overallScore),
      color: colors[i % colors.length],
      icon: icons[i % icons.length]
    }
  }) || []

  return (
    <div className="animate-fade-in-up pb-20">
      <header className="mb-10 pt-6 flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-zinc-800 border border-[var(--border-subtle)]">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Analytics Layer</span>
            </div>
            <div className="h-px w-6 bg-zinc-900" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Institutional Intelligence</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight italic text-[var(--text-primary)]">Reports & <span className="text-[var(--text-tertiary)] not-italic font-light">Insights</span></h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.info('Period filtering is active for current fiscal quarter')}
            className="flex items-center gap-2 px-5 py-2 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all border-[var(--border-subtle)] text-[var(--text-secondary)]"
          >
            <Filter className="w-3 h-3" /> Filter Period
          </button>
          <button
            onClick={() => toast.info('Export formatted reports from the Insight Hub below')}
            className="flex items-center gap-2 px-5 py-2 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
          >
            Export Intelligence
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 px-4">
        {/* Neural Trend Chart */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-[40px] relative overflow-hidden border-[var(--border-subtle)]">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Institutional Pulse</h3>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Compliance Equilibrium Trend</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Target</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current</span>
              </div>
            </div>
          </div>

          <div className="h-56 flex items-end gap-2 relative">
            {chartValues.length > 0 ? (
              chartValues.map((h, i) => (
                <div key={i} className="flex-1 group relative">
                  <div
                    className="w-full bg-blue-600/30 rounded-t-lg transition-all duration-700 group-hover:bg-blue-500 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    style={{ height: `${Math.max(h, 5)}%` }}
                  />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity mono text-[10px] text-blue-400 font-bold">
                    {h}%
                  </div>
                </div>
              ))
            ) : (
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                <div className="text-zinc-700 text-sm font-bold uppercase tracking-widest">No Trend Data</div>
                <div className="text-zinc-800 text-[10px]">Run an alignment analysis to populate</div>
              </div>
            )}

            {/* Horizontal Grid lines */}
            <div className="absolute inset-x-0 top-0 h-px bg-white/5 pointer-events-none" />
            <div className="absolute inset-x-0 top-1/4 h-px bg-white/5 pointer-events-none" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/5 pointer-events-none" />
            <div className="absolute inset-x-0 top-3/4 h-px bg-white/5 pointer-events-none" />
          </div>
          <div className="flex justify-between mt-6 px-1">
            {chartLabels.map((m, i) => (
              <span key={i} className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest truncate max-w-[40px]">{m}</span>
            ))}
          </div>
        </div>

        {/* Distribution Ring Card */}
        <div className="glass-panel p-8 rounded-[40px] border-[var(--border-subtle)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-8">Performance Distribution</h3>
          <div className="flex-1 space-y-6 flex flex-col justify-center">
            {distributionData.length > 0 ? (
              distributionData.map((item, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight group-hover:text-zinc-300 transition-colors truncate max-w-[140px]">{item.label}</span>
                    </div>
                    <span className="mono text-[10px] font-bold text-[var(--text-primary)]">{item.score}%</span>
                  </div>
                  <div className="h-1 bg-white/[0.02] rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.2)]`} style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center opacity-40">
                <Target className="w-8 h-8 text-zinc-700 mb-2" />
                <p className="text-[10px] uppercase font-bold text-zinc-600">No Distribution Data</p>
              </div>
            )}
          </div>
          <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex justify-between items-center">
            <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Sync Health: {reports ? "100%" : "—"}</span>
            <BarChart3 className="w-4 h-4 text-zinc-800" />
          </div>
        </div>
      </div>

      <section className="px-4">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-black italic text-[var(--text-primary)]">Neural Briefings</h2>
          <div className="h-px w-20 bg-[var(--border-subtle)]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports && reports.length > 0 ? (
            reports.map((item, i) => (
              <div
                key={item.id}
                onClick={() => router.push('/platform/gap-analysis')}
                className="glass-panel p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-[var(--surface)] transition-all border-[var(--border-subtle)] animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)] flex items-center justify-center">
                    <span className="mono text-[10px] font-bold text-zinc-500 group-hover:text-blue-500 transition-colors">RPT</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
                      {item.standardTitle} Analysis
                    </h4>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString()} • {Math.round(item.overallScore)}% Score
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center glass-panel rounded-[32px] border-dashed border-[var(--border-subtle)]">
              <p className="text-zinc-600 text-sm font-medium">No intelligence briefings generated yet.</p>
              <button
                onClick={() => router.push('/platform/gap-analysis')}
                className="mt-4 text-xs font-bold text-blue-500 uppercase tracking-widest hover:text-blue-400 pointer-cursor"
              >
                Generate First Report
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

