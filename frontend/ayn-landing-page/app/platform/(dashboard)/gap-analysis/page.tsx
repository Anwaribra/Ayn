"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { useState, useCallback, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { usePageTitle } from "@/hooks/use-page-title"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Activity,
  Zap,
  Play,
  Target,
  Radio,
  Loader2,
  Sparkles,
  FileText,
  X,
  Lightbulb,
  Check,
  ArrowRight,
  Download,
  ExternalLink,
} from "lucide-react"
import type { GapAnalysisListItem, GapAnalysis, GapItem, Standard, Evidence } from "@/types"
import { EvidenceSelector } from "@/components/platform/evidence-selector"
import { EmptyState } from "@/components/platform/empty-state"
import { StatusTiles } from "@/components/platform/status-tiles"
import { GlassCard } from "@/components/ui/glass-card"
import { DocumentEditor } from "@/components/platform/document-editor" // <-- Import Dialog
import { cn } from "@/lib/utils"

type UiSeverity = "High" | "Medium" | "Low"
type UiAlignment = "Aligned" | "Partially Aligned" | "Not Aligned"
type AnalysisScope = "linked" | "recent" | "selected"

function buildGapAnalysisFilename(report: { standardTitle?: string; id: string }) {
  const safeTitle = (report.standardTitle || "gap-analysis")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "gap-analysis"

  return `${safeTitle}-${report.id.slice(0, 8)}.pdf`
}

function getSeverity(value?: string): UiSeverity {
  const normalized = (value ?? "").toLowerCase()
  if (normalized === "high") return "High"
  if (normalized === "low") return "Low"
  return "Medium"
}

function getAlignment(value?: string): UiAlignment {
  const normalized = (value ?? "").toLowerCase()
  if (normalized === "aligned" || normalized === "met") return "Aligned"
  if (normalized === "partially_aligned" || normalized === "partially_met") return "Partially Aligned"
  return "Not Aligned"
}

function getEvidenceLabel(evidence: Evidence) {
  return evidence.title || evidence.originalFilename || "Untitled evidence"
}

