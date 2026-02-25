"use client"

import { useState, useMemo } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR, { mutate } from "swr"
import { Evidence } from "@/types"
import { UploadCloud, Plus, X, FileText, ExternalLink, Trash2, Search, Filter, Loader2, Eye, MoreVertical, Sparkles, AlertCircle } from "lucide-react"
import { EvidenceFilters } from "@/components/platform/evidence/evidence-filters"
import { EvidenceCard } from "@/components/platform/evidence/evidence-card"
import { GlassCard } from "@/components/ui/glass-card"
import { EmptyState } from "@/components/platform/empty-state"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function EvidencePage() {
  return (
    <ProtectedRoute>
      <EvidenceContent />
    </ProtectedRoute>
  )
}

function EvidenceContent() {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // H3: Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<any>("")
  const [standardFilter, setStandardFilter] = useState("")

  const { data: evidenceList, isLoading, error, mutate } = useSWR<Evidence[]>(
    user ? [`evidence`, user.id] : null,
    () => api.getEvidence()
  )

  const { data: standards } = useSWR<any[]>(
    "standards",
    () => api.getStandards()
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
      toast.success("Analysis started!", { description: "Horus is mapping this evidence against the selected standards." })
      setIsAnalyzeModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to start analysis")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDelete = async (evidence: Evidence) => {
    try {
      await api.deleteEvidence(evidence.id)
      toast.success("Evidence deleted")
      setSelectedEvidence(null)
      mutate()
    } catch (error) {
      toast.error("Failed to delete evidence", { description: "Please try again." })
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    setIsUploading(true)
    const file = e.target.files[0]

    try {
      await api.uploadEvidence(file)
      toast.success("Evidence uploaded successfully", {
        description: "Horus is analyzing the document for compliance standards."
      })
      mutate()
    } catch (error) {
      toast.error("Upload failed", { description: "Please try again." })
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
      toast.success("Evidence uploaded successfully", {
        description: "Horus is analyzing the document for compliance standards."
      })
      mutate()
    } catch {
      toast.error("Upload failed", { description: "Please try again." })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div
      className="animate-fade-in-up pb-20 space-y-8 relative"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm border-4 border-dashed border-primary/40 rounded-none pointer-events-none">
          <div className="text-center">
            <UploadCloud className="w-16 h-16 text-primary mx-auto mb-3" />
            <p className="text-xl font-bold text-primary">Drop to upload evidence</p>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 rounded-full status-success border flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--status-success)" }} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Vault Secure</span>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Evidence <span className="text-muted-foreground font-light">Library</span>
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Centralized repository for institutional compliance assets.
          </p>
        </div>

        <label className={cn(
          "group relative overflow-hidden rounded-2xl bg-primary text-primary-foreground px-8 py-4 font-bold text-sm cursor-pointer shadow-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-95 border border-border",
          isUploading && "opacity-70 cursor-not-allowed"
        )}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
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
              <span>Securing Asset...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              <span>Upload New Evidence</span>
            </>
          )}
        </label>
      </div>

      <EvidenceFilters
        onSearch={setSearchQuery}
        onStatusChange={setStatusFilter}
        onStandardChange={setStandardFilter}
        activeStatus={statusFilter}
        activeStandard={standardFilter}
      />

      {error ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-border bg-muted/30">
          <p className="text-muted-foreground text-center mb-4">Failed to load evidence.</p>
          <button
            type="button"
            onClick={() => mutate()}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-64 rounded-3xl glass-layer-1 animate-pulse" />
          ))}
        </div>
      ) : evidenceList?.length === 0 ? (
        <div className="mt-8">
          <EmptyState type="evidence" />
        </div>
      ) : (
        <>
          {/* H3: Result count */}
          {(searchQuery || statusFilter || standardFilter) && (
            <p className="text-sm text-muted-foreground font-medium mb-4">
              {filteredEvidence.length} result{filteredEvidence.length !== 1 ? "s" : ""}
              {searchQuery && <span> for <span className="text-foreground font-bold">"{searchQuery}"</span></span>}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEvidence.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <p className="text-muted-foreground font-medium">No evidence matches your filters.</p>
                <button
                  onClick={() => { setSearchQuery(""); setStatusFilter(""); setStandardFilter("") }}
                  className="mt-3 text-xs font-bold text-primary hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : filteredEvidence.map((evidence: Evidence) => (
              <GlassCard
                key={evidence.id}
                variant={2}
                hoverEffect
                shine
                onClick={() => setSelectedEvidence(evidence)}
                className="cursor-pointer group p-0"
              >
                <EvidenceCard evidence={evidence} onClick={() => setSelectedEvidence(evidence)} />
              </GlassCard>
            ))}
          </div>
        </>
      )}

      {/* Quick Preview Modal Overlay */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ margin: 0 }}>
          <div
            className="absolute inset-0 bg-[#000000]/60 backdrop-blur-md transition-opacity"
            onClick={() => setSelectedEvidence(null)}
          />
          <div className="relative w-full max-w-2xl glass-layer-3 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 border border-border">
            <div className="p-6 border-b border-border flex items-start justify-between bg-muted/30">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl status-info border flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground leading-tight mb-1">{selectedEvidence.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                      ['linked', 'analyzed'].includes(selectedEvidence.status)
                        ? "status-success"
                        : selectedEvidence.status === 'processing'
                          ? "status-warning"
                          : "bg-muted text-muted-foreground border-border"
                    )}>
                      {selectedEvidence.status}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground font-medium">Added {new Date(selectedEvidence.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Linked Standards</h4>
                {(selectedEvidence.criteria?.length ?? 0) > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedEvidence.criteria?.map(ref => (
                      <div key={ref.id || ref} className="px-3 py-1.5 rounded-lg status-info border text-xs font-bold">
                        {ref.title || ref.id || "Standard Link"}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No standards linked yet. Run Horus analysis to map this document.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Status</div>
                  <div className="text-xl font-black text-foreground capitalize">{selectedEvidence.status}</div>
                </div>
                <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Confidence</div>
                  <div className={cn(
                    "text-2xl font-black",
                    selectedEvidence.confidenceScore === undefined || selectedEvidence.confidenceScore === null ? "text-muted-foreground" :
                      (selectedEvidence.confidenceScore > 1 ? selectedEvidence.confidenceScore : selectedEvidence.confidenceScore * 100) > 80 ? "text-emerald-500" :
                        (selectedEvidence.confidenceScore > 1 ? selectedEvidence.confidenceScore : selectedEvidence.confidenceScore * 100) > 40 ? "text-amber-500" : "text-destructive"
                  )}>
                    {selectedEvidence.confidenceScore
                      ? `${selectedEvidence.confidenceScore > 1
                        ? Math.round(selectedEvidence.confidenceScore)
                        : Math.round(selectedEvidence.confidenceScore * 100)}%`
                      : "N/A"}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/30 flex flex-col sm:flex-row gap-3 justify-end items-center">
              <div className="flex-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsAnalyzeModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyze Automatically
                </button>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedEvidence)}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <a
                  href={selectedEvidence.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none px-6 py-2 bg-muted text-foreground font-bold rounded-xl text-sm hover:bg-muted/80 transition-all border border-border flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open File
                </a>
              </div>
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
          />
          <div className="relative w-full max-w-sm glass-layer-3 rounded-[32px] overflow-hidden flex flex-col p-6 animate-in zoom-in duration-200 border border-border/50">
            <h3 className="text-xl font-black text-foreground mb-1">Analyze Evidence</h3>
            <p className="text-sm font-medium text-muted-foreground mb-6">Select framework to map against.</p>

            <div className="space-y-3 mb-8">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/50">
                <input
                  type="radio"
                  name="standard"
                  value="all"
                  checked={selectedStandardId === "all"}
                  onChange={() => setSelectedStandardId("all")}
                  className="accent-primary"
                />
                <span className="text-sm font-bold">All Available Standards</span>
              </label>

              {standards?.map((s: any) => (
                <label key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/50">
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
                className="flex-1 px-4 py-3 text-sm font-bold bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground rounded-2xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-[2] px-4 py-3 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <>Run Analysis <Sparkles className="w-4 h-4 ml-1" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
