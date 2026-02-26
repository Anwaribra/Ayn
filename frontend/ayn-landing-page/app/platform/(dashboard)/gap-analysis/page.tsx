"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { useState, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
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
  const [activeTab, setActiveTab] = useState<"all" | "urgent">("all")
  const [selectedStandard, setSelectedStandard] = useState("")
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
    setGenerating(true)
    try {
      const job = await api.generateGapAnalysis(selectedStandard)
      // 202: queued — set the pending job ID, SWR will poll until done
      setPendingJobId(job.jobId)
      toast.success("Analysis queued", {
        description: "Horus is analyzing your evidence. We'll notify you when it's ready."
      })
      mutate() // Immediately refresh to show the 'queued' stub in the list
    } catch {
      toast.error("Failed to queue analysis")
      setGenerating(false)
    }
    // Note: setGenerating(false) is handled in SWR onSuccess once the job completes
  }, [selectedStandard, mutate])

  const handleViewReport = useCallback(async (id: string) => {
    try {
      const full = await api.getGapAnalysis(id)
      setActiveReport(full)
    } catch {
      toast.error("Failed to load report")
    }
  }, [])

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

  const filteredGaps = activeTab === "urgent"
    ? gaps.filter((g) => g.severity === "High")
    : gaps

  const overallScore = activeReport?.overallScore ?? null
  const activeGapCount = gaps.filter((g) => g.severity === "High").length
  const remediationRate = gaps.length > 0 ? Math.round((gaps.filter((g) => g.severity === "Low").length / gaps.length) * 100) : 94

  return (
    <div className="animate-fade-in-up pb-20">
      <header className="mb-10 pt-6 flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded status-info border">
              <span className="text-[10px] font-bold uppercase tracking-widest">Gap Analysis</span>
            </div>
            <div className="h-px w-6 bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Evidence vs Standards</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">
            Compliance Gap <span className="text-[var(--text-tertiary)] font-light">Center</span>
          </h1>
        </div>

        <div className="p-1 glass-panel rounded-xl flex flex-wrap gap-1 border-[var(--border-subtle)]">
          <button
            onClick={() => setActiveTab("all")}
            className={cn("px-4 sm:px-6 py-2.5 min-h-[44px] rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", activeTab === "all" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            All Gaps
          </button>
          <button
            onClick={() => setActiveTab("urgent")}
            className={cn("px-4 sm:px-6 py-2.5 min-h-[44px] rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", activeTab === "urgent" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            High Severity
          </button>
        </div>
      </header>

      <div className="px-4 mb-6">
        <div className="glass-panel p-4 rounded-2xl border-[var(--border-subtle)]">
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
              className="ml-auto shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
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
          <div className="p-6 rounded-3xl glass-layer-2 border-[var(--border-subtle)] bg-primary/5 flex flex-col md:flex-row gap-6 items-start">
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
        <div className="glass-panel p-6 rounded-3xl border-[var(--border-subtle)] flex flex-col md:flex-row items-center gap-4">
          <select
            value={selectedStandard}
            onChange={(e) => setSelectedStandard(e.target.value)}
            className="flex-1 h-11 bg-muted/50 border border-[var(--border-light)] text-foreground rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="" className="bg-[var(--surface-modal)]">Choose a standard to analyze...</option>
            {standards?.map((s: Standard) => (
              <option key={s.id} value={s.id} className="bg-[var(--surface-modal)]">{s.title}</option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedStandard}
            className="flex items-center gap-2 px-8 py-3 min-h-[44px] bg-foreground text-background rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Initiate Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Matrix */}
      {/* Summary Matrix & Results */}
      {reportsError ? (
        <div className="mt-10 flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-border bg-muted/30">
          <p className="text-muted-foreground text-center mb-4">Failed to load gap analyses.</p>
          <button
            type="button"
            onClick={() => mutate()}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (!reports || reports.length === 0) && !activeReport ? (
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
                  <div key={i} className="glass-panel p-8 rounded-[36px] animate-pulse border-[var(--border-subtle)]">
                    <div className="flex gap-8">
                      <div className="w-14 h-14 rounded-2xl bg-muted" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-muted rounded-lg w-1/2" />
                        <div className="h-4 bg-muted rounded-lg w-3/4" />
                        <div className="h-4 bg-muted rounded-lg w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredGaps.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-10 h-10 text-[var(--status-success)] opacity-50 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground italic">No critical gaps detected. System is stable.</p>
              </div>
            ) : (
              filteredGaps.map((gap, i) => (
                <div key={i} className="glass-panel p-8 rounded-[36px] flex flex-col md:flex-row items-start md:items-center gap-8 group hover:bg-[var(--surface)] transition-all border-[var(--border-subtle)] relative overflow-hidden animate-fade-in-up opacity-0" style={{ animationDelay: `${(i + 4) * 60}ms`, animationFillMode: 'forwards' }}>
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
                    <div className="h-10 w-px bg-border hidden md:block" />
                    <div className="flex flex-col gap-2">
                       <button
                        onClick={() => handleDraftRemediationClick(gap.original)}
                        disabled={isDrafting}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] bg-secondary text-secondary-foreground rounded-xl font-bold text-xs border hover:bg-muted transition-all disabled:opacity-50"
                      >
                        {isDrafting && targetGap?.gap.gap === gap.original.gap ? (
                           <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        Draft Fix
                      </button>
                      <button
                        onClick={() => handleRemediateClick(gap.original)}
                        className="flex items-center gap-2 px-6 py-2.5 min-h-[44px] bg-primary text-primary-foreground rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-xl justify-center"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Link Evidence
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Previous Reports */}
          {reports && reports.length > 0 && (
            <section className="mt-16 px-4">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-black italic text-[var(--text-primary)]">Previous Scans</h2>
                <div className="h-px w-20 bg-[var(--border-subtle)]" />
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
                          "group flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 justify-between p-5",
                          isQueued ? "opacity-70 cursor-wait" : isFailed ? "border-destructive/50 opacity-80" : "cursor-pointer"
                        )}
                        onClick={isQueued || isFailed ? undefined : () => handleViewReport(report.id)}
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center">
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
                          </div>
                        </div>
                        <div className="flex items-center gap-4 self-end sm:self-auto">
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); api.downloadGapAnalysisReport(report.id) }}
                            className="text-[10px] font-bold text-primary hover:underline transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                            title="Download PDF Report"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm deletion"
            className="bg-[var(--surface-modal)] rounded-2xl p-8 max-w-sm w-full border border-[var(--border-light)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Delete Report?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">This gap analysis report will be permanently removed.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--surface)] transition-all"
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
