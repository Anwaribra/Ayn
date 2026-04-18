"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { useState, useCallback, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { usePageTitle } from "@/hooks/use-page-title"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Play,
  Loader2,
  Check,
} from "lucide-react"
import type { GapAnalysis, GapItem, Standard, Evidence, GapAnalysisListItem } from "@/types"
import { EvidenceSelector } from "@/components/platform/evidence-selector"
import { EmptyState } from "@/components/platform/empty-state"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import { useUiLanguage } from "@/lib/ui-language-context"
import { isStandardHiddenFromNavigation } from "@/lib/standard-display"

type AnalysisScope = "linked" | "recent" | "selected"

function buildGapAnalysisFilename(report: { standardTitle?: string; id: string }) {
  const safeTitle = (report.standardTitle || "gap-analysis")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "gap-analysis"

  return `${safeTitle}-${report.id.slice(0, 8)}.pdf`
}

function getSeverity(value?: string, isArabic = false) {
  const normalized = (value ?? "").toLowerCase()
  if (normalized === "high") return isArabic ? "عالي" : "High"
  if (normalized === "low") return isArabic ? "منخفض" : "Low"
  return isArabic ? "متوسط" : "Medium"
}

function getAlignment(value?: string, isArabic = false) {
  const normalized = (value ?? "").toLowerCase()
  if (normalized === "aligned" || normalized === "met") return isArabic ? "متوافق" : "Aligned"
  if (normalized === "partially_aligned" || normalized === "partially_met") return isArabic ? "متوافق جزئيًا" : "Partially Aligned"
  return isArabic ? "غير متوافق" : "Not Aligned"
}

function getEvidenceLabel(evidence: Evidence, isArabic = false) {
  return evidence.title || evidence.originalFilename || (isArabic ? "دليل بلا عنوان" : "Untitled evidence")
}

function getAnalysisScopeLabel(scope?: string, isArabic = false) {
  if (scope === "selected") return isArabic ? "ملفات محددة" : "Selected files"
  if (scope === "recent") return isArabic ? "الملفات الحديثة" : "Recent uploads"
  return isArabic ? "الأدلة المرتبطة" : "Linked evidence"
}

function looksLikeLegacyFallbackReport(report: GapAnalysis | null) {
  if (!report) return false

  const summary = (report.summary ?? "").toLowerCase()

  const fallbackSummary =
    summary.includes("preliminary report was generated") &&
    summary.includes("ai provider")

  const fallbackGapsPartial =
    (report.gaps?.length ?? 0) > 0 &&
    report.gaps.every((gap) => {
      const recommendation = (gap.recommendation ?? "").toLowerCase()
      return (
        gap.status === "partially_aligned" &&
        recommendation.includes("rerun once ai provider access is restored")
      )
    })

  const fallbackGapsNoEvidence =
    (report.gaps?.length ?? 0) > 0 &&
    report.gaps.every((gap) => {
      const recommendation = (gap.recommendation ?? "").toLowerCase()
      return (
        gap.status === "no_evidence" &&
        recommendation.includes("upload or link evidence for this criterion")
      )
    })

  return fallbackSummary || fallbackGapsPartial || fallbackGapsNoEvidence
}

