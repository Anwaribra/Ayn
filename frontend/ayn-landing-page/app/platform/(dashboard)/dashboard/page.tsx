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
import { EmptyState } from "@/components/platform/empty-state"
import { DashboardMetricsSkeleton, SuggestionsGridSkeleton } from "@/components/platform/skeleton-loader"
import { SystemLog } from "@/components/platform/system-log"
import { SystemStatusWidget } from "@/components/platform/horus-ai-enhanced"
import { toast } from "sonner"

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

  const alignmentScore = metrics?.alignmentPercentage ?? 0
  const evidenceCount = metrics?.evidenceCount ?? 0
  const alignedCriteria = metrics?.alignedCriteriaCount ?? 0
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
  const strokeOffset = 754 - (754 * alignmentScore) / 100

  return (
    <div className="animate-fade-in-up space-y-12 pb-20">
      {/* Live Command Header */}
      <section className="pt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Visualizer */}
          <div className="flex-1 relative group">
            <div className="w-full min-h-[320px] md:h-96 rounded-[32px] md:rounded-[48px] overflow-hidden glass-panel flex items-center justify-between px-6 sm:px-10 md:px-16 relative border-none">
              <div className="relative z-10 max-w-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Ayn Core Live</span>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
                    Sync: Real-time
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-6 leading-tight italic text-[var(--text-primary)]">
                  Institutional <br />
                  <span className="text-[var(--text-tertiary)]">Equilibrium.</span>
                </h1>

                <p className="text-lg text-[var(--text-secondary)] font-medium mb-10 max-w-sm leading-relaxed">
                  {needsAuditStandard
                    ? <>Alignment drift detected. Horus recommends a self-review of <Link href="/platform/gap-analysis" className="text-blue-400 hover:underline">{(needsAuditStandard as { standardTitle: string }).standardTitle}</Link> to ensure consistency.</>
                    : "Your compliance workspace is ready. Upload evidence or run an alignment analysis to begin."}
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/platform/gap-analysis"
                    className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-3xl font-bold text-sm hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-white/10"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Launch Alignment Review
                  </Link>
                  <Link
                    href="/platform/evidence"
                    className="px-8 py-4 glass-panel rounded-3xl font-bold text-sm hover:bg-white/10 transition-all border-white/5"
                  >
                    Evidence Library
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
                    stroke="url(#dashHealthGrad)" strokeWidth="16"
                    fill="transparent"
                    strokeDasharray="754" strokeDashoffset={strokeOffset}
                    className="transition-all duration-1000"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="dashHealthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center" role="img" aria-label={`Alignment Index: ${Math.round(alignmentScore)} percent`}>
                  <span className="mono text-7xl font-black tracking-tighter text-[var(--text-primary)]">
                    {isLoading ? "—" : Math.round(alignmentScore)}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.3em] mt-2">Alignment Index</span>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 via-transparent to-indigo-600/5 pointer-events-none" />
            </div>
          </div>

          {/* Neural Activity Feed */}
          <div className="w-full lg:w-80 glass-panel rounded-[32px] md:rounded-[40px] p-6 md:p-8 flex flex-col border-white/5">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3 h-3" /> Live Feed
              </h3>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            </div>

            {/* System Log Component */}
            <div className="flex-1 overflow-hidden">
              <SystemLog showHeader={false} maxEntries={5} />
            </div>
          </div>
        </div>
      </section>

      {/* Primary Metrics Grid */}
      <section>
        <div className="flex items-center justify-between mb-10 px-4">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black tracking-tight italic">Executive Pulse</h2>
            <div className="h-px w-20 bg-[var(--border-subtle)]" />
          </div>
          <Link
            href="/platform/analytics"
            className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline"
          >
            View Reports
          </Link>
        </div>

        {isLoading ? (
          <DashboardMetricsSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { label: "Verified Criteria", value: String(alignedCriteria), sub: "Alignment", icon: ShieldCheck, color: "text-blue-500", glow: "shadow-blue-500/10", href: "/platform/standards" },
              { label: "Evidence Matrix", value: String(evidenceCount), sub: "Indexed Assets", icon: Archive, color: "text-indigo-500", glow: "shadow-indigo-500/10", href: "/platform/evidence" },
              { label: "Critical Gaps", value: String(activeGaps).padStart(2, "0"), sub: "Needs Action", icon: Zap, color: "text-amber-500", glow: "shadow-amber-500/10", href: "/platform/gap-analysis" },
              { label: "Horus AI", value: "Online", sub: "Intelligence Layer", icon: Cpu, color: "text-emerald-500", glow: "shadow-emerald-500/10", href: "/platform/horus-ai" },
            ].map((m, i) => (
              <Link key={i} href={m.href} className="group animate-fade-in-up opacity-0" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}>
                <div className={["glass-panel p-6 md:p-8 rounded-[32px] md:rounded-[40px] flex flex-col justify-between min-h-[200px] sm:aspect-square transition-all duration-500",
                  "group-hover:-translate-y-3 group-hover:bg-[var(--surface)] border-white/5", m.glow, "group-hover:shadow-2xl"].join(" ")}>
                  <div className="flex justify-between items-start">
                    <div className="w-12 md:w-14 h-12 md:h-14 rounded-2xl bg-white/[0.02] border border-[var(--border-subtle)] flex items-center justify-center">
                      <m.icon className={["w-5 md:w-6 h-5 md:h-6", m.color].join(" ")} />
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <div className="mono text-4xl md:text-6xl font-black tracking-tighter mb-2 text-[var(--text-primary)]">{m.value}</div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">{m.label}</div>
                      <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-tighter italic">{m.sub}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Suggested Strategy Section */}
      <section>
        <div className="flex items-center justify-between mb-8 px-4">
          <h2 className="text-2xl font-bold tracking-tight">Intelligence Suggestions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestionsFromData.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title="No compliance alerts"
                description="Your framework alignment is within optimal parameters. Horus is monitoring for drift."
                type="dashboard"
              />
            </div>
          ) : (
            suggestionsFromData.map((item, i) => (
              <Link key={item.title} href={item.href} className="glass-panel p-8 rounded-[36px] group hover:bg-[var(--surface)] transition-all border-[var(--border-subtle)] flex flex-col justify-between animate-fade-in-up opacity-0" style={{ animationDelay: `${(i + 4) * 60}ms`, animationFillMode: 'forwards' }}>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{item.cat}</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[var(--text-primary)] mb-2 leading-tight">{item.title}</h4>
                  <p className="text-sm text-[var(--text-secondary)] mb-6 font-medium">{item.desc}</p>
                  <span className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-[var(--text-primary)] transition-colors group/btn">
                    Review Framework <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
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

