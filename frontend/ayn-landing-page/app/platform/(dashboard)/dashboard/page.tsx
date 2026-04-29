"use client"

import { useEffect, useMemo, useState } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { usePageTitle } from "@/hooks/use-page-title"
import { useUiLanguage } from "@/lib/ui-language-context"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  ChevronRight,
  Activity,
  ArrowUpRight,
  FileText,
  AlertTriangle,
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

function formatMetricsSynced(dataUpdatedAt: number, isArabic: boolean): string {
  if (!dataUpdatedAt) return ""
  const sec = Math.max(0, Math.floor((Date.now() - dataUpdatedAt) / 1000))
  if (sec < 15) return isArabic ? "محدّث للتو" : "Updated just now"
  const min = Math.floor(sec / 60)
  if (min < 1) return isArabic ? "محدّث منذ لحظات" : "Updated moments ago"
  if (min === 1) return isArabic ? "محدّث منذ دقيقة" : "Updated 1 min ago"
  if (min < 60) return isArabic ? `محدّث منذ ${min} د` : `Updated ${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr === 1) return isArabic ? "محدّث منذ ساعة" : "Updated 1 hour ago"
  if (hr < 24) return isArabic ? `محدّث منذ ${hr} س` : `Updated ${hr} hours ago`
  const d = Math.floor(hr / 24)
  return isArabic ? `محدّث منذ ${d} يوم` : `Updated ${d}d ago`
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
  const { isArabic } = useUiLanguage()
  usePageTitle(isArabic ? "لوحة التحكم" : "Dashboard")

  const { data: metrics, isLoading, error, mutate } = useSWR<DashboardMetrics>(
    user ? [`dashboard-metrics`, user.id] : null,
    () => api.getDashboardMetrics(),
    {
      refreshInterval: 300_000, // 5-minute auto-refresh; user can always hit Retry manually
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,
      revalidateIfStale: false,
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

  const [lastMetricsSyncAt, setLastMetricsSyncAt] = useState<number | null>(null)
  useEffect(() => {
    if (safeMetrics) setLastMetricsSyncAt(Date.now())
  }, [safeMetrics])
  const safeStandards = Array.isArray(standards) ? standards : []
  const recentActivities = Array.isArray(safeMetrics?.recentActivities) ? safeMetrics.recentActivities : []

  const alignmentScore = safeMetrics?.alignmentPercentage ?? 0
  const alertCount = safeMetrics?.unreadNotificationsCount ?? 0
  const analysesCount = safeMetrics?.totalGapAnalyses ?? 0

  const greeting = (() => {
    const h = new Date().getHours()
    if (isArabic) {
      if (h < 12) return "صباح الخير"
      if (h < 18) return "طاب يومك"
      return "مساء الخير"
    }
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



  const dashboardStats = useMemo(() => {
    const alertIsCritical = (safeMetrics?.unreadNotificationsCount ?? 0) > 0
    const complianceOk = alignmentScore > 80
    if (isArabic) {
      return [
        {
          label: "إجمالي الأدلة",
          value: safeMetrics?.evidenceCount?.toString() || "0",
          icon: FileText,
          status: "warning" as const,
          statusLabel: "تحذير",
        },
        {
          label: "تنبيهات نشطة",
          value: safeMetrics?.unreadNotificationsCount?.toString() || "0",
          icon: AlertTriangle,
          status: (alertIsCritical ? "critical" : "success") as "critical" | "success",
          statusLabel: alertIsCritical ? "حرج" : "جيد",
        },
        {
          label: "درجة الامتثال",
          value: `${Math.round(alignmentScore)}%`,
          icon: Activity,
          status: (complianceOk ? "success" : "warning") as "success" | "warning",
          statusLabel: complianceOk ? "جيد" : "تحذير",
        },
        {
          label: "إجمالي التحليلات",
          value: safeMetrics?.totalGapAnalyses?.toString() || "0",
          icon: Microscope,
          status: "neutral" as const,
          statusLabel: "محايد",
        },
      ]
    }
    return [
      {
        label: "Total Evidence",
        value: safeMetrics?.evidenceCount?.toString() || "0",
        icon: FileText,
        status: "warning" as const,
        statusLabel: "WARNING",
      },
      {
        label: "Active Alerts",
        value: safeMetrics?.unreadNotificationsCount?.toString() || "0",
        icon: AlertTriangle,
        status: (alertIsCritical ? "critical" : "success") as "critical" | "success",
        statusLabel: alertIsCritical ? "WARNING" : "SUCCESS",
      },
      {
        label: "Compliance Score",
        value: `${Math.round(alignmentScore)}%`,
        icon: Activity,
        status: (complianceOk ? "success" : "warning") as "success" | "warning",
        statusLabel: complianceOk ? "SUCCESS" : "WARNING",
      },
      {
        label: "Total Analyses",
        value: safeMetrics?.totalGapAnalyses?.toString() || "0",
        icon: Microscope,
        status: "neutral" as const,
        statusLabel: "NEUTRAL",
      },
    ]
  }, [metrics, alignmentScore, isArabic, safeMetrics?.evidenceCount, safeMetrics?.unreadNotificationsCount, safeMetrics?.totalGapAnalyses])

  const quickActions = useMemo(
    () =>
      isArabic
        ? [
            {
              title: "رفع أدلة",
              description: "أضف مستندات مؤسسية جديدة ودع حورس يعالجها.",
              href: "/platform/evidence/upload",
              icon: UploadCloud,
            },
            {
              title: "تشغيل تحليل الفجوات",
              description: "أنشئ تقرير جاهزية حديثاً مقابل معاييرك.",
              href: "/platform/gap-analysis",
              icon: Microscope,
            },
            {
              title: "اسأل حورس",
              description: "افتح مساحة الذكاء للخطوات التالية والمسودات.",
              href: "/platform/horus-ai",
              icon: Brain,
            },
            {
              title: "مراجعة التنبيهات",
              description: "اطلع على أحداث المنصة والإشعارات غير المقروءة.",
              href: "/platform/notifications",
              icon: BellRing,
            },
          ]
        : [
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
          ],
    [isArabic],
  )

  const scoreTone =
    alignmentScore >= 85
      ? isArabic
        ? "محاذاة قوية"
        : "Strong alignment"
      : alignmentScore >= 65
        ? isArabic
          ? "وضع يتحسّن"
          : "Improving posture"
        : isArabic
          ? "يحتاج متابعة"
          : "Needs attention"



  const formatEvidenceDate = (value?: string | null) => {
    if (!value) return isArabic ? "أضيف مؤخراً" : "Recently added"

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return isArabic ? "أضيف مؤخراً" : "Recently added"

    return parsed.toLocaleDateString(isArabic ? "ar-EG" : undefined, {
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
        <p className="text-muted-foreground text-center mb-4">
          {isArabic ? "تعذر تحميل لوحة التحكم." : "Failed to load dashboard."}
        </p>
        <button
          type="button"
          onClick={() => mutate()}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          {isArabic ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "animate-fade-in-up space-y-6 sm:space-y-8 pb-16 sm:pb-20 relative",
        isArabic && "font-arabic",
      )}
    >
      <div id="dashboard-report-content" className="space-y-6 sm:space-y-8">
      {/* Header Section with Gauges */}
      <section>
        {/* Main Welcome Card */}
        <div className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] glass-card p-5 sm:p-8 md:p-12 flex flex-col justify-between min-h-[320px] sm:min-h-[340px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_42%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_28%)] pointer-events-none" />
          <div className="absolute -right-20 -top-14 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute left-10 bottom-6 h-24 w-24 rounded-full border border-white/10 bg-white/5 blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-6 sm:space-y-8">
            <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full status-success border w-fit", isArabic && "flex-row-reverse")}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--status-success)" }}></span>
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "var(--status-success)" }}></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {isArabic ? "عين — الدماغ نشط" : "Ayn Brain Live"}
              </span>
            </div>
            {isLoading && (
              <div className={cn("inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground", isArabic && "flex-row-reverse")}>
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                {isArabic ? "جارٍ مزامنة لوحة التحكم" : "Syncing dashboard"}
              </div>
            )}
            {lastMetricsSyncAt !== null && !isLoading && (
              <p className={cn("text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/90", isArabic && "text-right")}>
                {isArabic ? "المقاييس — " : "Metrics — "}
                {formatMetricsSynced(lastMetricsSyncAt, isArabic)}
              </p>
            )}

            <div className={cn("max-w-2xl", isArabic && "text-right ms-auto")} dir={isArabic ? "rtl" : "ltr"}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-4 leading-tight">
                {greeting}
                {isArabic ? "، " : ", "}
                <br />
                <span className="text-muted-foreground font-light" dir="ltr">
                  {user?.name?.split(" ")[0] ?? (isArabic ? "ضيفنا" : "there")}.
                </span>
              </h1>
              <p className="text-muted-foreground font-medium max-w-xl text-sm sm:text-base md:text-lg leading-relaxed">
                {isArabic ? (
                  <>
                    حورس نشط ومساحة عملك تعرض حالياً{" "}
                    <span className="text-foreground font-bold">{Math.round(alignmentScore)}%</span>{" "}
                    امتثالاً عبر{" "}
                    <span className="text-foreground font-bold">{publicStandards.length}</span> معياراً متتبعاً.
                  </>
                ) : (
                  <>
                    Horus is active and your workspace is currently showing{" "}
                    <span className="text-foreground font-bold">{Math.round(alignmentScore)}%</span>{" "}
                    compliance alignment across{" "}
                    <span className="text-foreground font-bold">{publicStandards.length}</span>{" "}
                    tracked standards.
                  </>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-3.5 backdrop-blur-sm sm:p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {isArabic ? "نبرة الجاهزية" : "Readiness Tone"}
                </p>
                <p className="mt-2 text-lg font-bold text-foreground">{scoreTone}</p>
              </div>
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-3.5 backdrop-blur-sm sm:p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {isArabic ? "تنبيهات مفتوحة" : "Open Alerts"}
                </p>
                <p className="mt-2 text-lg font-bold text-foreground">{alertCount}</p>
              </div>
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-3.5 backdrop-blur-sm sm:p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {isArabic ? "تحليلات منفّذة" : "Analyses Run"}
                </p>
                <p className="mt-2 text-lg font-bold text-foreground">{analysesCount}</p>
              </div>
            </div>
          </div>

          <div className={cn("relative z-10 mt-6 sm:mt-8 flex flex-wrap items-center gap-3", isArabic && "justify-end")}>
            <Link
              href="/platform/horus-ai"
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl bg-primary px-4 sm:px-5 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-[0_18px_40px_-22px_rgba(37,99,235,0.65)] transition-transform hover:-translate-y-0.5",
                isArabic && "flex-row-reverse",
              )}
            >
              <Sparkles className="w-4 h-4" />
              {isArabic ? "فتح حورس" : "Open Horus"}
            </Link>
            <Link
              href="/platform/gap-analysis"
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-[var(--glass-strong-bg)] sm:px-5 sm:text-xs",
                isArabic && "flex-row-reverse",
              )}
            >
              {isArabic ? "تشغيل تحليل الفجوات" : "Run Gap Analysis"}
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Status Tiles Grid */}
      <section className={cn(isLoading && "opacity-60 transition-opacity duration-300")}>
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
            <div className={cn("flex items-start justify-between gap-4", isArabic && "flex-row-reverse text-right")}>
              <div className="space-y-3">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)]", isArabic && "ms-auto")}>
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



      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Evidence List */}
          <div className="glass-card p-5 sm:p-8 rounded-[28px] sm:rounded-3xl">
            <div className={cn("flex items-center justify-between mb-8", isArabic && "flex-row-reverse")}>
              <div className={cn(isArabic && "text-right")}>
                <h3 className="text-lg font-bold text-foreground">
                  {isArabic ? "أحدث الأدلة" : "Recent Evidence"}
                </h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mt-1">
                  {isArabic ? "آخر المستندات إلى المخزن" : "Latest documents entering the vault"}
                </p>
              </div>
              <Link href="/platform/evidence" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                {isArabic ? "عرض المخزن" : "View Vault"}
              </Link>
            </div>
            <div className="space-y-3">
              {(safeMetrics?.recentEvidence?.length ?? 0) === 0 ? (
                <div className="text-center py-10 border-2 border-dashed glass-border rounded-3xl glass-panel">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground text-sm font-medium">
                    {isArabic ? "لا توجد أدلة حديثة" : "No recent evidence"}
                  </p>
                  <Link href="/platform/evidence" className="inline-block mt-4 px-5 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold rounded-xl uppercase tracking-widest">
                    {isArabic ? "رفع إلى المخزن" : "Upload to Vault"}
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
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                          {ev.documentType || (isArabic ? "ملف أدلة" : "Evidence file")}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-white/20" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{formatEvidenceDate(ev.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        {ev.status || (isArabic ? "مفتوح" : "Open")}
                      </p>
                      <ChevronRight className="w-4 h-4 mt-1 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Link href="/platform/analytics" className="group glass-card rounded-[28px] sm:rounded-3xl p-5 sm:p-7">
              <div className={cn("flex items-start justify-between gap-4", isArabic && "flex-row-reverse text-right")}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {isArabic ? "التقارير" : "Reporting"}
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-foreground">
                    {isArabic ? "التحليلات والاتجاهات" : "Analytics & Trends"}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {isArabic
                      ? "راجع حركة الدرجات وأداء المعايير ونمو الأدلة خلال آخر فترة تقرير."
                      : "Review score movement, standard performance, and evidence growth across the last reporting window."}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className={cn("mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary", isArabic && "flex-row-reverse justify-end")}>
                {isArabic ? "فتح التحليلات" : "Open Analytics"}{" "}
                <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>

            <Link href="/platform/notifications" className="group glass-card rounded-[28px] sm:rounded-3xl p-5 sm:p-7">
              <div className={cn("flex items-start justify-between gap-4", isArabic && "flex-row-reverse text-right")}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {isArabic ? "قائمة الانتباه" : "Attention Queue"}
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-foreground">
                    {isArabic ? "إشعارات المنصة" : "Platform Notifications"}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {isArabic
                      ? "راجع التحديثات غير المقروءة وأحداث التقارير الجديدة وإشارات الأدلة أو سير العمل التي تحتاج إجراءً."
                      : "Review unread updates, new report events, and evidence or workflow signals that need action."}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className={cn("mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary", isArabic && "flex-row-reverse justify-end")}>
                {isArabic ? "فتح الإشعارات" : "Open Notifications"}{" "}
                <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
