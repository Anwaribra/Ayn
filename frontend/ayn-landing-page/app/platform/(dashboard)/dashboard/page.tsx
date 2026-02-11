"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import Link from "next/link"
import {
  Activity,
  Brain,
  ShieldCheck,
  Target,
  Cpu,
  Radio,
  BookOpen,
  Zap,
  ArrowRight,
  FileText,
  TriangleAlert,
  CheckCircle2,
  TrendingUp,
  Layers,
  Sparkles,
} from "lucide-react"
import type { DashboardMetrics } from "@/types"

// ─── Skeleton placeholder ────────────────────────────────────────────────────

function LoadingPulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/[0.04] ${className ?? ""}`} />
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user } = useAuth()

  // Real API data
  const { data: metrics, isLoading: metricsLoading } = useSWR<DashboardMetrics>(
    user ? "dashboard-metrics" : null,
    () => api.getDashboardMetrics(),
  )

  const { data: notifications } = useSWR(
    user ? "notifications" : null,
    () => api.getNotifications(),
  )

  const { data: gapAnalyses } = useSWR(
    user ? "gap-analyses" : null,
    () => api.getGapAnalyses(),
  )

  // Derive values from real data
  const complianceScore = metrics?.assessmentProgressPercentage ?? 0
  const evidenceCount = metrics?.evidenceCount ?? 0
  const completedCriteria = metrics?.completedCriteriaCount ?? 0
  const activeGaps = gapAnalyses?.length ?? 0
  const recentNotifs = notifications?.slice(0, 5) ?? []
  const latestAnalysisScore = gapAnalyses?.[0]?.overallScore ?? 0

  return (
    <div className="animate-fade-in-up p-4 md:p-6 pb-20 max-w-[1440px] mx-auto">
      {/* ═══════════════════════════════════════════════════════════════════
         LIVE COMMAND HEADER — Hero section with metrics visualizer
         ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em]">
                Live Command
              </span>
            </div>
            <div className="h-px w-6 bg-zinc-800" />
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
              Quality Dashboard
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic text-white">
            QUALITY <span className="text-zinc-700 not-italic font-light">COMMAND</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 rounded-full border border-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em]">
              All Systems Nominal
            </span>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
         HERO VISUALIZER — Horus Engine status with animated border
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 mb-10">
        {/* Main engine visualizer */}
        <div className="relative rounded-[40px] p-[1px] overflow-hidden">
          {/* Gradient border */}
          <div className="absolute inset-0 rounded-[40px] animated-border opacity-30" />
          <div className="relative glass-panel rounded-[40px] p-8 md:p-10 overflow-hidden">
            {/* Glow backdrop */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 blur-[80px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 shadow-xl shadow-blue-600/5">
                  <Brain className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-1">
                    Horus Intelligence Engine
                  </h2>
                  <p className="text-3xl font-black text-white tracking-tight italic">
                    OPERATIONAL
                  </p>
                  <p className="text-[11px] text-zinc-600 font-bold uppercase tracking-tight mt-1">
                    All systems nominal · Neural bridge active
                  </p>
                </div>
              </div>

              {/* Mini metric cards */}
              <div className="flex gap-4 flex-wrap">
                {[
                  { label: "Compliance Score", value: metricsLoading ? "—" : `${complianceScore.toFixed(1)}%`, icon: ShieldCheck, color: "text-emerald-500" },
                  { label: "Evidence Assets", value: metricsLoading ? "—" : String(evidenceCount), icon: Layers, color: "text-blue-500" },
                  { label: "Active Analyses", value: metricsLoading ? "—" : String(activeGaps), icon: Target, color: "text-amber-500" },
                ].map((m, i) => (
                  <div key={i} className="glass-panel rounded-2xl px-5 py-4 border-white/5 min-w-[130px]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <m.icon className={`w-3 h-3 ${m.color}`} />
                      <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
                        {m.label}
                      </span>
                    </div>
                    <span className="mono text-xl font-bold text-white">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System Feed panel */}
        <div className="glass-panel rounded-[40px] p-8 border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3 h-3" /> System Feed
            </h3>
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
            {recentNotifs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[11px] text-zinc-700 font-bold uppercase tracking-widest">
                  No recent activity
                </p>
              </div>
            ) : (
              recentNotifs.map((notif, i) => (
                <div
                  key={notif.id}
                  className="group flex items-start gap-3 p-3 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-zinc-300 truncate">{notif.title}</p>
                    <p className="text-[10px] text-zinc-600 truncate mt-0.5">{notif.body}</p>
                    <p className="text-[9px] text-zinc-800 font-bold uppercase tracking-widest mt-1.5">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         KEY METRICS — 4 stat cards
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-10">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-2xl font-black italic text-white">Key Metrics</h2>
          <div className="h-px w-20 bg-zinc-900" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Compliance Score",
              value: metricsLoading ? null : `${complianceScore.toFixed(1)}%`,
              sub: "Assessment progress",
              icon: ShieldCheck,
              color: "text-emerald-500",
              bgHover: "hover:shadow-emerald-500/5",
            },
            {
              label: "Evidence Coverage",
              value: metricsLoading ? null : `${evidenceCount}`,
              sub: `${completedCriteria} criteria completed`,
              icon: Layers,
              color: "text-blue-500",
              bgHover: "hover:shadow-blue-500/5",
            },
            {
              label: "Active Gaps",
              value: metricsLoading ? null : `${activeGaps}`,
              sub: "Gap analyses running",
              icon: TriangleAlert,
              color: "text-amber-500",
              bgHover: "hover:shadow-amber-500/5",
            },
            {
              label: "Total Assessments",
              value: metricsLoading ? null : `${metrics?.totalAssessments ?? 0}`,
              sub: "Assessment templates",
              icon: CheckCircle2,
              color: "text-violet-500",
              bgHover: "hover:shadow-violet-500/5",
            },
          ].map((card, i) => (
            <div
              key={i}
              className={`glass-panel platform-card rounded-[28px] p-6 border-white/5 cursor-pointer ${card.bgHover} hover:shadow-xl`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl bg-white/[0.02] border border-white/5`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">
                  Live
                </span>
              </div>
              {card.value === null ? (
                <LoadingPulse className="h-8 w-20 mb-2" />
              ) : (
                <p className="text-3xl font-black text-white mb-1 tracking-tight">{card.value}</p>
              )}
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                {card.label}
              </p>
              <p className="text-[10px] text-zinc-700 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
         NEURAL OPERATIONS — Quick action cards
         ═══════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-2xl font-black italic text-white">Neural Operations</h2>
          <div className="h-px w-20 bg-zinc-900" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Run Diagnostics",
              desc: "Initiate an AI-powered gap analysis across your standards",
              icon: Cpu,
              href: "/platform/gap-analysis",
              color: "text-emerald-500",
              glowColor: "group-hover:shadow-emerald-500/5",
            },
            {
              title: "Evidence Scan",
              desc: "Upload and manage evidence library for compliance mapping",
              icon: FileText,
              href: "/platform/evidence",
              color: "text-blue-500",
              glowColor: "group-hover:shadow-blue-500/5",
            },
            {
              title: "Horus AI Command",
              desc: "Open the neural bridge for intelligent compliance assistance",
              icon: Brain,
              href: "/platform/horus-ai",
              color: "text-violet-500",
              glowColor: "group-hover:shadow-violet-500/5",
            },
          ].map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className={`group glass-panel platform-card rounded-[28px] p-6 border-white/5 flex items-start gap-5 ${action.glowColor} hover:shadow-xl`}
            >
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:scale-105 transition-transform">
                <action.icon className={`w-5 h-5 ${action.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-zinc-100 mb-1 group-hover:text-white transition-colors">
                  {action.title}
                </h3>
                <p className="text-[11px] text-zinc-600 font-medium leading-relaxed">
                  {action.desc}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-800 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
