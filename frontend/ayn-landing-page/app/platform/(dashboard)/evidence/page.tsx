"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { usePageTitle } from "@/hooks/use-page-title"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR, { mutate as globalMutate } from "swr"
import { Evidence } from "@/types"
import { UploadCloud, X, FileText, ExternalLink, Trash2, Loader2, Sparkles, Check } from "lucide-react"
import { EvidenceFilters } from "@/components/platform/evidence/evidence-filters"
import { EvidenceCard } from "@/components/platform/evidence/evidence-card"
import { DocumentEditor } from "@/components/platform/document-editor"
import { GlassCard } from "@/components/ui/glass-card"
import { EmptyState } from "@/components/platform/empty-state"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useUiLanguage } from "@/lib/ui-language-context"


export default function EvidencePage() {
  return (
    <ProtectedRoute>
      <EvidenceContent />
    </ProtectedRoute>
  )
}

function EvidenceContent() {
  const { user } = useAuth()
  const { isArabic } = useUiLanguage()
  const router = useRouter()
  usePageTitle(isArabic ? "مخزن الأدلة" : "Evidence Vault")
  const { data: evidenceList, isLoading, error, mutate: localMutate } = useSWR<Evidence[]>(
    user ? [`evidence`, user.id] : null,
    () => api.getEvidence(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 15000,
    }
  )

  const handleDemoLoad = () => {
    if (!user) return;
    
    toast.info(isArabic ? "جارٍ تشغيل العرض التجريبي..." : "Initializing Live Demo Mode...", { duration: 1500 });
    
    const demoEvidenceId = "demo-iso-21001";
    const demoGapAnalysisId = "demo-gap-report-1";
    
    const mockEvidence: any = {
      id: demoEvidenceId,
      institutionId: user.institutionId || "",
      fileName: "ISO_21001_Quality_Policy_Final.pdf",
      originalFilename: "ISO_21001_Quality_Policy_Final.pdf",
      title: "ISO 21001 Quality Policy",
      content: "",
      fileUrl: "#",
      status: "analyzed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confidenceScore: 92,
      fileSize: 1024 * 1024 * 2.5,
      mimeType: "application/pdf"
    };

    const mockGapListItem: any = {
      id: demoGapAnalysisId,
      standardId: "demo-std-1",
      standardTitle: "ISO 21001:2018 (EOMS)",
      status: "completed",
      overallScore: 82,
      createdAt: new Date().toISOString(),
    };

    const mockMetrics: any = {
      totalGapAnalyses: 1,
      evidenceCount: 1,
      alignmentPercentage: 82,
      unreadNotificationsCount: 3,
      recentScores: [
        { date: "2026-01-01", score: 45 },
        { date: "2026-02-01", score: 60 },
        { date: "2026-03-01", score: 82 },
      ],
      recentEvidence: [
        {
          id: demoEvidenceId,
          title: "ISO 21001 Quality Policy",
          originalFilename: "ISO_21001_Quality_Policy_Final.pdf",
          status: "analyzed",
        }
      ]
    };

    // Update global SWR cache instantly
    globalMutate([`evidence`, user.id], [mockEvidence], false);
    globalMutate("gap-analyses", [mockGapListItem], false);
    globalMutate([`dashboard-metrics`, user.id], mockMetrics, false);

    setTimeout(() => {
      toast.success(isArabic ? "تم تحميل بيانات العرض" : "Demo Data Loaded", {
        description: isArabic ? "تمت إضافة دليل وإنشاء تحليل فجوات بنتيجة 82٪." : "Evidence added and gap analysis generated at 82%.",
      });
    }, 1500);
  };
  const copy = useMemo(() => ({
    title: isArabic ? "الأدلة" : "Evidence",
    subtitle: isArabic ? "مستنداتك المرفوعة، مربوطة بمعايير الامتثال وجاهزة للتحليل." : "Your uploaded documents, mapped to compliance criteria and ready for analysis.",
    uploading: isArabic ? "جارٍ الرفع…" : "Uploading…",
    uploadEvidence: isArabic ? "رفع دليل" : "Upload Evidence",
    total: isArabic ? "الإجمالي" : "Total",
    analyzed: isArabic ? "تم التحليل" : "Analyzed",
    linked: isArabic ? "مرتبط" : "Linked",
    queued: isArabic ? "قيد الانتظار" : "Queued",
    uploaded: isArabic ? "تم الرفع" : "Uploaded",
    analyzing: isArabic ? "قيد التحليل" : "Analyzing",
    failedStatus: isArabic ? "فشل" : "Failed",
    complete: isArabic ? "مكتمل" : "Complete",
    statusUnknown: isArabic ? "غير معروف" : "Unknown",
    confidence: isArabic ? "الثقة" : "Confidence",
    failedLoad: isArabic ? "فشل تحميل الأدلة." : "Failed to load evidence.",
    retry: isArabic ? "إعادة المحاولة" : "Retry",
    selectAll: isArabic ? "تحديد الكل" : "Select all",
    clear: isArabic ? "مسح" : "Clear",
    gapAnalysis: isArabic ? "تحليل الفجوات" : "Gap Analysis",
    noMatches: isArabic ? "لا توجد أدلة تطابق الفلاتر." : "No evidence matches your filters.",
    clearFilters: isArabic ? "مسح الفلاتر" : "Clear filters",
    selected: isArabic ? "محدد" : "Selected",
    selectEvidence: isArabic ? "تحديد الدليل" : "Select evidence",
    deselectEvidence: isArabic ? "إلغاء تحديد الدليل" : "Deselect evidence",
    dropUpload: isArabic ? "أفلت الملف لرفعه" : "Drop to upload evidence",
    close: isArabic ? "إغلاق" : "Close",
    docPreview: isArabic ? "معاينة المستند" : "Document preview",
    untitled: isArabic ? "مستند بلا عنوان" : "Untitled Document",
    summary: isArabic ? "الملخص" : "Summary",
    openOriginal: isArabic ? "فتح الملف الأصلي" : "Open original file",
    noPreview: isArabic ? "لا توجد معاينة متاحة لهذا المستند." : "No preview available for this document.",
    horusAnalysis: isArabic ? "تحليل حورس" : "Horus Analysis",
    alignmentScore: isArabic ? "درجة المواءمة" : "Alignment score",
    linkedCriteria: isArabic ? "المعايير المرتبطة" : "Linked Criteria",
    standard: isArabic ? "المعيار" : "Standard",
    noCriteria: isArabic ? "لا توجد معايير مرتبطة بعد." : "No criteria linked yet.",
    runAnalysisMap: isArabic ? "حلل هذا الملف أو افتح تحليل الفجوات لتحديد المعيار المناسب." : "Analyze this file or open Gap Analysis to attach the right standard.",
    analyzeNow: isArabic ? "حلل الآن" : "Analyze now",
    openGapAnalysisCta: isArabic ? "فتح تحليل الفجوات" : "Open Gap Analysis",
    bulkTitle: isArabic ? "تشغيل تحليل الفجوات على الملفات المحددة" : "Run Gap Analysis on Selected Files",
    bulkSubtitle: isArabic ? "اختر معيارًا الآن، أو اتركه فارغًا وحدده داخل صفحة تحليل الفجوات." : "Choose a standard now, or leave it blank and pick the standard inside Gap Analysis.",
    targetStandard: isArabic ? "المعيار المستهدف" : "Target Standard",
    chooseLater: isArabic ? "اختر لاحقًا داخل تحليل الفجوات" : "Choose later in Gap Analysis",
    detectedOne: isArabic ? "اكتشفنا معيارًا مرتبطًا واحدًا لهذه الملفات ويمكننا تعبئته تلقائيًا." : "We detected one matching linked standard for these files and can prefill it automatically.",
    cancel: isArabic ? "إلغاء" : "Cancel",
    openGapAnalysis: isArabic ? "فتح تحليل الفجوات" : "Open Gap Analysis",
    analyzeEvidence: isArabic ? "تحليل الدليل" : "Analyze Evidence",
    selectFramework: isArabic ? "اختر الإطار الذي تريد المطابقة عليه." : "Select framework to map against.",
    allStandards: isArabic ? "كل المعايير المتاحة" : "All Available Standards",
    processing: isArabic ? "جارٍ التحليل..." : "Analyzing...",
    runAnalysis: isArabic ? "تشغيل التحليل" : "Run Analysis",
    deleteEvidence: isArabic ? "حذف الدليل" : "Delete Evidence",
    confirmDelete: isArabic ? "تأكيد الحذف" : "Confirm Delete",
    previewLoading: isArabic ? "جارٍ تحميل المعاينة…" : "Loading preview…",
    previewFailed: isArabic ? "تعذّر تحميل الملف. حاول مرة أخرى." : "Could not load the file. Please try again.",
  }), [isArabic])

  type EvidenceStatusTone = "success" | "warning" | "info" | "critical" | "neutral"
  const statusToneClasses: Record<EvidenceStatusTone, string> = {
    success: "text-[var(--status-success)] bg-[var(--status-success-bg)] border-[var(--status-success-border)]",
    warning: "text-[var(--status-warning)] bg-[var(--status-warning-bg)] border-[var(--status-warning-border)]",
    info: "text-[var(--status-info)] bg-[var(--status-info-bg)] border-[var(--status-info-border)]",
    critical: "text-[var(--status-critical)] bg-[var(--status-critical-bg)] border-[var(--status-critical-border)]",
    neutral: "text-muted-foreground border-[var(--glass-border)] bg-[var(--glass-soft-bg)]",
  }
  const evidenceStatusMeta = useMemo(() => ({
    uploaded: { label: copy.uploaded, tone: "info" as EvidenceStatusTone, animate: true },
    pending: { label: copy.queued, tone: "info" as EvidenceStatusTone, animate: true },
    processing: { label: copy.analyzing, tone: "warning" as EvidenceStatusTone, animate: true },
    analyzed: { label: copy.analyzed, tone: "success" as EvidenceStatusTone },
    linked: { label: copy.linked, tone: "success" as EvidenceStatusTone },
    complete: { label: copy.complete, tone: "success" as EvidenceStatusTone },
    failed: { label: copy.failedStatus, tone: "critical" as EvidenceStatusTone },
  }), [copy])
  type EvidenceStatusKey = keyof typeof evidenceStatusMeta
  const resolveEvidenceStatus = (status?: string | null) => {
    const fallback = { label: copy.statusUnknown, tone: "neutral" as EvidenceStatusTone, animate: false }
    const meta =
      status && Object.prototype.hasOwnProperty.call(evidenceStatusMeta, status)
        ? evidenceStatusMeta[status as EvidenceStatusKey]
        : fallback
    return {
      label: meta.label,
      badgeClass: statusToneClasses[meta.tone],
      animate: Boolean(meta.animate),
    }
  }
 
  const [isUploading, setIsUploading] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)
  const [evidenceFileUrl, setEvidenceFileUrl] = useState<string | null>(null)
  const [evidenceFileUrlLoading, setEvidenceFileUrlLoading] = useState(false)
  const [evidenceFileUrlError, setEvidenceFileUrlError] = useState(false)
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([])
  const [isBulkGapModalOpen, setIsBulkGapModalOpen] = useState(false)
  const [bulkStandardId, setBulkStandardId] = useState<string>("")
  const [isDragOver, setIsDragOver] = useState(false)

  // H3: Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<any>("")
  const [standardFilter, setStandardFilter] = useState("")


  const { data: standards } = useSWR<any[]>(
    "standards",
    () => api.getStandards(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
    }
  )

  // H3: Client-side filter — fast while server result is cached
  const filteredEvidence = useMemo(() => {
    if (!evidenceList) return []
    return evidenceList.filter((ev) => {
      const matchesSearch = searchQuery === "" ||
        (ev.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.originalFilename ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "" || ev.status === statusFilter
      const matchesStandard = standardFilter === "" ||
        ev.criteria?.some((c: any) => c.standardId === standardFilter || c.id === standardFilter)
      return matchesSearch && matchesStatus && matchesStandard
    })
  }, [evidenceList, searchQuery, statusFilter, standardFilter])

  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false)
  const [selectedStandardId, setSelectedStandardId] = useState<string>("all")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [evidenceToDelete, setEvidenceToDelete] = useState<Evidence | null>(null)
  
  // Split-view highlight state
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const highlightId = searchParams.get("highlight")

  useEffect(() => {
    if (highlightId && evidenceList && (!selectedEvidence || (selectedEvidence.id !== highlightId && selectedEvidence.originalFilename !== highlightId && selectedEvidence.title !== highlightId))) {
      const match = evidenceList.find(e => 
        e.id === highlightId || 
        e.title === highlightId || 
        e.originalFilename === highlightId
      )
      if (match) {
        setSelectedEvidence(match)
      } else if (highlightId.includes(".pdf") || highlightId.includes(".doc")) {
        // Fallback demo document if not found in db
        setSelectedEvidence({
          id: highlightId,
          institutionId: "demo",
          fileName: highlightId,
          originalFilename: highlightId,
          title: highlightId.replace(/_/g, " ").replace(".pdf", ""),
          content: "",
          fileUrl: "#",
          status: "analyzed",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          confidenceScore: Math.floor(Math.random() * (98 - 85 + 1) + 85),
          fileSize: 1024 * 1024 * 1.5,
          mimeType: "application/pdf"
        } as unknown as Evidence);
      }
    }
  }, [highlightId, evidenceList, selectedEvidence])

  useEffect(() => {
    let cancelled = false

    if (!selectedEvidence) {
      setEvidenceFileUrl(null)
      setEvidenceFileUrlLoading(false)
      setEvidenceFileUrlError(false)
      return
    }

    const raw = selectedEvidence.fileUrl ?? ""
    const isHttp =
      raw.startsWith("http://") ||
      raw.startsWith("https://")

    if (raw && raw !== "#" && raw !== "private" && isHttp) {
      setEvidenceFileUrl(raw)
      setEvidenceFileUrlLoading(false)
      setEvidenceFileUrlError(false)
      return
    }

    const isDemo = (selectedEvidence as { institutionId?: string }).institutionId === "demo"
    if (isDemo || raw === "#") {
      setEvidenceFileUrl(null)
      setEvidenceFileUrlLoading(false)
      setEvidenceFileUrlError(false)
      return
    }

    setEvidenceFileUrl(null)
    setEvidenceFileUrlError(false)
    setEvidenceFileUrlLoading(true)

    ;(async () => {
      try {
        const { url } = await api.getEvidenceSignedUrl(selectedEvidence.id)
        if (!cancelled) {
          setEvidenceFileUrl(url)
          setEvidenceFileUrlError(false)
        }
      } catch {
        if (!cancelled) {
          setEvidenceFileUrl(null)
          setEvidenceFileUrlError(true)
        }
      } finally {
        if (!cancelled) setEvidenceFileUrlLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [selectedEvidence])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAnalyzeModalOpen && !isAnalyzing) {
          setIsAnalyzeModalOpen(false)
        } else if (evidenceToDelete) {
          setEvidenceToDelete(null)
        } else if (selectedEvidence && !isAnalyzeModalOpen) {
          setSelectedEvidence(null)
          setActiveHighlightId(null)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isAnalyzeModalOpen, isAnalyzing, selectedEvidence, evidenceToDelete])

  const vaultSummary = useMemo(() => {
    const total = evidenceList?.length ?? 0
    const analyzed = evidenceList?.filter((item) => ["analyzed", "linked"].includes(item.status)).length ?? 0
    const linked = evidenceList?.filter((item) => item.status === "linked").length ?? 0
    const avgConfidenceRaw = evidenceList?.reduce((sum, item) => sum + ((item as any).confidenceScore ?? 0), 0) ?? 0
    const avgConfidence = total > 0 ? Math.round(avgConfidenceRaw / total) : 0

    return { total, analyzed, linked, avgConfidence }
  }, [evidenceList])

  const handleAnalyze = async () => {
    if (!selectedEvidence) return
    setIsAnalyzing(true)
    try {
      if (selectedStandardId === "all") {
        if (!standards) return
        // Trigger for all standards
        await Promise.all(standards.map((s: any) => api.analyzeStandard(s.id, [selectedEvidence.id], true)))
      } else {
        await api.analyzeStandard(selectedStandardId, [selectedEvidence.id], true)
      }
      toast.success(isArabic ? "بدأ التحليل!" : "Analysis started!", { description: isArabic ? "يقوم حورس بربط هذا الدليل بالمعايير المحددة." : "Horus is mapping this evidence against the selected standards." })
      setIsAnalyzeModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || (isArabic ? "فشل بدء التحليل" : "Failed to start analysis"))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDelete = async (evidence: Evidence) => {
    setEvidenceToDelete(evidence)
  }

  const confirmDelete = async () => {
    if (!evidenceToDelete) return
    try {
      await api.deleteEvidence(evidenceToDelete.id)
      toast.success(isArabic ? "تم حذف الدليل" : "Evidence deleted")
      if (selectedEvidence?.id === evidenceToDelete.id) {
        setSelectedEvidence(null)
      }
      localMutate()
    } catch (error) {
      toast.error(isArabic ? "فشل حذف الدليل" : "Failed to delete evidence", { description: isArabic ? "حاول مرة أخرى." : "Please try again." })
    } finally {
      setEvidenceToDelete(null)
    }
  }


  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    setIsUploading(true)
    const file = e.target.files[0]

    try {
      await api.uploadEvidence(file)
      toast.success(isArabic ? "تم رفع الدليل بنجاح" : "Evidence uploaded successfully", {
        description: isArabic ? "يقوم حورس بتحليل المستند وفق معايير الامتثال." : "Horus is analyzing the document for compliance standards."
      })
      localMutate()
    } catch (error) {
      toast.error(isArabic ? "فشل الرفع" : "Upload failed", { description: isArabic ? "حاول مرة أخرى." : "Please try again." })
    } finally {
      setIsUploading(false)
    }
    e.target.value = ""
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      await api.uploadEvidence(file)
      toast.success(isArabic ? "تم رفع الدليل بنجاح" : "Evidence uploaded successfully", {
        description: isArabic ? "يقوم حورس بتحليل المستند وفق معايير الامتثال." : "Horus is analyzing the document for compliance standards."
      })
      localMutate()
    } catch {
      toast.error(isArabic ? "فشل الرفع" : "Upload failed", { description: isArabic ? "حاول مرة أخرى." : "Please try again." })
    } finally {
      setIsUploading(false)
    }
  }

  const handleOpenGapAnalysisForEvidence = () => {
    if (!selectedEvidence) return

    const params = new URLSearchParams()
    params.set("scope", "selected")
    params.set("evidenceIds", selectedEvidence.id)

    const criteria = Array.isArray(selectedEvidence.criteria) ? selectedEvidence.criteria : []
    const standardIds = Array.from(
      new Set(
        criteria
          .map((criterion: any) => criterion?.standardId)
          .filter((value: string | undefined | null): value is string => Boolean(value)),
      ),
    )

    if (standardIds.length === 1) {
      params.set("standardId", standardIds[0])
    }

    router.push(`/platform/gap-analysis?${params.toString()}`)
  }

  const handleOpenGapAnalysisForSelected = () => {
    if (selectedEvidenceIds.length === 0) return

    const params = new URLSearchParams()
    params.set("scope", "selected")
    params.set("evidenceIds", selectedEvidenceIds.join(","))

    const selectedItems = filteredEvidence.filter((item) => selectedEvidenceIds.includes(item.id))
    const standardIds = Array.from(
      new Set(
        selectedItems.flatMap((item) =>
          (Array.isArray(item.criteria) ? item.criteria : [])
            .map((criterion: any) => criterion?.standardId)
            .filter((value: string | undefined | null): value is string => Boolean(value)),
        ),
      ),
    )

    if (bulkStandardId) {
      params.set("standardId", bulkStandardId)
    } else if (standardIds.length === 1) {
      params.set("standardId", standardIds[0])
    }

    setIsBulkGapModalOpen(false)
    router.push(`/platform/gap-analysis?${params.toString()}`)
  }

  const toggleEvidenceSelection = (evidenceId: string) => {
    setSelectedEvidenceIds((current) =>
      current.includes(evidenceId)
        ? current.filter((id) => id !== evidenceId)
        : [...current, evidenceId],
    )
  }

  const clearSelection = () => setSelectedEvidenceIds([])

  const selectAllVisible = () => {
    setSelectedEvidenceIds(filteredEvidence.map((item) => item.id))
  }

  const selectedItems = useMemo(
    () => filteredEvidence.filter((item) => selectedEvidenceIds.includes(item.id)),
    [filteredEvidence, selectedEvidenceIds],
  )

  const selectedStandardCandidates = useMemo(
    () =>
      Array.from(
        new Set(
          selectedItems.flatMap((item) =>
            (Array.isArray(item.criteria) ? item.criteria : [])
              .map((criterion: any) => criterion?.standardId)
              .filter((value: string | undefined | null): value is string => Boolean(value)),
          ),
        ),
      ),
    [selectedItems],
  )

  useEffect(() => {
    if (selectedStandardCandidates.length === 1) {
      setBulkStandardId(selectedStandardCandidates[0])
      return
    }

    if (selectedStandardCandidates.length === 0 || !selectedStandardCandidates.includes(bulkStandardId)) {
      setBulkStandardId("")
    }
  }, [bulkStandardId, selectedStandardCandidates])

  const selectedIsPdf =
    selectedEvidence?.originalFilename?.toLowerCase().endsWith(".pdf") ?? false
  const canOpenOriginalFile = Boolean(evidenceFileUrl) && !evidenceFileUrlError

  return (
    <div
      className="animate-fade-in-up pb-20 space-y-6 relative"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm border-4 border-dashed border-primary/40 rounded-none pointer-events-none">
          <div className="text-center">
            <UploadCloud className="w-16 h-16 text-primary mx-auto mb-3" />
            <p className="text-xl font-bold text-primary">{copy.dropUpload}</p>
          </div>
        </div>
      )}
      <div className="pt-6">
        <div className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-5 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_36%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {copy.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy.subtitle}
              </p>
            </div>

            <label className={cn(
              "group relative shrink-0 overflow-hidden rounded-2xl bg-primary text-primary-foreground px-6 py-3 font-semibold text-sm cursor-pointer hover:bg-primary/90 transition-all flex items-center gap-2 active:scale-95 self-start",
              isUploading && "opacity-70 cursor-not-allowed"
            )}>
              <input
                type="file"
                className="hidden"
                onChange={handleUpload}
                accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                disabled={isUploading}
              />
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{copy.uploading}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>{copy.uploadEvidence}</span>
                </>
              )}
            </label>
          </div>

          <div className="relative z-10 mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-[var(--glass-border)] bg-background/40 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{copy.total}</p>
              <p className="mt-1.5 text-xl font-bold text-foreground">{vaultSummary.total}</p>
            </div>
            <div className="rounded-2xl border border-[var(--glass-border)] bg-background/40 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{copy.analyzed}</p>
              <p className="mt-1.5 text-xl font-bold text-[var(--status-success)]">{vaultSummary.analyzed}</p>
            </div>
            <div className="rounded-2xl border border-[var(--glass-border)] bg-background/40 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{copy.linked}</p>
              <p className="mt-1.5 text-xl font-bold text-primary">{vaultSummary.linked}</p>
            </div>
            <div className="rounded-2xl border border-[var(--glass-border)] bg-background/40 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{copy.confidence}</p>
              <p className="mt-1.5 text-xl font-bold text-foreground">
                {vaultSummary.avgConfidence > 0 ? `${vaultSummary.avgConfidence}%` : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <EvidenceFilters
        onSearch={setSearchQuery}
        onStatusChange={setStatusFilter}
        onStandardChange={setStandardFilter}
        activeStatus={statusFilter}
        activeStandard={standardFilter}
      />

      {error ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl glass-panel glass-border">
          <p className="text-muted-foreground text-center mb-4">{copy.failedLoad}</p>
          <button
            type="button"
            onClick={() => localMutate()}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            {copy.retry}
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex flex-col justify-between p-5 rounded-3xl glass-layer-2 animate-pulse h-[220px] border border-[var(--border-subtle)]/60">
              <div className="flex justify-between items-start mb-4">
                <div className="h-6 w-24 bg-[var(--surface)]/60 rounded-full" />
                <div className="h-6 w-6 rounded-full bg-[var(--surface)]/50" />
              </div>
              <div className="space-y-3 mb-4 flex-1 mt-2">
                <div className="h-5 bg-[var(--surface)]/60 rounded-lg w-3/4" />
                <div className="h-5 bg-[var(--surface)]/60 rounded-lg w-1/2" />
                <div className="h-3 bg-[var(--surface)]/50 rounded-lg w-full mt-4" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] mt-auto">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[var(--surface)]/60 border-2 border-[var(--surface-modal)]" />
                  <div className="w-6 h-6 rounded-full bg-[var(--surface)]/50 border-2 border-[var(--surface-modal)]" />
                </div>
                <div className="h-3 w-16 bg-[var(--surface)]/50 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : evidenceList?.length === 0 ? (
        <div className="mt-8">
          <EmptyState type="evidence" onDemoLoad={handleDemoLoad} />
        </div>
      ) : (
        <>
          {/* H3: Result count */}
          {(searchQuery || statusFilter || standardFilter) && (
            <p className="text-sm text-muted-foreground font-medium mb-4">
              {filteredEvidence.length} {isArabic ? (filteredEvidence.length === 1 ? "نتيجة" : "نتائج") : `result${filteredEvidence.length !== 1 ? "s" : ""}`}
              {searchQuery && <span> {isArabic ? "للبحث" : "for"} <span className="text-foreground font-bold">"{searchQuery}"</span></span>}
            </p>
          )}
          {filteredEvidence.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={selectAllVisible}
                className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                {copy.selectAll}
              </button>
              {selectedEvidenceIds.length > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">{selectedEvidenceIds.length} {isArabic ? "محدد" : "selected"}</span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="rounded-lg border border-[var(--glass-border)] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {copy.clear}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBulkGapModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Sparkles className="h-3 w-3" />
                    {copy.gapAnalysis}
                  </button>
                </>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEvidence.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <p className="text-muted-foreground font-medium">{copy.noMatches}</p>
                <button
                  onClick={() => { setSearchQuery(""); setStatusFilter(""); setStandardFilter("") }}
                  className="mt-3 text-xs font-bold text-primary hover:underline"
                >
                  {copy.clearFilters}
                </button>
              </div>
            ) : filteredEvidence.map((evidence: Evidence) => (
              <GlassCard
                key={evidence.id}
                variant={2}
                hoverEffect
                shine
                onClick={() => setSelectedEvidence(evidence)}
                className={cn(
                  "cursor-pointer group p-0 relative rounded-[28px] overflow-hidden",
                  selectedEvidenceIds.includes(evidence.id) && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_24px_rgba(var(--primary),0.18)]",
                  (highlightId === evidence.id || highlightId === evidence.originalFilename || highlightId === evidence.title) && "ring-2 ring-primary ring-offset-4 ring-offset-background animate-pulse shadow-[0_0_30px_rgba(var(--primary),0.3)] transition-all"
                )}
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleEvidenceSelection(evidence.id)
                  }}
                  className={cn(
                    "absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border transition-all",
                    selectedEvidenceIds.includes(evidence.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-[var(--glass-border)] bg-[var(--surface-modal)]/80 text-transparent hover:border-primary/40",
                  )}
                  aria-label={selectedEvidenceIds.includes(evidence.id) ? copy.deselectEvidence : copy.selectEvidence}
                >
                  <Check className={cn("h-3.5 w-3.5", selectedEvidenceIds.includes(evidence.id) ? "opacity-100" : "opacity-0")} />
                </button>
                {selectedEvidenceIds.includes(evidence.id) && (
                  <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                    {copy.selected}
                  </div>
                )}
                <EvidenceCard
                  evidence={evidence}
                  onClick={() => setSelectedEvidence(evidence)}
                  onDelete={() => handleDelete(evidence)}
                />
              </GlassCard>
            ))}
          </div>
        </>
      )}

      {/* Full-Screen Split-View Evidence Analysis Overlay */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300 bg-[var(--surface-modal)]/95 backdrop-blur-xl" style={{ margin: 0 }}>
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 h-16 border-b border-[var(--border-subtle)] bg-[var(--surface-modal)]/80 backdrop-blur-md flex items-center justify-between px-5 z-20 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)]">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-foreground truncate leading-tight">
                  {selectedEvidence.title || selectedEvidence.originalFilename}
                </h3>
                {(() => {
                  const statusMeta = resolveEvidenceStatus(selectedEvidence.status)
                  return (
                    <span
                      className={cn(
                        "mt-0.5 inline-block rounded px-1.5 py-px text-[10px] font-semibold capitalize border",
                        statusMeta.badgeClass,
                        statusMeta.animate && "animate-pulse",
                      )}
                    >
                      {statusMeta.label}
                    </span>
                  )
                })()}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleOpenGapAnalysisForEvidence}
                className="hidden sm:flex px-3 py-2 text-xs font-semibold glass-button text-foreground rounded-lg transition-colors items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> {copy.gapAnalysis}
              </button>
              <button
                type="button"
                onClick={() => setIsAnalyzeModalOpen(true)}
                className="px-3 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> {isArabic ? "تحليل" : "Analyze"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selectedEvidence)}
                className="px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15"
              >
                <Trash2 className="w-3.5 h-3.5" /> {isArabic ? "حذف" : "Delete"}
              </button>
              <button
                onClick={() => { setSelectedEvidence(null); setActiveHighlightId(null) }}
                className="p-2 rounded-lg glass-button text-muted-foreground transition-colors"
                aria-label={copy.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* LEFT PANE: Document Viewer */}
          <div className="w-1/2 h-full pt-16 border-r border-[var(--border-subtle)] flex flex-col bg-[var(--surface-modal)] relative overflow-hidden">
            {selectedIsPdf && evidenceFileUrl ? (
              <iframe
                key={evidenceFileUrl}
                src={evidenceFileUrl}
                className="w-full h-full border-0"
                title={selectedEvidence.title || copy.docPreview}
              />
            ) : selectedIsPdf && evidenceFileUrlLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
                <p className="text-sm font-medium">{copy.previewLoading}</p>
              </div>
            ) : selectedIsPdf && evidenceFileUrlError ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
                <FileText className="h-10 w-10 text-destructive/80" aria-hidden />
                <p className="text-sm font-medium text-destructive">{copy.previewFailed}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                <div className="max-w-3xl mx-auto rounded-xl glass-panel glass-border shadow-2xl p-8 lg:p-12 min-h-full">
                  <div className="mb-8 pb-6 border-b border-[var(--border-subtle)]">
                    <h1 className="text-2xl font-bold text-foreground mb-2">{selectedEvidence.title || copy.untitled}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {selectedEvidence.documentType && (
                        <span className="uppercase font-medium">{selectedEvidence.documentType}</span>
                      )}
                      {selectedEvidence.confidenceScore != null && selectedEvidence.confidenceScore > 0 && (
                        <span className="text-emerald-500 font-semibold">{selectedEvidence.confidenceScore}% {isArabic ? "تطابق" : "match"}</span>
                      )}
                    </div>
                  </div>

                  {selectedEvidence.summary ? (
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{copy.summary}</h3>
                        <p className="text-sm text-foreground/80 leading-relaxed">{selectedEvidence.summary}</p>
                      </div>
                      {canOpenOriginalFile && evidenceFileUrl && (
                        <a
                          href={evidenceFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" /> {copy.openOriginal}
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">{copy.noPreview}</p>
                      {canOpenOriginalFile && evidenceFileUrl && (
                        <a
                          href={evidenceFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-primary hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" /> {copy.openOriginal}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANE: Horus AI Analysis */}
          <div className="w-1/2 h-full pt-16 flex flex-col bg-[var(--surface-modal)]/70 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
              
              <div className="mb-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <h2 className="text-base font-bold text-foreground">{copy.horusAnalysis}</h2>
              </div>

              {/* Confidence Score — only show when a real score exists */}
              {selectedEvidence.confidenceScore != null && selectedEvidence.confidenceScore > 0 && (
                <div className="mb-6 flex items-center gap-5 rounded-2xl glass-panel glass-border px-5 py-4">
                  <div className="w-14 h-14 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full text-primary -rotate-90">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="currentColor" strokeWidth="4"
                        strokeDasharray={`${selectedEvidence.confidenceScore}, 100`}
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-foreground">{selectedEvidence.confidenceScore}%</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{copy.alignmentScore}</div>
                  </div>
                </div>
              )}

              {/* Linked Criteria */}
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                {copy.linkedCriteria}
              </h3>
              <div className="space-y-2.5">
                {selectedEvidence.criteria && selectedEvidence.criteria.length > 0 ? (
                  selectedEvidence.criteria.map((criterion: any, idx: number) => (
                    <div
                      key={criterion.id || idx}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer hover:bg-[var(--surface)]",
                        activeHighlightId === criterion.id
                          ? "border-primary bg-primary/5"
                          : "glass-panel glass-border"
                      )}
                      onClick={() => setActiveHighlightId(criterion.id)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h4 className="font-semibold text-sm text-foreground leading-snug">
                          {criterion.title}
                        </h4>
                        {criterion.standardId && (
                          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border status-info">
                            {copy.standard}
                          </span>
                        )}
                      </div>
                      {criterion.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {criterion.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed glass-border px-5 py-8 text-center glass-panel">
                    <FileText className="w-7 h-7 text-muted-foreground/30 mx-auto mb-2.5" />
                    <p className="text-sm text-muted-foreground">{copy.noCriteria}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {copy.runAnalysisMap}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAnalyzeModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {copy.analyzeNow}
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenGapAnalysisForEvidence}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-3.5 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {copy.openGapAnalysisCta}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {isBulkGapModalOpen && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#000000]/80 backdrop-blur-xl transition-opacity"
            onClick={() => setIsBulkGapModalOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-lg glass-panel rounded-[32px] overflow-hidden flex flex-col p-6 animate-in zoom-in duration-200 glass-border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-gap-modal-title"
          >
            <h3 id="bulk-gap-modal-title" className="text-xl font-black text-foreground mb-1">{copy.bulkTitle}</h3>
            <p className="text-sm font-medium text-muted-foreground mb-6">
              {copy.bulkSubtitle}
            </p>

            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-3 mb-5">
              <p className="text-sm font-semibold text-foreground">
                {selectedEvidenceIds.length} file{selectedEvidenceIds.length === 1 ? "" : "s"} selected
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedItems.slice(0, 3).map((item) => item.title || item.originalFilename || (isArabic ? "دليل بلا عنوان" : "Untitled evidence")).join(" • ") || (isArabic ? "سيتم إرسال الملفات المحددة إلى تحليل الفجوات." : "Selected files will be sent to Gap Analysis.")}
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.targetStandard}
              </label>
              <select
                value={bulkStandardId}
                onChange={(event) => setBulkStandardId(event.target.value)}
                className="w-full h-11 glass-input text-foreground rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">{copy.chooseLater}</option>
                {standards?.map((standard: any) => (
                  <option key={standard.id} value={standard.id}>
                    {standard.title}
                  </option>
                ))}
              </select>
              {selectedStandardCandidates.length === 1 && !bulkStandardId && (
                <p className="text-xs text-primary">
                  {copy.detectedOne}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsBulkGapModalOpen(false)}
                className="flex-1 px-4 py-3 text-sm font-bold glass-button text-muted-foreground rounded-2xl transition-colors"
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                onClick={handleOpenGapAnalysisForSelected}
                className="flex-[2] px-4 py-3 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
              >
                {copy.openGapAnalysis} <Sparkles className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analyze Modal */}
      {isAnalyzeModalOpen && selectedEvidence && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#000000]/80 backdrop-blur-xl transition-opacity"
            onClick={() => !isAnalyzing && setIsAnalyzeModalOpen(false)}
            aria-hidden="true"
          />
          <div 
            className="relative w-full max-w-sm glass-panel rounded-[32px] overflow-hidden flex flex-col p-6 animate-in zoom-in duration-200 glass-border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="analyze-modal-title"
          >
            <h3 id="analyze-modal-title" className="text-xl font-black text-foreground mb-1">{copy.analyzeEvidence}</h3>
            <p className="text-sm font-medium text-muted-foreground mb-6">{copy.selectFramework}</p>

            <div className="space-y-3 mb-8">
              <label className="flex items-center gap-3 p-3 rounded-xl glass-button cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="standard"
                  value="all"
                  checked={selectedStandardId === "all"}
                  onChange={() => setSelectedStandardId("all")}
                  className="accent-primary"
                />
                <span className="text-sm font-bold">{copy.allStandards}</span>
              </label>

              {standards?.map((s: any) => (
                <label key={s.id} className="flex items-center gap-3 p-3 rounded-xl glass-button cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="standard"
                    value={s.id}
                    checked={selectedStandardId === s.id}
                    onChange={() => setSelectedStandardId(s.id)}
                    className="accent-primary"
                  />
                  <div>
                    <span className="text-sm font-bold block">{s.title}</span>
                    <span className="text-[10px] text-muted-foreground uppercase opacity-80 font-black">{s.code}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsAnalyzeModalOpen(false)}
                disabled={isAnalyzing}
                className="flex-1 px-4 py-3 text-sm font-bold glass-button text-muted-foreground rounded-2xl transition-colors disabled:opacity-50"
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-[2] px-4 py-3 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {copy.processing}</>
                ) : (
                  <>{copy.runAnalysis} <Sparkles className="w-4 h-4 ml-1" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {evidenceToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#000000]/80 backdrop-blur-xl transition-opacity"
            onClick={() => setEvidenceToDelete(null)}
            aria-hidden="true"
          />
          <div 
            className="relative w-full max-w-sm glass-panel rounded-[32px] overflow-hidden flex flex-col p-6 animate-in zoom-in duration-200 glass-border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <h3 id="delete-modal-title" className="text-xl font-black text-foreground mb-1">{copy.deleteEvidence}</h3>
            <p className="text-sm font-medium text-muted-foreground mb-6">{isArabic ? `هل أنت متأكد أنك تريد حذف "${evidenceToDelete.title}"؟ لا يمكن التراجع عن هذا الإجراء.` : `Are you sure you want to delete "${evidenceToDelete.title}"? This action cannot be undone.`}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEvidenceToDelete(null)}
                className="flex-1 px-4 py-3 text-sm font-bold glass-button text-muted-foreground rounded-2xl transition-colors"
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-[2] px-4 py-3 text-sm font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-xl shadow-destructive/20"
              >
                <Trash2 className="w-4 h-4 ml-1" /> {copy.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
