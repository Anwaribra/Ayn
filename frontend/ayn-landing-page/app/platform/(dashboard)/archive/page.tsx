"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { toast } from "sonner"
import { useCallback } from "react"
import {
  BarChart3,
  Download,
  Filter,
  Share2,
  Target,
  Zap,
  Globe,
  Cpu,
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

  const { data: reports } = useSWR<GapAnalysisListItem[]>(
    user ? "gap-analyses-archive" : null,
    () => api.getGapAnalyses(),
  )

  const { data: archivedReports } = useSWR<GapAnalysisListItem[]>(
    user ? "archived-gap-analyses" : null,
    () => api.getArchivedGapAnalyses(),
  )

  const allReports = [...(reports ?? []), ...(archivedReports ?? [])]

  // Generate chart data from reports (recent scores)
  const chartData = allReports.slice(0, 12).map((r) => Math.round(r.overallScore))
  const fallbackChart = [30, 45, 35, 70, 55, 84, 90, 75, 88, 82, 95, 89]
  const barData = chartData.length > 0 ? chartData : fallbackChart

  // Performance distribution
  const performanceAreas = [
    { label: "Teaching Quality", score: 92, color: "bg-blue-500", icon: Target },
    { label: "Student Support", score: 78, color: "bg-indigo-500", icon: Globe },
    { label: "Research Matrix", score: 64, color: "bg-purple-500", icon: Cpu },
    { label: "Institutional Infra", score: 85, color: "bg-cyan-500", icon: Zap },
  ]

  // Briefing documents from real reports
  const briefings = allReports.slice(0, 4).map((report) => ({
    id: report.id,
    title: report.standardTitle,
    date: new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    pages: report.totalItems,
    cat: "AUDIT",
  }))

  const fallbackBriefings = [
    { id: "1", title: "Compliance Cycle Intelligence", date: "Jan 12, 2025", pages: 14, cat: "AUDIT" },
    { id: "2", title: "Strategic Resource Forecast", date: "Jan 10, 2025", pages: 8, cat: "PLAN" },
    { id: "3", title: "Faculty Accreditation Deep Dive", date: "Jan 05, 2025", pages: 22, cat: "HR" },
    { id: "4", title: "Infrastructure Resilience Hub", date: "Dec 28, 2024", pages: 11, cat: "OPS" },
  ]

  const displayBriefings = briefings.length > 0 ? briefings : fallbackBriefings

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
          <h1 className="text-4xl font-black tracking-tight italic text-white">
            Reports & <span className="text-zinc-700 not-italic font-light">Insights</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-5 py-2 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all border-white/5">
            <Filter className="w-3 h-3" /> Filter Period
          </button>
          <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-600/10 active:scale-95 transition-all">
            <Download className="w-3 h-3" /> Export Intelligence
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 px-4">
        {/* Neural Trend Chart */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-[40px] relative overflow-hidden border-white/5">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Institutional Pulse</h3>
              <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">Compliance Equilibrium Trend (6 Months)</p>
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
            {barData.map((h, i) => (
              <div key={i} className="flex-1 group relative">
                <div
                  className="w-full bg-blue-600/30 rounded-t-lg transition-all duration-700 group-hover:bg-blue-500 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                  style={{ height: `${h}%` }}
                />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity mono text-[9px] text-blue-400 font-bold">
                  {h}%
                </div>
              </div>
            ))}
            <div className="absolute inset-x-0 top-0 h-px bg-white/5 pointer-events-none" />
            <div className="absolute inset-x-0 top-1/4 h-px bg-white/5 pointer-events-none" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/5 pointer-events-none" />
            <div className="absolute inset-x-0 top-3/4 h-px bg-white/5 pointer-events-none" />
          </div>
          <div className="flex justify-between mt-6">
            {["Q1-24", "Q2-24", "Q3-24", "Q4-24", "Q1-25"].map((m, i) => (
              <span key={i} className="text-[8px] font-bold text-zinc-700 uppercase tracking-[0.3em]">{m}</span>
            ))}
          </div>
        </div>

        {/* Distribution Ring Card */}
        <div className="glass-panel p-8 rounded-[40px] border-white/5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
          <h3 className="text-lg font-bold text-white mb-8">Performance Distribution</h3>
          <div className="flex-1 space-y-6 flex flex-col justify-center">
            {performanceAreas.map((item, i) => (
              <div key={i} className="group">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight group-hover:text-zinc-300 transition-colors">{item.label}</span>
                  </div>
                  <span className="mono text-[11px] font-bold text-white">{item.score}%</span>
                </div>
                <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.2)]`} style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
            <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Sync Health: 100%</span>
            <BarChart3 className="w-4 h-4 text-zinc-800" />
          </div>
        </div>
      </div>

      <section className="px-4">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-black italic text-white">Neural Briefings</h2>
          <div className="h-px w-20 bg-zinc-900" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayBriefings.map((item, i) => (
            <div key={item.id} className="glass-panel p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/[0.04] transition-all border-white/5">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                  <span className="mono text-[9px] font-bold text-zinc-600 group-hover:text-blue-500 transition-colors">{item.cat}</span>
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-zinc-200 group-hover:text-white transition-colors">{item.title}</h4>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">{item.date} • {item.pages} Pages</p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                <button className="p-2 text-zinc-600 hover:text-white transition-colors"><Share2 className="w-4 h-4" /></button>
                <button className="p-2 text-zinc-600 hover:text-white transition-colors"><Download className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
