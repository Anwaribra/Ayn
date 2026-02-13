"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import Link from "next/link"
import {
  ShieldCheck,
  Zap,
  Play,
  Archive,
  ChevronRight,
  Activity,
  Cpu,
  ArrowUpRight,
  FileText,
  AlertTriangle
} from "lucide-react"
import type { DashboardMetrics } from "@/types"
import { EmptyState } from "@/components/platform/empty-state"
import { DashboardMetricsSkeleton } from "@/components/platform/skeleton-loader"
import { SystemLog } from "@/components/platform/system-log"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user } = useAuth()

  const { data: metrics, isLoading } = useSWR<DashboardMetrics>(
    user ? [`dashboard-metrics`, user.id] : null,
    () => api.getDashboardMetrics(),
    { refreshInterval: 30000 }
  )

  const alignmentScore = metrics?.alignmentPercentage ?? 0
  const evidenceCount = metrics?.evidenceCount ?? 0
  const alignedCriteria = metrics?.alignedCriteriaCount ?? 0
  const activeGaps = metrics?.totalGapAnalyses ?? 0

  // Calculate stroke offset for SVG circle
  const strokeOffset = 754 - (754 * alignmentScore) / 100

  return (
    <div className="animate-fade-in-up space-y-12 pb-20">
      {/* Dynamic Command Center Header */}
      <section className="pt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Visualizer */}
          <div className="flex-1 relative group">
            <div className="w-full min-h-[350px] md:h-[400px] rounded-[48px] overflow-hidden glass-panel flex items-center justify-between px-6 sm:px-10 md:px-16 relative border-none bg-gradient-to-br from-zinc-900 to-black">
              <div className="relative z-10 max-w-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Ayn Brain Live</span>
                  </div>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9] italic text-white">
                  Institutional <br />
                  <span className="text-zinc-600">Intelligence.</span>
                </h1>

                <p className="text-lg text-zinc-400 font-medium mb-12 max-w-sm leading-relaxed">
                  Horus is active. Your compliance framework is mapped with <span className="text-white font-bold">{alignmentScore}%</span> accuracy across <span className="text-white font-bold">{evidenceCount}</span> verified assets.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/platform/horus-ai"
                    className="flex items-center gap-3 px-10 py-5 bg-blue-600 text-white rounded-[24px] font-black text-sm hover:bg-blue-500 transition-all active:scale-95 shadow-2xl shadow-blue-500/20"
                  >
                    <Cpu className="w-4 h-4" />
                    Consult Horus AI
                  </Link>
                  <Link
                    href="/platform/gap-analysis"
                    className="flex items-center gap-3 px-10 py-5 glass-panel rounded-[24px] font-black text-sm hover:bg-white/10 transition-all border-white/10 text-white"
                  >
                    Run Fresh Audit
                  </Link>
                </div>
              </div>

              {/* Radial Health Score - Premium Design */}
              <div className="relative w-80 h-80 z-10 hidden lg:flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-blue-500/5 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-8 rounded-full border border-emerald-500/5 animate-[spin_15s_linear_infinite_reverse]" />

                <svg className="w-full h-full transform -rotate-90" style={{ filter: "drop-shadow(0 0 20px rgba(37,99,235,0.2))" }}>
                  <circle cx="160" cy="160" r="120" stroke="rgba(255,255,255,0.03)" strokeWidth="12" fill="transparent" />
                  <circle
                    cx="160" cy="160" r="120"
                    stroke="url(#dashHealthGrad)" strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="754" strokeDashoffset={strokeOffset}
                    className="transition-all duration-[1500ms] ease-out"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="dashHealthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="flex items-baseline gap-1">
                    <span className="mono text-8xl font-black tracking-tighter text-white">
                      {isLoading ? "—" : Math.round(alignmentScore)}
                    </span>
                    <span className="text-2xl font-black text-zinc-600">%</span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-2">Alignment Index</span>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-emerald-600/5 pointer-events-none" />
            </div>
          </div>

          {/* Activity Stream Sidebar */}
          <div className="w-full lg:w-96 flex flex-col gap-6">
            <SystemLog className="h-full" maxEntries={6} />
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Compliance Score", value: `${alignmentScore}%`, sub: "Global Health", icon: ShieldCheck, color: "text-blue-500" },
            { label: "Evidence Vault", value: String(evidenceCount), sub: "Verified Assets", icon: Archive, color: "text-emerald-500" },
            { label: "Critical Gaps", value: String(activeGaps), sub: "Needs Action", icon: AlertTriangle, color: "text-amber-500" },
            { label: "Recent Performance", value: metrics?.recentScores?.[0]?.score ? `${metrics.recentScores[0].score}%` : "Stable", sub: "Trend", icon: Zap, color: "text-indigo-500" },
          ].map((m, i) => (
            <div key={i} className="glass-panel p-8 rounded-[40px] border-white/5 flex flex-col justify-between min-h-[180px] hover:bg-white/[0.02] transition-colors group">
              <div className="flex justify-between items-start">
                <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110", m.color)}>
                  <m.icon className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-800 group-hover:text-zinc-500 transition-colors" />
              </div>
              <div>
                <div className="text-4xl font-black tracking-tighter text-white mb-1">{m.value}</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">{m.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Evidence & Scores Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Evidence */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-[48px] border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white italic">Recent Evidence</h3>
            <Link href="/platform/evidence" className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline">View Library</Link>
          </div>

          <div className="space-y-4">
            {metrics?.recentEvidence?.length === 0 ? (
              <p className="text-center py-12 text-zinc-600 italic">No evidence uploaded yet.</p>
            ) : (
              metrics?.recentEvidence?.map((ev: any) => (
                <div key={ev.id} className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-zinc-100 truncate">{ev.title || ev.originalFilename}</h4>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">{ev.status}</p>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-600">
                    {new Date(ev.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Performance Log */}
        <div className="glass-panel p-8 rounded-[48px] border-white/5">
          <h3 className="text-xl font-black text-white italic mb-8">Score History</h3>
          <div className="space-y-6">
            {metrics?.recentScores?.length === 0 ? (
              <p className="text-center py-12 text-zinc-600 italic">Analytical data pending.</p>
            ) : (
              metrics?.recentScores?.map((s: any, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate max-w-[150px]">{s.standard}</span>
                    <span className="text-xs font-black text-white">{s.score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        s.score >= 80 ? "bg-emerald-500" : s.score >= 50 ? "bg-amber-500" : "bg-red-500"
                      )}
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-12 p-6 rounded-[32px] bg-blue-500/5 border border-blue-500/10">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-2">Horus Tip</p>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Try uploading more evidence for the gaps Identified in your latest NAQAAE analysis to bump the index.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
