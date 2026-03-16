"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { usePageTitle } from "@/hooks/use-page-title"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR, { mutate as globalMutate } from "swr"
import { Evidence } from "@/types"
import { UploadCloud, Plus, X, FileText, ExternalLink, Trash2, Search, Filter, Loader2, Eye, MoreVertical, Sparkles, AlertCircle } from "lucide-react"
import { EvidenceFilters } from "@/components/platform/evidence/evidence-filters"
import { EvidenceCard } from "@/components/platform/evidence/evidence-card"
import { DocumentEditor } from "@/components/platform/document-editor"
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
  usePageTitle("Evidence Vault")
  const { data: evidenceList, isLoading, error, mutate: localMutate } = useSWR<Evidence[]>(
    user ? [`evidence`, user.id] : null,
    () => api.getEvidence()
  )

  const handleDemoLoad = () => {
    if (!user) return;
    
    toast.info("Initializing Live Demo Mode...", { duration: 1500 });
    
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
      toast.success("Demo Data Loaded", {
        description: "Evidence added and gap analysis generated at 82%.",
      });
    }, 1500);
  };
 
  const [isUploading, setIsUploading] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // H3: Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<any>("")
  const [standardFilter, setStandardFilter] = useState("")


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
    setEvidenceToDelete(evidence)
  }

  const confirmDelete = async () => {
    if (!evidenceToDelete) return
    try {
      await api.deleteEvidence(evidenceToDelete.id)
      toast.success("Evidence deleted")
      if (selectedEvidence?.id === evidenceToDelete.id) {
        setSelectedEvidence(null)
      }
      localMutate()
    } catch (error) {
      toast.error("Failed to delete evidence", { description: "Please try again." })
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
      toast.success("Evidence uploaded successfully", {
        description: "Horus is analyzing the document for compliance standards."
      })
      localMutate()
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
      localMutate()
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
            onClick={() => localMutate()}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex flex-col justify-between p-5 rounded-3xl glass-layer-2 animate-pulse h-[220px] border border-border/50">
              <div className="flex justify-between items-start mb-4">
                <div className="h-6 w-24 bg-muted/60 rounded-full" />
                <div className="h-6 w-6 rounded-full bg-muted/40" />
              </div>
              <div className="space-y-3 mb-4 flex-1 mt-2">
                <div className="h-5 bg-muted/60 rounded-lg w-3/4" />
                <div className="h-5 bg-muted/60 rounded-lg w-1/2" />
                <div className="h-3 bg-muted/40 rounded-lg w-full mt-4" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-muted/60 border-2 border-[var(--surface-modal)]" />
                  <div className="w-6 h-6 rounded-full bg-muted/40 border-2 border-[var(--surface-modal)]" />
                </div>
                <div className="h-3 w-16 bg-muted/40 rounded-lg" />
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
                className={cn(
                  "cursor-pointer group p-0 relative",
                  (highlightId === evidence.id || highlightId === evidence.originalFilename || highlightId === evidence.title) && "ring-2 ring-primary ring-offset-4 ring-offset-background animate-pulse shadow-[0_0_30px_rgba(var(--primary),0.3)] transition-all"
                )}
              >
                <EvidenceCard evidence={evidence} onClick={() => setSelectedEvidence(evidence)} />
              </GlassCard>
            ))}
          </div>
        </>
      )}

      {/* Full-Screen Split-View Evidence Analysis Overlay */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300 bg-background/95 backdrop-blur-xl" style={{ margin: 0 }}>
          {/* Top Bar Navigation for the Split View */}
          <div className="absolute top-0 left-0 right-0 h-16 border-b border-[var(--border-subtle)] bg-[var(--surface-modal)]/70 backdrop-blur-md flex items-center justify-between px-6 z-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl status-info border flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-foreground leading-tight">{selectedEvidence.title || selectedEvidence.originalFilename}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn(
                    "px-2 py-px rounded text-[10px] font-bold uppercase tracking-wider border",
                    ['linked', 'analyzed'].includes(selectedEvidence.status) ? "status-success" : "glass-button text-muted-foreground"
                  )}>
                    {selectedEvidence.status}
                  </span>
                  <span className="text-xs text-muted-foreground">• Analysis Mode</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAnalyzeModalOpen(true)}
                className="px-4 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                <Sparkles className="w-4 h-4" /> Run Horus Scan
              </button>
              <button
                onClick={() => { setSelectedEvidence(null); setActiveHighlightId(null); }}
                className="p-2 rounded-full glass-button text-muted-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* LEFT PANE: Document Viewer */}
          <div className="w-1/2 h-full pt-16 border-r border-[var(--border-subtle)] flex flex-col bg-[var(--surface-modal)] relative overflow-hidden">
            {selectedEvidence.fileUrl && selectedEvidence.fileUrl !== "#" && selectedEvidence.originalFilename?.toLowerCase().endsWith(".pdf") ? (
              <iframe src={selectedEvidence.fileUrl} className="w-full h-full" title={selectedEvidence.title || "Document preview"} />
            ) : (
              <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                <div className="max-w-3xl mx-auto rounded-xl glass-panel glass-border shadow-2xl p-8 lg:p-12 min-h-full">
                  <div className="mb-10 pb-6 border-b border-[var(--border-subtle)] text-center">
                    <h1 className="text-3xl font-serif font-black text-foreground mb-4">{selectedEvidence.title || "Untitled Document"}</h1>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">ID: {selectedEvidence.id.slice(0, 8)}</span>
                      {selectedEvidence.documentType && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider glass-pill text-muted-foreground">{selectedEvidence.documentType}</span>
                      )}
                      {selectedEvidence.confidenceScore != null && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider status-success border">{selectedEvidence.confidenceScore}% confidence</span>
                      )}
                    </div>
                  </div>

                  {selectedEvidence.summary ? (
                    <div className="space-y-6 font-serif text-lg leading-relaxed text-foreground/80">
                      <div className="mb-6">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">AI Summary</h3>
                        <p className="text-foreground/80 leading-relaxed">{selectedEvidence.summary}</p>
                      </div>
                      {selectedEvidence.fileUrl && selectedEvidence.fileUrl !== "#" && (
                        <a
                          href={selectedEvidence.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" /> Open original file
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground font-medium">No preview available for this document.</p>
                      {selectedEvidence.fileUrl && selectedEvidence.fileUrl !== "#" && (
                        <a
                          href={selectedEvidence.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-primary hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" /> Open original file
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANE: Horus AI Analysis */}
          <div className="w-1/2 h-full pt-16 flex flex-col bg-background/50 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
              
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-black text-foreground">Horus AI Analysis</h2>
                </div>
                <p className="text-sm text-muted-foreground font-medium">Compliance verification and gap detection.</p>
              </div>

              {/* Confidence Score Card */}
              <div className="p-6 rounded-3xl glass-panel glass-border mb-8 flex items-center gap-6">
                <div className="w-16 h-16 shrink-0">
                  {/* Mock Circular Progress */}
                  <svg viewBox="0 0 36 36" className="w-full h-full text-primary -rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${selectedEvidence.confidenceScore || 85}, 100`}
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-black text-foreground">{selectedEvidence.confidenceScore || 85}%</div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Overall Alignment Score</div>
                </div>
              </div>

              {/* Linked Criteria */}
              <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Linked Criteria</h3>
              <div className="space-y-4">
                {selectedEvidence.criteria && selectedEvidence.criteria.length > 0 ? (
                  selectedEvidence.criteria.map((criterion: any, idx: number) => (
                    <div
                      key={criterion.id || idx}
                      className={cn(
                        "p-5 rounded-2xl border transition-all cursor-pointer group hover:bg-[var(--surface)]",
                        activeHighlightId === criterion.id ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "glass-panel glass-border"
                      )}
                      onClick={() => setActiveHighlightId(criterion.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-primary" />
                          {criterion.title}
                        </h4>
                        {criterion.standardId && (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border status-info">
                            Standard
                          </span>
                        )}
                      </div>
                      {criterion.description && (
                        <p className="text-[13px] font-medium text-muted-foreground leading-relaxed mb-4">
                          {criterion.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs font-bold text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                          View criterion →
                        </span>
                        <button className="px-3 py-1.5 rounded-lg glass-button text-[10px] font-bold uppercase transition-colors text-foreground">
                          Draft AI Fix
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed glass-border text-center glass-panel">
                    <AlertCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No criteria linked yet.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Run a Horus Scan to map this evidence against standards.</p>
                  </div>
                )}
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
            aria-hidden="true"
          />
          <div 
            className="relative w-full max-w-sm glass-panel rounded-[32px] overflow-hidden flex flex-col p-6 animate-in zoom-in duration-200 glass-border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="analyze-modal-title"
          >
            <h3 id="analyze-modal-title" className="text-xl font-black text-foreground mb-1">Analyze Evidence</h3>
            <p className="text-sm font-medium text-muted-foreground mb-6">Select framework to map against.</p>

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
                <span className="text-sm font-bold">All Available Standards</span>
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
            <h3 id="delete-modal-title" className="text-xl font-black text-foreground mb-1">Delete Evidence</h3>
            <p className="text-sm font-medium text-muted-foreground mb-6">Are you sure you want to delete &quot;{evidenceToDelete.title}&quot;? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEvidenceToDelete(null)}
                className="flex-1 px-4 py-3 text-sm font-bold glass-button text-muted-foreground rounded-2xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-[2] px-4 py-3 text-sm font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-xl shadow-destructive/20"
              >
                <Trash2 className="w-4 h-4 ml-1" /> Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
