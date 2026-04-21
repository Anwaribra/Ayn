"use client"

import { useState, useEffect, useMemo } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { api } from "@/lib/api"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/platform/header"
import {
  Activity,
  Sparkles,
  FileCheck,
  GraduationCap,
  X,
  Loader2,
  FileUp,
  Search,
  Eye,
  CheckCircle2,
  Upload,
  CheckCircle,
  AlertCircle,
  XCircle,
  Circle,
  Check,
  RefreshCw,
  ArrowUpRight,
  Layers3,
  ShieldCheck,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react"
import type { Standard, Evidence } from "@/types"
import { useUiLanguage } from "@/lib/ui-language-context"
import { useAuth } from "@/lib/auth-context"
import { getStandardDisplayTitle } from "@/lib/standard-display"
import { resolveStandardColorClass } from "@/lib/standard-color"
import { usePageTitle } from "@/hooks/use-page-title"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassPanel } from "@/components/ui/glass-panel"
import { CoverageBar } from "@/components/platform/coverage-bar"

type MappingState = "not_started" | "analyzing" | "complete"
type DerivedStatus = "strong" | "partial" | "critical" | "unmapped" | "analyzing"

type StandardInsight = {
  standardId: string
  totalCriteria: number
  coveredCriteria: number
  coveragePct: number
  mapped: number
  totalMapped: number
  mappingState: MappingState
  derivedStatus: DerivedStatus
}

function deriveStatus(coveragePct: number, mappingState: string | undefined, mapped: number, total: number): DerivedStatus {
  if (mappingState === "analyzing") return "analyzing"
  if ((mapped === 0 || total === 0) && coveragePct === 0) return "unmapped"
  if (coveragePct >= 80) return "strong"
  if (coveragePct >= 40) return "partial"
  return "critical"
}

function getStatusBadge(status: DerivedStatus, isArabic: boolean) {
  switch (status) {
    case "strong":
      return {
        label: isArabic ? "قوي" : "Strong",
        className:
          "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]",
      }
    case "partial":
      return {
        label: isArabic ? "جزئي" : "Partial",
        className:
          "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
      }
    case "critical":
      return {
        label: isArabic ? "حرج" : "Critical",
        className:
          "border-[var(--status-critical-border)] bg-[var(--status-critical-bg)] text-[var(--status-critical)]",
      }
    case "analyzing":
      return {
        label: isArabic ? "قيد التحليل" : "Analyzing",
        className:
          "border-[var(--status-info-border)] bg-[var(--status-info-bg)] text-[var(--status-info)]",
      }
    default:
      return {
        label: isArabic ? "لم يبدأ" : "Not Started",
        className: "border-[var(--glass-border)] bg-[var(--glass-soft-bg)] text-muted-foreground",
      }
  }
}

function formatFilterLabel(value?: string | null, fallback = "Uncategorized") {
  return value?.trim() || fallback
}

const MAPPING_STATUS_META: Record<string, { label: string; labelAr: string; Icon: LucideIcon; iconClass: string; badgeClass: string }> = {
  met: {
    label: "Covered",
    labelAr: "مغطى",
    Icon: CheckCircle,
    iconClass: "text-green-500",
    badgeClass: "bg-green-500/10 text-green-500",
  },
  partial: {
    label: "Partial",
    labelAr: "جزئي",
    Icon: AlertCircle,
    iconClass: "text-yellow-500",
    badgeClass: "bg-yellow-500/10 text-yellow-500",
  },
  gap: {
    label: "Gap",
    labelAr: "فجوة",
    Icon: XCircle,
    iconClass: "text-red-500",
    badgeClass: "bg-red-500/10 text-red-500",
  },
  not_analyzed: {
    label: "Pending",
    labelAr: "قيد الانتظار",
    Icon: Circle,
    iconClass: "text-muted-foreground",
    badgeClass: "glass-button text-muted-foreground",
  },
}

