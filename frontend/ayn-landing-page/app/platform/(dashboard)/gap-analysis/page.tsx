"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { usePageTitle } from "@/hooks/use-page-title"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Play,
  Loader2,
  Check,
  CheckSquare,
  FileX,
  Eye,
  Clock,
  Plus,
  ChevronDown,
  ChevronRight,
  Calendar,
  Flag,
  Tag,
  X,
  Filter,
  ListTodo,
  ShieldAlert,
  TriangleAlert,
  Sparkles,
} from "lucide-react"
import type { GapAnalysis, GapItem, Standard, Evidence, GapAnalysisListItem } from "@/types"
import { EvidenceSelector } from "@/components/platform/evidence-selector"
import { DocumentEditor } from "@/components/platform/document-editor"
import { EmptyState } from "@/components/platform/empty-state"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import { useUiLanguage } from "@/lib/ui-language-context"

type AnalysisScope = "linked" | "recent" | "selected"
type TaskStatus = "open" | "in_progress" | "blocked" | "done" | "archived"
type TaskPriority = "critical" | "high" | "medium" | "low"
type TaskFilterTab = "all" | "my_tasks" | "open_risks" | "missing_evidence" | "needs_review"

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  due_date?: string
  dueDate?: string
  assigned_to?: string
  reference_type?: string
  source?: "v2" | "legacy"
  createdAt?: string
  created_at?: string
}

interface ActionCenterSummary {
  open_tasks: number
  overdue_tasks: number
  open_risks: number
  critical_risks: number
  missing_evidence: number
  needs_review: number
  expiring_soon: number
  overall_readiness: number
}

interface CreateTaskForm {
  title: string
  description: string
  priority: TaskPriority
  due_date: string
  reference_type: string
}

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

function getEffectiveDueDate(task: Task): string | undefined {
  return task.due_date ?? task.dueDate
}

function isOverdue(task: Task): boolean {
  const due = getEffectiveDueDate(task)
  if (!due) return false
  return new Date(due) < new Date() && task.status !== "done" && task.status !== "archived"
}

