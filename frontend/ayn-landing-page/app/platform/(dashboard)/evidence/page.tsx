"use client"

import { useState, useCallback, useRef } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import {
  Upload,
  FileText,
  Image as ImageIcon,
  File,
  Grid3x3,
  List,
  Search,
  Brain,
  Trash2,
  ArrowRight,
  Link2,
  Filter,
  Eye,
  Download,
} from "lucide-react"
import { toast } from "sonner"
import type { Evidence } from "@/types"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFileIcon(evidence: Evidence) {
  const type = evidence.fileType ?? evidence.fileName ?? ""
  if (type.includes("image") || type.match(/\.(png|jpg|jpeg|gif|webp|svg)/i))
    return <ImageIcon className="w-4 h-4 text-violet-400" />
  if (type.includes("pdf") || type.match(/\.pdf/i))
    return <FileText className="w-4 h-4 text-red-400" />
  return <File className="w-4 h-4 text-zinc-500" />
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EvidencePage() {
  return (
    <ProtectedRoute>
      <EvidenceContent />
    </ProtectedRoute>
  )
}

function EvidenceContent() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: evidence, isLoading, mutate } = useSWR<Evidence[]>(
    user ? "evidence" : null,
    () => api.getEvidence(),
  )

  // ── Upload handler ────────────────────────────────────────────────
  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      try {
        for (const file of Array.from(files)) {
          await api.uploadEvidence(file)
        }
        toast.success(`${files.length} file(s) uploaded`)
        mutate()
      } catch {
        toast.error("Upload failed")
      }
    },
    [mutate],
  )

  const handleDeleteEvidence = async (id: string) => {
    if (!confirm("Delete this evidence?")) return
    try {
      await api.deleteEvidence(id)
      toast.success("Evidence deleted")
      mutate()
    } catch {
      toast.error("Delete failed")
    }
  }

  // ── Drag & drop ───────────────────────────────────────────────────
  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
      else if (e.type === "dragleave") setDragActive(false)
    },
    [],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      handleUpload(e.dataTransfer.files)
    },
    [handleUpload],
  )

  // ── Filter ────────────────────────────────────────────────────────
  const filtered = (evidence ?? []).filter((e) => {
    const term = search.toLowerCase()
    return (
      !term ||
      e.fileName?.toLowerCase().includes(term) ||
      e.criterion?.title.toLowerCase().includes(term) ||
      e.fileType?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="animate-fade-in-up p-4 md:p-6 pb-20 max-w-[1440px] mx-auto">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">
              <span className="text-[9px] font-bold text-violet-400 uppercase tracking-[0.2em]">
                Asset Vault
              </span>
            </div>
            <div className="h-px w-6 bg-zinc-800" />
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
              Compliance Evidence Hub
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic text-white">
            EVIDENCE <span className="text-zinc-700 not-italic font-light">LIBRARY</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex glass-panel rounded-xl overflow-hidden border-white/5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 transition-all ${viewMode === "grid"
                  ? "bg-blue-600/10 text-blue-400"
                  : "text-zinc-600 hover:text-white"
                }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 transition-all ${viewMode === "list"
                  ? "bg-blue-600/10 text-blue-400"
                  : "text-zinc-600 hover:text-white"
                }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-600/10 active:scale-95 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Evidence
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
          />
        </div>
      </header>

      {/* ── Search bar ────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search evidence by name, type, or criterion..."
            className="w-full h-11 bg-white/[0.02] border border-white/[0.06] rounded-xl pl-11 pr-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/30 transition-all"
          />
        </div>
      </div>

      {/* ── Drop zone ─────────────────────────────────────────────── */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`mb-8 glass-panel rounded-[32px] p-10 border-dashed border-2 transition-all text-center ${dragActive
            ? "border-blue-500/40 bg-blue-600/5"
            : "border-white/[0.08] hover:border-white/10"
          }`}
      >
        <Upload className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
        <p className="text-sm text-zinc-500 font-medium">
          Drop files here or{" "}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            browse
          </button>
        </p>
        <p className="text-[10px] text-zinc-700 mt-1 uppercase tracking-widest font-bold">
          PDF, DOCX, Images supported
        </p>
      </div>

      {/* ── Asset stats ───────────────────────────────────────────── */}
      <div className="flex items-center gap-6 mb-8 px-2">
        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
          {filtered.length} {filtered.length === 1 ? "asset" : "assets"}
        </span>
        <div className="h-px flex-1 bg-zinc-900" />
        <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">
          {evidence?.filter((e) => e.criterion).length ?? 0} linked to criteria
        </span>
      </div>

      {/* ── Evidence grid / list ──────────────────────────────────── */}
      {isLoading ? (
        <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl p-6 border-white/5 animate-pulse">
              <div className="h-4 w-2/3 bg-white/[0.04] rounded mb-3" />
              <div className="h-3 w-1/2 bg-white/[0.03] rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-[40px] p-16 border-white/5 text-center">
          <File className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-400 mb-2">No evidence found</h3>
          <p className="text-[11px] text-zinc-600 font-medium">
            {search ? "Try a different search term" : "Upload your first evidence file to get started"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group glass-panel platform-card rounded-2xl p-5 border-white/5 hover:shadow-xl cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  {getFileIcon(item)}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-blue-400 hover:bg-white/5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteEvidence(item.id)}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="text-[13px] font-bold text-zinc-200 truncate group-hover:text-white transition-colors">
                {item.fileName ?? "Unnamed File"}
              </h4>
              <p className="text-[10px] text-zinc-600 mt-1 font-bold uppercase tracking-widest">
                {formatDate(item.createdAt)}
              </p>

              {item.criterion && (
                <div className="mt-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 w-fit">
                  <Link2 className="w-2.5 h-2.5 text-emerald-500" />
                  <span className="text-[9px] font-bold text-emerald-500 truncate max-w-[120px]">
                    {item.criterion.title}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* list view */
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group glass-panel rounded-xl px-5 py-3 border-white/5 flex items-center justify-between hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                {getFileIcon(item)}
                <div className="min-w-0">
                  <h4 className="text-[13px] font-bold text-zinc-200 truncate group-hover:text-white transition-colors">
                    {item.fileName ?? "Unnamed File"}
                  </h4>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                    {formatDate(item.createdAt)}
                    {item.criterion && (
                      <> · <span className="text-emerald-500">{item.criterion.title}</span></>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.fileUrl && (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-zinc-600 hover:text-blue-400 hover:bg-white/5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => handleDeleteEvidence(item.id)}
                  className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
