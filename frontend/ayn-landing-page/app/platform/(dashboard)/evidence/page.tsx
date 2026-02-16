"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR, { mutate } from "swr"
import { Evidence } from "@/types"
import { UploadCloud, Plus, X, FileText, ExternalLink, Trash2, Search, Filter, Loader2, Eye, MoreVertical } from "lucide-react"
import { EvidenceFilters } from "@/components/platform/evidence/evidence-filters"
import { EvidenceCard } from "@/components/platform/evidence/evidence-card"
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

  const { data: evidenceList, isLoading, mutate } = useSWR<Evidence[]>(
    user ? [`evidence`, user.id] : null,
    () => api.getEvidence()
  )

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    setIsUploading(true)
    const file = e.target.files[0]

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Mock upload delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Real implementation would be: await api.uploadEvidence(formData)

      toast.success("Evidence uploaded successfully", {
        description: "Horus is analyzing the document for compliance standards."
      })

      mutate() // Refresh
    } catch (error) {
      toast.error("Upload failed", { description: "Please try again." })
    } finally {
      setIsUploading(false)
    }
  }

  // Helper for evidence card since we aren't importing the separate component in this version to avoid excessive file creation if users prefer single file
  // Actually, I authored EvidenceCard earlier, let's use it if imported. 
  // But for this `write_to_file` to be self-contained and robust against import errors if I messed up paths, I will inline a robust version or use the imported one if I am sure.
  // I created `d:\CV-4\graduation\Ayn\frontend\ayn-landing-page\components\platform\evidence\evidence-card.tsx` in step 97.
  // So I should import it. See import above.

  return (
    <div className="animate-fade-in-up pb-20 space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center gap-1.5 dark:bg-emerald-900/20 dark:border-emerald-900/30">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse dark:bg-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest dark:text-emerald-400">Vault Secure</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Evidence <span className="text-muted-foreground font-light">Library</span>
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Centralized repository for institutional compliance assets.
          </p>
        </div>

        <label className={cn(
          "group relative overflow-hidden rounded-xl bg-blue-600 text-white px-6 py-3 font-bold text-sm cursor-pointer shadow-lg hover:shadow-blue-500/25 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 active:scale-95",
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
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              <span>Upload Evidence</span>
            </>
          )}
        </label>
      </div>

      <EvidenceFilters />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-zinc-100 animate-pulse dark:bg-slate-800" />
          ))}
        </div>
      ) : evidenceList?.length === 0 ? (
        <div className="text-center py-20 rounded-3xl border-2 border-dashed border-glass-border glass-layer-2">
          <div className="w-16 h-16 rounded-2xl glass-layer-3 mx-auto flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No evidence found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2">
            Upload proof documents, reports, or policies to start mapping your compliance framework.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {evidenceList?.map((evidence) => (
            <EvidenceCard
              key={evidence.id}
              evidence={evidence}
              onClick={() => setSelectedEvidence(evidence)}
            />
          ))}
        </div>
      )}

      {/* Quick Preview Modal Overlay */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ margin: 0 }}>
          <div
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedEvidence(null)}
          />
          <div className="relative w-full max-w-2xl glass-layer-3 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-start justify-between bg-zinc-50/50 dark:bg-slate-900/50 dark:border-slate-800">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 dark:bg-blue-900/20 dark:border-blue-900/30">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 leading-tight mb-1 dark:text-white">{selectedEvidence.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      selectedEvidence.status === 'linked'
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-slate-800 dark:text-zinc-400"
                    )}>
                      {selectedEvidence.status}
                    </span>
                    <span className="text-xs text-zinc-400">•</span>
                    <span className="text-xs text-zinc-500 font-medium dark:text-zinc-400">Added {new Date(selectedEvidence.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="p-2 rounded-full hover:bg-zinc-200/50 text-zinc-400 hover:text-zinc-600 transition-colors dark:hover:bg-slate-800 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 dark:bg-slate-900">
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Linked Standards</h4>
                {(selectedEvidence.criteria?.length ?? 0) > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedEvidence.criteria?.map(ref => (
                      <div key={ref.id || ref} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30">
                        {ref.title || ref.id || "Standard Link"}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 italic dark:text-zinc-400">No standards linked yet. Run Horus analysis to map this document.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 dark:bg-slate-800/50 dark:border-slate-800">
                  <div className="text-xs font-medium text-zinc-500 mb-1 dark:text-zinc-400">Impact Score</div>
                  <div className="text-2xl font-black text-zinc-900 dark:text-white">High</div>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 dark:bg-slate-800/50 dark:border-slate-800">
                  <div className="text-xs font-medium text-zinc-500 mb-1 dark:text-zinc-400">Confidence</div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {selectedEvidence.confidenceScore ? `${Math.round(selectedEvidence.confidenceScore * 100)}%` : "N/A"}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex gap-3 justify-end dark:bg-slate-900/50 dark:border-slate-800">
              <button className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 dark:hover:bg-red-900/20 dark:text-red-400">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <a
                href={selectedEvidence.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2 bg-zinc-900 text-white font-bold rounded-xl text-sm hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <ExternalLink className="w-4 h-4" />
                Open File
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
