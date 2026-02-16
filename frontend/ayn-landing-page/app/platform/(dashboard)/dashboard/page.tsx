"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import Link from "next/link"
import {
  ChevronRight,
  Activity,
  ArrowUpRight,
  FileText,
  AlertTriangle
} from "lucide-react"
import type { DashboardMetrics } from "@/types"
import { EmptyState } from "@/components/platform/empty-state"
import { DashboardPageSkeleton } from "@/components/platform/skeleton-loader"
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

import { CircularGauge } from "@/components/ui/circular-gauge"
import { StatusTiles } from "@/components/platform/status-tiles"
import { ActivityChart } from "@/components/platform/activity-graph"
import { Cpu, Zap } from "lucide-react"

function DashboardContent() {
  const { user } = useAuth()

  const { data: metrics, isLoading } = useSWR<DashboardMetrics>(
    user ? [`dashboard-metrics`, user.id] : null,
    () => api.getDashboardMetrics(),
    { refreshInterval: 30000 }
  )

  if (isLoading) {
    return <DashboardPageSkeleton />
  }

  const alignmentScore = metrics?.alignmentPercentage ?? 0
  const evidenceCount = metrics?.evidenceCount ?? 0

  return (
    <div className="animate-fade-in-up space-y-8 pb-20">
      {/* Header Section with Gauges */}
      <section className="flex flex-col xl:flex-row gap-6">
        {/* Main Welcome Card */}
        <div className="flex-1 relative overflow-hidden rounded-[40px] glass-card p-8 md:p-12 flex flex-col justify-center min-h-[300px]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Ayn Brain Live</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-4 leading-tight">
              Institutional <br />
              <span className="text-muted-foreground">Intelligence.</span>
            </h1>
            <p className="text-muted-foreground font-medium max-w-md">
              Horus is active. Your compliance framework is mapped with <span className="text-foreground font-bold">{Math.round(alignmentScore)}%</span> accuracy.
            </p>
          </div>
        </div>

        {/* Dashdot Gauges */}
        <div className="flex flex-col sm:flex-row xl:flex-col gap-4 shrink-0">
          <div className="glass-layer-2 rounded-[32px] p-6 flex items-center gap-6 min-w-[280px]">
            <CircularGauge value={Math.round(alignmentScore)} label="System Health" icon={<Cpu className="w-5 h-5" />} color="#3B82F6" />
            <div className="flex flex-col justify-center">
              <span className="text-2xl font-bold tracking-tight">Good</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Optimal State</span>
            </div>
          </div>
          <div className="glass-layer-2 rounded-[32px] p-6 flex items-center gap-6 min-w-[280px]">
            <CircularGauge value={24} max={100} label="AI Latency" sublabel="ms" icon={<Zap className="w-5 h-5" />} color="#10B981" />
            <div className="flex flex-col justify-center">
              <span className="text-2xl font-bold tracking-tight">24ms</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Horus Response</span>
            </div>
          </div>
        </div>
      </section>

      {/* Status Tiles Grid */}
      <section>
        <StatusTiles
          stats={[
            {
              label: "Pending Evidence",
              value: metrics?.evidenceCount?.toString() || "0",
              icon: FileText,
              status: "warning"
            },
            {
              label: "Active Alerts",
              value: metrics?.unreadNotificationsCount?.toString() || "0",
              icon: AlertTriangle,
              status: metrics?.unreadNotificationsCount > 0 ? "critical" : "success"
            },
            {
              label: "Compliance Score",
              value: `${Math.round(alignmentScore)}%`,
              icon: Activity,
              status: alignmentScore > 80 ? "success" : "warning"
            },
            {
              label: "Total Analyses",
              value: metrics?.totalGapAnalyses?.toString() || "0",
              icon: Cpu,
              status: "neutral"
            }
          ]}
        />
      </section>

      {/* Activity Graph & Logs */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActivityChart data={[]} />

          {/* Recent Evidence List */}
          <div className="glass-layer-2 p-8 rounded-[40px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-foreground">Recent Evidence</h3>
              <Link href="/platform/evidence" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">View Library</Link>
            </div>
            <div className="space-y-3">
              {metrics?.recentEvidence?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No evidence uploaded yet.</p>
              ) : (
                metrics?.recentEvidence?.map((ev: any) => (
                  <div key={ev.id} className="flex items-center gap-4 p-4 rounded-2xl glass-layer-3 hover:bg-white/5 transition-all group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5 text-blue-500" />
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
  )
}
