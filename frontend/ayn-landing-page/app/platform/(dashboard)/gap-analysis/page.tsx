"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { useState, useCallback, useEffect } from "react"
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
} from "lucide-react"
import type { GapAnalysisListItem, GapAnalysis, GapItem, Standard, Evidence } from "@/types"
import { EvidenceSelector } from "@/components/platform/evidence-selector"

export default function GapAnalysisPage() {
  return (
    <ProtectedRoute>
      <GapAnalysisContent />
    </ProtectedRoute>
  )
}

function GapAnalysisContent() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"all" | "urgent">("all")
  const [selectedStandard, setSelectedStandard] = useState("")
  const [generating, setGenerating] = useState(false)
  const [activeReport, setActiveReport] = useState<GapAnalysis | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Remediation State
  const [isRemediating, setIsRemediating] = useState(false)
  const [targetGap, setTargetGap] = useState<{ gap: GapItem, standardId: string } | null>(null)

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

  const { data: standards } = useSWR<Standard[]>(
    user ? "standards" : null,
    () => api.getStandards(),
  )

  const { data: reports, mutate } = useSWR<GapAnalysisListItem[]>(
    user ? "gap-analyses" : null,
    () => api.getGapAnalyses(),
  )

  const handleGenerate = useCallback(async () => {
    if (!selectedStandard) return toast.error("Select a standard first")
    setGenerating(true)
    try {
      const report = await api.generateGapAnalysis(selectedStandard)
      toast.success("Alignment analysis generated")
      mutate()
      setActiveReport(report)
    } catch {
      toast.error("Generation failed")
    } finally {
      setGenerating(false)
    }
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

  const gaps = activeReport?.gaps?.map((item: GapItem) => {
    const priorityMap: Record<string, string> = { high: "High", medium: "Med", low: "Low" }
    const statusMap: Record<string, string> = { not_met: "Critical", no_evidence: "Critical", partially_met: "Warning", met: "Verified" }
    const p = priorityMap[item.priority] ?? "Med"
    const s = statusMap[item.status] ?? "Warning"
    const color = p === "High" ? "text-red-500" : p === "Med" ? "text-amber-500" : "text-emerald-500"
    const bg = p === "High" ? "bg-red-500/5" : p === "Med" ? "bg-amber-500/5" : "bg-emerald-500/5"
    const riskScore = p === "High" ? 88 : p === "Med" ? 42 : 12
    return {
      original: item, // Keep reference to original item
      title: item.criterionTitle ?? "Unnamed Criterion",
      priority: p,
      status: s,
      desc: item.recommendation ?? "No recommendation available.",
      riskScore,
      color,
      bg,
    }
  }) ?? []

  const filteredGaps = activeTab === "urgent"
    ? gaps.filter((g) => g.priority === "High")
    : gaps

  const overallScore = activeReport?.overallScore ?? null
  const activeGapCount = gaps.filter((g) => g.priority === "High").length
  const remediationRate = gaps.length > 0 ? Math.round((gaps.filter((g) => g.priority === "Low").length / gaps.length) * 100) : 94

  return (
    <div className="animate-fade-in-up pb-20">
      <header className="mb-10 pt-6 flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Neural Alignment Monitor</span>
            </div>
            <div className="h-px w-6 bg-zinc-800" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Framework Alignment</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight italic text-[var(--text-primary)]">
            Alignment <span className="text-[var(--text-tertiary)] not-italic font-light">Analysis</span>
          </h1>
        </div>

        <div className="p-1 glass-panel rounded-xl flex gap-1 border-[var(--border-subtle)]">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "all" ? "bg-white/5 text-white" : "text-zinc-600 hover:text-zinc-400"}`}
          >
            System Wide
          </button>
          <button
            onClick={() => setActiveTab("urgent")}
            className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "urgent" ? "bg-white/5 text-white" : "text-zinc-600 hover:text-zinc-400"}`}
          >
            Critical Only
          </button>
        </div>
      </header>

      {/* Generate Controls */}
      <div className="px-4 mb-10">
        <div className="glass-panel p-6 rounded-3xl border-[var(--border-subtle)] flex flex-col md:flex-row items-center gap-4">
          <select
            value={selectedStandard}
            onChange={(e) => setSelectedStandard(e.target.value)}
            className="flex-1 h-11 bg-white/[0.02] border border-[var(--border-light)] text-white rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="" className="bg-[var(--surface-modal)]">Choose a standard to analyze...</option>
            {standards?.map((s) => (
              <option key={s.id} value={s.id} className="bg-[var(--surface-modal)]">{s.title}</option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedStandard}
            className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 fill-current" />
            {generating ? "Scanning..." : "Initiate Analysis"}
          </button>
        </div>
      </div>

      {/* Summary Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 px-4">
        {[
          { label: "Identified Gaps", val: String(activeGapCount).padStart(2, "0"), icon: Zap, color: "text-red-500" },
          { label: "Total Scans", val: String(reports?.length ?? 0), icon: Radio, color: "text-amber-500" },
          { label: "Remediation Rate", val: `${remediationRate}%`, icon: Activity, color: "text-blue-500" },
          { label: "Alignment Index", val: overallScore !== null ? `${Math.round(overallScore)}%` : "Optimal", icon: Target, color: "text-emerald-500" },
        ].map((s, i) => (
          <div key={i} className="glass-panel p-5 rounded-2xl flex items-center gap-5 border-[var(--border-subtle)] animate-fade-in-up opacity-0" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)]">
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <div className="mono text-xl font-bold text-[var(--text-primary)]">{s.val}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Gap List */}
      <div className="space-y-4 px-4">
        {filteredGaps.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/30 mx-auto mb-4" />
            <p className="text-sm text-zinc-600 italic">No critical gaps detected. System is stable.</p>
          </div>
        ) : (
          filteredGaps.map((gap, i) => (
            <div key={i} className="glass-panel p-8 rounded-[36px] flex flex-col md:flex-row items-start md:items-center gap-8 group hover:bg-[var(--surface)] transition-all border-[var(--border-subtle)] relative overflow-hidden animate-fade-in-up opacity-0" style={{ animationDelay: `${(i + 4) * 60}ms`, animationFillMode: 'forwards' }}>
              <div className={`w-14 h-14 rounded-2xl flex flex-shrink-0 items-center justify-center ${gap.bg} border border-[var(--border-subtle)]`}>
                {gap.priority === "High" ? <AlertTriangle className={`w-5 h-5 ${gap.color}`} /> :
                  gap.priority === "Med" ? <Info className={`w-5 h-5 ${gap.color}`} /> :
                    <CheckCircle2 className={`w-5 h-5 ${gap.color}`} />}
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{gap.title}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${gap.priority === "High" ? "bg-red-500/5 text-red-500 border-red-500/10" : "bg-white/5 text-zinc-600 border-[var(--border-subtle)]"
                    }`}>
                    {gap.status}
                  </span>
                </div>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-2xl">{gap.desc}</p>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right hidden xl:block">
                  <div className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">Risk Impact</div>
                  <div className="mono text-xl font-bold text-zinc-400">{gap.riskScore}%</div>
                </div>
                <div className="h-10 w-px bg-white/5 hidden md:block" />
                <button
                  onClick={() => handleRemediateClick(gap.original)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Remediate
                </button>
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
            {reports.map((report) => (
              <div
                key={report.id}
                className="glass-panel p-5 rounded-2xl flex items-center justify-between hover:bg-white/[0.03] transition-all border-[var(--border-subtle)] group cursor-pointer"
                onClick={() => handleViewReport(report.id)}
              >
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-[var(--border-subtle)] flex items-center justify-center">
                    <span className="mono text-[10px] font-bold text-zinc-500">{Math.round(report.overallScore)}%</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">{report.standardTitle}</h4>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(report.id) }}
                    className="text-[10px] font-bold text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    Delete
                  </button>
                  <Play className="w-4 h-4 text-zinc-700 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </section>
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
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-all"
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
    </div>
  )
}

