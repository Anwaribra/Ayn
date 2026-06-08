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
  ArrowRight,
  FileText,
  Sparkles,
  Brain,
  UploadCloud,
  Microscope,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Download,
  Cpu,
  AlertCircle,
  Search,
} from "lucide-react"
import type { DashboardMetrics } from "@/types"
import { DashboardPageSkeleton } from "@/components/platform/skeleton-loader"
import { ReadinessRing } from "@/components/ui/ReadinessRing"
import { ComplianceHealthBar } from "@/components/ui/ComplianceHealthBar"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// ─── Component: ReportsGauge ───────────────────────────────────────────────
function ReportsGauge({ value, total }: { value: number; total: number }) {
  const radius = 18
  const strokeWidth = 3.5
  const circumference = 2 * Math.PI * radius
  const percent = Math.min((value / Math.max(total, 1)) * 100, 100)
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative flex items-center justify-center h-12 w-12 shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 44 44">
        <circle
          className="text-muted/30 dark:text-muted/10"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="22"
          cy="22"
        />
        <circle
          className="text-emerald-500"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="22"
          cy="22"
        />
      </svg>
      <span className="absolute text-xs font-bold text-foreground">{value}</span>
    </div>
  )
}

// ─── Component: ComplianceGauge ────────────────────────────────────────────
function ComplianceGauge({ value }: { value: number }) {
  const radius = 16
  const strokeWidth = 3
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex items-center justify-center h-10 w-10 shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 38 38">
        <circle
          className="text-muted/30 dark:text-muted/10"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="19"
          cy="19"
        />
        <circle
          className="text-emerald-500"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="19"
          cy="19"
        />
      </svg>
      <span className="absolute text-xs font-bold text-foreground">{value}</span>
    </div>
  )
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

  const isAdmin = user?.role === "ADMIN"
  const campusId = user?.institutionId || "00000000-0000-0000-0000-000000000000"

  const { data: metrics, isLoading, isValidating } = useSWR<DashboardMetrics>(
    user ? [`dashboard-metrics`, user.id] : null,
    () => api.getDashboardMetrics(),
    {
      refreshInterval: 300_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,
      revalidateIfStale: false,
    }
  )

  const { data: v2Standards } = useSWR<any[]>(
    campusId ? `/api/v2/standards?campus_id=${campusId}` : null,
    fetcher
  )

  const { data: v2Summary } = useSWR<any>(
    campusId ? `/api/v2/validation/action-center?campus_id=${campusId}` : null,
    fetcher
  )

  const { data: latestBriefing } = useSWR<any>(
    campusId ? `/api/v2/horus/briefings/latest?campus_id=${campusId}` : null,
    fetcher
  )

  const { data: institution } = useSWR<any>(
    campusId ? [`institution`, campusId] : null,
    () => api.getInstitution(campusId)
  )

  const safeMetrics =
    metrics && typeof metrics === "object" && !Array.isArray(metrics)
      ? metrics
      : null

  const [lastMetricsSyncAt, setLastMetricsSyncAt] = useState<number | null>(null)
  useEffect(() => {
    if (safeMetrics) setLastMetricsSyncAt(Date.now())
  }, [safeMetrics])

  const readinessPercentage = useMemo(() => {
    if (v2Standards && v2Standards.length > 0) {
      const sum = v2Standards.reduce((acc, std) => acc + (std.readiness_score || 0), 0)
      return Math.round((sum / v2Standards.length) * 100)
    }
    return Math.round(safeMetrics?.alignmentPercentage ?? 0)
  }, [v2Standards, safeMetrics])

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

  const quickActions = useMemo(
    () =>
      isArabic
        ? [
            { title: "رفع أدلة", description: "أضف مستندات ودع حورس يعالجها", href: "/platform/evidence", icon: UploadCloud },
            { title: "تحليل الفجوات", description: "تقرير جاهزية مقابل معاييرك", href: "/platform/gap-analysis", icon: Microscope },
            { title: "مساعد حورس", description: "مساحة الذكاء للخطوات التالية", href: "/platform/horus-ai", icon: Brain },
          ]
        : [
            { title: "Upload Evidence", description: "Add proof and let Horus process it", href: "/platform/evidence", icon: UploadCloud },
            { title: "Gap Analysis", description: "Generate a fresh readiness report", href: "/platform/gap-analysis", icon: Microscope },
            { title: "Horus AI", description: "Open the AI workspace for guidance", href: "/platform/horus-ai", icon: Brain },
          ],
    [isArabic]
  )

  if (!user) return <DashboardPageSkeleton />

  const getStatValue = (key: string): number => {
    switch (key) {
      case "evidenceCount": return safeMetrics?.evidenceCount ?? 0
      case "standardsCount": return v2Standards?.length ?? 0
      case "needsReview": return v2Summary?.needs_review_count ?? 0
      case "missing": return v2Summary?.missing_evidence_count ?? 0
      default: return 0
    }
  }

  const standardsCount = v2Standards?.length ?? 0
  const evidenceCount = safeMetrics?.evidenceCount ?? 0
  const openAlerts = v2Summary?.needs_review_count ?? 0
  const gapAnalyses = safeMetrics?.totalGapAnalyses ?? 0
  const reportsCount = gapAnalyses
  const reportsTotal = 8

  return (
    <div id="dashboard-report-content" className={cn("mx-auto platform-container-wide space-y-5 py-2", isArabic && "font-arabic")} dir={isArabic ? "rtl" : "ltr"}>
      {/* Top Header Row with Refresh */}
      {lastMetricsSyncAt !== null && !isLoading && (
        <div className={cn("flex items-center gap-1.5 py-1 text-xs text-muted-foreground/70", isArabic && "flex-row-reverse")}>
          <Activity className="h-3 w-3" />
          <span>{lastMetricsSyncAt ? (isArabic ? "محدّث للتو" : "Updated just now") : ""}</span>
        </div>
      )}

      {/* Top Row: Welcome Card + System Health + Reports */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Card 1: Welcome Card */}
        <div className="md:col-span-6 rounded-2xl border border-border bg-[var(--layer-3)] p-5 flex flex-col justify-between min-h-[120px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isArabic ? "نشط" : "HORUS ACTIVE"}
            </span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {institution?.name || (isArabic ? "المؤسسة التعليمية" : "YOUR INSTITUTION")}
            </span>
          </div>
          <div className="mt-3">
            <h2 className="text-base font-bold text-foreground">
              {greeting}, <span className="font-normal text-muted-foreground">{user?.name?.split(" ")[0] || "Officer"}</span>
            </h2>
            <p className="text-sm text-muted-foreground/85 mt-1 leading-relaxed">
              {isArabic ? (
                <>
                  نسبة الجاهزية <span className="font-semibold text-emerald-600 dark:text-emerald-400">{readinessPercentage}%</span> عبر <span className="font-semibold text-foreground">{standardsCount}</span> معايير تم تتبعها في هذه الدورة.
                </>
              ) : (
                <>
                  Readiness score <span className="font-semibold text-emerald-600 dark:text-emerald-400">{readinessPercentage}%</span> across <span className="font-semibold text-foreground">{standardsCount}</span> tracked standards this cycle.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Card 2: System Health */}
        <div className="md:col-span-3 rounded-2xl border border-border bg-[var(--layer-3)] p-5 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{isArabic ? "صحة النظام" : "SYSTEM HEALTH"}</span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isArabic ? "الحالة" : "Status"}</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{isArabic ? "مثالي" : "Optimal"}</p>
          </div>
        </div>

        {/* Card 3: Reports */}
        <div className="md:col-span-3 rounded-2xl border border-border bg-[var(--layer-3)] p-5 flex justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col justify-between h-full">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{isArabic ? "التقارير" : "REPORTS"}</span>
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground font-sans tracking-tight leading-none">{reportsCount}</p>
              <p className="text-xs text-muted-foreground mt-1">{isArabic ? `${reportsTotal} إجمالي` : `${reportsTotal} total`}</p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <ReportsGauge value={reportsCount} total={reportsTotal} />
          </div>
        </div>
      </div>

      {/* Row of 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Evidence Items */}
        <Link
          href="/platform/evidence"
          className="rounded-2xl border border-border bg-[var(--layer-3)] p-5 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.01] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus:outline-none"
        >
          <div className={cn("flex items-start justify-between", isArabic && "flex-row-reverse")}>
            <div className={isArabic ? "text-right" : ""}>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{isArabic ? "على المسار" : "ON TRACK"}</p>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">{isArabic ? "عناصر الأدلة" : "Evidence items"}</p>
            </div>
            <div className="h-7 w-7 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-4 font-sans tracking-tight">{evidenceCount}</p>
        </Link>

        {/* Card 2: Open Alerts */}
        <Link
          href="/platform/gap-analysis"
          className="rounded-2xl border border-border bg-[var(--layer-3)] p-5 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.01] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus:outline-none"
        >
          <div className={cn("flex items-start justify-between", isArabic && "flex-row-reverse")}>
            <div className={isArabic ? "text-right" : ""}>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">{isArabic ? "مراجعة" : "REVIEW"}</p>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">{isArabic ? "تنبيهات مفتوحة" : "Open alerts"}</p>
            </div>
            <div className="h-7 w-7 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-4 font-sans tracking-tight">{openAlerts}</p>
        </Link>

        {/* Card 3: Compliance Score */}
        <Link
          href="/platform/standards"
          className="rounded-2xl border border-border bg-[var(--layer-3)] p-5 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.01] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus:outline-none"
        >
          <div className={cn("flex items-start justify-between", isArabic && "flex-row-reverse")}>
            <div className={isArabic ? "text-right" : ""}>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{isArabic ? "يتحسن" : "IMPROVING"}</p>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">{isArabic ? "صحة الامتثال" : "Compliance score"}</p>
            </div>
            <div className="flex items-center justify-center">
              <ComplianceGauge value={readinessPercentage} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-4 font-sans tracking-tight">{readinessPercentage}%</p>
        </Link>

        {/* Card 4: Gap Analyses */}
        <Link
          href="/platform/gap-analysis"
          className="rounded-2xl border border-border bg-[var(--layer-3)] p-5 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.01] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus:outline-none"
        >
          <div className={cn("flex items-start justify-between", isArabic && "flex-row-reverse")}>
            <div className={isArabic ? "text-right" : ""}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isArabic ? "الدورة الحالية" : "THIS CYCLE"}</p>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">{isArabic ? "تحليلات الفجوات" : "Gap analyses"}</p>
            </div>
            <div className="h-7 w-7 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-500">
              <Search className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-4 font-sans tracking-tight">{gapAnalyses}</p>
        </Link>
      </div>

      {/* Compliance Health */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {isArabic ? "صحة الامتثال" : "Compliance Health"}
            </h3>
          </div>
          {v2Summary && (
            <span className="text-xs text-muted-foreground">
              {v2Summary.covered_requirements_count ?? 0}/{(v2Summary.covered_requirements_count ?? 0) + (v2Summary.partial_requirements_count ?? 0) + (v2Summary.missing_requirements_count ?? 0)} {isArabic ? "متطلب" : "requirements"}
            </span>
          )}
        </div>
        <ComplianceHealthBar
          covered={v2Summary?.covered_requirements_count ?? 0}
          partial={v2Summary?.partial_requirements_count ?? 0}
          missing={v2Summary?.missing_requirements_count ?? 0}
          total={(v2Summary?.covered_requirements_count ?? 0) + (v2Summary?.partial_requirements_count ?? 0) + (v2Summary?.missing_requirements_count ?? 0)}
        />
      </div>

      {/* Briefing + Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Horus Briefing */}
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {isArabic ? "ملخص حورس" : "Horus Briefing"}
            </h3>
            <span className={cn("inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-xs font-semibold text-primary", isArabic ? "mr-auto" : "ml-auto")}>
              <Sparkles className="h-2.5 w-2.5" />
              AI
            </span>
          </div>
          <div
            className="max-h-[160px] overflow-y-auto rounded-lg border border-border/60 bg-muted/30 p-3 text-sm leading-relaxed text-foreground custom-scrollbar whitespace-pre-wrap"
            dir={isArabic ? "rtl" : "ltr"}
          >
            {latestBriefing ? latestBriefing.summary_content : (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Brain className="mb-2 h-8 w-8 opacity-40" />
                <span className="text-sm">
                  {isArabic ? "لا يوجد ملخص اليوم" : "No briefing for today yet"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={cn("group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]", isArabic && "flex-row-reverse")}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-white">
                <action.icon className="h-4 w-4 text-primary group-hover:text-white" />
              </div>
              <div className={cn("min-w-0 flex-1", isArabic && "text-right")}>
                <p className="text-sm font-semibold text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <ArrowRight className={cn("h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary", isArabic && "rotate-180")} />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Evidence */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {isArabic ? "أحدث الأدلة" : "Recent Evidence"}
            </h3>
          </div>
          <Link href="/platform/evidence" className="text-xs font-medium text-primary hover:underline">
            {isArabic ? "عرض المخزن" : "Open Vault"}
          </Link>
        </div>

        {(safeMetrics?.recentEvidence?.length ?? 0) === 0 ? (
          <Link
            href="/platform/evidence/upload"
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-8 text-center transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <UploadCloud className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-semibold text-foreground">
              {isArabic ? "ارفَع أول دليل" : "Upload your first evidence"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "اسحب ملفًا أو انقر للرفع" : "Drag and drop or click to upload"}
            </p>
          </Link>
        ) : (
          <div className="divide-y divide-border">
            {(safeMetrics as any)?.recentEvidence?.slice(0, 5).map((ev: any) => (
              <Link
                key={ev.id}
                href={`/platform/evidence?highlight=${encodeURIComponent(ev.id)}`}
                className={cn("flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/30 rounded-lg px-1", isArabic && "flex-row-reverse")}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-background">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className={cn("min-w-0 flex-1", isArabic && "text-right")}>
                  <p className="truncate text-sm font-medium text-foreground">{ev.title || ev.originalFilename}</p>
                </div>
                <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground/50", isArabic && "rotate-180")} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