function getAnalysisScopeLabel(scope?: string) {
  if (scope === "selected") return "Selected evidence"
  if (scope === "recent") return "Recent uploads"
  return "Full standard scan"
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
  const searchParams = useSearchParams()
  usePageTitle("Gap Analysis")
  const [selectedStandard, setSelectedStandard] = useState("")
  const [analysisScope, setAnalysisScope] = useState<AnalysisScope>("linked")
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([])
  const [evidenceSearchQuery, setEvidenceSearchQuery] = useState("")
  const [generating, setGenerating] = useState(false)
  const [activeReport, setActiveReport] = useState<GapAnalysis | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  // Track in-flight job ID so the SWR can poll until it's done
  const [pendingJobId, setPendingJobId] = useState<string | null>(null)

  // Remediation State
  const [isRemediating, setIsRemediating] = useState(false)
  const [targetGap, setTargetGap] = useState<{ gap: GapItem, standardId: string } | null>(null)

  // Auto-Draft Remediation State
  const [isDrafting, setIsDrafting] = useState(false)
  const [draftContent, setDraftContent] = useState("")
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  // Auto-open report when navigating from notification (e.g. ?report=<id>)
  useEffect(() => {
    const reportId = searchParams.get("report")
    if (!reportId || !user) return
    let cancelled = false
    api.getGapAnalysis(reportId).then((full) => {
      if (!cancelled) setActiveReport(full)
    }).catch(() => {
      if (!cancelled) toast.error("Failed to load report")
    })
    return () => { cancelled = true }
  }, [searchParams, user])

  useEffect(() => {
    const standardId = searchParams.get("standardId")
    const scope = searchParams.get("scope") as AnalysisScope | null
    const evidenceIdsParam = searchParams.get("evidenceIds")

    if (standardId) {
      setSelectedStandard(standardId)
    }

    if (scope === "linked" || scope === "recent" || scope === "selected") {
      setAnalysisScope(scope)
    }

    if (evidenceIdsParam) {
      const ids = evidenceIdsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)

      if (ids.length > 0) {
        setSelectedEvidenceIds(ids)
        if (!scope) {
          setAnalysisScope("selected")
        }
      }
    }
  }, [searchParams])

  // ESC to close delete confirm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirm) setDeleteConfirm(null)
        if (isRemediating) setIsRemediating(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [deleteConfirm, isRemediating])

  // 2-minute timeout for gap analysis polling
  useEffect(() => {
    if (!pendingJobId) return
    const timer = setTimeout(() => {
      setGenerating(false)
      setPendingJobId(null)
      toast.error("Analysis is taking longer than expected. Try refreshing.")
    }, 120000)

    return () => clearTimeout(timer)
  }, [pendingJobId])

  const { data: standards } = useSWR<Standard[]>(
    user ? "standards" : null,
    () => api.getStandards(),
  )

  const { data: evidenceList } = useSWR<Evidence[]>(
    user ? ["evidence", user.id] : null,
    () => api.getEvidence(),
  )

  const { data: reports, error: reportsError, mutate } = useSWR<GapAnalysisListItem[]>(
    user ? "gap-analyses" : null,
    () => api.getGapAnalyses(),
    {
      // Poll every 3s when there's a pending background job
      // Once the report appears as done (status === 'completed' or 'failed'), stop polling
      refreshInterval: pendingJobId ? 3000 : 0,
      onSuccess: (data: GapAnalysisListItem[]) => {
        if (!pendingJobId) return
        const job = data?.find((r: GapAnalysisListItem) => r.id === pendingJobId)

        if (job) {
          if (job.status === "completed") {
            setPendingJobId(null)
            setGenerating(false)
            toast.success("Gap analysis is ready!", { description: job.standardTitle })
            handleViewReport(job.id)
          } else if (job.status === "failed") {
            setPendingJobId(null)
            setGenerating(false)
            toast.error("Gap analysis failed.", { description: "An error occurred during evidence analysis." })
          }
        }
      }
    }
  )

  const handleGenerate = useCallback(async () => {
    if (!selectedStandard) return toast.error("Select a standard first")
    if ((analysisScope === "recent" || analysisScope === "selected") && selectedEvidenceIds.length === 0) {
      toast.error("Choose at least one file", {
        description: analysisScope === "recent"
          ? "Pick one or more recent uploads before starting the scan."
          : "Select the evidence you want Horus to analyze.",
      })
      return
    }

    setGenerating(true)
    try {
      const job = await api.generateGapAnalysis(selectedStandard, {
        analysisScope,
        evidenceIds: analysisScope === "linked" ? undefined : selectedEvidenceIds,
      })
      // 202: queued — set the pending job ID, SWR will poll until done
      setPendingJobId(job.jobId)
      toast.success("Analysis queued", {
        description:
          analysisScope === "linked"
            ? "Horus is analyzing the evidence already linked to this standard."
            : `Horus is analyzing ${selectedEvidenceIds.length} selected file${selectedEvidenceIds.length === 1 ? "" : "s"}.`,
      })
      mutate() // Immediately refresh to show the 'queued' stub in the list
    } catch {
      toast.error("Failed to queue analysis")
      setGenerating(false)
    }
    // Note: setGenerating(false) is handled in SWR onSuccess once the job completes
  }, [selectedStandard, analysisScope, selectedEvidenceIds, mutate])

  const handleViewReport = useCallback(async (id: string) => {
    try {
      const full = await api.getGapAnalysis(id)
      setActiveReport(full)
      return full
    } catch {
      toast.error("Failed to load report")
      return null
    }
  }, [])

  const handleExportSnapshot = useCallback(async (reportId?: string) => {
    if (!reportId && !activeReport) {
      toast.error("Open a completed report first")
      return
    }

    const targetReport =
      !reportId || activeReport?.id === reportId
        ? activeReport
        : await handleViewReport(reportId)

    if (!targetReport) return

    if (targetReport.status !== "completed") {
      toast.error("Only completed reports can be exported", {
        description: "This analysis did not finish successfully, so there is no useful report to export.",
      })
      return
    }

    const { exportToPDF } = await import("@/lib/pdf-export")

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => resolve())
      })
    })

    await exportToPDF("gap-analysis-report-content", buildGapAnalysisFilename(targetReport))
  }, [activeReport, handleViewReport])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.deleteGapAnalysis(id)
      toast.success("Report deleted")
      setDeleteConfirm(null)
      if (activeReport?.id === id) setActiveReport(null)
      mutate()
    } catch {
      toast.error("Deletion failed")
    }
  }, [mutate, activeReport])

  const handleRemediateClick = (gapItem: GapItem) => {
    if (!activeReport) return
    setTargetGap({ gap: gapItem, standardId: activeReport.standardId })
    setIsRemediating(true)
  }

  const handleEvidenceSelected = async (evidence: Evidence) => {
    if (!targetGap) return

    try {
      const gapId = crypto.randomUUID()
      // 1. Create the PlatformGap (State)
      await api.recordGapDefined(
        gapId,
        targetGap.standardId,
        targetGap.gap.criterionTitle, // Clause/Criterion
        targetGap.gap.gap, // Description
        targetGap.gap.priority.toLowerCase() // Severity
      )

      // 2. Link Evidence (Address it)
      await api.recordGapAddressed(gapId, evidence.id)

      toast.success("Evidence linked to gap", {
        description: `Linked "${evidence.title || "Evidence"}" to ${targetGap.gap.criterionTitle}`
      })
      setIsRemediating(false)
      setTargetGap(null)
    } catch (error) {
      console.error(error)
      toast.error("Failed to link evidence")
    }
  }

  const handleDraftRemediationClick = async (gapItem: GapItem) => {
    if (!activeReport || !user?.institutionId) {
      toast.error("Institution context missing")
      return
    }
    
    // Use a generated stable ID for this draft request instead of mock/demo IDs.
    const gapId = crypto.randomUUID()
    
    setTargetGap({ gap: gapItem, standardId: activeReport.standardId })
    setIsDrafting(true)

    try {
      toast.info("Horus AI is drafting a document...", { duration: 4000 })
      const res = await api.draftDocument(gapId, user.institutionId, `Please draft a policy/evidence regarding: ${gapItem.recommendation}`)
      setDraftContent(res.content)
      setIsEditorOpen(true)
    } catch (e: any) {
      toast.error(e.message || "Failed to generate AI Draft")
    } finally {
      setIsDrafting(false)
    }
  }

  const handleSaveDraftAsEvidence = async (finalContent: string) => {
    if (!targetGap || !user) return
    setIsSavingDraft(true)
    try {
      // Create a text file from the drafted content
      const file = new File([finalContent], `Auto-Draft-${targetGap.gap.criterionTitle.slice(0, 15)}.txt`, {
        type: "text/plain",
      })

      // Upload file directly using the standard evidence endpoint
      const uploadRes = await api.uploadEvidence(file)
      
      const gapId = crypto.randomUUID()
      // 1. Create the PlatformGap 
      await api.recordGapDefined(
        gapId,
        targetGap.standardId,
        targetGap.gap.criterionTitle,
        targetGap.gap.gap,
        targetGap.gap.priority.toLowerCase()
      )

      // 2. Link Evidence to the newly created PlatformGap
      // (Using uploadRes.id assuming the endpoint returns the DB evidence ID)
      await api.recordGapAddressed(gapId, uploadRes.id || uploadRes.evidence_id)

      toast.success("Draft saved and linked as Evidence!")
      setIsEditorOpen(false)
      setTargetGap(null)
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Failed to save draft as Evidence")
    } finally {
      setIsSavingDraft(false)
    }
  }

  const gaps = activeReport?.gaps?.map((item: GapItem) => {
    const severity = getSeverity(item.priority)
    const alignment = getAlignment(item.status)
    const statusClass = severity === "High" ? "status-critical" : severity === "Medium" ? "status-warning" : "status-success"
    // Deterministic risk score for consistent UI state and testing.
    const riskScore = alignment === "Not Aligned" ? 90 : alignment === "Partially Aligned" ? 55 : 20
    return {
      original: item,
      title: item.criterionTitle ?? "Unnamed Criterion",
      severity,
      alignment,
      desc: item.recommendation ?? "No recommendation available.",
      riskScore,
      statusClass,
    }
  }) ?? []

  const overallScore = activeReport?.overallScore ?? null
  const activeGapCount = gaps.filter((g) => g.severity === "High").length
  const remediationRate = gaps.length > 0 ? Math.round((gaps.filter((g) => g.severity === "Low").length / gaps.length) * 100) : 94
  const completedReports = reports?.filter((report) => report.status === "completed").length ?? 0
  const reportsReady = reports !== undefined
  const hasReports = (reports?.length ?? 0) > 0
  const showReportsLoadingState = !reportsReady && !reportsError && !activeReport
  const selectedStandardObject = standards?.find((standard) => standard.id === selectedStandard) ?? null
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
  const selectedEvidence = useMemo(
    () => sortedEvidence.filter((item) => selectedEvidenceIds.includes(item.id)),
    [sortedEvidence, selectedEvidenceIds],
  )

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

  const scopeDescription =
    analysisScope === "linked"
      ? "Run against all evidence already linked to this standard across your institution."
      : analysisScope === "recent"
        ? "Start from your latest uploads, then keep only the files you want in this run."
        : "Choose the exact evidence files Horus should analyze for this report."

  return (
    <div className="animate-fade-in-up pb-20 relative">
      <div id="gap-analysis-report-content">
      <header className="mb-10 pt-6 px-4">
        <div className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] glass-panel glass-border p-5 sm:p-7 lg:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_35%),radial-gradient(circle_at_82%_18%,rgba(239,68,68,0.08),transparent_26%)] pointer-events-none" />
          <div className="absolute -right-14 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="px-2 py-0.5 rounded status-info border">
              <span className="text-[10px] font-bold uppercase tracking-widest">Gap Analysis</span>
                </div>
                <div className="h-px w-6 bg-border" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Evidence vs Standards</span>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--text-primary)] relative">
                  Compliance Gap <span className="text-[var(--text-tertiary)] font-light">Center</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Detect weak clauses, draft remediation evidence, and close priority risks with a clearer view of what needs action next.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
              <button 
            onClick={() => handleExportSnapshot()}
            data-html2canvas-ignore="true"
            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
          >
            <Download className="w-4 h-4" /> Export Report (PDF)
          </button>
            </div>
          </div>

          <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-3.5 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Open High Risk</p>
              <p className="mt-2 text-xl font-bold text-[var(--status-critical)]">{activeGapCount}</p>
            </div>
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-3.5 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Completed Scans</p>
              <p className="mt-2 text-xl font-bold text-foreground">{completedReports}</p>
            </div>
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-3.5 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Remediation Rate</p>
              <p className="mt-2 text-xl font-bold text-[var(--status-success)]">{remediationRate}%</p>
            </div>
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-3.5 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Alignment Index</p>
              <p className="mt-2 text-xl font-bold text-primary">{overallScore !== null ? `${Math.round(overallScore)}%` : "No report"}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 mb-6">
        <div className="glass-panel p-4 rounded-2xl glass-border">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>Detect</span>
            <ArrowRight className="w-3 h-3" />
            <span>Draft</span>
            <ArrowRight className="w-3 h-3" />
            <span>Link Evidence</span>
            <ArrowRight className="w-3 h-3" />
            <span>Verify</span>
            <ArrowRight className="w-3 h-3" />
            <span>Close</span>
          </div>
        </div>
      </div>

      {/* H4: Active report indicator banner */}
      {activeReport && (
        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/20 text-sm">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground font-medium">Viewing:</span>
            <span className="text-foreground font-bold truncate flex-1">{activeReport.standardTitle ?? "Gap Analysis"}</span>
            {activeReport.overallScore !== undefined && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                {Math.round(activeReport.overallScore)}% score
              </span>
            )}
            {activeReport.createdAt && (
              <span className="text-[10px] text-muted-foreground font-medium shrink-0 hidden sm:block">
                {new Date(activeReport.createdAt).toLocaleDateString()}
              </span>
            )}
            <button
              onClick={() => setActiveReport(null)}
              className="ml-auto shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-[var(--surface)]/60 transition-colors"
              aria-label="Close report"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Onboarding / Contextual Help */}
      {(!reports || reports.length === 0) && !generating && !pendingJobId && !activeReport && (
        <div className="px-4 mb-8">
          <div className="p-6 rounded-3xl glass-panel glass-border bg-primary/5 flex flex-col md:flex-row gap-6 items-start">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
              <Lightbulb className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">What is a Gap Analysis?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-3xl">
                Gap Analysis compares your uploaded evidence against selected standards. Horus identifies missing controls, weak documentation, and non-compliance risks, then helps you remediate each item.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--status-success)]/10 text-[var(--status-success)]"><Check className="w-3.5 h-3.5" /> 1. Select Standard</span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--status-success)]/10 text-[var(--status-success)]"><Check className="w-3.5 h-3.5" /> 2. Upload Evidence</span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary"><Sparkles className="w-3.5 h-3.5" /> 3. Run Analysis</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Controls */}
      <div className="px-4 mb-10">
        <div className="glass-panel p-6 rounded-[28px] glass-border relative overflow-hidden space-y-5">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.85),transparent)] opacity-70" />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">1. Standard</p>
                <select
                  value={selectedStandard}
                  onChange={(e) => setSelectedStandard(e.target.value)}
                  disabled={!standards || standards.length === 0 || generating}
                  className="w-full h-11 glass-input text-foreground rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="" className="bg-[var(--surface-modal)]">
                    {!standards ? "Loading standards..." : standards.length === 0 ? "No standards available yet" : "Choose a standard to analyze..."}
                  </option>
                  {standards?.map((s: Standard) => (
                    <option key={s.id} value={s.id} className="bg-[var(--surface-modal)]">{s.title}</option>
                  ))}
                </select>
                {selectedStandardObject && (
                  <p className="text-xs text-muted-foreground">
                    {selectedStandardObject.criteriaCount} criteria will be checked in this run.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">2. Analysis Scope</p>
                  {(analysisScope === "recent" || analysisScope === "selected") && (
                    <span className="text-[11px] text-primary font-medium">
                      {selectedEvidenceIds.length} file{selectedEvidenceIds.length === 1 ? "" : "s"} selected
                    </span>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    {
                      id: "linked" as const,
                      label: "Full standard scan",
                      description: "Use all evidence already mapped to this standard.",
                    },
                    {
                      id: "recent" as const,
                      label: "Recent uploads",
                      description: "Start from your latest files, then trim the list.",
                    },
                    {
                      id: "selected" as const,
                      label: "Selected evidence",
                      description: "Pick the exact files you want in this run.",
                    },
                  ].map((scope) => (
                    <button
                      key={scope.id}
                      type="button"
                      onClick={() => setAnalysisScope(scope.id)}
                      className={cn(
                        "rounded-2xl border px-4 py-4 text-left transition-all",
                        analysisScope === scope.id
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                          : "border-[var(--glass-border)] bg-[var(--glass-soft-bg)] hover:border-primary/40 hover:bg-primary/5",
                      )}
                    >
                      <p className="text-sm font-bold text-foreground">{scope.label}</p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{scope.description}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{scopeDescription}</p>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">3. Source Preview</p>
                  <p className="mt-1 text-sm text-foreground font-semibold">
                    {analysisScope === "linked" ? "Institution-linked evidence" : "Files included in this run"}
                  </p>
                </div>
                {(analysisScope === "recent" || analysisScope === "selected") && (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {selectedEvidenceIds.length} chosen
                  </span>
                )}
              </div>

              {analysisScope === "linked" ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Horus will inspect the evidence already attached to criteria inside the selected standard. This is the right option for a full institutional scan.
                  </p>
                  <div className="rounded-2xl border border-dashed border-[var(--glass-border)] bg-background/30 px-4 py-3 text-xs text-muted-foreground">
                    No manual file picking here. If you want to test fresh uploads first, switch to <span className="text-foreground font-semibold">Recent uploads</span> or <span className="text-foreground font-semibold">Selected evidence</span>.
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <input
                    value={evidenceSearchQuery}
                    onChange={(e) => setEvidenceSearchQuery(e.target.value)}
                    placeholder={analysisScope === "recent" ? "Filter recent uploads..." : "Search evidence by title or filename..."}
                    className="w-full h-10 glass-input rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {evidenceOptions.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[var(--glass-border)] px-4 py-8 text-center text-sm text-muted-foreground">
                        {analysisScope === "recent"
                          ? "No recent uploads matched your filter."
                          : "No evidence matched your search."}
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
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border",
                                checked ? "border-primary bg-primary text-primary-foreground" : "border-[var(--glass-border)] text-transparent"
                              )}>
                                <Check className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">{getEvidenceLabel(item)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Uploaded {new Date(item.createdAt).toLocaleDateString()}
                                  {item.documentType ? ` • ${item.documentType}` : ""}
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
          </div>

          <div className="flex flex-col gap-4 border-t border-[var(--glass-border)] pt-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {analysisScope === "linked"
                  ? "This run will analyze the evidence currently linked to the selected standard."
                  : `This run will analyze ${selectedEvidenceIds.length} file${selectedEvidenceIds.length === 1 ? "" : "s"} against ${selectedStandardObject?.title || "the selected standard"}.`}
              </p>
              <p className="text-xs text-muted-foreground">
                {analysisScope === "selected" && selectedEvidence.length > 0
                  ? selectedEvidence.slice(0, 3).map(getEvidenceLabel).join(" • ")
                  : analysisScope === "recent"
                    ? "Recent uploads stay editable before you start the scan."
                    : "Best for full compliance scans after linking evidence in the vault."}
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !selectedStandard || !standards || standards.length === 0}
              className="flex items-center justify-center gap-2 px-8 py-3 min-h-[44px] bg-foreground text-background rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {generating ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Run Gap Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Matrix */}
      {/* Summary Matrix & Results */}
      {reportsError ? (
        <div className="mt-10 flex flex-col items-center justify-center py-16 px-4 rounded-2xl glass-panel glass-border">
          <p className="text-muted-foreground text-center mb-4">Failed to load gap analyses.</p>
          <button
            type="button"
            onClick={() => mutate()}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : showReportsLoadingState ? (
        <div className="mt-10 px-4">
          <div className="glass-panel glass-border rounded-[28px] p-6 sm:p-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-3 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Syncing analyses...
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="glass-panel glass-border animate-pulse rounded-[24px] p-6">
                  <div className="mb-4 h-4 w-40 rounded bg-[var(--surface)]/60" />
                  <div className="mb-2 h-4 w-3/4 rounded bg-[var(--surface)]/50" />
                  <div className="h-4 w-1/2 rounded bg-[var(--surface)]/40" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !hasReports && !activeReport ? (
        <div className="mt-10">
          <EmptyState type="gap-analysis" />
        </div>
      ) : (
        <>
          <div className="mb-12 px-4">
            <StatusTiles
              stats={[
                { label: "Identified Gaps", value: String(activeGapCount).padStart(2, "0"), icon: Zap, trend: "+2", status: "critical" },
                { label: "Total Scans", value: String(reports?.length ?? 0), icon: Radio, status: "neutral" },
                { label: "Remediation Rate", value: `${remediationRate}%`, icon: Activity, status: "success" },
                { label: "Alignment Index", value: overallScore !== null ? `${Math.round(overallScore)}%` : "Optimal", icon: Target, status: "success" },
              ]}
            />
          </div>

          {/* Gap List / Generating Skeleton */}
          <div className="space-y-4 px-4">
            {generating ? (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-primary/10 border border-primary/20">
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-sm font-bold text-primary">Horus is analyzing your evidence against the standard...</span>
                  </div>
                </div>
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="glass-panel p-8 rounded-[36px] animate-pulse glass-border">
                    <div className="flex gap-8">
                      <div className="w-14 h-14 rounded-2xl glass-input" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-[var(--surface)] rounded-lg w-1/2" />
                        <div className="h-4 bg-[var(--surface)] rounded-lg w-3/4" />
                        <div className="h-4 bg-[var(--surface)] rounded-lg w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : gaps.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-10 h-10 text-[var(--status-success)] opacity-50 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground italic">No critical gaps detected. System is stable.</p>
              </div>
            ) : (
              gaps.map((gap, i) => (
                <div key={i} className="glass-panel p-6 sm:p-8 rounded-[30px] flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-8 group hover:bg-[var(--surface)] transition-all glass-border relative overflow-hidden animate-fade-in-up opacity-0" style={{ animationDelay: `${(i + 4) * 60}ms`, animationFillMode: 'forwards' }}>
                  <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.75),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-70" />
                  <div className={cn("w-14 h-14 rounded-2xl flex flex-shrink-0 items-center justify-center border border-[var(--border-subtle)]", gap.statusClass)}>
                    {gap.severity === "High" ? <AlertTriangle className="w-5 h-5" /> :
                      gap.severity === "Medium" ? <Info className="w-5 h-5" /> :
                        <CheckCircle2 className="w-5 h-5" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{gap.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border", gap.severity === "High" ? "status-critical" : gap.severity === "Medium" ? "status-warning" : "status-success")}>
                          {gap.severity}
                        </span>
                        <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border", gap.alignment === "Not Aligned" ? "status-critical" : gap.alignment === "Partially Aligned" ? "status-warning" : "status-success")}>
                          {gap.alignment}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-2xl">{gap.desc}</p>
                  </div>

                  <div className="flex items-center gap-10">
                    <div className="text-right hidden xl:block">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Risk Impact</div>
                      <div className="mono text-xl font-bold text-muted-foreground">{gap.riskScore}%</div>
                    </div>
                    <div className="h-10 w-px bg-[var(--border-subtle)] hidden md:block" />
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                       <button
                        onClick={() => handleDraftRemediationClick(gap.original)}
                        disabled={isDrafting}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] glass-button text-foreground rounded-xl font-bold text-xs transition-all disabled:opacity-50"
                      >
                        {isDrafting && targetGap?.gap.gap === gap.original.gap ? (
                           <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        Draft Fix
                      </button>
                      <div className="flex gap-2">
                        {(gap.alignment === "Aligned" || gap.alignment === "Partially Aligned") && (
                          <Link
                            href={`/platform/evidence?highlight=${gap.original.criterionId}`}
                            className="flex-1 flex items-center gap-2 px-4 py-2.5 min-h-[44px] glass-button text-foreground rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all justify-center"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Evidence
                          </Link>
                        )}
                        <button
                          onClick={() => handleRemediateClick(gap.original)}
                          className={cn(
                            "flex items-center gap-2 px-6 py-2.5 min-h-[44px] bg-primary text-primary-foreground rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-xl justify-center",
                            (gap.alignment === "Aligned" || gap.alignment === "Partially Aligned") ? "flex-1" : "w-full"
                          )}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Previous Reports */}
          {reports && reports.length > 0 && (
            <section className="mt-16 px-4">
              <div className="mb-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black italic text-[var(--text-primary)]">Previous Analyses</h2>
                  <div className="h-px w-20 bg-[var(--border-subtle)]" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Each run now keeps the source it used, so you can tell whether Horus scanned linked evidence, recent uploads, or a hand-picked file set.
                </p>
              </div>
              <div className="space-y-3">
                {reports
                  .filter((report: GapAnalysisListItem) => report.status !== "pending" && report.status !== "running" || report.id === pendingJobId)
                  .map((report: GapAnalysisListItem) => {
                    const isQueued = report.status === "pending" || report.status === "running" || report.id === pendingJobId
                    const isFailed = report.status === "failed"
                    return (
                      <GlassCard
                        key={report.id}
                        variant={2}
                        hoverEffect={!isQueued}
                        shine={!isQueued}
                        className={cn(
                          "group flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 justify-between p-5 rounded-[24px]",
                          isQueued ? "opacity-70 cursor-wait" : isFailed ? "border-destructive/50 opacity-80" : "cursor-pointer"
                        )}
                        onClick={isQueued || isFailed ? undefined : () => handleViewReport(report.id)}
                      >
                        <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-xl glass-input flex items-center justify-center">
                            {isQueued ? (
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            ) : isFailed ? (
                              <AlertTriangle className="w-4 h-4 text-destructive" />
                            ) : (
                              <span className="mono text-[10px] font-bold text-muted-foreground">{Math.round(report.overallScore)}%</span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">{report.standardTitle}</h4>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                              {isQueued ? "Analyzing..." : isFailed ? "Analysis Failed" : new Date(report.createdAt).toLocaleDateString()}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                {getAnalysisScopeLabel(report.analysisScope)}
                              </span>
                              {report.evidenceCount ? (
                                <span className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                                  {report.evidenceCount} file{report.evidenceCount === 1 ? "" : "s"}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 self-end sm:self-auto">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleExportSnapshot(report.id)
                            }}
                            className={cn(
                              "text-[10px] font-bold transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100",
                              isFailed || isQueued
                                ? "text-muted-foreground/50 cursor-not-allowed pointer-events-none"
                                : "text-primary hover:underline"
                            )}
                            title={isFailed || isQueued ? "Only completed reports can be exported" : "Export snapshot PDF"}
                          >
                            Export PDF
                          </a>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(report.id) }}
                            className="text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                          >
                            Delete
                          </button>
                          <Play className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </GlassCard>
                    )
                  })}
              </div>
            </section>
          )}
        </>
      )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm deletion"
            className="glass-panel rounded-2xl p-8 max-w-sm w-full glass-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Delete Report?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">This gap analysis report will be permanently removed.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-lg glass-button text-[var(--text-secondary)] text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Selector Modal */}
      <EvidenceSelector
        open={isRemediating}
        onOpenChange={setIsRemediating}
        onSelect={handleEvidenceSelected}
      />

      {/* AI Draft Editor Modal */}
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
