"use client"

import Link from "next/link"
import useSWR from "swr"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useUiLanguage } from "@/lib/ui-language-context"
import { usePageTitle } from "@/hooks/use-page-title"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  FileText,
  Brain,
  ArrowRight,
  Upload,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  Target,
} from "lucide-react"

export default function OverviewPage() {
  const { user } = useAuth()
  const { isArabic } = useUiLanguage()
  usePageTitle(isArabic ? "نظرة عامة" : "Overview")
  const { data: metrics, isLoading } = useSWR(
    // Use the same key as dashboard/page.tsx so the two pages share the SWR cache entry.
    user ? ["dashboard-metrics", user.id] : null,
    () => api.getDashboardMetrics(),
    {
      refreshInterval: 300_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,
      revalidateIfStale: false,
    }
  )

  if (isLoading && !metrics) {
    return (
      <div className="p-8 space-y-6">
        <div className="glass-surface h-8 w-48 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-panel h-32 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="glass-panel h-48 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const score = Math.round(metrics?.alignmentPercentage ?? 0)
  const evidence = metrics?.evidenceCount ?? 0
  const alerts = metrics?.unreadNotificationsCount ?? 0
  const analyses = metrics?.totalGapAnalyses ?? 0

  return (
    <div className={cn("p-8 space-y-8", isArabic && "font-arabic")}>
      <div className={cn("flex flex-wrap items-center justify-between gap-3", isArabic && "flex-row-reverse")}>
        <div className={cn(isArabic && "text-right")}>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {isArabic ? "نظرة عامة" : "Overview"}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isArabic
              ? "مركز قيادة الامتثال في لمحة"
              : "Your compliance command center at a glance"}
          </p>
        </div>
        {isLoading && (
          <div className={cn("inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground", isArabic && "flex-row-reverse font-arabic")}>
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            {isArabic ? "جارٍ التحديث" : "Refreshing"}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/platform/gap-analysis" className="group p-5 rounded-2xl glass-panel glass-border hover:border-blue-500/30 transition-all">
          <div className={cn("flex items-center justify-between mb-3", isArabic && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-blue-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{score}%</p>
          <p className={cn("text-xs text-[var(--text-secondary)] mt-1", isArabic && "text-right")}>
            {isArabic ? "درجة الامتثال" : "Compliance Score"}
          </p>
        </Link>

        <Link href="/platform/evidence" className="group p-5 rounded-2xl glass-panel glass-border hover:border-emerald-500/30 transition-all">
          <div className={cn("flex items-center justify-between mb-3", isArabic && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-emerald-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{evidence}</p>
          <p className={cn("text-xs text-[var(--text-secondary)] mt-1", isArabic && "text-right")}>
            {isArabic ? "مستندات الأدلة" : "Evidence Documents"}
          </p>
        </Link>

        <Link href="/platform/notifications" className="group p-5 rounded-2xl glass-panel glass-border hover:border-amber-500/30 transition-all">
          <div className={cn("flex items-center justify-between mb-3", isArabic && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-amber-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{alerts}</p>
          <p className={cn("text-xs text-[var(--text-secondary)] mt-1", isArabic && "text-right")}>
            {isArabic ? "تنبيهات غير مقروءة" : "Unread Alerts"}
          </p>
        </Link>

        <Link href="/platform/analytics" className="group p-5 rounded-2xl glass-panel glass-border hover:border-purple-500/30 transition-all">
          <div className={cn("flex items-center justify-between mb-3", isArabic && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-purple-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{analyses}</p>
          <p className={cn("text-xs text-[var(--text-secondary)] mt-1", isArabic && "text-right")}>
            {isArabic ? "إجمالي التحليلات" : "Total Analyses"}
          </p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel glass-border rounded-2xl p-6">
          <h2 className={cn("mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]", isArabic && "flex-row-reverse justify-end text-right")}>
            <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />{" "}
            {isArabic ? "إجراءات سريعة" : "Quick Actions"}
          </h2>
          <div className="space-y-2">
            <Link href="/platform/evidence/upload" className={cn("glass-button group flex items-center gap-3 rounded-xl p-3 transition-colors", isArabic && "flex-row-reverse text-right")}>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0"><Upload className="w-4 h-4 text-emerald-500" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{isArabic ? "رفع أدلة" : "Upload Evidence"}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{isArabic ? "أضف مستندات لتحليل الذكاء الاصطناعي" : "Add documents for AI analysis"}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/platform/gap-analysis" className={cn("glass-button group flex items-center gap-3 rounded-xl p-3 transition-colors", isArabic && "flex-row-reverse text-right")}>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0"><Target className="w-4 h-4 text-amber-500" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{isArabic ? "تشغيل تحليل الفجوات" : "Run Gap Analysis"}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{isArabic ? "قيّم جاهزية الامتثال" : "Assess compliance readiness"}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/platform/horus-ai" className={cn("glass-button group flex items-center gap-3 rounded-xl p-3 transition-colors", isArabic && "flex-row-reverse text-right")}>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><Brain className="w-4 h-4 text-blue-500" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{isArabic ? "اسأل حورس" : "Ask Horus AI"}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{isArabic ? "إرشاد فوري للامتثال" : "Get instant compliance guidance"}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/platform/ai-tools" className={cn("glass-button group flex items-center gap-3 rounded-xl p-3 transition-colors", isArabic && "flex-row-reverse text-right")}>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0"><Clock className="w-4 h-4 text-purple-500" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{isArabic ? "أدوات الذكاء" : "AI Tools"}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{isArabic ? "معالجة، تحضير تدقيق، وأكثر" : "Remediation, audit prep & more"}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <Link href="/platform/horus-ai" className={cn("glass-surface-strong group flex flex-col justify-between rounded-2xl border border-blue-500/20 p-6 transition-all hover:border-blue-500/35", isArabic && "text-right")}>
          <div>
            <div className={cn("w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4", isArabic && "ms-auto")}>
              <Brain className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">{isArabic ? "حورس AI" : "Horus AI"}</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {isArabic
                ? "مساعدك الذكي للامتثال. اسأل، حلّل الأدلة، نفّذ تدقيقاً، واحصل على إرشاد فوري للمعالجة."
                : "Your AI compliance assistant. Ask questions, analyze evidence, run audits, and get real-time remediation guidance."}
            </p>
          </div>
          <div className={cn("mt-4 flex items-center gap-2 text-blue-400 text-sm font-medium", isArabic && "flex-row-reverse justify-end")}>
            {isArabic ? "ابدأ المحادثة" : "Start conversation"}{" "}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  )
}