function sortEvidenceNewestFirst(items: Evidence[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
}

export default function GapAnalysisPage() {
  return (
    <ProtectedRoute>
      <GapAnalysisContent />
    </ProtectedRoute>
  )
}

function GapAnalysisContent() {
  const { user } = useAuth()
  const { isArabic } = useUiLanguage()
  const searchParams = useSearchParams()
  usePageTitle(isArabic ? "تحليل الفجوات" : "Gap Analysis")
  const copy = useMemo(() => ({
    failedLoadReport: isArabic ? "فشل تحميل التقرير" : "Failed to load report",
    analysisSlow: isArabic ? "التحليل يستغرق وقتًا أطول من المتوقع. جرّب التحديث." : "Analysis is taking longer than expected. Try refreshing.",
    ready: isArabic ? "تحليل الفجوات جاهز!" : "Gap analysis is ready!",
    failed: isArabic ? "فشل تحليل الفجوات." : "Gap analysis failed.",
    failedDesc: isArabic ? "حدث خطأ أثناء تحليل الأدلة." : "An error occurred during evidence analysis.",
    selectStandard: isArabic ? "اختر معيارًا أولًا" : "Select a standard first",
    chooseAtLeastOne: isArabic ? "اختر ملفًا واحدًا على الأقل" : "Choose at least one file",
    pickRecent: isArabic ? "اختر ملفًا أو أكثر من الملفات الحديثة قبل التشغيل." : "Pick one or more recent uploads before running.",
    selectEvidenceWanted: isArabic ? "اختر الأدلة التي تريد تحليلها." : "Select the evidence you want analyzed.",
    queued: isArabic ? "تمت جدولة التحليل" : "Analysis queued",
    linkedDesc: isArabic ? "يقوم حورس بمراجعة الأدلة المرتبطة بهذا المعيار." : "Horus is checking the evidence linked to this standard.",
    analyzingFiles: (n: number) => isArabic ? `جارٍ تحليل ${n} ${n === 1 ? "ملف" : "ملفات"}.` : `Analyzing ${n} file${n === 1 ? "" : "s"}.`,
    failedQueue: isArabic ? "فشل جدولة التحليل" : "Failed to queue analysis",
    openCompletedFirst: isArabic ? "افتح تقريرًا مكتملًا أولًا" : "Open a completed report first",
    onlyCompleted: isArabic ? "يمكن تصدير التقارير المكتملة فقط" : "Only completed reports can be exported",
    exported: isArabic ? "تم تصدير التقرير" : "Report exported",
    failedExport: isArabic ? "فشل تصدير التقرير" : "Failed to export report",
    failedExportDesc: isArabic ? "تعذر تنزيل نسخة PDF لهذا التقرير." : "Could not download the PDF export for this report.",
    deleted: isArabic ? "تم حذف التقرير" : "Report deleted",
    deletionFailed: isArabic ? "فشل الحذف" : "Deletion failed",
    latestLoadFailed: isArabic ? "فشل تحميل آخر تقرير" : "Failed to load the latest report",
    pageTitle: isArabic ? "تحليل الفجوات" : "Gap Analysis",
    pageSubtitle: isArabic ? "اختر معيارًا، ثم الأدلة، ثم شغّل التحليل. يفحص حورس كل معيار فرعي ويعرض وضعك الحالي." : "Choose a standard, choose your evidence, and run. Horus checks each criterion and shows you where you stand.",
    standard: isArabic ? "المعيار" : "Standard",
    loading: isArabic ? "جارٍ التحميل…" : "Loading…",
    noStandards: isArabic ? "لا توجد معايير متاحة" : "No standards available",
    chooseStandard: isArabic ? "اختر معيارًا…" : "Choose a standard…",
    criteriaChecked: (n: number) => isArabic ? `سيتم فحص ${n} معيارًا فرعيًا.` : `${n} criteria will be checked.`,
    evidence: isArabic ? "الأدلة" : "Evidence",
    filterRecent: isArabic ? "فلترة الملفات الحديثة…" : "Filter recent uploads…",
    searchEvidence: isArabic ? "ابحث في الأدلة…" : "Search evidence…",
    selected: isArabic ? "محدد" : "selected",
    noRecentMatch: isArabic ? "لا توجد ملفات حديثة تطابق الفلترة." : "No recent uploads match your filter.",
    noEvidenceMatch: isArabic ? "لا توجد أدلة تطابق البحث." : "No evidence matched your search.",
    run: isArabic ? "تشغيل تحليل الفجوات" : "Run Gap Analysis",
    running: isArabic ? "جارٍ التشغيل…" : "Running…",
    analysesFailedLoad: isArabic ? "فشل تحميل تحليلات الفجوات." : "Failed to load gap analyses.",
    retry: isArabic ? "إعادة المحاولة" : "Retry",
    loadingAnalyses: isArabic ? "جارٍ تحميل التحليلات…" : "Loading analyses…",
    latestAnalysis: isArabic ? "أحدث تحليل" : "Latest analysis",
    file: isArabic ? "ملف" : "file",
    files: isArabic ? "ملفات" : "files",
    preliminary: isArabic ? "أولي" : "Preliminary",
    score: isArabic ? "النتيجة" : "Score",
    highPriority: isArabic ? "أولوية عالية" : "High priority",
    exportPdf: isArabic ? "تصدير PDF" : "Export PDF",
    close: isArabic ? "إغلاق" : "Close",
    preliminaryTitle: isArabic ? "تقرير أولي" : "Preliminary report",
    preliminaryDesc: isArabic ? "كان مزود الذكاء الاصطناعي غير متاح أثناء هذا التشغيل. أنشأ حورس مراجعة هيكلية أولية بدل النتائج التفصيلية. راجع الأدلة وأضف المزيد إذا لزم، ثم أعد التشغيل عند توفر المزود." : "The AI provider was unavailable during this run. Horus produced a basic structure review instead of full criterion findings. Verify your evidence, add more if needed, then rerun when the provider is available.",
    noFindings: isArabic ? "لا توجد نتائج في التقرير الحالي." : "No findings for the current report.",
    analyzingEvidence: isArabic ? "جارٍ تحليل أدلتك…" : "Analyzing your evidence…",
    noRecommendation: isArabic ? "لا توجد توصية متاحة." : "No recommendation available.",
    unnamedCriterion: isArabic ? "معيار بلا اسم" : "Unnamed Criterion",
    moreGaps: (n: number) => isArabic ? `${n} فجوات إضافية — كلها مضمنة في تصدير الـ PDF.` : `${n} more gap${n === 1 ? "" : "s"} — all included in the PDF export.`,
    previousRuns: isArabic ? "التشغيلات السابقة" : "Previous runs",
    analyzing: isArabic ? "جارٍ التحليل…" : "Analyzing…",
    failedShort: isArabic ? "فشل" : "Failed",
    deletePrompt: isArabic ? "هل تريد حذف هذا التقرير؟" : "Delete this report?",
    cannotUndo: isArabic ? "لا يمكن التراجع عن هذا الإجراء." : "This cannot be undone.",
    cancel: isArabic ? "إلغاء" : "Cancel",
    delete: isArabic ? "حذف" : "Delete",
    scopeLinkedLabel: isArabic ? "الأدلة المرتبطة" : "Linked evidence",
    scopeLinkedDesc: isArabic ? "استخدم الأدلة المرتبطة بالفعل بهذا المعيار." : "Use evidence already mapped to this standard.",
    scopeRecentLabel: isArabic ? "الملفات الحديثة" : "Recent uploads",
    scopeRecentDesc: isArabic ? "ابدأ بأحدث ملفاتك ثم قلّص القائمة." : "Start from your latest files, then trim the list.",
    scopeSelectedLabel: isArabic ? "اختر ملفات" : "Pick files",
    scopeSelectedDesc: isArabic ? "اختر الملفات التي تريدها بالضبط في هذا التشغيل." : "Choose the exact files you want in this run.",
  }), [isArabic])
  const scopeOptions = useMemo(
    () => [
      { id: "linked" as AnalysisScope, label: copy.scopeLinkedLabel, description: copy.scopeLinkedDesc },
      { id: "recent" as AnalysisScope, label: copy.scopeRecentLabel, description: copy.scopeRecentDesc },
      { id: "selected" as AnalysisScope, label: copy.scopeSelectedLabel, description: copy.scopeSelectedDesc },
    ],
    [copy],
  )

  const [selectedStandard, setSelectedStandard] = useState("")
  const [analysisScope, setAnalysisScope] = useState<AnalysisScope>("linked")
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([])
  const [evidenceSearchQuery, setEvidenceSearchQuery] = useState("")
  const [generating, setGenerating] = useState(false)
  const [activeReport, setActiveReport] = useState<GapAnalysis | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [pendingJobId, setPendingJobId] = useState<string | null>(null)

  useEffect(() => {
    const reportId = searchParams.get("report")
    if (!reportId || !user) return
    if (activeReport?.id === reportId) return
    let cancelled = false
    api.getGapAnalysis(reportId).then((full) => {
      if (!cancelled) setActiveReport(full)
    }).catch(() => {
      if (!cancelled) toast.error(copy.failedLoadReport)
    })
    return () => { cancelled = true }
  }, [searchParams, user, activeReport?.id])

  useEffect(() => {
    const standardId = searchParams.get("standardId")
    const scope = searchParams.get("scope") as AnalysisScope | null
    const evidenceIdsParam = searchParams.get("evidenceIds")

    if (standardId) setSelectedStandard(standardId)
    if (scope === "linked" || scope === "recent" || scope === "selected") setAnalysisScope(scope)

    if (evidenceIdsParam) {
      const ids = evidenceIdsParam.split(",").map((id) => id.trim()).filter(Boolean)
      if (ids.length > 0) {
        setSelectedEvidenceIds(ids)
        if (!scope) setAnalysisScope("selected")
      }
    }
  }, [searchParams])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deleteConfirm) setDeleteConfirm(null)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [deleteConfirm])

  useEffect(() => {
    if (selectedStandard && isStandardHiddenFromNavigation(selectedStandard)) {
      setSelectedStandard("")
    }
  }, [selectedStandard])

  useEffect(() => {
    if (!pendingJobId) return
    const timer = setTimeout(() => {
      setGenerating(false)
      setPendingJobId(null)
      toast.error(copy.analysisSlow)
    }, 120_000)
    return () => clearTimeout(timer)
  }, [pendingJobId])

  const { data: standards } = useSWR<Standard[]>(
    user ? "standards" : null,
    () => api.getStandards(),
    { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 30_000 },
  )

  const { data: evidenceList } = useSWR<Evidence[]>(
    user ? ["evidence", user.id] : null,
    () => api.getEvidence(),
    { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 15_000 },
  )

  const { data: reports, error: reportsError, mutate } = useSWR<GapAnalysisListItem[]>(
    user ? "gap-analyses" : null,
    () => api.getGapAnalyses(),
    {
      refreshInterval: pendingJobId ? 3000 : 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: pendingJobId ? 1500 : 10_000,
      onSuccess: (data: GapAnalysisListItem[]) => {
        if (!pendingJobId) return
        const job = data?.find((r: GapAnalysisListItem) => r.id === pendingJobId)
        if (job) {
          if (job.status === "completed") {
            setPendingJobId(null)
            setGenerating(false)
            toast.success(copy.ready, { description: job.standardTitle })
            handleViewReport(job.id)
          } else if (job.status === "failed") {
            setPendingJobId(null)
            setGenerating(false)
            toast.error(copy.failed, { description: copy.failedDesc })
          }
        }
      },
    },
  )

  useEffect(() => {
    if (activeReport || !reports || reports.length === 0 || searchParams.get("report")) return
    const latestCompleted = [...reports]
      .filter((r) => r.status === "completed")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    if (!latestCompleted) return

    let cancelled = false
    api.getGapAnalysis(latestCompleted.id).then((full) => {
      if (!cancelled) setActiveReport(full)
    }).catch(() => {
      if (!cancelled) toast.error(copy.latestLoadFailed)
    })
    return () => { cancelled = true }
  }, [activeReport, reports, searchParams])

  const handleGenerate = useCallback(async () => {
    if (!selectedStandard) return toast.error(copy.selectStandard)
    if ((analysisScope === "recent" || analysisScope === "selected") && selectedEvidenceIds.length === 0) {
      toast.error(copy.chooseAtLeastOne, {
        description:
          analysisScope === "recent"
            ? copy.pickRecent
            : copy.selectEvidenceWanted,
      })
      return
    }

    setGenerating(true)
    try {
      const job = await api.generateGapAnalysis(selectedStandard, {
        analysisScope,
        evidenceIds: analysisScope === "linked" ? undefined : selectedEvidenceIds,
      })
      setPendingJobId(job.jobId)
      toast.success(copy.queued, {
        description:
          analysisScope === "linked"
            ? copy.linkedDesc
            : copy.analyzingFiles(selectedEvidenceIds.length),
      })
      mutate()
    } catch {
      toast.error(copy.failedQueue)
      setGenerating(false)
    }
  }, [selectedStandard, analysisScope, selectedEvidenceIds, mutate])

  const handleViewReport = useCallback(async (id: string) => {
    if (activeReport?.id === id) return activeReport
    try {
      const full = await api.getGapAnalysis(id)
      setActiveReport(full)
      return full
    } catch {
      toast.error(copy.failedLoadReport)
      return null
    }
  }, [activeReport])

  const handleExportSnapshot = useCallback(async (reportId?: string) => {
    if (!reportId && !activeReport) {
      toast.error(copy.openCompletedFirst)
      return
    }
    const targetReport =
      !reportId || activeReport?.id === reportId
        ? activeReport
        : await handleViewReport(reportId)

    if (!targetReport) return
    if (targetReport.status !== "completed") {
      toast.error(copy.onlyCompleted)
      return
    }

    try {
      await api.downloadGapAnalysisReport(targetReport.id)
      toast.success(copy.exported, {
        description: `Downloaded ${buildGapAnalysisFilename(targetReport)}`,
      })
    } catch (downloadError) {
      console.error(downloadError)
      toast.error(copy.failedExport, {
        description: copy.failedExportDesc,
      })
    }
  }, [activeReport, handleViewReport])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.deleteGapAnalysis(id)
      toast.success(copy.deleted)
      setDeleteConfirm(null)
      if (activeReport?.id === id) setActiveReport(null)
      mutate()
    } catch {
      toast.error(copy.deletionFailed)
    }
  }, [mutate, activeReport])

  const gaps = activeReport?.gaps?.map((item: GapItem) => {
    const severity = getSeverity(item.priority, isArabic)
    const alignment = getAlignment(item.status, isArabic)
    const statusClass =
      severity === "High" ? "status-critical" :
      severity === "Medium" ? "status-warning" : "status-success"
    return {
      original: item,
      title: item.criterionTitle ?? copy.unnamedCriterion,
      severity,
      alignment,
      desc: item.recommendation ?? copy.noRecommendation,
      statusClass,
    }
  }) ?? []

  const overallScore = activeReport?.overallScore ?? null
  const highGapCount = gaps.filter((g) => g.severity === "High").length
  const reportsReady = reports !== undefined
  const hasReports = (reports?.length ?? 0) > 0
  const showReportsLoadingState = !reportsReady && !reportsError && !activeReport
  const selectedStandardObject = standards?.find((s) => s.id === selectedStandard) ?? null
  const sortedEvidence = useMemo(() => sortEvidenceNewestFirst(evidenceList ?? []), [evidenceList])
  const recentEvidence = useMemo(() => sortedEvidence.slice(0, 8), [sortedEvidence])
  const evidenceOptions = useMemo(() => {
    const pool = analysisScope === "recent" ? recentEvidence : sortedEvidence
    const query = evidenceSearchQuery.trim().toLowerCase()
    if (!query) return pool
    return pool.filter((item) => {
      const haystack = `${item.title ?? ""} ${item.originalFilename ?? ""} ${item.summary ?? ""}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [analysisScope, recentEvidence, sortedEvidence, evidenceSearchQuery])

  useEffect(() => {
    if (analysisScope !== "recent" || recentEvidence.length === 0) return
    setSelectedEvidenceIds((current) => {
      const recentIds = recentEvidence.map((item) => item.id)
      const stillValid = current.filter((id) => recentIds.includes(id))
      return stillValid.length > 0 ? stillValid : recentIds.slice(0, 4)
    })
  }, [analysisScope, recentEvidence])

  const toggleEvidenceSelection = useCallback((evidenceId: string) => {
    setSelectedEvidenceIds((current) =>
      current.includes(evidenceId)
        ? current.filter((id) => id !== evidenceId)
        : [...current, evidenceId],
    )
  }, [])

  const displayedGaps = gaps.slice(0, 5)
  const remainingGapCount = Math.max(gaps.length - displayedGaps.length, 0)
  const isFallbackReport = Boolean(activeReport?.isFallback) || looksLikeLegacyFallbackReport(activeReport)

  return (
    <div className="animate-fade-in-up pb-20">
      <div id="gap-analysis-report-content">

        {/* ── Page title ── */}
        <div className="px-4 pt-6 pb-5">
          <h1 className="text-2xl font-bold text-foreground">{copy.pageTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {copy.pageSubtitle}
          </p>
        </div>

        {/* ── Run form ── */}
        <div className="px-4 mb-8">
          <div className="glass-panel glass-border rounded-[28px] p-5 sm:p-6 space-y-5 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.8),transparent)] opacity-60" />

            {/* Standard picker */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.standard}
              </label>
              <select
                value={selectedStandard}
                onChange={(e) => setSelectedStandard(e.target.value)}
                disabled={!standards || standards.length === 0 || generating}
                className="w-full h-11 glass-input text-foreground rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="" className="bg-[var(--surface-modal)]">
                  {!standards
                    ? copy.loading
                    : standards.length === 0
                    ? copy.noStandards
                    : copy.chooseStandard}
                </option>
                {standards
                  ?.filter((s: Standard) => !isStandardHiddenFromNavigation(s.id))
                  .map((s: Standard) => (
                  <option key={s.id} value={s.id} className="bg-[var(--surface-modal)]">
                    {s.title}
                  </option>
                ))}
              </select>
              {selectedStandardObject && (
                <p className="text-xs text-muted-foreground">
                  {copy.criteriaChecked(selectedStandardObject.criteriaCount)}
                </p>
              )}
            </div>

            {/* Evidence scope */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.evidence}
              </label>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {scopeOptions.map((scope) => (
                  <button
                    key={scope.id}
                    type="button"
                    onClick={() => setAnalysisScope(scope.id)}
                    className={cn(
                      "rounded-2xl border px-4 py-3.5 text-left transition-all",
                      analysisScope === scope.id
                        ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
                        : "border-[var(--glass-border)] bg-[var(--glass-soft-bg)] hover:border-primary/40 hover:bg-primary/5",
                    )}
                  >
                    <p className="text-sm font-semibold text-foreground">{scope.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{scope.description}</p>
                  </button>
                ))}
              </div>

              {/* File picker — only for non-linked scopes */}
              {analysisScope !== "linked" && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between gap-3">
                    <input
                      value={evidenceSearchQuery}
                      onChange={(e) => setEvidenceSearchQuery(e.target.value)}
                      placeholder={
                        analysisScope === "recent"
                          ? copy.filterRecent
                          : copy.searchEvidence
                      }
                      className="flex-1 h-10 glass-input rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    {selectedEvidenceIds.length > 0 && (
                      <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        {selectedEvidenceIds.length} {copy.selected}
                      </span>
                    )}
                  </div>
                  <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                    {evidenceOptions.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[var(--glass-border)] px-4 py-8 text-center text-sm text-muted-foreground">
                        {analysisScope === "recent"
                          ? copy.noRecentMatch
                          : copy.noEvidenceMatch}
                      </div>
                    ) : (
                      evidenceOptions.map((item) => {
                        const checked = selectedEvidenceIds.includes(item.id)
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleEvidenceSelection(item.id)}
                            className={cn(
                              "w-full rounded-2xl border px-4 py-3 text-left transition-all",
                              checked
                                ? "border-primary bg-primary/10"
                                : "border-[var(--glass-border)] bg-background/30 hover:border-primary/40 hover:bg-primary/5",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                                  checked
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-[var(--glass-border)] text-transparent",
                                )}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {getEvidenceLabel(item, isArabic)}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {new Date(item.createdAt).toLocaleDateString()}
                                  {item.documentType ? ` · ${item.documentType}` : ""}
                                </p>
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Run button */}
            <div className="border-t border-[var(--glass-border)] pt-4">
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedStandard || !standards || standards.length === 0}
                className="flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-3 bg-foreground text-background rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {generating ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    {copy.running}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    {copy.run}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── States: error / loading / empty ── */}
        {reportsError ? (
          <div className="mx-4 flex flex-col items-center gap-4 rounded-2xl glass-panel glass-border py-12 px-4 text-center">
            <p className="text-sm text-muted-foreground">{copy.analysesFailedLoad}</p>
            <button
              type="button"
              onClick={() => mutate()}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              {copy.retry}
            </button>
          </div>
        ) : showReportsLoadingState ? (
          <div className="px-4">
            <div className="glass-panel glass-border rounded-[28px] p-6">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-3 py-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading analyses…
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-panel glass-border animate-pulse rounded-[20px] p-5">
                    <div className="mb-3 h-4 w-36 rounded bg-[var(--surface)]/60" />
                    <div className="h-3 w-3/4 rounded bg-[var(--surface)]/50" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !hasReports && !activeReport ? (
          <div className="mt-6">
            <EmptyState type="gap-analysis" />
          </div>
        ) : (
          <>
            {/* ── Active report ── */}
            {activeReport && (
              <div className="mb-8 px-4">
                <div className="glass-panel glass-border rounded-[28px] p-5 sm:p-6 space-y-4">

                  {/* Report header */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                      <h2 className="text-xl font-bold text-foreground">
                        {activeReport.standardTitle ?? copy.pageTitle}
                      </h2>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>
                          {activeReport.createdAt
                            ? new Date(activeReport.createdAt).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : copy.latestAnalysis}
                        </span>
                        <span className="opacity-40">·</span>
                        <span>{getAnalysisScopeLabel(activeReport.analysisScope, isArabic)}</span>
                        {activeReport.evidenceCount ? (
                          <>
                            <span className="opacity-40">·</span>
                            <span>{activeReport.evidenceCount} {activeReport.evidenceCount === 1 ? copy.file : copy.files}</span>
                          </>
                        ) : null}
                        {isFallbackReport && (
                          <>
                            <span className="opacity-40">·</span>
                            <span className="text-amber-400 font-medium">{copy.preliminary}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-4 sm:text-right">
                      {overallScore !== null && (
                        <div>
                          <p className="text-3xl font-black text-primary tabular-nums">
                            {Math.round(overallScore)}%
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            {copy.score}
                          </p>
                        </div>
                      )}
                      {highGapCount > 0 && (
                        <div>
                          <p className="text-3xl font-black text-[var(--status-critical)] tabular-nums">
                            {highGapCount}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            {copy.highPriority}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {activeReport.summary && (
                    <p className="text-sm leading-relaxed text-muted-foreground border-t border-[var(--glass-border)] pt-4">
                      {activeReport.summary}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2.5 border-t border-[var(--glass-border)] pt-4">
                    <button
                      onClick={() => handleExportSnapshot(activeReport.id)}
                      data-html2canvas-ignore="true"
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      {copy.exportPdf}
                    </button>
                    <button
                      onClick={() => setActiveReport(null)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                    >
                      {copy.close}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Findings ── */}
            <div className="space-y-3 px-4">
              {generating ? (
                <div className="space-y-3">
                  <div className="flex justify-center py-5">
                    <div className="inline-flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-3">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {copy.analyzingEvidence}
                      </span>
                    </div>
                  </div>
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="glass-panel glass-border animate-pulse rounded-[28px] p-6">
                      <div className="flex gap-6">
                        <div className="h-12 w-12 rounded-2xl glass-input" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 w-1/2 rounded-lg bg-[var(--surface)]" />
                          <div className="h-3 w-3/4 rounded-lg bg-[var(--surface)]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : isFallbackReport ? (
                <div className="rounded-[20px] border border-amber-500/20 bg-amber-500/10 px-5 py-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-foreground">{copy.preliminaryTitle}</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {copy.preliminaryDesc}
                      </p>
                    </div>
                  </div>
                </div>
              ) : gaps.length === 0 ? (
                <div className="py-14 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-9 w-9 text-[var(--status-success)] opacity-40" />
                  <p className="text-sm text-muted-foreground">{copy.noFindings}</p>
                </div>
              ) : (
                <>
                  {displayedGaps.map((gap, i) => (
                    <div
                      key={i}
                      className="glass-panel glass-border rounded-[24px] p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-5 group hover:bg-[var(--surface)] transition-all animate-fade-in-up opacity-0 relative overflow-hidden"
                      style={{ animationDelay: `${(i + 4) * 60}ms`, animationFillMode: "forwards" }}
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.7),transparent)] opacity-0 transition-opacity group-hover:opacity-60" />

                      <div className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-subtle)]",
                        gap.statusClass,
                      )}>
                        {gap.severity === "High" ? (
                          <AlertTriangle className="h-5 w-5" />
                        ) : gap.severity === "Medium" ? (
                          <Info className="h-5 w-5" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h3 className="text-base font-bold text-foreground">{gap.title}</h3>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border",
                            gap.severity === "High" ? "status-critical" :
                            gap.severity === "Medium" ? "status-warning" : "status-success",
                          )}>
                            {gap.severity}
                          </span>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border",
                            gap.alignment === (isArabic ? "غير متوافق" : "Not Aligned") ? "status-critical" :
                            gap.alignment === (isArabic ? "متوافق جزئيًا" : "Partially Aligned") ? "status-warning" : "status-success",
                          )}>
                            {gap.alignment}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">{gap.desc}</p>
                      </div>

                    </div>
                  ))}

                  {remainingGapCount > 0 && (
                    <p className="rounded-2xl border border-dashed border-[var(--glass-border)] px-4 py-4 text-center text-sm text-muted-foreground">
                      {copy.moreGaps(remainingGapCount)}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* ── Previous reports ── */}
            {reports && reports.length > 0 && (
              <section className="mt-12 px-4">
                <details className="glass-panel glass-border rounded-[24px] p-5">
                  <summary className="cursor-pointer list-none select-none">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-base font-semibold text-foreground">{copy.previousRuns}</h2>
                      <span className="rounded-full border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                        {reports.length}
                      </span>
                    </div>
                  </summary>

                  <div className="mt-4 space-y-2.5">
                    {reports
                      .filter(
                        (r: GapAnalysisListItem) =>
                          r.status !== "pending" && r.status !== "running" || r.id === pendingJobId,
                      )
                      .map((report: GapAnalysisListItem) => {
                        const isQueued =
                          report.status === "pending" ||
                          report.status === "running" ||
                          report.id === pendingJobId
                        const isFailed = report.status === "failed"

                        return (
                          <GlassCard
                            key={report.id}
                            variant={2}
                            hoverEffect={!isQueued}
                            shine={!isQueued}
                            className={cn(
                              "group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-[20px]",
                              isQueued
                                ? "opacity-60 cursor-wait"
                                : isFailed
                                ? "border-destructive/40 opacity-75"
                                : "cursor-pointer",
                            )}
                            onClick={isQueued || isFailed ? undefined : () => handleViewReport(report.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl glass-input">
                                {isQueued ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : isFailed ? (
                                  <AlertTriangle className="h-4 w-4 text-destructive" />
                                ) : (
                                  <span className="font-mono text-[10px] font-bold text-muted-foreground">
                                    {Math.round(report.overallScore)}%
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{report.standardTitle}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                  <span>
                                    {isQueued
                                      ? copy.analyzing
                                      : isFailed
                                      ? copy.failedShort
                                      : new Date(report.createdAt).toLocaleDateString()}
                                  </span>
                                  <span className="opacity-40">·</span>
                                  <span>{getAnalysisScopeLabel(report.analysisScope, isArabic)}</span>
                                  {report.evidenceCount ? (
                                    <>
                                      <span className="opacity-40">·</span>
                                      <span>{report.evidenceCount} {report.evidenceCount === 1 ? copy.file : copy.files}</span>
                                    </>
                                  ) : null}
                                  {report.isFallback && (
                                    <>
                                      <span className="opacity-40">·</span>
                                      <span className="text-amber-400 font-medium">{copy.preliminary}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleExportSnapshot(report.id)
                                }}
                                disabled={isFailed || isQueued}
                                className="text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity disabled:text-muted-foreground/40 disabled:pointer-events-none"
                              >
                                {copy.exportPdf}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteConfirm(report.id)
                                }}
                                className="text-[11px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                              >
                                {copy.delete}
                              </button>
                              <Play className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </GlassCard>
                        )
                      })}
                  </div>
                </details>
              </section>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={copy.deletePrompt}
            className="glass-panel glass-border rounded-2xl p-7 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-foreground mb-1">{copy.deletePrompt}</h3>
            <p className="text-sm text-muted-foreground mb-6">{copy.cannotUndo}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-[var(--glass-border)] py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                {copy.cancel}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/90"
              >
                {copy.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
