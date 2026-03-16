"use client"

import { useEffect, useState, useMemo } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { usePageTitle } from "@/hooks/use-page-title"
import Link from "next/link"
import {
  ChevronRight,
  Activity,
  ArrowUpRight,
  FileText,
  AlertTriangle,
  ShieldCheck,
  TrendingUp
} from "lucide-react"
import { Cpu, Zap, Download } from "lucide-react"
import type { DashboardMetrics, Standard } from "@/types"
import { EmptyState } from "@/components/platform/empty-state"
import { DashboardPageSkeleton } from "@/components/platform/skeleton-loader"
import { SystemLog } from "@/components/platform/system-log"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { CircularGauge } from "@/components/ui/circular-gauge"
import { StatusTiles } from "@/components/platform/status-tiles"
import { ActivityChart } from "@/components/platform/activity-graph"
import { CoverageBar } from "@/components/platform/coverage-bar"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user } = useAuth()
  usePageTitle("Dashboard")

  const { data: metrics, isLoading, error, mutate } = useSWR<DashboardMetrics>(
    user ? [`dashboard-metrics`, user.id] : null,
    () => api.getDashboardMetrics(),
    { refreshInterval: 30000 }
  )

  const { data: standards } = useSWR<Standard[]>(
    user ? [`standards-dashboard`, user.id] : null,
    () => api.getStandards(),
    { revalidateOnFocus: false }
  )

  if (isLoading || !user) {
    return <DashboardPageSkeleton />
  }

  if (error) {
    return (
      <div className="animate-fade-in-up flex flex-col items-center justify-center py-20 px-4">
        <p className="text-muted-foreground text-center mb-4">Failed to load dashboard.</p>
        <button
          type="button"
          onClick={() => mutate()}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const safeMetrics =
    metrics && typeof metrics === "object" && !Array.isArray(metrics)
      ? metrics
      : null
  const safeStandards = Array.isArray(standards) ? standards : []

  const alignmentScore = safeMetrics?.alignmentPercentage ?? 0
  const evidenceCount = safeMetrics?.evidenceCount ?? 0

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  })()

  const publicStandards = useMemo(
    () =>
      safeStandards.filter(
        (s: Standard | null | undefined) => !!s && (s as Standard).isPublic && !!(s as Standard).id
      ) as Standard[],
    [safeStandards]
  )

  const dashboardStats = useMemo(() => [
    {
      label: "Total Evidence",
      value: safeMetrics?.evidenceCount?.toString() || "0",
      icon: FileText,
      status: "warning" as const
    },
    {
      label: "Active Alerts",
      value: safeMetrics?.unreadNotificationsCount?.toString() || "0",
      icon: AlertTriangle,
      status: ((safeMetrics?.unreadNotificationsCount ?? 0) > 0 ? "critical" : "success") as "critical" | "success"
    },
    {
      label: "Compliance Score",
      value: `${Math.round(alignmentScore)}%`,
      icon: Activity,
      status: (alignmentScore > 80 ? "success" : "warning") as "success" | "warning"
    },
    {
      label: "Total Analyses",
      value: safeMetrics?.totalGapAnalyses?.toString() || "0",
      icon: Cpu,
      status: "neutral" as const
    }
  ], [metrics, alignmentScore])

  return (
    <div className="animate-fade-in-up space-y-8 pb-20 relative">
      <div id="dashboard-report-content" className="space-y-8">
      {/* Header Section with Gauges */}
      <section className="flex flex-col xl:flex-row gap-6">
        {/* Main Welcome Card */}
        <div className="flex-1 relative overflow-hidden rounded-3xl glass-card p-8 md:p-12 flex flex-col justify-center min-h-[300px]">
          <div className="absolute top-4 right-4 z-50">
             <button 
               onClick={async () => {
                 const { exportToPDF } = await import("@/lib/pdf-export")
                 exportToPDF("dashboard-report-content", "Ayn-Horus-Audit-Dashboard.pdf")
               }}
               data-html2canvas-ignore="true"
               className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-primary/20 shadow-sm"
             >
               <Download className="w-4 h-4" /> Export Report (PDF)
             </button>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full status-success border mb-6 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--status-success)" }}></span>
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "var(--status-success)" }}></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Ayn Brain Live</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-4 leading-tight">
              {greeting}, <br />
              <span className="text-muted-foreground font-light">{user?.name?.split(" ")[0] ?? "there"}.</span>
            </h1>
            <p className="text-muted-foreground font-medium max-w-md">
              Horus is active. Your compliance framework is mapped with <span className="text-foreground font-bold">{Math.round(alignmentScore)}%</span> accuracy.
            </p>
          </div>
        </div>

        {/* Dashdot Gauges */}
        <div className="flex flex-col sm:flex-row xl:flex-col gap-4 shrink-0">
          <div className="glass-card rounded-3xl p-6 flex items-center gap-6 w-full sm:w-auto min-w-0 sm:min-w-[280px]">
            <CircularGauge value={Math.round(alignmentScore)} label="System Health" icon={<Cpu className="w-5 h-5" />} color="#3B82F6" />
            <div className="flex flex-col justify-center">
              <span className="text-2xl font-bold tracking-tight text-foreground">Good</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Optimal State</span>
            </div>
          </div>
          <div className="glass-card rounded-3xl p-6 flex items-center gap-6 w-full sm:w-auto min-w-0 sm:min-w-[280px]">
            <CircularGauge
              value={safeMetrics?.totalGapAnalyses ?? 0}
              max={20}
              label="Gap Analyses"
              icon={<Zap className="w-5 h-5" />}
              color="#10B981"
            />
            <div className="flex flex-col justify-center">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {safeMetrics?.totalGapAnalyses ?? 0}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Reports</span>
            </div>
          </div>
        </div>
      </section>

      {/* Status Tiles Grid */}
      <section>
        <StatusTiles
          stats={dashboardStats}
        />
      </section>

      {/* ─── Standards Progress ─── */}
      {publicStandards.length > 0 && (
        <section className="glass-card p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl status-success border flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Standards Progress</h3>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Criteria coverage by evidence</p>
              </div>
            </div>
            <Link
              href="/platform/standards"
              className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-5">
            {publicStandards.slice(0, 6).map((standard: Standard) => (
              <div key={standard.id} className="group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate mr-4">
                    {standard.title}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                    {standard.code ?? standard.category ?? "Standard"}
                  </span>
                </div>
                <CoverageBar standardId={standard.id} compact />
              </div>
            ))}
          </div>

          {publicStandards.length > 6 && (
            <div className="mt-6 pt-4 border-t border-border">
              <Link
                href="/platform/standards"
                className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
              >
                +{publicStandards.length - 6} more standards →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Activity Graph & Logs */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActivityChart data={safeMetrics?.recentScores ?? []} />

          {/* Recent Evidence List */}
          <div className="glass-card p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-foreground">Recent Evidence</h3>
              <Link href="/platform/evidence" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">View Library</Link>
            </div>
            <div className="space-y-3">
              {(safeMetrics?.recentEvidence?.length ?? 0) === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-3xl bg-muted/20">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground text-sm font-medium">No recent evidence</p>
                  <Link href="/platform/evidence" className="inline-block mt-4 px-5 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold rounded-xl uppercase tracking-widest">
                    Upload to Vault
                  </Link>
                </div>
              ) : (
                safeMetrics?.recentEvidence?.map((ev: any) => (
                  <div key={ev.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-all group cursor-pointer border border-transparent hover:border-border">
                    <div className="w-10 h-10 rounded-xl status-info border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">{ev.title || ev.originalFilename}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mt-0.5">{ev.status}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* System Log */}
        <div className="h-full">
          <SystemLog className="h-full min-h-[500px]" maxEntries={8} />
        </div>
      </section>
      </div>
    </div>
  )
}
