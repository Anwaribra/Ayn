"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import {
  FileText,
  Grid2X2,
  List,
  Search,
  Plus,
  Archive,
  ChevronRight,
  HardDrive,
  Clock,
  ShieldCheck,
} from "lucide-react"
import type { Evidence } from "@/types"
import { EmptyState } from "@/components/platform/empty-state"
import { EvidenceGridSkeleton, StatsGridSkeleton } from "@/components/platform/skeleton-loader"

export default function EvidencePage() {
  return (
    <ProtectedRoute>
      <EvidenceContent />
    </ProtectedRoute>
  )
}

const STATUS_COLORS: Record<string, string> = {
  verified: "bg-blue-600/10",
  pending: "bg-amber-600/10",
  flagged: "bg-red-600/10",
}

const CAT_COLORS = [
  "bg-blue-600/10",
  "bg-indigo-600/10",
  "bg-purple-600/10",
  "bg-amber-600/10",
  "bg-emerald-600/10",
  "bg-rose-600/10",
  "bg-cyan-600/10",
  "bg-zinc-600/10",
]


function EvidenceContent() {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [uploading, setUploading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: evidence, mutate, isLoading } = useSWR<Evidence[]>(
    user ? "evidence" : null,
    () => api.getEvidence(),
  )

  const filteredEvidence = (evidence ?? []).filter((e: Evidence) =>
    (e.fileName ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setUploading(true)
      try {
        for (const file of Array.from(files)) {
          await api.uploadEvidence(file)
        }
        toast.success("Evidence uploaded successfully")
        mutate()
        setIsUploading(false)
      } catch {
        toast.error("Upload failed")
      } finally {
        setUploading(false)
      }
    },
    [mutate],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await api.deleteEvidence(id)
        toast.success("Evidence removed")
        setDeleteConfirm(null)
        mutate()
      } catch {
        toast.error("Failed to delete evidence")
      }
    },
    [mutate],
  )

  // ESC to close upload modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirm) setDeleteConfirm(null)
        else if (isUploading && !uploading) setIsUploading(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isUploading, uploading, deleteConfirm])

  return (
    <div className="animate-fade-in-up pb-20">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-zinc-800 border border-white/5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Asset Manager</span>
            </div>
            <div className="h-px w-6 bg-zinc-900" />
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Institutional Vault</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight italic text-[var(--text-primary)]">
            Evidence <span className="text-[var(--text-tertiary)] not-italic font-light">Library</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5 mr-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg ${viewMode === "grid" ? "text-blue-500 bg-white/5 shadow-inner" : "text-zinc-600 hover:text-zinc-400"}`}
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg ${viewMode === "list" ? "text-blue-500 bg-white/5 shadow-inner" : "text-zinc-600 hover:text-zinc-400"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setIsUploading(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
          >
            <Plus className="w-4 h-4" />
            Upload Asset
          </button>
        </div>
      </header>

      {/* Stats Summary */}
      {isLoading ? (
        <div className="px-4 mb-10">
          <StatsGridSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 px-4">
          {[
            { label: "Total Volume", value: String(evidence?.length ?? 0), icon: HardDrive },
            { label: "Criteria Linked", value: evidence && evidence.length > 0 ? `${Math.round((evidence.filter((e) => e.criterionId).length / evidence.length) * 100)}%` : "—", icon: ShieldCheck },
            { label: "Pending Audit", value: String(evidence?.filter((e) => !e.criterionId).length ?? 0), icon: Clock },
            { label: "Storage Usage", value: evidence ? `${evidence.length} files` : "0 files", icon: Archive },
          ].map((stat, i) => (
            <div key={i} className="glass-panel p-4 rounded-2xl flex items-center gap-4 border-white/5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.02] flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-zinc-500" />
              </div>
              <div>
                <div className="mono text-lg font-bold text-[var(--text-primary)]">{stat.value}</div>
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search — always visible when evidence exists */}
      {(evidence ?? []).length > 0 && (
        <div className="px-4 mb-6">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full h-9 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-600 text-[var(--text-primary)]"
            />
          </div>
        </div>
      )}

      {/* Library Grid */}
      <div className={
        viewMode === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4"
          : "space-y-3 px-4"
      }>
        {isLoading ? (
          <EvidenceGridSkeleton viewMode={viewMode} />
        ) : filteredEvidence.length === 0 ? (
          <EmptyState type="evidence" />
        ) : (
          filteredEvidence.map((item, i) => {
            const color = CAT_COLORS[i % CAT_COLORS.length]
            const hasLink = !!item.criterionId
            const year = new Date(item.createdAt).getFullYear()
            const size = item.fileType ?? "DOC"

            return viewMode === "grid" ? (
              <div
                key={item.id}
                className="group glass-panel rounded-3xl p-5 border-white/5 hover:border-blue-500/30 hover:bg-[var(--surface)] transition-all cursor-pointer relative overflow-hidden animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center border border-white/5 transition-transform group-hover:scale-110`}>
                    <FileText className="w-6 h-6 text-zinc-300 group-hover:text-white" />
                  </div>
                  <div className="flex gap-1.5">
                    {hasLink && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                    {!hasLink && <Clock className="w-4 h-4 text-amber-500" />}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-blue-400 transition-colors">
                      {item.fileName}
                    </h3>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">
                      {item.criterionId ? "Linked" : "Unlinked"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="mono text-[10px] text-zinc-500">{size}</span>
                      <div className="w-1 h-1 rounded-full bg-zinc-800" />
                      <span className="mono text-[10px] text-zinc-500">{year}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* Subtle glow on hover */}
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ) : (
              <div
                key={item.id}
                className="glass-panel p-4 rounded-2xl flex items-center justify-between border-white/5 hover:bg-white/[0.02] transition-all group cursor-pointer animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center border border-white/5`}>
                    <FileText className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100 group-hover:text-white">{item.fileName}</h4>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                      {size} • {year}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasLink ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item.id) }}
                    className="text-[10px] font-bold text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Upload Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-[60] flex items-center justify-center p-6" onClick={() => !uploading && setIsUploading(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Upload evidence"
            className="w-full max-w-xl bg-[var(--surface-modal)] rounded-2xl p-10 relative overflow-hidden text-center border border-[var(--border-subtle)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsUploading(false)}
              className="absolute top-8 right-8 p-2 text-zinc-500 hover:text-white transition-colors"
              aria-label="Close upload dialog"
            >
              <Plus className="w-6 h-6 rotate-45" />
            </button>
            <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Archive className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold mb-4 italic text-[var(--text-primary)]">Upload Evidence</h2>
            <p className="text-zinc-500 text-sm mb-10 max-w-sm mx-auto">
              Assets are automatically mapped to the National Framework via the Horus Engine.
            </p>

            <label className="border-2 border-dashed border-white/10 rounded-[32px] p-12 mb-8 hover:border-blue-500/30 hover:bg-white/[0.02] transition-all cursor-pointer group block">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
                disabled={uploading}
              />
              <div className="flex flex-col items-center gap-3">
                <Plus className="w-6 h-6 text-zinc-700 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
                  {uploading ? "Uploading..." : "Drag & drop or click to select files"}
                </span>
              </div>
            </label>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setIsUploading(false)}
                className="px-8 py-3 rounded-xl text-xs font-bold text-zinc-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
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
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Delete Evidence?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">This action cannot be undone. The file will be permanently removed.</p>
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
    </div>
  )
}

