"use client"

import { useMemo } from "react"
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
  Sparkles,
  Brain,
  UploadCloud,
  Microscope,
  BellRing
} from "lucide-react"
import type { DashboardMetrics, Standard } from "@/types"
import { DashboardPageSkeleton } from "@/components/platform/skeleton-loader"
import { SystemLog } from "@/components/platform/system-log"
import { StatusTiles } from "@/components/platform/status-tiles"
import { CoverageBar } from "@/components/platform/coverage-bar"

interface StandardCoverageSummary {
  standard: Standard
  standardId: string
  totalCriteria: number
  coveredCriteria: number
  coveragePct: number
}

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
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
    }
  )

  const { data: standards } = useSWR<Standard[]>(
    user ? [`standards-dashboard`, user.id] : null,
    () => api.getStandards(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
    }
  )

  const safeMetrics =
    metrics && typeof metrics === "object" && !Array.isArray(metrics)
      ? metrics
      : null
  const safeStandards = Array.isArray(standards) ? standards : []
  const recentActivities = Array.isArray(safeMetrics?.recentActivities) ? safeMetrics.recentActivities : []

  const alignmentScore = safeMetrics?.alignmentPercentage ?? 0
  const alertCount = safeMetrics?.unreadNotificationsCount ?? 0
  const analysesCount = safeMetrics?.totalGapAnalyses ?? 0

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

  const { data: standardsCoverage } = useSWR<StandardCoverageSummary[]>(
    user && publicStandards.length > 0
      ? ["dashboard-standards-coverage", ...publicStandards.map((standard) => standard.id)]
      : null,
    async () =>
      Promise.all(
        publicStandards.map(async (standard) => {
          const coverage = await api.getStandardCoverage(standard.id)
          return {
            standard,
            ...coverage,
          }
        })
      ),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,
    }
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
      icon: Microscope,
      status: "neutral" as const
    }
  ], [metrics, alignmentScore])

  const quickActions = [
    {
      title: "Upload Evidence",
      description: "Add new institutional proof and let Horus process it.",
      href: "/platform/evidence/upload",
      icon: UploadCloud,
    },
    {
      title: "Run Gap Analysis",
      description: "Generate a fresh readiness report against your standards.",
      href: "/platform/gap-analysis",
      icon: Microscope,
    },
    {
      title: "Ask Horus",
      description: "Open the AI workspace for next-step guidance and drafting.",
      href: "/platform/horus-ai",
      icon: Brain,
    },
    {
      title: "Review Alerts",
      description: "Check active platform events and unread notifications.",
      href: "/platform/notifications",
      icon: BellRing,
    },
  ] as const

  const scoreTone =
    alignmentScore >= 85
      ? "Strong alignment"
      : alignmentScore >= 65
        ? "Improving posture"
        : "Needs attention"

  const featuredStandards = useMemo(() => {
    if (!publicStandards.length) return []

    if (!standardsCoverage?.length) {
      return publicStandards.slice(0, 3).map((standard) => ({
        standard,
        standardId: standard.id,
        totalCriteria: 0,
        coveredCriteria: 0,
        coveragePct: 0,
      }))
    }

    return [...standardsCoverage]
      .sort((a, b) => a.coveragePct - b.coveragePct)
      .slice(0, 3)
  }, [publicStandards, standardsCoverage])

  const getCoverageTone = (coveragePct: number) => {
    if (coveragePct >= 80) {
      return {
        label: "Strong",
        className: "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]",
      }
    }

    if (coveragePct >= 50) {
      return {
        label: "Partial",
        className: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
      }
    }

    return {
      label: "Critical",
      className: "border-[var(--status-critical-border)] bg-[var(--status-critical-bg)] text-[var(--status-critical)]",
    }
  }

  const formatEvidenceDate = (value?: string | null) => {
    if (!value) return "Recently added"

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return "Recently added"

    return parsed.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  }

  if (!user) {
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

  return (
    <div className="animate-fade-in-up space-y-6 sm:space-y-8 pb-16 sm:pb-20 relative">
      <div id="dashboard-report-content" className="space-y-6 sm:space-y-8">
      {/* Header Section with Gauges */}
      <section>
        {/* Main Welcome Card */}
        <div className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] glass-card p-5 sm:p-8 md:p-12 flex flex-col justify-between min-h-[320px] sm:min-h-[340px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_42%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_28%)] pointer-events-none" />
          <div className="absolute -right-20 -top-14 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute left-10 bottom-6 h-24 w-24 rounded-full border border-white/10 bg-white/5 blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full status-success border w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--status-success)" }}></span>
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "var(--status-success)" }}></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Ayn Brain Live</span>
            </div>
            {isLoading && (
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Syncing dashboard
              </div>
            )}

            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-4 leading-tight">
                {greeting}, <br />
                <span className="text-muted-foreground font-light">{user?.name?.split(" ")[0] ?? "there"}.</span>
              </h1>
              <p className="text-muted-foreground font-medium max-w-xl text-sm sm:text-base md:text-lg leading-relaxed">
                Horus is active and your workspace is currently showing{" "}
                <span className="text-foreground font-bold">{Math.round(alignmentScore)}%</span>{" "}
                compliance alignment across{" "}
                <span className="text-foreground font-bold">{publicStandards.length}</span>{" "}
                tracked standards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-3.5 backdrop-blur-sm sm:p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Readiness Tone</p>
                <p className="mt-2 text-lg font-bold text-foreground">{scoreTone}</p>
              </div>
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-3.5 backdrop-blur-sm sm:p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Open Alerts</p>
                <p className="mt-2 text-lg font-bold text-foreground">{alertCount}</p>
              </div>
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-3.5 backdrop-blur-sm sm:p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Analyses Run</p>
                <p className="mt-2 text-lg font-bold text-foreground">{analysesCount}</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-6 sm:mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/platform/horus-ai"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 sm:px-5 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-[0_18px_40px_-22px_rgba(37,99,235,0.65)] transition-transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              Open Horus
            </Link>
            <Link
              href="/platform/gap-analysis"
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-[var(--glass-strong-bg)] sm:px-5 sm:text-xs"
            >
              Run Gap Analysis
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Status Tiles Grid */}
      <section>
        <StatusTiles
          stats={dashboardStats}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group glass-card rounded-[26px] sm:rounded-[28px] p-4 sm:p-5 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)]">
                  <action.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{action.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{action.description}</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </section>

      {/* ─── Standards Progress ─── */}
      {publicStandards.length > 0 && (
        <section className="glass-card relative overflow-hidden p-4 rounded-[20px] sm:rounded-[22px]">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_16%),linear-gradient(180deg,rgba(255,255,255,0.018),transparent)]" />
          <div className="relative z-10 flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl status-success border flex items-center justify-center shadow-[0_18px_36px_-28px_rgba(16,185,129,0.42)]">
                <ShieldCheck className="w-3 h-3" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">Standards Progress</h3>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-[0.14em]">Weakest mapped standards first</p>
              </div>
            </div>
            <Link
              href="/platform/standards"
              className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary transition-colors hover:bg-[var(--glass-strong-bg)] sm:text-[10px]"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="relative z-10 space-y-1.5">
            {featuredStandards.map((entry) => {
              const tone = getCoverageTone(entry.coveragePct)

              return (
              <div
                key={entry.standard.id}
                className="rounded-[15px] border border-white/6 bg-white/[0.025] px-3 py-2.5 transition-all hover:bg-white/[0.045] hover:border-white/10"
              >
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <span className="block text-[13px] sm:text-sm font-bold text-foreground truncate">
                      {entry.standard.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.12em] ${tone.className}`}>
                      {tone.label}
                    </span>
                    <span className="hidden max-w-full truncate rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-soft-bg)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:inline-flex sm:text-[9px]">
                      {entry.standard.code ?? entry.standard.category ?? "Standard"}
                    </span>
                  </div>
                </div>
                <CoverageBar standardId={entry.standard.id} result={entry} compact />
              </div>
            )})}
          </div>

          {publicStandards.length > 3 && (
            <div className="relative z-10 mt-2.5 pt-2 border-t border-[var(--border-subtle)]">
              <Link
                href="/platform/standards"
                className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.12em]"
              >
                +{publicStandards.length - 3} more standards <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Evidence List */}
          <div className="glass-card p-5 sm:p-8 rounded-[28px] sm:rounded-3xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-foreground">Recent Evidence</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mt-1">Latest documents entering the vault</p>
              </div>
              <Link href="/platform/evidence" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">View Vault</Link>
            </div>
            <div className="space-y-3">
              {(safeMetrics?.recentEvidence?.length ?? 0) === 0 ? (
                <div className="text-center py-10 border-2 border-dashed glass-border rounded-3xl glass-panel">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground text-sm font-medium">No recent evidence</p>
                  <Link href="/platform/evidence" className="inline-block mt-4 px-5 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold rounded-xl uppercase tracking-widest">
                    Upload to Vault
                  </Link>
                </div>
              ) : (
                safeMetrics?.recentEvidence?.map((ev: any) => (
                  <Link
                    key={ev.id}
                    href={`/platform/evidence?highlight=${encodeURIComponent(ev.id)}`}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[var(--surface)] transition-all group cursor-pointer border border-transparent hover:border-[var(--border-subtle)]"
                  >
                    <div className="w-10 h-10 rounded-xl status-info border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">{ev.title || ev.originalFilename}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{ev.documentType || "Evidence file"}</span>
                        <span className="h-1 w-1 rounded-full bg-white/20" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{formatEvidenceDate(ev.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{ev.status || "Open"}</p>
                      <ChevronRight className="w-4 h-4 mt-1 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Link href="/platform/analytics" className="group glass-card rounded-[28px] sm:rounded-3xl p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reporting</p>
                  <h3 className="mt-3 text-xl font-bold text-foreground">Analytics & Trends</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Review score movement, standard performance, and evidence growth across the last reporting window.
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                Open Analytics <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>

            <Link href="/platform/notifications" className="group glass-card rounded-[28px] sm:rounded-3xl p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Attention Queue</p>
                  <h3 className="mt-3 text-xl font-bold text-foreground">Platform Notifications</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Review unread updates, new report events, and evidence or workflow signals that need action.
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                Open Notifications <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          </div>
        </div>

        {/* System Log */}
        <div className="h-full">
          <SystemLog
            className="h-full min-h-[500px]"
            maxEntries={8}
            logs={recentActivities}
            isLoading={isLoading}
          />
        </div>
      </section>
      </div>
    </div>
  )
}