function formatDueDate(dateStr?: string, isArabic = false): string {
  if (!dateStr) return isArabic ? "لا يوجد" : "No date"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return isArabic ? "لا يوجد" : "No date"
  return date.toLocaleDateString(isArabic ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// Style mappings
const PRIORITY_STYLES: Record<TaskPriority, string> = {
  critical: "bg-red-500/15 text-red-400 border border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  medium: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  low: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  open: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  in_progress: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  blocked: "bg-red-500/15 text-red-400 border border-red-500/30",
  done: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  archived: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
}

const PRIORITY_LABELS_EN: Record<TaskPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
}
const PRIORITY_LABELS_AR: Record<TaskPriority, string> = {
  critical: "حرج",
  high: "عالية",
  medium: "متوسطة",
  low: "منخفضة",
}

const STATUS_LABELS_EN: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
  archived: "Archived",
}
const STATUS_LABELS_AR: Record<TaskStatus, string> = {
  open: "مفتوح",
  in_progress: "قيد التنفيذ",
  blocked: "محجوب",
  done: "مكتمل",
  archived: "مؤرشف",
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

  // Primary Tabs: Workspace (Original Gap Analysis Report run) vs Actions (Operational Gaps, Missing Evidence, Recommended Actions, Assigned Tasks)
  const [activeTab, setActiveTab] = useState<"workspace" | "actions">("workspace")
  const [taskFilter, setTaskFilter] = useState<TaskFilterTab>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [usingLegacy, setUsingLegacy] = useState(false)

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
    workspaceTab: isArabic ? "مساحة التحليل" : "Analysis Workspace",
    actionsTab: isArabic ? "إجراءات المعالجة" : "Operational Actions & Gaps",
    tasksLabel: isArabic ? "المهام المعينة" : "Assigned Tasks",
    openGapsLabel: isArabic ? "الفجوات المفتوحة" : "Open Gaps",
    missingEvidenceLabel: isArabic ? "أدلة مفقودة مطلوبة" : "Missing Evidence",
    recommendedActionsLabel: isArabic ? "توصيات حورس الذكية" : "Recommended Actions",
    createTaskBtn: isArabic ? "إضافة مهمة جديدة" : "New Task",
    usingLegacyData: isArabic ? "استخدام البيانات الاحتياطية" : "Using legacy data",
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
  const [progress, setProgress] = useState(0)
  const [activeReport, setActiveReport] = useState<GapAnalysis | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [pendingJobId, setPendingJobId] = useState<string | null>(null)

  const [isRemediating, setIsRemediating] = useState(false)
  const [targetGap, setTargetGap] = useState<{ gap: GapItem; standardId: string } | null>(null)
  const [isDrafting, setIsDrafting] = useState(false)
  const [draftContent, setDraftContent] = useState("")
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  // ─── Data Fetching: Action Center Summary & Tasks ───────────────────────────
  const {
    data: summaryData,
    mutate: mutateSummary,
  } = useSWR<ActionCenterSummary>(
    user ? "action-center-summary" : null,
    async () => {
      try {
        const result = await api.v2GetActionCenterSummary()
        setUsingLegacy(false)
        return result
      } catch {
        const legacy = await api.getCommandCenter()
        setUsingLegacy(true)
        return {
          open_tasks: legacy.overdueTasksCount ?? 0,
          overdue_tasks: legacy.overdueTasksCount ?? 0,
          open_risks: legacy.openGapsCount ?? 0,
          critical_risks: 0,
          missing_evidence: legacy.staleEvidenceCount ?? 0,
          needs_review: legacy.pendingReviewsCount ?? 0,
          expiring_soon: 0,
          overall_readiness: legacy.auditReadinessScore ?? 0,
        } satisfies ActionCenterSummary
      }
    },
    {
      refreshInterval: 120_000,
      revalidateOnFocus: false,
    }
  )

  const {
    data: v2Tasks,
    mutate: mutateV2Tasks,
  } = useSWR<any[]>(
    user ? "v2-tasks" : null,
    () => api.v2GetTasks({ limit: 100 }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    }
  )

  const {
    data: legacyTasks,
    mutate: mutateLegacyTasks,
  } = useSWR<any[]>(
    user ? "legacy-action-plan-tasks" : null,
    () => api.getActionPlanTasks(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    }
  )

  // Unify V2 and Legacy Tasks
  const allTasks: Task[] = useMemo(() => {
    const v2 = Array.isArray(v2Tasks)
      ? v2Tasks.map((t) => ({ ...t, source: "v2" as const }))
      : []

    const v2Ids = new Set(v2.map((t) => t.id))
    const legacy = Array.isArray(legacyTasks)
      ? legacyTasks
          .filter((t) => !v2Ids.has(t.id))
          .map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: (t.status === "todo" ? "open" : t.status) as TaskStatus,
            priority: (t.priority ?? "medium") as TaskPriority,
            dueDate: t.dueDate,
            source: "legacy" as const,
            reference_type: t.criterionId ? "criterion" : t.gapId ? "gap" : undefined,
            createdAt: t.createdAt,
          }))
      : []

    return [...v2, ...legacy]
  }, [v2Tasks, legacyTasks])

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (t.status === "archived") return false
      switch (taskFilter) {
        case "my_tasks":
          return t.status !== "done"
        case "open_risks":
          return t.reference_type === "risk" || t.reference_type === "gap"
        case "missing_evidence":
          return t.reference_type === "evidence"
        case "needs_review":
          return t.status === "blocked" || t.status === "open"
        default:
          return true
      }
    })
  }, [allTasks, taskFilter])

  const handleStatusChange = useCallback(
    async (taskId: string, status: TaskStatus, source: "v2" | "legacy") => {
      try {
        if (source === "v2") {
          await api.v2UpdateTask(taskId, { status })
        } else {
          const legacyStatus = status === "open" ? "todo" : (status as any)
          await api.updateActionPlanTask(taskId, { status: legacyStatus })
        }
        await Promise.all([mutateV2Tasks(), mutateLegacyTasks(), mutateSummary()])
        toast.success(isArabic ? "تم تحديث الحالة" : "Status updated")
      } catch (err: any) {
        toast.error(err?.message ?? (isArabic ? "فشل التحديث" : "Failed to update"))
      }
    },
    [mutateV2Tasks, mutateLegacyTasks, mutateSummary, isArabic]
  )

  const handleCreated = useCallback(() => {
    mutateV2Tasks()
    mutateSummary()
  }, [mutateV2Tasks, mutateSummary])

  // ─── Standard SWR & Operations ─────────────────────────────────────────────
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
        if (isRemediating) setIsRemediating(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [deleteConfirm, isRemediating])

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
    setProgress(0)
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
      // Fill progress bar fully before next tick resets it
      setProgress(100)
      setTimeout(() => setGenerating(false), 600)
      mutate()
    } catch {
      toast.error(copy.failedQueue)
      setGenerating(false)
    }
  }, [selectedStandard, analysisScope, selectedEvidenceIds, mutate])

  // Progress bar simulation during analysis
  useEffect(() => {
    if (!generating) {
      setProgress(0)
      return
    }
    const timer = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 8, 90))
    }, 400)
    return () => clearInterval(timer)
  }, [generating])

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

  const handleRemediateClick = useCallback((gapItem: GapItem) => {
    if (!activeReport) return
    setTargetGap({ gap: gapItem, standardId: activeReport.standardId })
    setIsRemediating(true)
  }, [activeReport])

  const handleEvidenceSelected = useCallback(async (evidence: Evidence) => {
    if (!targetGap) return
    try {
      const gapId = crypto.randomUUID()
      await api.recordGapDefined(
        gapId,
        targetGap.standardId,
        targetGap.gap.criterionTitle,
        targetGap.gap.gap || targetGap.gap.recommendation || "Gap description",
        targetGap.gap.priority.toLowerCase()
      )
      await api.recordGapAddressed(gapId, evidence.id)
      toast.success(isArabic ? "تم ربط الدليل بالفجوة" : "Evidence linked to gap", {
        description: isArabic
          ? `تم ربط "${evidence.title || "الدليل"}" بـ ${targetGap.gap.criterionTitle}`
          : `Linked "${evidence.title || "Evidence"}" to ${targetGap.gap.criterionTitle}`,
      })
      setIsRemediating(false)
      setTargetGap(null)
      mutate()
    } catch (error) {
      console.error(error)
      toast.error(isArabic ? "فشل ربط الدليل" : "Failed to link evidence")
    }
  }, [targetGap, isArabic, mutate])

  const handleDraftRemediationClick = useCallback(async (gapItem: GapItem) => {
    if (!activeReport || !user?.institutionId) {
      toast.error(isArabic ? "سياق المؤسسة مفقود" : "Institution context missing")
      return
    }
    const mockGapId = `gap-${Date.now()}`
    setTargetGap({ gap: gapItem, standardId: activeReport.standardId })
    setIsDrafting(true)
    try {
      toast.info(isArabic ? "حورس يقوم بصياغة مسودة للمستند..." : "Horus AI is drafting a document...", { duration: 4000 })
      const res = await api.draftDocument(
        mockGapId,
        user.institutionId,
        `Please draft a policy/evidence document addressing this recommendation: ${gapItem.recommendation}`
      )
      setDraftContent(res.content)
      setIsEditorOpen(true)
    } catch (e: any) {
      toast.error(e.message || (isArabic ? "فشل توليد مسودة الذكاء الاصطناعي" : "Failed to generate AI Draft"))
    } finally {
      setIsDrafting(false)
    }
  }, [activeReport, user, isArabic])

  const handleSaveDraftAsEvidence = useCallback(async (finalContent: string) => {
    if (!targetGap || !user) return
    setIsSavingDraft(true)
    try {
      const fileName = `Auto-Draft-${targetGap.gap.criterionTitle.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 15)}.txt`
      const file = new File([finalContent], fileName, { type: "text/plain" })
      const uploadRes = await api.uploadEvidence(file)
      const gapId = crypto.randomUUID()
      await api.recordGapDefined(
        gapId,
        targetGap.standardId,
        targetGap.gap.criterionTitle,
        targetGap.gap.gap || targetGap.gap.recommendation || "Gap description",
        targetGap.gap.priority.toLowerCase()
      )
      await api.recordGapAddressed(gapId, uploadRes.id || uploadRes.evidence_id)
      toast.success(isArabic ? "تم حفظ المسودة وربطها كدليل!" : "Draft saved and linked as Evidence!")
      setIsEditorOpen(false)
      setTargetGap(null)
      mutate()
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || (isArabic ? "فشل حفظ المسودة كدليل" : "Failed to save draft as Evidence"))
    } finally {
      setIsSavingDraft(false)
    }
  }, [targetGap, user, isArabic, mutate])

  // Parse Gaps
  const gaps = useMemo(() => {
    return activeReport?.gaps?.map((item: GapItem) => {
      const severity = getSeverity(item.priority, isArabic)
      const alignment = getAlignment(item.status, isArabic)
      const statusClass =
        severity === (isArabic ? "عالي" : "High") ? "status-critical" :
        severity === (isArabic ? "متوسط" : "Medium") ? "status-warning" : "status-success"
      return {
        original: item,
        title: item.criterionTitle ?? copy.unnamedCriterion,
        severity,
        alignment,
        desc: item.recommendation ?? copy.noRecommendation,
        statusClass,
      }
    }) ?? []
  }, [activeReport, isArabic, copy])

  const overallScore = activeReport?.overallScore ?? null
  const highGapCount = gaps.filter((g) => g.severity === (isArabic ? "عالي" : "High")).length
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
      return stillValid
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

  // Sub-sections lists derived from current gaps
  const openGapsList = useMemo(() => {
    return gaps.filter(g => g.original.status !== "aligned" && g.original.status !== "met")
  }, [gaps])

  const missingEvidenceList = useMemo(() => {
    return gaps.filter(g => g.original.status === "no_evidence" || g.original.status === "not_aligned")
  }, [gaps])

  const recommendedActionsList = useMemo(() => {
    return gaps.filter(g => !!g.original.recommendation).map(g => ({
      criterionTitle: g.title,
      recommendation: g.desc,
      priority: g.severity,
      original: g.original,
    }))
  }, [gaps])

  return (
    <div className={cn("mx-auto platform-container-default animate-fade-in-up pb-20", isArabic && "font-arabic")} dir={isArabic ? "rtl" : "ltr"}>
      <div id="gap-analysis-report-content">

        {/* ── Page title & Navigation Tabs ── */}
        <div className="px-4 pt-6 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{copy.pageTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {copy.pageSubtitle}
            </p>
          </div>

          {/* Action Center Legacy Badge */}
          {usingLegacy && (
            <span
              className="self-start rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 cursor-help"
              title={isArabic ? "بيانات من الإصدار السابق — بعض الإجراءات قد لا تكون متاحة" : "Data from a previous version — some actions may be unavailable"}
            >
              ⚠️ {copy.usingLegacyData}
            </span>
          )}
        </div>

        {/* Tab switcher */}
        <div className="px-4 mb-6">
          <div className="inline-flex p-1 rounded-xl border border-white/8 bg-white/[0.02] backdrop-blur-sm shadow-inner">
            <button
              onClick={() => setActiveTab("workspace")}
              className={cn(
                "relative px-4 py-2 text-xs font-bold tracking-wider transition-colors duration-300 rounded-lg cursor-pointer flex items-center gap-2",
                activeTab === "workspace"
                  ? "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(59,130,246,0.35)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Play className="h-3 w-3" />
              <span className="flex flex-col items-start gap-0">
                <span>{copy.workspaceTab}</span>
                <span className="text-xs font-normal text-muted-foreground/70">
                  {isArabic ? "تشغيل تحليل جديد" : "Run a new analysis"}
                </span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("actions")}
              className={cn(
                "relative px-4 py-2 text-xs font-bold tracking-wider transition-colors duration-300 rounded-lg cursor-pointer flex items-center gap-2",
                activeTab === "actions"
                  ? "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(59,130,246,0.35)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListTodo className="h-3 w-3" />
              <span className="flex flex-col items-start gap-0">
                <span>{copy.actionsTab}</span>
                <span className="text-xs font-normal text-muted-foreground/70">
                  {isArabic ? "عرض النتائج والمهام" : "View results & tasks"}
                </span>
              </span>
                  </button>
                  {generating && (
                    <div className="mt-3 h-1 w-full max-w-[300px] overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-foreground transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
        </div>

        {activeTab === "workspace" ? (
          <>
            {/* ── Tab 1: Workspace Run Form & Report ── */}
            <div className="px-4 mb-8">
              <div className="glass-panel glass-border rounded-[28px] p-5 sm:p-6 space-y-5 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.8),transparent)] opacity-60" />

                {/* Standard picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
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
                      ?.filter((s: Standard) => s.isPublic)
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
                  <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {copy.evidence}
                  </label>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {scopeOptions.map((scope) => (
                      <button
                        key={scope.id}
                        type="button"
                        onClick={() => setAnalysisScope(scope.id)}
                        className={cn(
                          "rounded-2xl border px-4 py-3.5 text-start transition-all",
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
                          <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                            {selectedEvidenceIds.length} {copy.selected}
                          </span>
                        )}
                      </div>
                      <div className="max-h-64 space-y-1.5 overflow-y-auto pe-1">
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
                                  "w-full rounded-2xl border px-4 py-3 text-start transition-all",
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

            {/* Reports results display */}
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
                {/* Active report header and metadata */}
                {activeReport && (
                  <div className="mb-8 px-4">
                    <div className="glass-panel glass-border rounded-[28px] p-5 sm:p-6 space-y-4">
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

                        <div className="flex items-center gap-4 sm:text-end">
                          {overallScore !== null && (
                            <div>
                              <p className="text-3xl font-black text-primary tabular-nums">
                                {Math.round(overallScore)}%
                              </p>
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                {copy.score}
                              </p>
                            </div>
                          )}
                          {highGapCount > 0 && (
                            <div>
                              <p className="text-3xl font-black text-[var(--status-critical)] tabular-nums">
                                {highGapCount}
                              </p>
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                {copy.highPriority}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {activeReport.summary && (
                        <p className="text-sm leading-relaxed text-muted-foreground border-t border-[var(--glass-border)] pt-4">
                          {activeReport.summary}
                        </p>
                      )}

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

                {/* Findings list */}
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
                            {gap.severity === (isArabic ? "عالي" : "High") ? (
                              <AlertTriangle className="h-5 w-5" />
                            ) : gap.severity === (isArabic ? "متوسط" : "Medium") ? (
                              <Info className="h-5 w-5" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <h3 className="text-base font-bold text-foreground">{gap.title}</h3>
                              <span className={cn(
                                "text-xs font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border",
                                gap.severity === (isArabic ? "عالي" : "High") ? "status-critical" :
                                gap.severity === (isArabic ? "متوسط" : "Medium") ? "status-warning" : "status-success",
                              )}>
                                {gap.severity}
                              </span>
                              <span className={cn(
                                "text-xs font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border",
                                gap.alignment === (isArabic ? "غير متوافق" : "Not Aligned") ? "status-critical" :
                                gap.alignment === (isArabic ? "متوافق جزئيًا" : "Partially Aligned") ? "status-warning" : "status-success",
                              )}>
                                {gap.alignment}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground">{gap.desc}</p>
                          </div>

                          {gap.original.status !== "aligned" && gap.original.status !== "met" && (
                            <div className="shrink-0 mt-4 sm:mt-0 flex flex-row sm:flex-col gap-2 w-full sm:w-auto self-stretch sm:self-center">
                              <button
                                onClick={() => handleDraftRemediationClick(gap.original)}
                                disabled={isDrafting}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/10 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                              >
                                {isDrafting && targetGap?.gap.criterionTitle === gap.original.criterionTitle ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5" />
                                )}
                                <span>{isArabic ? "مسودة تلقائية" : "Auto-Draft"}</span>
                              </button>
                              <button
                                onClick={() => handleRemediateClick(gap.original)}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-all hover:opacity-90 cursor-pointer shadow-md whitespace-nowrap"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>{isArabic ? "ربط الدليل" : "Link Evidence"}</span>
                              </button>
                            </div>
                          )}

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

                {/* Previous reports */}
                {reports && reports.length > 0 && (
                  <section className="mt-12 px-4">
                    <details className="glass-panel glass-border rounded-[24px] p-5">
                      <summary className="cursor-pointer list-none select-none">
                        <div className="flex items-center justify-between gap-4">
                          <h2 className="text-base font-semibold text-foreground">{copy.previousRuns}</h2>
                          <span className="rounded-full border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-2.5 py-1 text-xs font-semibold text-muted-foreground">
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
                                      <span className="font-mono text-xs font-bold text-muted-foreground">
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
                                    className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity disabled:text-muted-foreground/40 disabled:pointer-events-none"
                                  >
                                    {copy.exportPdf}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setDeleteConfirm(report.id)
                                    }}
                                    className="text-xs font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
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
          </>
        ) : (
          /* ── Tab 2: Operational Actions (Open Gaps, Missing Evidence, Recommended Actions, Tasks) ── */
          <div className="space-y-8">

            {/* 1. Stat cards/Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="premium-card p-4 flex flex-col justify-between">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{isArabic ? "مجموع الفجوات" : "Open Gaps"}</span>
                <span className="text-2xl font-black text-amber-400 mt-2">{openGapsList.length || summaryData?.open_risks || 0}</span>
              </div>
              <div className="premium-card p-4 flex flex-col justify-between">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{isArabic ? "أدلة مفقودة" : "Missing Evidence"}</span>
                <span className="text-2xl font-black text-red-400 mt-2">{missingEvidenceList.length || summaryData?.missing_evidence || 0}</span>
              </div>
              <div className="premium-card p-4 flex flex-col justify-between">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{isArabic ? "المهام المعلقة" : "Pending Tasks"}</span>
                <span className="text-2xl font-black text-blue-400 mt-2">{allTasks.filter(t => t.status !== "done").length}</span>
              </div>
              <div className="premium-card p-4 flex flex-col justify-between">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{isArabic ? "المهام المكتملة" : "Completed Tasks"}</span>
                <span className="text-2xl font-black text-emerald-400 mt-2">{allTasks.filter(t => t.status === "done").length}</span>
              </div>
            </div>

            {/* 2. Grid for Gaps, Missing Evidence, and Recommended Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Section A: Open Gaps */}
              <GlassCard className="p-5 flex flex-col gap-4" hoverEffect>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-foreground tracking-wider">{copy.openGapsLabel}</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-3 pe-1">
                  {openGapsList.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">{isArabic ? "لا توجد فجوات نشطة حاليًا" : "No active gaps currently"}</p>
                  ) : (
                    openGapsList.map((gap, index) => (
                      <div key={index} className="premium-card p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground truncate">{gap.title}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full border border-amber-500/20 text-amber-400 bg-amber-500/10 font-bold">{gap.severity}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{gap.desc}</p>
                        <div className="flex gap-1.5 pt-1.5 border-t border-white/5">
                          <button
                            onClick={() => handleDraftRemediationClick(gap.original)}
                            disabled={isDrafting}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg border border-primary/20 bg-primary/5 text-xs font-bold text-primary transition-all hover:bg-primary/10 disabled:opacity-50 cursor-pointer"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{isArabic ? "مسودة" : "Auto-Draft"}</span>
                          </button>
                          <button
                            onClick={() => handleRemediateClick(gap.original)}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-primary text-xs font-bold text-primary-foreground transition-all hover:opacity-90 cursor-pointer"
                          >
                            <span>{isArabic ? "ربط" : "Link"}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

              {/* Section B: Missing Evidence */}
              <GlassCard className="p-5 flex flex-col gap-4" hoverEffect>
                <div className="flex items-center gap-2">
                  <FileX className="w-5 h-5 text-red-400" />
                  <h3 className="text-sm font-bold text-foreground tracking-wider">{copy.missingEvidenceLabel}</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-3 pe-1">
                  {missingEvidenceList.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">{isArabic ? "لا توجد أدلة مفقودة معلقة" : "No missing evidence reports"}</p>
                  ) : (
                    missingEvidenceList.map((gap, index) => (
                      <div key={index} className="premium-card p-3 space-y-2 bg-red-500/[0.02]">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{gap.title}</p>
                            <p className="text-xs text-muted-foreground">{isArabic ? "يلزم إرفاق دليل امتثال" : "Compliance proof needed"}</p>
                          </div>
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        </div>
                        <div className="flex gap-1.5 pt-1.5 border-t border-white/5">
                          <button
                            onClick={() => handleDraftRemediationClick(gap.original)}
                            disabled={isDrafting}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg border border-primary/20 bg-primary/5 text-xs font-bold text-primary transition-all hover:bg-primary/10 disabled:opacity-50 cursor-pointer"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{isArabic ? "مسودة" : "Auto-Draft"}</span>
                          </button>
                          <button
                            onClick={() => handleRemediateClick(gap.original)}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-primary text-xs font-bold text-primary-foreground transition-all hover:opacity-90 cursor-pointer"
                          >
                            <span>{isArabic ? "ربط" : "Link"}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

              {/* Section C: Recommended Actions */}
              <GlassCard className="p-5 flex flex-col gap-4" hoverEffect>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-bold text-foreground tracking-wider">{copy.recommendedActionsLabel}</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-3 pe-1">
                  {recommendedActionsList.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">{isArabic ? "لا توجد توصيات متاحة" : "No recommendations available"}</p>
                  ) : (
                    recommendedActionsList.map((action, index) => (
                      <div key={index} className="premium-card p-3 space-y-2">
                        <p className="text-xs text-primary font-bold uppercase tracking-wider">{action.criterionTitle}</p>
                        <p className="text-xs text-foreground font-medium leading-relaxed">{action.recommendation}</p>
                        <div className="flex gap-1.5 pt-1.5 border-t border-white/5">
                          <button
                            onClick={() => handleDraftRemediationClick(action.original)}
                            disabled={isDrafting}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg border border-primary/20 bg-primary/5 text-xs font-bold text-primary transition-all hover:bg-primary/10 disabled:opacity-50 cursor-pointer"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{isArabic ? "مسودة" : "Auto-Draft"}</span>
                          </button>
                          <button
                            onClick={() => handleRemediateClick(action.original)}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-primary text-xs font-bold text-primary-foreground transition-all hover:opacity-90 cursor-pointer"
                          >
                            <span>{isArabic ? "ربط" : "Link"}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

            </div>

            {/* 3. Assigned Tasks console (Action Center integration) */}
            <div className="premium-surface p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground tracking-wider">{copy.tasksLabel}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_4px_12px_rgba(59,130,246,0.3)] self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{copy.createTaskBtn}</span>
                </button>
              </div>

              {/* Task filter sub-tabs */}
              <div className="flex flex-wrap gap-1.5">
                {(isArabic 
                  ? [
                      { id: "all" as TaskFilterTab, label: "الكل" },
                      { id: "my_tasks" as TaskFilterTab, label: "مهامي النشطة" },
                      { id: "open_risks" as TaskFilterTab, label: "المخاطر" },
                      { id: "missing_evidence" as TaskFilterTab, label: "الأدلة المفقودة" },
                      { id: "needs_review" as TaskFilterTab, label: "يحتاج مراجعة" }
                    ]
                  : [
                      { id: "all" as TaskFilterTab, label: "All" },
                      { id: "my_tasks" as TaskFilterTab, label: "Active Tasks" },
                      { id: "open_risks" as TaskFilterTab, label: "Risks" },
                      { id: "missing_evidence" as TaskFilterTab, label: "Missing Evidence" },
                      { id: "needs_review" as TaskFilterTab, label: "Needs Review" }
                    ]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTaskFilter(tab.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-2xl text-xs font-bold transition-all border cursor-pointer",
                      taskFilter === tab.id
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-[var(--glass-border-subtle)] bg-[var(--glass-soft-bg)] text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Task list container */}
              <div className="space-y-1 divide-y divide-white/5 max-h-[400px] overflow-y-auto pe-1">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground">
                    {isArabic ? "لا توجد مهام تطابق الفلترة الحالية" : "No tasks match current filter"}
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div key={task.id} className="py-2.5 flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          task.priority === "critical" && "bg-red-400",
                          task.priority === "high" && "bg-orange-400",
                          task.priority === "medium" && "bg-amber-400",
                          task.priority === "low" && "bg-slate-400",
                        )} />
                        <div className="min-w-0">
                          <p className={cn(
                            "text-xs font-medium text-foreground truncate",
                            task.status === "done" && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground/60">{task.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Priority label */}
                        <span className={cn(
                          "hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border",
                          PRIORITY_STYLES[task.priority]
                        )}>
                          {isArabic ? PRIORITY_LABELS_AR[task.priority] : PRIORITY_LABELS_EN[task.priority]}
                        </span>

                        {/* Clickable Status dropdown */}
                        <StatusDropdown task={task} onStatusChange={handleStatusChange} isArabic={isArabic} />

                        {/* Due date */}
                        <div className="text-xs text-muted-foreground hidden md:flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDueDate(getEffectiveDueDate(task), isArabic)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── dialog confirmation (Delete) ── */}
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

      {/* ── dialog create task ── */}
      <CreateTaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
        isArabic={isArabic}
      />

      {/* ── Evidence Selector ── */}
      <EvidenceSelector
        open={isRemediating}
        onOpenChange={setIsRemediating}
        onSelect={handleEvidenceSelected}
      />

      {/* ── AI Draft Editor ── */}
      <DocumentEditor
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        draftContent={draftContent}
        onSave={handleSaveDraftAsEvidence}
        isSaving={isSavingDraft}
      />
    </div>
  )
}

function StatusDropdown({
  task,
  onStatusChange,
  isArabic,
}: {
  task: Task
  onStatusChange: (taskId: string, status: TaskStatus, source: "v2" | "legacy") => Promise<void>
  isArabic: boolean
}) {
  const [open, setOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const labels = isArabic ? STATUS_LABELS_AR : STATUS_LABELS_EN

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const statuses: TaskStatus[] = ["open", "in_progress", "blocked", "done"]

  async function handleSelect(status: TaskStatus) {
    if (status === task.status) { setOpen(false); return }
    setUpdating(true)
    setOpen(false)
    try {
      await onStatusChange(task.id, status, task.source ?? "v2")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        disabled={updating}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all hover:opacity-80 cursor-pointer",
          STATUS_STYLES[task.status]
        )}
      >
        {updating ? (
          <Loader2 className="w-2.5 h-2.5 animate-spin" />
        ) : (
          <ChevronDown className="w-2.5 h-2.5" />
        )}
        {labels[task.status]}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full mt-1 end-0 min-w-[140px] rounded-xl border border-[var(--glass-border)] bg-[var(--surface-modal)] shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            {statuses.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSelect(s)}
                className={cn(
                  "w-full text-start px-3 py-2 text-xs font-medium hover:bg-white/5 transition-colors flex items-center gap-2",
                  s === task.status && "opacity-50 cursor-default"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", {
                  "bg-blue-400": s === "open",
                  "bg-purple-400": s === "in_progress",
                  "bg-red-400": s === "blocked",
                  "bg-emerald-400": s === "done",
                })} />
                {labels[s]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CreateTaskDialog({
  open,
  onClose,
  onCreated,
  isArabic,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  isArabic: boolean
}) {
  const [form, setForm] = useState<CreateTaskForm>({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    reference_type: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => titleRef.current?.focus(), 80)
      setForm({ title: "", description: "", priority: "medium", due_date: "", reference_type: "" })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error(isArabic ? "العنوان مطلوب" : "Title is required")
      return
    }
    setSubmitting(true)
    try {
      await api.v2CreateTask({
        title: form.title.trim(),
        description: form.description || undefined,
        priority: form.priority,
        due_date: form.due_date || undefined,
        reference_type: form.reference_type || undefined,
      })
      toast.success(isArabic ? "تم إنشاء المهمة" : "Task created")
      onCreated()
      onClose()
    } catch (err: any) {
      toast.error(err?.message ?? (isArabic ? "فشل الإنشاء" : "Failed to create task"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-lg rounded-[24px] border border-[var(--glass-border)] bg-[var(--surface-modal)] shadow-2xl backdrop-blur-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">
                    {isArabic ? "إنشاء مهمة جديدة" : "Create New Task"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                    {isArabic ? "العنوان *" : "Title *"}
                  </label>
                  <input
                    ref={titleRef}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder={isArabic ? "عنوان المهمة..." : "Task title..."}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.04] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                    {isArabic ? "الوصف" : "Description"}
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder={isArabic ? "وصف اختياري..." : "Optional description..."}
                    rows={3}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.04] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                      {isArabic ? "الأولوية" : "Priority"}
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.04] px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="critical">{isArabic ? "حرج" : "Critical"}</option>
                      <option value="high">{isArabic ? "عالية" : "High"}</option>
                      <option value="medium">{isArabic ? "متوسطة" : "Medium"}</option>
                      <option value="low">{isArabic ? "منخفضة" : "Low"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                      {isArabic ? "تاريخ الاستحقاق" : "Due Date"}
                    </label>
                    <input
                      type="date"
                      value={form.due_date}
                      onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.04] px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                    {isArabic ? "نوع المرجع" : "Reference Type"}
                  </label>
                  <select
                    value={form.reference_type}
                    onChange={(e) => setForm((f) => ({ ...f, reference_type: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.04] px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">{isArabic ? "بدون مرجع" : "No reference"}</option>
                    <option value="risk">{isArabic ? "مخاطرة" : "Risk"}</option>
                    <option value="evidence">{isArabic ? "دليل" : "Evidence"}</option>
                    <option value="gap">{isArabic ? "فجوة" : "Gap"}</option>
                    <option value="standard">{isArabic ? "معيار" : "Standard"}</option>
                    <option value="criterion">{isArabic ? "معيار فرعي" : "Criterion"}</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-white/5"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold transition-all hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    {isArabic ? "إنشاء" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
