"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import {
  BarChart3,
  Download,
  Filter,
  Share2,
  Target,
  Zap,
  Globe,
  Cpu,
  X,
} from "lucide-react"
import type { GapAnalysisListItem } from "@/types"

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsContent />
    </ProtectedRoute>
  )
}

function ReportsContent() {
  const { user } = useAuth()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // ESC key to close delete confirmation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && deleteConfirm) {
        setDeleteConfirm(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [deleteConfirm])

  const handleDelete = async (id: string) => {
    try {
      await api.deleteGapAnalysis(id)
      mutate("gap-analyses-archive")
      mutate("archived-gap-analyses")
      setDeleteConfirm(null)
      toast.success("Report deleted successfully")
    } catch (err) {
      toast.error("Failed to delete report")
    }
  }

  const { data: reports } = useSWR<GapAnalysisListItem[]>(
    user ? "gap-analyses-archive" : null,
    () => api.getGapAnalyses(),
  )

  const { data: archivedReports } = useSWR<GapAnalysisListItem[]>(
    user ? "archived-gap-analyses" : null,
    () => api.getArchivedGapAnalyses(),
  )

  const allReports = [...(reports ?? []), ...(archivedReports ?? [])]

  const chartData = allReports.slice(0, 12).map((r) => Math.round(r.overallScore))

  const performanceAreas = allReports.slice(0, 4).map((r, i) => {
    const icons = [Target, Globe, Cpu, Zap]
    const colors = ["bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-cyan-500"]
    return {
      label: r.standardTitle,
      score: Math.round(r.overallScore),
      color: colors[i % colors.length],
      icon: icons[i % icons.length],
    }
  })

  const briefings = allReports.slice(0, 4).map((report) => ({
    id: report.id,
    title: report.standardTitle,
    date: new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    pages: Math.max(1, Math.round(report.overallScore / 10)),
    cat: "AUDIT",
  }))

  return (
    <div className="animate-fade-in-up pb-20">
      <header className="mb-10 pt-6 flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-zinc-800 border border-white/5">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Analytics Layer</span>
            </div>
            <div className="h-px w-6 bg-zinc-900" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Institutional Intelligence</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight italic text-[var(--text-primary)]">
            Reports & <span className="text-[var(--text-tertiary)] not-italic font-light">Insights</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.info("Filter functionality coming soon")}
            className="flex items-center gap-2 px-5 py-2 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--surface)] transition-all border-[var(--border-subtle)]"
          >
            <Filter className="w-3 h-3" /> Filter Period
          </button>
          <button
            onClick={() => toast.info("Exporting distribution data...")}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-600/10 active:scale-95 transition-all"
          >
            <Download className="w-3 h-3" /> Export Intelligence
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 px-4">
        {/* Neural Trend Chart */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-[40px] relative overflow-hidden border-white/5">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Institutional Pulse</h3>
              <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Compliance Equilibrium Trend (6 Months)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Target</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Current</span>
              </div>
            </div>
          </div>

          <div className="h-56 flex items-end gap-2 relative">
            {chartData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm italic">
                No compliance trend data yet. Generate gap analysis reports to see trends.
              </div>
            ) : (
              chartData.map((h, i) => (
                <div key={i} className="flex-1 group relative">
                  <div
                    className="w-full bg-blue-600/30 rounded-t-lg transition-all duration-700 group-hover:bg-blue-500 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    style={{ height: `${h}%` }}
                  />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity mono text-[9px] text-blue-400 font-bold">
                    {h}%
                  </div>
                </div>
              ))
            )}
            <div className="absolute inset-x-0 top-0 h-px bg-white/5 pointer-events-none" />
            <div className="absolute inset-x-0 top-1/4 h-px bg-white/5 pointer-events-none" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/5 pointer-events-none" />
            <div className="absolute inset-x-0 top-3/4 h-px bg-white/5 pointer-events-none" />
          </div>
          <div className="flex justify-between mt-6">
            {chartData.length === 0 ? null : allReports.slice(0, Math.min(chartData.length, 5)).map((r, i) => (
              <span key={i} className="text-[8px] font-bold text-zinc-700 uppercase tracking-[0.3em]">
                {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
              </span>
            ))}
          </div>
        </div>

        {/* Distribution Ring Card */}
        <div className="glass-panel p-8 rounded-[40px] border-[var(--border-subtle)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-8">Performance Distribution</h3>
          <div className="flex-1 space-y-6 flex flex-col justify-center">
            {performanceAreas.length === 0 ? (
              <p className="text-sm text-zinc-600 italic">No distribution data. Reports will appear here.</p>
            ) : (
              performanceAreas.map((item, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
                      <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-tight group-hover:text-[var(--text-primary)] transition-colors">{item.label}</span>
                    </div>
                    <span className="mono text-[11px] font-bold text-[var(--text-primary)]">{item.score}%</span>
                  </div>
                  <div className="h-1 bg-[var(--surface-subtle)] rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.2)]`} style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
            <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Sync Health: 100%</span>
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
          {briefings.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <BarChart3 className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
              <p className="text-sm text-zinc-600 italic">No neural briefings yet. Generate gap analyses to create reports.</p>
            </div>
          ) : (
            briefings.map((item) => (
              <div key={item.id} className="glass-panel p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-[var(--surface)] transition-all border-[var(--border-subtle)]">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center">
                    <span className="mono text-[9px] font-bold text-[var(--text-tertiary)] group-hover:text-blue-500 transition-colors">{item.cat}</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{item.title}</h4>
                    <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest mt-0.5">{item.date} • {item.pages} Pages</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toast.info("Generating shareable link...") }}
                    className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                    aria-label="Share report"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toast.info("Downloading report...") }}
                    className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                    aria-label="Download report"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item.id) }}
                    className="p-2 text-[var(--text-tertiary)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 group-focus:opacity-100"
                    aria-label="Delete report"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
            <div
              role="dialog"
              aria-modal="true"
              className="bg-[var(--surface-modal)] rounded-3xl p-8 max-w-md w-full border border-[var(--border-subtle)] shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Delete Report?</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-8 leading-relaxed">
                This will permanently remove the neural briefing and associated intelligence metadata. This action cannot be reversed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--surface)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