export default function StandardsPage() {
  const router = useRouter()
  const { isArabic } = useUiLanguage()
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"
  usePageTitle(isArabic ? "المعايير" : "Standards Hub")
  const { data: standards, isLoading, mutate } = useSWR<Standard[]>(
    "standards",
    () => api.getStandards(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
    },
  )

  const publicStandards = useMemo(
    () => (standards ?? []).filter((standard) => standard.isPublic),
    [standards],
  )

  const { data: standardInsights, isLoading: insightsLoading } = useSWR<StandardInsight[]>(
    publicStandards.length ? ["standards-insights", ...publicStandards.map((standard) => standard.id)] : null,
    async () =>
      Promise.all(
        publicStandards.map(async (standard) => {
          const [coverage, mapping] = await Promise.all([
            api.getStandardCoverage(standard.id).catch(() => null),
            api.getStandardMappingsStatus(standard.id).catch(() => null),
          ])

          const totalCriteria = coverage?.totalCriteria ?? standard.criteriaCount ?? 0
          const coveredCriteria = coverage?.coveredCriteria ?? 0
          const coveragePct = coverage?.coveragePct ?? 0
          const mapped = mapping?.mapped ?? coveredCriteria
          const totalMapped = mapping?.total ?? totalCriteria
          const mappingState = (mapping?.status as MappingState | undefined) ?? "not_started"

          return {
            standardId: standard.id,
            totalCriteria,
            coveredCriteria,
            coveragePct,
            mapped,
            totalMapped,
            mappingState,
            derivedStatus: deriveStatus(coveragePct, mapping?.status, mapped, totalMapped),
          }
        }),
      ),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,
    },
  )

  const insightsById = useMemo(
    () => new Map((standardInsights ?? []).map((entry) => [entry.standardId, entry])),
    [standardInsights],
  )

  const totalCriteria = useMemo(
    () => publicStandards.reduce((sum, standard) => sum + (standard.criteriaCount ?? standard.criteria?.length ?? 0), 0),
    [publicStandards],
  )

  const analyzedFrameworks = useMemo(
    () => (standardInsights ?? []).filter((entry) => entry.mappingState === "complete" || entry.coveredCriteria > 0).length,
    [standardInsights],
  )

  const averageCoverage = useMemo(() => {
    if (!standardInsights?.length) return 0
    return Math.round(
      standardInsights.reduce((sum, entry) => sum + entry.coveragePct, 0) / standardInsights.length,
    )
  }, [standardInsights])

  const weakestStandard = useMemo(() => {
    if (!publicStandards.length || !standardInsights?.length) return null
    const weakest = [...standardInsights].sort((a, b) => a.coveragePct - b.coveragePct)[0]
    return publicStandards.find((standard) => standard.id === weakest.standardId) ?? null
  }, [publicStandards, standardInsights])

  // PDF Import State
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
    } else if (file) {
      toast.error("Please upload a PDF file.")
    }
  }

  // Details Modal State
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [mappingStatus, setMappingStatus] = useState<MappingState>("not_started")
  const [mappingsData, setMappingsData] = useState<any>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isDetailsOpen && selectedStandard && mappingStatus === "analyzing") {
      interval = setInterval(async () => {
        try {
          const statusRes = await api.getStandardMappingsStatus(selectedStandard.id)
          setMappingStatus(statusRes.status as MappingState)
          if (statusRes.status === "complete") {
            const data = await api.getStandardMappings(selectedStandard.id)
            setMappingsData(data)
          }
        } catch {
          // ignore polling errors
        }
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [isDetailsOpen, selectedStandard, mappingStatus])

  const openDetails = async (standard: Standard) => {
    setSelectedStandard(standard)
    setIsDetailsOpen(true)
    setMappingStatus("not_started")
    setMappingsData(null)

    try {
      const [data, statusRes] = await Promise.all([
        api.getStandardMappings(standard.id),
        api.getStandardMappingsStatus(standard.id),
      ])
      setMappingsData(data)
      setMappingStatus(statusRes.status as MappingState)
    } catch (err) {
      console.error(err)
    }
  }

  // Evidence Selection State
  const [evidenceSelection, setEvidenceSelection] = useState<"all" | "specific">("all")
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([])

  const { data: allEvidence } = useSWR<Evidence[]>(isDetailsOpen ? "evidence" : null, () => api.getEvidence())

  const handleAnalyzeNow = async (forceRefetch = false) => {
    if (!selectedStandard) return
    try {
      const ids =
        evidenceSelection === "specific"
          ? selectedEvidenceIds.length > 0
            ? selectedEvidenceIds
            : undefined
          : undefined
      await api.analyzeStandard(selectedStandard.id, ids, forceRefetch)
      setMappingStatus("analyzing")
      toast.success(forceRefetch ? "Re-analysis started!" : "Analysis started!")
      mutate()
    } catch (err: any) {
      toast.error(err.message || "Failed to start analysis")
    }
  }

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortBy, setSortBy] = useState("weakest")

  const copy = useMemo(() => ({
    allFrameworks:   isArabic ? "كل الأطر"             : "All Frameworks",
    highComplexity:  isArabic ? "تعقيد عالٍ"           : "High Complexity",
    importedCustom:  isArabic ? "مستورد / مخصص"        : "Imported / Custom",
    allCategories:   isArabic ? "كل الفئات"            : "All categories",
    allRegions:      isArabic ? "كل المناطق"           : "All regions",
    allStatuses:     isArabic ? "كل الحالات"           : "All statuses",
    statusStrong:    isArabic ? "قوي"                  : "Strong",
    statusPartial:   isArabic ? "جزئي"                 : "Partial",
    statusCritical:  isArabic ? "حرج"                  : "Critical",
    statusNotStarted:isArabic ? "لم يبدأ"              : "Not Started",
    statusAnalyzing: isArabic ? "قيد التحليل"          : "Analyzing",
    sortWeakest:     isArabic ? "الأضعف أولًا"         : "Weakest first",
    sortStrongest:   isArabic ? "الأقوى أولًا"         : "Strongest first",
    sortCriteria:    isArabic ? "أكثر معايير"          : "Most criteria",
    sortAZ:          isArabic ? "أبجديًا"              : "A–Z",
    sort:            isArabic ? "ترتيب"                : "Sort",
    visible:         isArabic ? "ظاهر"                 : "visible",
    analyzeNow:      isArabic ? "تحليل الآن"           : "Analyze Now",
    browse:          isArabic ? "تصفح"                 : "Browse",
    openStandard:    isArabic ? "فتح المعيار"          : "Open Standard",
    gapAnalysis:     isArabic ? "تحليل الفجوات"        : "Gap Analysis",
    noFrameworks:    isArabic ? "لا توجد أطر تطابق الفلاتر الحالية" : "No frameworks match the current filters",
    noFrameworksDesc:isArabic ? "أزل الفلاتر، وسّع البحث، أو استورد إطارًا جديدًا." : "Clear the filters, widen your search, or import a new framework.",
    importFramework: isArabic ? "استيراد إطار"         : "Import Framework",
    searchPlaceholder:isArabic? "ابحث بالإطار، الرمز، الفئة، أو المنطقة…" : "Search by framework, code, category, or region…",
    criteriaLabel:   isArabic ? "المعايير"             : "Criteria",
    coverageLabel:   isArabic ? "التغطية"              : "Coverage",
    mappedLabel:     isArabic ? "مرتبط"                : "Mapped",
    evidenceMapping: isArabic ? "ربط الأدلة"           : "Evidence Mapping",
    analysisInProgress:isArabic? "التحليل قيد التنفيذ…":"Analysis in progress…",
    loadingCriteria: isArabic ? "جارٍ تحميل المعايير…" : "Loading criteria…",
    aynIntelligence: isArabic ? "ذكاء عين"             : "Ayn Intelligence",
    analyzeAgainst:  isArabic ? "تحليل ضد:"            : "Analyze against:",
    allEvidence:     (n: number) => isArabic ? `كل الأدلة (${n} ملف)` : `All Evidence (${n} files)`,
    selectSpecific:  isArabic ? "اختر أدلة محددة"      : "Select Specific Evidence",
    runAnalysis:     isArabic ? "تشغيل التحليل"        : "Analyze Now",
    rerunAnalysis:   isArabic ? "إعادة التشغيل"        : "Re-run Analysis",
    running:         isArabic ? "جارٍ التشغيل"         : "Running",
    runFreshDesc:    isArabic ? "شغّل تمريرة جديدة على الأدلة المرتبطة، أو أعد التحليل بعد الرفع الجديد." : "Run a fresh pass across linked evidence, or re-analyze after new uploads.",
    importTitle:     isArabic ? "استيراد إطار"         : "Import Framework",
    importDesc:      isArabic ? "ارفع ملف PDF لإطار واجعل عين يستخرج هيكل المعيار." : "Upload a framework PDF and let Ayn extract the standard structure.",
    selectPDF:       isArabic ? "اختر ملف PDF"         : "Select PDF File",
    dragDrop:        isArabic ? "أو اسحب وأفلت هنا"   : "or drag and drop here",
    changeFile:      isArabic ? "تغيير الملف"          : "Change file",
    cancel:          isArabic ? "إلغاء"                : "Cancel",
    uploadExtract:   isArabic ? "رفع واستخراج"         : "Upload & Extract",
    processing:      isArabic ? "جارٍ المعالجة…"       : "Processing…",
    awaitingAnalysis:isArabic ? "في انتظار التحليل."   : "Awaiting analysis against evidence.",
    openStandardBtn: isArabic ? "فتح المعيار"          : "Open Standard",
  }), [isArabic])

  const categories = useMemo(
    () => Array.from(new Set(publicStandards.map((standard) => formatFilterLabel(standard.category)))).sort(),
    [publicStandards],
  )

  const regions = useMemo(
    () => Array.from(new Set(publicStandards.map((standard) => formatFilterLabel(standard.region, "Global")))).sort(),
    [publicStandards],
  )

  const filteredStandards = useMemo(() => {
    const base = publicStandards.filter((standard) => {
      const insight = insightsById.get(standard.id)
      const matchesSearch =
        standard.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        standard.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        standard.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        standard.region?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === "all" || formatFilterLabel(standard.category) === selectedCategory
      const matchesRegion =
        selectedRegion === "all" || formatFilterLabel(standard.region, "Global") === selectedRegion
      const matchesStatus = selectedStatus === "all" || insight?.derivedStatus === selectedStatus

      if (!matchesSearch || !matchesCategory || !matchesRegion || !matchesStatus) return false

      if (activeTab === "popular") return (standard.criteriaCount ?? standard.criteria?.length ?? 0) >= 20
      if (activeTab === "recent") return standard.source === "custom" || standard.source === "imported"
      return true
    })

    const withInsights = base.map((standard) => ({
      standard,
      insight: insightsById.get(standard.id),
    }))

    withInsights.sort((a, b) => {
      switch (sortBy) {
        case "strongest":
          return (b.insight?.coveragePct ?? 0) - (a.insight?.coveragePct ?? 0)
        case "alphabetical":
          return a.standard.title.localeCompare(b.standard.title)
        case "criteria":
          return (b.standard.criteriaCount ?? 0) - (a.standard.criteriaCount ?? 0)
        default:
          return (a.insight?.coveragePct ?? 0) - (b.insight?.coveragePct ?? 0)
      }
    })

    return withInsights.map(({ standard }) => standard)
  }, [
    activeTab,
    insightsById,
    publicStandards,
    searchQuery,
    selectedCategory,
    selectedRegion,
    selectedStatus,
    sortBy,
  ])

  const handlePDFUpload = async () => {
    if (!selectedFile) return
    setIsImporting(true)
    try {
      const newStandard = await api.importStandardPDF(selectedFile)
      toast.success(`${newStandard.title} imported successfully!`)
      mutate()
      setIsPDFModalOpen(false)
      setSelectedFile(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to import PDF")
    } finally {
      setIsImporting(false)
    }
  }

  const selectedInsight = selectedStandard ? insightsById.get(selectedStandard.id) : null

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative overflow-hidden">
        <div className="relative z-10">
          <Header
            title={isArabic ? "مركز المعايير" : "Standards Hub"}
            description={
              isArabic
                ? "أطر الاعتماد، مؤشرات التغطية، وجاهزية التحليل في مساحة واحدة."
                : "Audit frameworks, coverage signals, and analysis readiness in one workspace."
            }
            breadcrumbs={[
              { label: isArabic ? "لوحة التحكم" : "Dashboard", href: "/platform/dashboard" },
              { label: isArabic ? "المعايير" : "Standards Hub" },
            ]}
            actions={
              isAdmin ? (
                <button
                  type="button"
                  onClick={() => setIsPDFModalOpen(true)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-[0_8px_20px_-10px_rgba(37,99,235,0.45)] transition-all hover:bg-primary/90 hover:scale-[1.02]",
                    isArabic && "flex-row-reverse",
                  )}
                >
                  <FileUp className="h-3.5 w-3.5" />
                  {copy.importFramework}
                </button>
              ) : undefined
            }
          />

          <div className={cn("mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-12 pt-3 md:px-6 xl:px-8", isArabic && "font-arabic")}>
            <section className="glass-card relative overflow-hidden rounded-[32px] p-5 sm:p-7 lg:p-8">
              <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.16),transparent_70%)] blur-3xl" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.45),transparent)]" />

              <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_440px]">
                <div className="space-y-5">
                  <div className={cn("inline-flex items-center gap-2 rounded-full border border-[var(--status-info-border)] bg-[var(--status-info-bg)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary", isArabic && "flex-row-reverse")}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {isArabic ? "ذكاء المعايير" : "Standards Intelligence"}
                  </div>

                  <div className="space-y-3">
                    <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                      {isArabic
                        ? "أطر عالمية مع مؤشرات جاهزية مباشرة."
                        : "Global frameworks with live readiness signals."}
                    </h1>
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {isArabic
                        ? "راجع مكتبة المعايير، اطلع على الأطر المربوطة فعلياً، وانتقل أولاً لأضعف مناطق التغطية."
                        : "Review your standards library, see which frameworks are actually mapped, and jump straight into the weakest coverage areas first."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        {isArabic ? "معايير نشطة" : "Active Standards"}
                      </p>
                      <p className="mt-2 text-2xl font-black text-foreground">{publicStandards.length}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        {isArabic ? "نقاط المعايير" : "Criteria Points"}
                      </p>
                      <p className="mt-2 text-2xl font-black text-foreground">{totalCriteria}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        {isArabic ? "تم تحليلها" : "Analyzed"}
                      </p>
                      <p className="mt-2 text-2xl font-black text-[var(--status-success)]">{analyzedFrameworks}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        {isArabic ? "متوسط التغطية" : "Avg Coverage"}
                      </p>
                      <p className="mt-2 text-2xl font-black text-primary">{averageCoverage}%</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-[28px] border border-[var(--glass-border)] bg-[linear-gradient(180deg,var(--glass-soft-bg),color-mix(in_srgb,var(--glass-soft-bg)_72%,transparent))] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                          {isArabic ? "أضعف إطار" : "Weakest Framework"}
                        </p>
                        <h3 className="mt-2 text-xl font-bold text-foreground">
                          {weakestStandard?.title ??
                            (isArabic ? "لا توجد أطر مربوطة بعد" : "No mapped frameworks yet")}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {weakestStandard
                            ? isArabic
                              ? "أفضل نقطة لبدء دورة الأدلة والتحليل التالية."
                              : "Best candidate for your next evidence and analysis cycle."
                            : isArabic
                              ? "استورد إطاراً أو ابدأ التحليل لإظهار مؤشرات الجاهزية."
                              : "Import a framework or start analysis to surface readiness signals."}
                        </p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--status-critical-border)] bg-[var(--status-critical-bg)]">
                        <Activity className="h-5 w-5 text-[var(--status-critical)]" />
                      </div>
                    </div>
                    {weakestStandard && (
                      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-3 py-2.5">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          {Math.round(insightsById.get(weakestStandard.id)?.coveragePct ?? 0)}%
                          {isArabic ? " تغطية" : " coverage"}
                        </span>
                        <button
                          type="button"
                          onClick={() => router.push(`/platform/gap-analysis?standardId=${weakestStandard.id}`)}
                          className={cn("inline-flex items-center gap-1 text-xs font-bold text-primary", isArabic && "flex-row-reverse")}
                        >
                          {isArabic ? "تحليل" : "Analyze"} <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[28px] border border-[var(--glass-border)] bg-[linear-gradient(180deg,var(--glass-soft-bg),color-mix(in_srgb,var(--glass-soft-bg)_72%,transparent))] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)]">
                        <Layers3 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                          {isArabic ? "لمحة المكتبة" : "Library Snapshot"}
                        </p>
                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                          {isArabic
                            ? `${categories.length} فئات • ${regions.length} مناطق`
                            : `${categories.length} categories • ${regions.length} regions`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {categories.slice(0, 4).map((category) => (
                        <span
                          key={category}
                          className="rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search
                  className={cn(
                    "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                    isArabic ? "right-4" : "left-4",
                  )}
                />
                <input
                  type="text"
                  placeholder={copy.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "glass-input h-11 w-full rounded-xl text-sm",
                    isArabic ? "pr-11 pl-4" : "pl-11 pr-4",
                  )}
                />
              </div>

              {/* Filters + tabs row */}
              <div className={cn("flex flex-wrap items-center gap-2", isArabic && "flex-row-reverse")}>
                {/* Tabs */}
                {[
                  { id: "all",     label: copy.allFrameworks },
                  { id: "popular", label: copy.highComplexity },
                  { id: "recent",  label: copy.importedCustom },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                      activeTab === tab.id
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-[var(--glass-border)] bg-[var(--glass-soft-bg)] text-muted-foreground hover:border-primary/25 hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}

                <div className="mx-1 h-4 w-px bg-[var(--glass-border)]" />

                {/* Compact filter selects */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={cn(
                    "glass-input h-8 rounded-lg px-2.5 text-xs font-medium",
                    selectedStatus !== "all" && "border-primary/40 bg-primary/8 text-primary",
                  )}
                >
                  <option value="all">{copy.allStatuses}</option>
                  <option value="strong">{copy.statusStrong}</option>
                  <option value="partial">{copy.statusPartial}</option>
                  <option value="critical">{copy.statusCritical}</option>
                  <option value="unmapped">{copy.statusNotStarted}</option>
                  <option value="analyzing">{copy.statusAnalyzing}</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={cn(
                    "glass-input h-8 rounded-lg px-2.5 text-xs font-medium",
                    selectedCategory !== "all" && "border-primary/40 bg-primary/8 text-primary",
                  )}
                >
                  <option value="all">{copy.allCategories}</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className={cn(
                    "glass-input h-8 rounded-lg px-2.5 text-xs font-medium",
                    selectedRegion !== "all" && "border-primary/40 bg-primary/8 text-primary",
                  )}
                >
                  <option value="all">{copy.allRegions}</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="glass-input h-8 rounded-lg px-2.5 text-xs font-medium"
                >
                  <option value="weakest">{copy.sortWeakest}</option>
                  <option value="strongest">{copy.sortStrongest}</option>
                  <option value="criteria">{copy.sortCriteria}</option>
                  <option value="alphabetical">{copy.sortAZ}</option>
                </select>

                <span className={cn("ms-auto text-[11px] font-medium text-muted-foreground", isArabic && "ms-0 me-auto")}>
                  {filteredStandards.length} {copy.visible}
                </span>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
              {isLoading || insightsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[320px] animate-pulse rounded-[32px] glass-panel glass-border" />
                ))
              ) : filteredStandards.length > 0 ? (
                filteredStandards.map((standard) => {
                  const insight = insightsById.get(standard.id)
                  const badge = getStatusBadge(insight?.derivedStatus ?? "unmapped", isArabic)

                  return (
                    <GlassCard
                      key={standard.id}
                      variant={2}
                      hoverEffect
                      shine
                      className="group rounded-[32px] p-6 glass-border"
                    >
                      <div className="relative z-10 flex h-full flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-4">
                            <div
                              className={cn(
                                "flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br text-white shadow-lg",
                                resolveStandardColorClass(standard.color),
                              )}
                            >
                              <GraduationCap className="h-7 w-7 text-white" />
                            </div>
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                                  {standard.code || "STD-LIB"}
                                </span>
                                <span
                                  className={cn(
                                    "rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
                                    badge.className,
                                  )}
                                >
                                  {badge.label}
                                </span>
                              </div>
                              <h3 className="line-clamp-2 text-[22px] font-black leading-tight text-foreground transition-colors group-hover:text-primary">
                                {getStandardDisplayTitle(standard, isArabic)}
                              </h3>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openDetails(standard)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] text-muted-foreground transition-colors hover:text-primary"
                            aria-label={`Quick preview ${getStandardDisplayTitle(standard, isArabic)}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>

                        {standard.description && (
                          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {standard.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-medium">{standard.criteriaCount} {copy.criteriaLabel}</span>
                          {standard.category && (
                            <>
                              <span className="opacity-30">·</span>
                              <span>{formatFilterLabel(standard.category)}</span>
                            </>
                          )}
                          {standard.region && (
                            <>
                              <span className="opacity-30">·</span>
                              <span>{formatFilterLabel(standard.region, "Global")}</span>
                            </>
                          )}
                        </div>

                        <div className="mt-4 rounded-[20px] border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-4 py-3">
                          <CoverageBar
                            standardId={standard.id}
                            compact
                            result={
                              insight
                                ? {
                                    standardId: standard.id,
                                    totalCriteria: insight.totalCriteria,
                                    coveredCriteria: insight.coveredCriteria,
                                    coveragePct: insight.coveragePct,
                                  }
                                : null
                            }
                          />
                        </div>

                        <div className={cn("mt-4 flex items-center gap-3", isArabic && "flex-row-reverse")}>
                          {insight?.derivedStatus === "unmapped" || !insight ? (
                            <>
                              <Button
                                onClick={() => openDetails(standard)}
                                className="h-9 flex-1 rounded-xl bg-primary text-xs text-primary-foreground shadow-[0_8px_20px_-10px_rgba(37,99,235,0.45)]"
                              >
                                {copy.analyzeNow}
                              </Button>
                              <button
                                type="button"
                                onClick={() => router.push(`/platform/standards/${standard.id}`)}
                                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
                              >
                                {copy.browse}
                              </button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => router.push(`/platform/standards/${standard.id}`)}
                                className="h-9 flex-1 rounded-xl bg-primary text-xs text-primary-foreground shadow-[0_8px_20px_-10px_rgba(37,99,235,0.45)]"
                              >
                                {copy.openStandard}
                              </Button>
                              <button
                                type="button"
                                onClick={() => router.push(`/platform/gap-analysis?standardId=${standard.id}`)}
                                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
                              >
                                {copy.gapAnalysis}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  )
                })
              ) : (
                <GlassPanel className="col-span-full rounded-[32px] border-2 border-dashed glass-border py-20 text-center" hoverEffect>
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl glass-input shadow-sm">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h4 className="text-xl font-bold text-foreground">{copy.noFrameworks}</h4>
                  <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-muted-foreground">
                    {copy.noFrameworksDesc}
                  </p>
                </GlassPanel>
              )}
            </section>
          </div>
        </div>

        <AnimatePresence>
          {isPDFModalOpen && (
            <div
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md transition-colors"
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDragOver(false)
              }}
              onDrop={handleDrop}
            >
              <GlassCard
                variant={3}
                className={cn(
                  "relative w-full max-w-lg overflow-hidden rounded-[40px] p-10 shadow-2xl transition-all duration-300 glass-border",
                  isDragOver && "scale-[1.02] border-primary/50 ring-4 ring-primary/20 shadow-primary/20",
                )}
              >
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

                <div className="flex flex-col items-center space-y-6 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-primary/10">
                    <FileUp className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-foreground">{copy.importTitle}</h3>
                    <p className="font-medium text-muted-foreground">
                      {copy.importDesc}
                    </p>
                  </div>

                  <label
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragOver(true)
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      setIsDragOver(false)
                    }}
                    onDrop={handleDrop}
                    className={cn(
                      "group relative flex w-full cursor-pointer flex-col items-center rounded-[32px] border-2 border-dashed p-8 transition-all duration-300",
                      isDragOver ? "border-primary/50 bg-primary/5" : "glass-border glass-button",
                    )}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    {selectedFile ? (
                      <>
                        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
                        <p className="mx-auto max-w-xs truncate text-sm font-bold text-foreground">
                          {selectedFile.name}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            setSelectedFile(null)
                          }}
                          className="relative z-10 mt-2 text-[10px] font-bold uppercase text-destructive underline underline-offset-4"
                        >
                          {copy.changeFile}
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="mx-auto mb-4 h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
                        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary">
                          {copy.selectPDF}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{copy.dragDrop}</p>
                      </>
                    )}
                  </label>

                  <div className="flex w-full gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsPDFModalOpen(false)
                        setSelectedFile(null)
                      }}
                      className="glass-button h-14 flex-1 rounded-2xl border-2 text-foreground"
                    >
                      {copy.cancel}
                    </Button>
                    <Button
                      onClick={handlePDFUpload}
                      disabled={isImporting || !selectedFile}
                      className="h-14 flex-1 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {copy.processing}
                        </>
                      ) : (
                        <>
                          <FileCheck className="mr-2 h-4 w-4" />
                          {copy.uploadExtract}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isDetailsOpen && selectedStandard && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xl">
              <div className="glass-card relative flex h-[92vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-[28px] p-0 shadow-2xl sm:h-[86vh] sm:rounded-[40px]">
                <div className="flex flex-col sm:flex-row shrink-0 sm:items-start justify-between gap-6 border-b border-[var(--border-subtle)] bg-[var(--surface-modal)]/70 px-4 pb-5 pt-4 backdrop-blur-xl sm:px-10 sm:pb-8 sm:pt-8 relative">
                  {/* Close button absolutely positioned on mobile to save space from the top */}
                  <button
                    onClick={() => setIsDetailsOpen(false)}
                    className="absolute right-4 top-4 sm:hidden glass-button h-9 w-9 rounded-xl flex items-center justify-center p-0 transition-all z-10"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>

                  <div className="min-w-0 space-y-5 flex-1 pr-10 sm:pr-0 w-full">
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br text-white shadow-2xl sm:h-16 sm:w-16 sm:rounded-[22px]",
                          resolveStandardColorClass(selectedStandard.color),
                        )}
                      >
                        <GraduationCap className="h-6 w-6 sm:h-10 sm:w-10" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-black text-foreground sm:text-3xl">
                          {selectedStandard.title}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 sm:gap-3 opacity-90">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            {selectedStandard.code || "STD-LIB"}
                          </span>
                          <div className="hidden sm:block h-1 w-1 rounded-full bg-border" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground break-keep">
                            {formatFilterLabel(selectedStandard.category)}
                          </span>
                          <div className="hidden sm:block h-1 w-1 rounded-full bg-border" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground break-keep">
                            {formatFilterLabel(selectedStandard.region, "Global")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3.5 py-2.5 flex-1 min-w-[90px] sm:flex-none">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          {copy.criteriaLabel}
                        </p>
                        <p className="mt-1 text-lg font-black text-foreground">{selectedStandard.criteriaCount}</p>
                      </div>
                      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3.5 py-2.5 flex-1 min-w-[90px] sm:flex-none">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          {copy.coverageLabel}
                        </p>
                        <p className="mt-1 text-lg font-black text-primary">
                          {Math.round(selectedInsight?.coveragePct ?? 0)}%
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3.5 py-2.5 flex-1 min-w-[90px] sm:flex-none">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          {copy.mappedLabel}
                        </p>
                        <p className="mt-1 text-lg font-black text-foreground">
                          {selectedInsight?.mapped ?? 0}
                          <span className="ml-1 text-xs font-semibold text-muted-foreground">
                            / {selectedInsight?.totalMapped ?? selectedStandard.criteriaCount}
                          </span>
                        </p>
                      </div>
                      {(() => {
                        const badge = getStatusBadge(selectedInsight?.derivedStatus ?? "unmapped", isArabic)
                        return (
                          <span className={cn("rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] mt-1 sm:mt-0", badge.className)}>
                            {badge.label}
                          </span>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="glass-button rounded-2xl border-[var(--glass-border)] text-foreground flex-1 sm:flex-none py-2 h-auto text-sm"
                      onClick={() => router.push(`/platform/standards/${selectedStandard.id}`)}
                    >
                      {copy.openStandardBtn}
                    </Button>
                    <button
                      onClick={() => setIsDetailsOpen(false)}
                      className="hidden sm:flex glass-button h-[44px] w-[44px] rounded-2xl items-center justify-center p-0 transition-all"
                    >
                      <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
                  <div className="flex-1 bg-card/20 px-4 py-5 sm:px-10 sm:py-8">
                  <div className="mb-6 rounded-[24px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4">
                    <CoverageBar
                      standardId={selectedStandard.id}
                      result={
                        selectedInsight
                          ? {
                              standardId: selectedStandard.id,
                              totalCriteria: selectedInsight.totalCriteria,
                              coveredCriteria: selectedInsight.coveredCriteria,
                              coveragePct: selectedInsight.coveragePct,
                            }
                          : null
                      }
                    />
                  </div>

                  <h4 className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                    <Activity className="h-4 w-4 text-primary" />
                    {copy.evidenceMapping}
                  </h4>

                        <div className="space-y-3">
                    {mappingStatus === "analyzing" ? (
                      <div className="glass-panel glass-border flex flex-col items-center justify-center rounded-[24px] border border-dashed p-10 text-center">
                        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
                        <p className="font-bold text-muted-foreground">{copy.analysisInProgress}</p>
                      </div>
                    ) : mappingsData?.mappings?.length > 0 ? (
                      mappingsData.mappings.map((mapping: any) => {
                        const statusMeta = MAPPING_STATUS_META[mapping.status as keyof typeof MAPPING_STATUS_META] ?? MAPPING_STATUS_META.not_analyzed
                        return (
                          <div
                            key={mapping.criterion_id}
                            className="glass-panel glass-border flex flex-col gap-2 rounded-2xl p-5 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex min-w-0 items-start gap-3">
                                <statusMeta.Icon className={cn("mt-0.5 shrink-0", statusMeta.iconClass)} size={18} />
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {mapping.criterion_code && mapping.criterion_code !== "N/A" && (
                                      <span className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-black uppercase text-primary">
                                        {mapping.criterion_code}
                                      </span>
                                    )}
                                    <span className="text-base font-bold text-foreground">
                                      {mapping.criterion_title}
                                    </span>
                                  </div>
                                  <p className="mt-1.5 text-sm text-muted-foreground">
                                    {mapping.criterion_description ||
                                      mapping.ai_reasoning ||
                                      copy.awaitingAnalysis}
                                  </p>
                                </div>
                              </div>
                              <span className={cn("shrink-0 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", statusMeta.badgeClass)}>
                                {isArabic ? statusMeta.labelAr : statusMeta.label}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="glass-panel glass-border flex flex-col items-center justify-center rounded-[24px] border border-dashed p-10 text-center">
                        <Loader2 className="mb-3 h-6 w-6 animate-spin text-primary opacity-50" />
                        <p className="font-bold text-muted-foreground">{copy.loadingCriteria}</p>
                      </div>
                    )}
                  </div>
                  </div>

                  <div className="z-10 grid shrink-0 grid-cols-1 gap-5 border-t border-[var(--border-subtle)] bg-[var(--surface-modal)]/60 px-4 py-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] sm:px-10 sm:py-8 xl:grid-cols-2 xl:gap-8">
                  <div className="space-y-6 rounded-[24px] border border-primary/20 bg-primary/5 p-5 shadow-xl shadow-primary/5 sm:rounded-[32px] sm:p-8">
                    <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/80">
                      <Sparkles className="h-4 w-4" />
                      {copy.aynIntelligence}
                    </h5>
                    <p className="text-lg font-bold leading-relaxed text-foreground">{copy.analyzeAgainst}</p>

                    <div className="space-y-4">
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="radio"
                          name="evidence"
                          value="all"
                          checked={evidenceSelection === "all"}
                          onChange={() => setEvidenceSelection("all")}
                          className="accent-primary"
                        />
                        <span className="text-sm font-bold">{copy.allEvidence(allEvidence?.length || 0)}</span>
                      </label>

                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="radio"
                          name="evidence"
                          value="specific"
                          checked={evidenceSelection === "specific"}
                          onChange={() => setEvidenceSelection("specific")}
                          className="accent-primary"
                        />
                        <span className="text-sm font-bold">{copy.selectSpecific}</span>
                      </label>

                      {evidenceSelection === "specific" && (
                        <div className="mt-3 max-h-32 space-y-2 overflow-y-auto pl-6 custom-scrollbar">
                          {allEvidence?.map((evidence: Evidence) => (
                            <label key={evidence.id} className="group flex cursor-pointer items-center gap-2">
                              <div
                                className={cn(
                                  "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                                  selectedEvidenceIds.includes(evidence.id)
                                    ? "border-white bg-white text-primary"
                                    : "border-white/30 group-hover:border-white/60",
                                )}
                              >
                                {selectedEvidenceIds.includes(evidence.id) && <Check className="h-3 w-3" />}
                              </div>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={selectedEvidenceIds.includes(evidence.id)}
                                onChange={(event) => {
                                  if (event.target.checked) {
                                    setSelectedEvidenceIds((prev) => [...prev, evidence.id])
                                  } else {
                                    setSelectedEvidenceIds((prev) => prev.filter((id) => id !== evidence.id))
                                  }
                                }}
                              />
                              <span
                                className="max-w-[180px] truncate text-xs font-medium"
                                title={evidence.title || evidence.originalFilename || undefined}
                              >
                                {evidence.title || evidence.originalFilename}
                              </span>
                              {evidence.documentType && (
                                <span className="glass-pill ml-1 rounded px-1.5 py-0.5 text-[9px] font-bold">
                                  {evidence.documentType}
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 rounded-[24px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 sm:rounded-[32px] sm:p-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      {copy.runAnalysis}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {copy.runFreshDesc}
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button
                        onClick={() => handleAnalyzeNow(false)}
                        disabled={mappingStatus === "analyzing"}
                        className="h-12 rounded-2xl bg-primary text-primary-foreground"
                      >
                        {mappingStatus === "analyzing" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {copy.running}
                          </>
                        ) : (
                          <>
                            <Activity className="mr-2 h-4 w-4" />
                            {copy.analyzeNow}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleAnalyzeNow(true)}
                        disabled={mappingStatus === "analyzing"}
                        className="glass-button h-12 rounded-2xl border-[var(--glass-border)] text-foreground"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {copy.rerunAnalysis}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  )
}
