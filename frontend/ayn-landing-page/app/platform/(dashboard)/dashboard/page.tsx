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
} from "lucide-react"
import type { DashboardMetrics } from "@/types"

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
  )

  const { data: notifications } = useSWR(
    user ? [`notifications`, user.id] : null,
    () => api.getNotifications(),
  )

  const { data: gapAnalyses } = useSWR(
    user ? [`gap-analyses`, user.id] : null,
    () => api.getGapAnalyses(),
  )

  const healthScore = metrics?.assessmentProgressPercentage ?? 0
  const evidenceCount = metrics?.evidenceCount ?? 0
  const completedCriteria = metrics?.completedCriteriaCount ?? 0
  const activeGaps = gapAnalyses?.length ?? 0
  const recentNotifs = notifications?.slice(0, 4) ?? []

  const needsAuditStandard = (gapAnalyses ?? []).find((g: { overallScore: number }) => (g.overallScore ?? 100) < 80)
  const suggestionsFromData = (gapAnalyses ?? [])
    .filter((g: { overallScore: number }) => (g.overallScore ?? 100) < 80)
    .slice(0, 3)
    .map((g: { id: string; standardTitle: string }) => ({
      title: `Review ${g.standardTitle}`,
      cat: "Compliance",
      desc: "Gap analysis indicates remediation needed.",
      icon: ShieldCheck,
      href: "/platform/gap-analysis",
    }))

  // Calculate stroke offset for SVG circle (754 total circumference, 120px radius)
  const strokeOffset = 754 - (754 * healthScore) / 100

  return (
    <div className="animate-fade-in-up space-y-12 pb-20">
      {/* Live Command Header */}
      <section className="pt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Visualizer */}
          <div className="flex-1 relative group">
            <div className="w-full h-96 rounded-[48px] overflow-hidden glass-panel flex items-center justify-between px-10 md:px-16 relative border-none">
              <div className="relative z-10 max-w-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Ayn Core Live</span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    Sync: {isLoading ? "..." : "—"}
                  </span>
                </div>

                <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 leading-tight italic text-white">
                  Institutional <br />
                  <span className="text-zinc-600">Equilibrium.</span>
                </h1>

                <p className="text-lg text-zinc-400 font-medium mb-10 max-w-sm leading-relaxed">
                  {needsAuditStandard
                    ? <>Compliance drift detected. Horus recommends an audit of <Link href="/platform/gap-analysis" className="text-blue-400 hover:underline">{(needsAuditStandard as { standardTitle: string }).standardTitle}</Link> to mitigate drift.</>
                    : "Compliance is holding steady. Run a gap analysis to assess framework alignment."}
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/platform/gap-analysis"
                    className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-3xl font-bold text-sm hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-white/10"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Launch Global Audit
                  </Link>
                  <Link
                    href="/platform/gap-analysis"
                    className="px-8 py-4 glass-panel rounded-3xl font-bold text-sm hover:bg-white/10 transition-all border-white/5"
                  >
                    Map Gap Topology
                  </Link>
                </div>
              </div>

              {/* Radial Health Score */}
              <div className="relative w-72 h-72 z-10 hidden lg:flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_10s_linear_infinite] opacity-20" />
                <svg className="w-full h-full transform -rotate-90" style={{ filter: "drop-shadow(0 0 12px rgba(37,99,235,0.3))" }}>
                  <circle cx="144" cy="144" r="120" stroke="rgba(255,255,255,0.03)" strokeWidth="16" fill="transparent" />
                  <circle
                    cx="144" cy="144" r="120"
                    stroke="url(#blueGradient)" strokeWidth="16"
                    fill="transparent"
                    strokeDasharray="754" strokeDashoffset={strokeOffset}
                    className="transition-all duration-1000"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="mono text-7xl font-black tracking-tighter text-white">
                    {isLoading ? "—" : Math.round(healthScore)}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">Health Index</span>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 via-transparent to-indigo-600/5 pointer-events-none" />
            </div>
          </div>

          {/* Neural Activity Feed */}
          <div className="w-full lg:w-80 glass-panel rounded-[40px] p-8 flex flex-col border-white/5">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3 h-3" /> Live Feed
              </h3>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            </div>

            <div className="flex-1 space-y-6 overflow-hidden">
              {recentNotifs.length === 0 ? (
                <div className="text-sm text-zinc-600 italic py-4">No recent activity.</div>
              ) : (
                recentNotifs.map((notif, i) => (
                  <div key={notif.id} className="flex gap-4 group">
                    <span className="mono text-[10px] text-zinc-700 font-bold mt-0.5">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div>
                      <p className={`text-[12px] font-bold ${!notif.read ? "text-amber-500" : "text-zinc-400"} group-hover:text-white transition-colors cursor-default`}>
                        {notif.title}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link href="/platform/archive" className="mt-8 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white text-center block">
              View Audit History
            </Link>
          </div>
        </div>
      </section>

      {/* Primary Metrics Grid */}
      <section>
        <div className="flex items-center justify-between mb-10 px-4">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black tracking-tight italic">Executive Pulse</h2>
            <div className="h-px w-20 bg-zinc-800" />
          </div>
          <button className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline">Download Report</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: "Verified Standards", value: isLoading ? "—" : String(completedCriteria), sub: "Compliance", icon: ShieldCheck, color: "text-blue-500", glow: "shadow-blue-500/10" },
            { label: "Evidence Matrix", value: isLoading ? "—" : String(evidenceCount), sub: "Indexed Assets", icon: Archive, color: "text-indigo-500", glow: "shadow-indigo-500/10" },
            { label: "Critical Gaps", value: isLoading ? "—" : String(activeGaps).padStart(2, "0"), sub: "Needs Action", icon: Zap, color: "text-amber-500", glow: "shadow-amber-500/10" },
            { label: "Sync Latency", value: isLoading ? "—" : "—", sub: "Neural Bridge", icon: Cpu, color: "text-emerald-500", glow: "shadow-emerald-500/10" },
          ].map((m, i) => (
            <div key={i} className="group cursor-pointer">
              <div className={`
                glass-panel p-8 rounded-[40px] aspect-square flex flex-col justify-between transition-all duration-500
                group-hover:-translate-y-3 group-hover:bg-white/[0.04] border-white/5 ${m.glow} group-hover:shadow-2xl
              `}>
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                    <m.icon className={`w-6 h-6 ${m.color}`} />
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <div className="mono text-6xl font-black tracking-tighter mb-2 text-white">{m.value}</div>
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{m.label}</div>
                    <div className="text-[10px] font-bold text-zinc-700 uppercase tracking-tighter italic">{m.sub}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Suggested Strategy Section */}
      <section>
        <div className="flex items-center justify-between mb-8 px-4">
          <h2 className="text-2xl font-bold tracking-tight">Intelligence Suggestions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestionsFromData.length === 0 ? (
            <div className="col-span-full glass-panel p-8 rounded-[36px] border-white/5 text-center">
              <p className="text-sm text-zinc-600 italic">No intelligence suggestions. Standards and gap analyses will drive recommendations.</p>
              <Link href="/platform/standards" className="inline-block mt-4 text-blue-500 text-xs font-bold hover:underline">Create Standards</Link>
            </div>
          ) : (
          suggestionsFromData.map((item, i) => (
            <Link key={item.title} href={item.href} className="glass-panel p-8 rounded-[36px] group hover:bg-white/5 transition-all border-white/5 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-700">{item.cat}</span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-zinc-100 mb-2 leading-tight">{item.title}</h4>
                <p className="text-sm text-zinc-500 mb-6 font-medium">{item.desc}</p>
                <span className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-white transition-colors group/btn">
                  Initiate Neural Procedure <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))
          )}
        </div>
      </section>
    </div>
  )
}
