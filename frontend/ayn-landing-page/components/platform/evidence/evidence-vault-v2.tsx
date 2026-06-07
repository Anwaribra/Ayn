"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import useSWR from "swr"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Upload,
  Trash2,
  FileText,
  File,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  X,
  DownloadCloud,
  RefreshCw,
  Eye,
  ChevronDown,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useUiLanguage } from "@/lib/ui-language-context"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface EvidenceRow {
  id: string
  title?: string | null
  originalFilename?: string | null
  fileName?: string | null
  status: string
  confidenceScore?: number | null
  createdAt: string
  updatedAt?: string
  fileSize?: number | null
  mimeType?: string | null
  fileUrl?: string | null
  criterionId?: string | null
  uploadedById?: string
  criteria?: { id: string; title: string; standardId: string; standardTitle: string }[]
}

interface QueuedFile {
  file: File
  id: string
  progress: number
  status: "queued" | "uploading" | "done" | "error"
  errorMsg?: string
}

type StatusFilter = "" | "uploaded" | "processing" | "analyzed" | "failed"
type TypeFilter = "" | "pdf" | "docx" | "image"
type InnerTab = "all" | "needs_review" | "failed"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes?: number | null): string {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function relativeDate(iso: string, isArabic: boolean): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (isArabic) {
    if (minutes < 1) return "للتو"
    if (minutes < 60) return `منذ ${minutes} دقيقة`
    if (hours < 24) return `منذ ${hours} ساعة`
    if (days === 1) return "أمس"
    if (days < 30) return `منذ ${days} أيام`
    return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })
  }
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return "yesterday"
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function getMimeCategory(mime?: string | null, filename?: string | null): TypeFilter | "" {
  const ext = (filename ?? "").split(".").pop()?.toLowerCase() ?? ""
  const m = (mime ?? "").toLowerCase()
  if (m.includes("pdf") || ext === "pdf") return "pdf"
  if (m.includes("wordprocessingml") || m.includes("msword") || ext === "docx" || ext === "doc") return "docx"
  if (m.includes("image") || ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image"
  return ""
}

function FileIcon({ mime, filename, className }: { mime?: string | null; filename?: string | null; className?: string }) {
  const category = getMimeCategory(mime, filename)
  if (category === "pdf")
    return (
      <div className={cn("flex items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400", className)}>
        <FileText className="h-4 w-4" />
      </div>
    )
  if (category === "docx")
    return (
      <div className={cn("flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400", className)}>
        <FileText className="h-4 w-4" />
      </div>
    )
  if (category === "image")
    return (
      <div className={cn("flex items-center justify-center rounded-lg bg-purple-500/10 text-purple-400", className)}>
        <File className="h-4 w-4" />
      </div>
    )
  return (
    <div className={cn("flex items-center justify-center rounded-lg bg-[var(--glass-soft-bg)] text-muted-foreground", className)}>
      <File className="h-4 w-4" />
    </div>
  )
}

interface StatusBadgeProps {
  status: string
  isArabic: boolean
}
function StatusBadge({ status, isArabic }: StatusBadgeProps) {
  const s = status.toLowerCase()
  const map: Record<string, { label: string; labelAr: string; cls: string; icon: React.ReactNode }> = {
    analyzed: {
      label: "Analyzed",
      labelAr: "محلّل",
      cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    linked: {
      label: "Linked",
      labelAr: "مرتبط",
      cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    processing: {
      label: "Processing",
      labelAr: "قيد المعالجة",
      cls: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      icon: <Clock className="h-3 w-3 animate-spin" style={{ animationDuration: "3s" }} />,
    },
    uploaded: {
      label: "Uploaded",
      labelAr: "مرفوع",
      cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      icon: <Clock className="h-3 w-3" />,
    },
    failed: {
      label: "Failed",
      labelAr: "فاشل",
      cls: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    needs_review: {
      label: "Needs Review",
      labelAr: "يحتاج مراجعة",
      cls: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    pending: {
      label: "Pending",
      labelAr: "قيد الانتظار",
      cls: "bg-[var(--glass-soft-bg)] text-muted-foreground border-[var(--glass-border)]",
      icon: <Clock className="h-3 w-3" />,
    },
  }
  const info = map[s] ?? {
    label: status,
    labelAr: status,
    cls: "bg-[var(--glass-soft-bg)] text-muted-foreground border-[var(--glass-border)]",
    icon: <Clock className="h-3 w-3" />,
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        info.cls,
      )}
    >
      {info.icon}
      {isArabic ? info.labelAr : info.label}
    </span>
  )
}

function ConfidenceBar({ score }: { score?: number | null }) {
  if (!score) return <span className="text-[11px] text-muted-foreground">—</span>
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-yellow-400" : "bg-red-400"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--glass-border)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
      <span className={cn("text-[11px] font-semibold tabular-nums", score >= 80 ? "text-emerald-600 dark:text-emerald-400" : score >= 60 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400")}>
        {score}%
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload Modal
// ─────────────────────────────────────────────────────────────────────────────

interface UploadModalProps {
  onClose: () => void
  onDone: () => void
  isArabic: boolean
}

function UploadModal({ onClose, onDone, isArabic }: UploadModalProps) {
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [isDragActive, setIsDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files)
    setQueue((prev) => [
      ...prev,
      ...arr.map((f) => ({
        file: f,
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        progress: 0,
        status: "queued" as const,
      })),
    ])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragActive(false)
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
    },
    [addFiles],
  )

  const handleUploadAll = async () => {
    if (isUploading || queue.length === 0) return
    setIsUploading(true)

    for (const item of queue) {
      if (item.status === "done") continue
      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "uploading", progress: 10 } : q)))
      try {
        try {
          await api.v2UploadEvidence(item.file)
        } catch {
          await api.uploadEvidence(item.file)
        }
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "done", progress: 100 } : q)))
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "error", progress: 0, errorMsg: err.message || "Upload failed" } : q,
          ),
        )
      }
    }

    setIsUploading(false)
    const allDone = queue.every((q) => q.status === "done" || queue.find((x) => x.id === q.id)?.status === "done")
    if (allDone) {
      toast.success(isArabic ? "تم رفع الملفات بنجاح" : "Files uploaded successfully", {
        description: isArabic ? "يقوم حورس بتحليل المستندات." : "Horus is analyzing your documents.",
      })
      onDone()
    }
  }

  const removeFile = (id: string) => setQueue((prev) => prev.filter((q) => q.id !== id))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-[var(--glass-border-subtle)] bg-[var(--surface-modal)] p-7 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-foreground">
              {isArabic ? "رفع الأدلة" : "Upload Evidence"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isArabic ? "اسحب وأفلت الملفات أو اختر يدويًا" : "Drag & drop files or select manually"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 transition-colors hover:bg-[var(--glass-soft-bg)]"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragActive(true) }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative mb-4 flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border border-dashed p-8 transition-all duration-200 ease-out",
            isDragActive
              ? "border-primary/60 bg-primary/10 shadow-md"
              : "border-[var(--glass-border-subtle)] bg-[var(--glass-soft-bg)] hover:border-primary/30 hover:bg-primary/5",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-[var(--glass-border-subtle)] bg-[var(--surface-modal)] shadow-sm">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              {isArabic ? "اسحب ملفاتك هنا" : "Drop your files here"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isArabic ? "PDF, DOCX, PNG, JPG — حد أقصى 50 ميجابايت لكل ملف" : "PDF, DOCX, PNG, JPG — max 50MB per file"}
            </p>
          </div>
        </div>

        {/* Queue */}
        {queue.length > 0 && (
          <div className="mb-4 max-h-48 space-y-2 overflow-y-auto">
            {queue.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-3 py-2"
              >
                <FileIcon filename={item.file.name} className="h-8 w-8 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{item.file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatBytes(item.file.size)}</p>
                  {item.status === "uploading" && (
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-[var(--glass-border)]">
                      <motion.div
                        initial={{ width: "10%" }}
                        animate={{ width: "90%" }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  )}
                  {item.status === "done" && (
                    <p className="mt-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {isArabic ? "✓ تم الرفع" : "✓ Uploaded"}
                    </p>
                  )}
                  {item.status === "error" && (
                    <p className="mt-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                      {item.errorMsg || (isArabic ? "فشل" : "Failed")}
                    </p>
                  )}
                </div>
                {item.status !== "uploading" && (
                  <button
                    onClick={() => removeFile(item.id)}
                    className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {item.status === "done" && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                )}
                {item.status === "error" && (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-3 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            {isArabic ? "إلغاء" : "Cancel"}
          </button>
          <button
            onClick={handleUploadAll}
            disabled={queue.length === 0 || isUploading}
            className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {isArabic ? "جارٍ الرفع…" : "Uploading…"}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {isArabic ? `رفع ${queue.length} ملف` : `Upload ${queue.length} file${queue.length !== 1 ? "s" : ""}`}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete Confirm Dialog
// ─────────────────────────────────────────────────────────────────────────────

interface DeleteConfirmProps {
  count: number
  onConfirm: () => void
  onCancel: () => void
  isArabic: boolean
}

function DeleteConfirm({ count, onConfirm, onCancel, isArabic }: DeleteConfirmProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[210] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-xl" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.95, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm overflow-hidden rounded-[24px] border border-[var(--glass-border)] bg-[var(--surface-modal)] p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10">
          <Trash2 className="h-5 w-5 text-destructive" />
        </div>
        <h3 className="text-lg font-black text-foreground">
          {isArabic ? "تأكيد الحذف" : "Confirm Delete"}
        </h3>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          {isArabic
            ? `هل أنت متأكد من حذف ${count} ${count === 1 ? "دليل" : "أدلة"}؟ لا يمكن التراجع عن هذا الإجراء.`
            : `Are you sure you want to delete ${count} ${count === 1 ? "item" : "items"}? This action cannot be undone.`}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-[var(--glass-border)] px-4 py-3 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            {isArabic ? "إلغاء" : "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            className="flex-[2] rounded-2xl bg-destructive px-4 py-3 text-sm font-bold text-destructive-foreground shadow-xl shadow-destructive/20 transition-colors hover:bg-destructive/90"
          >
            {isArabic ? "حذف" : "Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown Filter
// ─────────────────────────────────────────────────────────────────────────────

interface FilterDropdownProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (val: string) => void
}

function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer",
          value
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-[var(--glass-border)] bg-[var(--glass-soft-bg)] text-muted-foreground hover:border-primary/30 hover:text-foreground",
        )}
      >
        <Filter className="h-3 w-3" />
        {selected?.label ?? label}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute start-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--surface-modal)] shadow-2xl"
          >
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={cn(
                  "block w-full px-3 py-2 text-start text-xs font-medium transition-colors cursor-pointer",
                  value === o.value
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-[var(--glass-soft-bg)] hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function EvidenceVaultV2() {
  const { user } = useAuth()
  const { isArabic } = useUiLanguage()

  // ── SWR: try V2, fall back silently ──
  const [usingLegacy, setUsingLegacy] = useState(false)
  const {
    data: evidenceList,
    isLoading,
    error,
    mutate,
  } = useSWR<EvidenceRow[]>(
    user ? ["evidence-v2", user.id] : null,
    async () => {
      try {
        const result = await api.v2GetEvidence()
        setUsingLegacy(false)
        return result as EvidenceRow[]
      } catch {
        setUsingLegacy(true)
        return api.getEvidence() as Promise<EvidenceRow[]>
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 15000,
    },
  )

  // ── Local state ──
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter | "">("")
  const [innerTab, setInnerTab] = useState<InnerTab>("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string[] | null>(null)
  const [exportLoading, setExportLoading] = useState(false)

  // ── Filters & derived data ──
  const filtered = useMemo(() => {
    if (!evidenceList) return []
    return evidenceList.filter((item) => {
      const name = (item.title ?? item.originalFilename ?? item.fileName ?? "").toLowerCase()
      const matchSearch = !search || name.includes(search.toLowerCase())
      const matchStatus = !statusFilter || item.status === statusFilter
      const matchType = !typeFilter || getMimeCategory(item.mimeType, item.originalFilename ?? item.fileName) === typeFilter
      const matchTab =
        innerTab === "all" ||
        (innerTab === "failed" && item.status === "failed") ||
        (innerTab === "needs_review" &&
          (item.status === "needs_review" || ((item.confidenceScore ?? 100) < 70 && item.status === "analyzed")))
      return matchSearch && matchStatus && matchType && matchTab
    })
  }, [evidenceList, search, statusFilter, typeFilter, innerTab])

  const stats = useMemo(() => {
    const list = evidenceList ?? []
    return {
      total: list.length,
      analyzed: list.filter((i) => ["analyzed", "linked", "validated"].includes(i.status.toLowerCase())).length,
      needsReview: list.filter(
        (i) => i.status.toLowerCase() === "needs_review" || ((i.confidenceScore ?? 100) < 70 && ["analyzed", "linked", "validated"].includes(i.status.toLowerCase())),
      ).length,
      failed: list.filter((i) => i.status.toLowerCase() === "failed").length,
    }
  }, [evidenceList])

  // ── Selection helpers ──
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => (prev.length === filtered.length ? [] : filtered.map((f) => f.id)))
  }, [filtered])
  const clearSelection = useCallback(() => setSelectedIds([]), [])

  // ── Delete ──
  const confirmDelete = async (ids: string[]) => {
    try {
      for (const id of ids) {
        try {
          await api.v2DeleteEvidence(id)
        } catch {
          await api.deleteEvidence(id)
        }
      }
      toast.success(
        isArabic ? `تم حذف ${ids.length} دليل` : `Deleted ${ids.length} item${ids.length !== 1 ? "s" : ""}`,
      )
      clearSelection()
      mutate()
    } catch {
      toast.error(isArabic ? "فشل الحذف" : "Delete failed")
    } finally {
      setDeleteTarget(null)
    }
  }

  // ── Export CSV ──
  const handleExport = async () => {
    setExportLoading(true)
    try {
      await api.downloadEvidenceCSV()
      toast.success(isArabic ? "تم تصدير CSV" : "CSV exported")
    } catch {
      toast.error(isArabic ? "فشل التصدير" : "Export failed")
    } finally {
      setExportLoading(false)
    }
  }

  // ── Copy strings ──
  const t = {
    searchPlaceholder: isArabic ? "بحث في الأدلة…" : "Search evidence…",
    allStatus: isArabic ? "كل الحالات" : "All Statuses",
    uploaded: isArabic ? "مرفوع" : "Uploaded",
    processing: isArabic ? "قيد المعالجة" : "Processing",
    analyzed: isArabic ? "محلّل" : "Analyzed",
    failed: isArabic ? "فاشل" : "Failed",
    allTypes: isArabic ? "كل الأنواع" : "All Types",
    pdf: "PDF",
    docx: "DOCX",
    image: isArabic ? "صورة" : "Image",
    tabAll: isArabic ? "كل الأدلة" : "All Evidence",
    tabNeedsReview: isArabic ? "يحتاج مراجعة" : "Needs Review",
    tabFailed: isArabic ? "فاشل" : "Failed",
    colFile: isArabic ? "الملف والاسم" : "File & Title",
    colStatus: isArabic ? "حالة المعالجة" : "Processing Status",
    colConfidence: isArabic ? "نتيجة التحقق" : "Validation Result",
    colLinkedStandards: isArabic ? "المعايير المربوطة" : "Linked Standards",
    colDate: isArabic ? "تاريخ الرفع" : "Upload Date",
    colActions: isArabic ? "الإجراءات" : "Actions",
    noResults: isArabic ? "لا توجد أدلة تطابق البحث" : "No evidence matches your search",
    loading: isArabic ? "جارٍ التحميل…" : "Loading…",
    errorLoad: isArabic ? "فشل تحميل الأدلة" : "Failed to load evidence",
    retry: isArabic ? "إعادة المحاولة" : "Retry",
    legacyBadge: isArabic ? "بيانات إرثية" : "Using legacy data",
    selectedCount: (n: number) => isArabic ? `${n} محدد` : `${n} selected`,
    deleteSelected: isArabic ? "حذف المحدد" : "Delete selected",
    clearSelection: isArabic ? "مسح التحديد" : "Clear selection",
    total: isArabic ? "الإجمالي" : "Total",
    needsReview: isArabic ? "يحتاج مراجعة" : "Needs Review",
    view: isArabic ? "عرض" : "View",
    delete: isArabic ? "حذف" : "Delete",
  }

  const statusOptions = [
    { value: "", label: t.allStatus },
    { value: "uploaded", label: t.uploaded },
    { value: "processing", label: t.processing },
    { value: "analyzed", label: t.analyzed },
    { value: "failed", label: t.failed },
  ]
  const typeOptions = [
    { value: "", label: t.allTypes },
    { value: "pdf", label: t.pdf },
    { value: "docx", label: t.docx },
    { value: "image", label: t.image },
  ]
  const innerTabs: { key: InnerTab; label: string; count: number }[] = [
    { key: "all", label: t.tabAll, count: (evidenceList ?? []).length },
    { key: "needs_review", label: t.tabNeedsReview, count: stats.needsReview },
    { key: "failed", label: t.tabFailed, count: stats.failed },
  ]

  return (
    <div className="space-y-6">
      {/* ── Toolbar ── */}
      <div className="premium-surface flex flex-wrap items-center gap-2 p-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-10 w-full rounded-2xl border border-[var(--glass-border-subtle)] bg-white dark:bg-background/50 border-[var(--glass-border)] dark:border-[var(--glass-border-subtle)] ps-9 pe-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Filters */}
        <FilterDropdown
          label={t.allStatus}
          value={statusFilter}
          options={statusOptions}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
        />
        <FilterDropdown
          label={t.allTypes}
          value={typeFilter}
          options={typeOptions}
          onChange={(v) => setTypeFilter(v as TypeFilter | "")}
        />

            <div className="ms-auto flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={() => mutate()}
            title={isArabic ? "تحديث" : "Refresh"}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-soft-bg)] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex h-10 items-center gap-1.5 rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-soft-bg)] px-3 text-xs font-black text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 cursor-pointer"
          >
            {exportLoading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <DownloadCloud className="h-3.5 w-3.5" />
            )}
            CSV
          </button>

          {/* Upload (Primary Highlighted Action) */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex h-10 items-center gap-1.5 rounded-2xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 cursor-pointer border border-primary/20 relative overflow-hidden"
          >
            <Upload className="h-3.5 w-3.5" />
            {isArabic ? "رفع أدلة جديدة" : "Upload Evidence"}
          </button>
        </div>
      </div>

      {/* ── Stats chips ── */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: t.total, value: stats.total, cls: "text-foreground border-[var(--glass-border)]" },
          { label: t.analyzed, value: stats.analyzed, cls: "text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
          { label: t.needsReview, value: stats.needsReview, cls: "text-orange-600 dark:text-orange-400 border-orange-500/20 bg-orange-500/5" },
          { label: t.failed, value: stats.failed, cls: "text-red-600 dark:text-red-400 border-red-500/20 bg-red-500/5" },
        ].map((chip) => (
          <span
            key={chip.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              chip.cls,
            )}
          >
            <span className="text-[10px] font-bold opacity-60">{chip.label}</span>
            <span className="tabular-nums">{chip.value}</span>
          </span>
        ))}
        {usingLegacy && (
          <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/5 px-2.5 py-1 text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-3 w-3" />
            {t.legacyBadge}
          </span>
        )}
      </div>

      {/* ── Inner Tabs ── */}
      <div className="flex items-center gap-1 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-1 self-start w-fit">
        {innerTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setInnerTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-all cursor-pointer",
              innerTab === tab.key
                ? "bg-[var(--surface-modal)] text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-black tabular-nums",
                  innerTab === tab.key ? "bg-primary/15 text-primary" : "bg-[var(--glass-border)] text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Bulk Actions Bar ── */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3"
          >
            <span className="text-sm font-semibold text-primary">{t.selectedCount(selectedIds.length)}</span>
        <div className="ms-auto flex items-center gap-2">
              <button
                onClick={() => setDeleteTarget(selectedIds)}
                className="flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t.deleteSelected}
              </button>
              <button
                onClick={clearSelection}
                className="rounded-xl border border-[var(--glass-border)] px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                {t.clearSelection}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ── */}
      <div className="premium-surface overflow-x-auto">
        {/* Table header */}
        <div className="grid min-w-[980px] grid-cols-[auto_auto_1.8fr_1.2fr_1.2fr_1.8fr_1.2fr_auto] items-center gap-3 border-b border-[var(--glass-border-subtle)] bg-background/30 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          {/* Checkbox all */}
          <input
            type="checkbox"
            checked={filtered.length > 0 && selectedIds.length === filtered.length}
            onChange={toggleAll}
            className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
          />
          {/* Icon placeholder */}
          <span className="w-8" />
          <span>{t.colFile}</span>
          <span>{t.colStatus}</span>
          <span>{t.colConfidence}</span>
          <span>{t.colLinkedStandards}</span>
          <span>{t.colDate}</span>
          <span>{t.colActions}</span>
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="space-y-0 divide-y divide-[var(--glass-border)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[auto_auto_1.8fr_1.2fr_1.2fr_1.8fr_1.2fr_auto] items-center gap-3 px-4 py-3 animate-pulse"
              >
                <div className="h-3.5 w-3.5 rounded bg-[var(--glass-border)]" />
                <div className="h-8 w-8 rounded-lg bg-[var(--glass-border)]" />
                <div className="space-y-1.5">
                  <div className="h-3 w-40 rounded bg-[var(--glass-border)]" />
                  <div className="h-2.5 w-24 rounded bg-[var(--glass-border)]/60" />
                </div>
                <div className="h-5 w-20 rounded-full bg-[var(--glass-border)]" />
                <div className="h-3 w-16 rounded bg-[var(--glass-border)]" />
                <div className="h-3 w-16 rounded bg-[var(--glass-border)]" />
                <div className="h-3 w-12 rounded bg-[var(--glass-border)]" />
                <div className="h-7 w-16 rounded-lg bg-[var(--glass-border)]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="mb-3 h-8 w-8 text-destructive/60" />
            <p className="text-sm font-black text-muted-foreground">{t.errorLoad}</p>
            <button
              onClick={() => mutate()}
              className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t.retry}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-3 h-9 w-9 text-muted-foreground/30" />
            <p className="text-sm font-black text-muted-foreground">{t.noResults}</p>
            {(search || statusFilter || typeFilter || innerTab !== "all") && (
              <button
                onClick={() => { setSearch(""); setStatusFilter(""); setTypeFilter(""); setInnerTab("all") }}
                className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                {isArabic ? "مسح كل الفلاتر" : "Clear all filters"}
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--glass-border-subtle)]">
            <AnimatePresence initial={false}>
              {filtered.map((item, idx) => {
                const name = item.title ?? item.originalFilename ?? item.fileName ?? "—"
                const isSelected = selectedIds.includes(item.id)
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15, delay: idx * 0.015 }}
                    className={cn(
                      "group grid min-w-[980px] grid-cols-[auto_auto_1.8fr_1.2fr_1.2fr_1.8fr_1.2fr_auto] items-center gap-3 px-4 py-4 transition-all cursor-pointer border-s-2 border-s-transparent",
                      isSelected ? "bg-primary/5 border-s-primary/30" : "hover:bg-zinc-50 dark:hover:bg-white/[0.04] even:bg-zinc-50/30 dark:even:bg-white/[0.01] hover:border-s-primary/20",
                    )}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* File icon */}
                    <FileIcon mime={item.mimeType} filename={item.originalFilename ?? item.fileName} className="h-8 w-8" />

                    {/* Filename & size (technical size details are small and de-emphasized under title) */}
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-medium text-foreground"
                        title={name}
                      >
                        {name}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground/60" title={item.originalFilename ?? ""}>
                        {formatBytes((item as any).fileSize)}
                      </p>
                    </div>

                    {/* Status badge */}
                    <div>
                      <StatusBadge status={item.status} isArabic={isArabic} />
                    </div>

                    {/* Validation Result / Confidence */}
                    <div>
                      {["analyzed", "linked", "validated"].includes(item.status.toLowerCase()) ? (
                        <ConfidenceBar score={item.confidenceScore} />
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </div>

                    {/* Linked Standards (Major compliance highlight) */}
                    <div className="flex flex-wrap gap-1">
                      {item.criteria && item.criteria.length > 0 ? (
                        item.criteria.map((c, i) => (
                          <span
                            key={i}
                            title={c.title}
                            className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary max-w-[120px] truncate"
                          >
                            {c.standardTitle}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground/50">
                          {isArabic ? "غير مربوط" : "Not mapped"}
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {relativeDate(item.createdAt, isArabic)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.fileUrl && item.fileUrl !== "#" && item.fileUrl !== "private" && (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t.view}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => setDeleteTarget([item.id])}
                        title={t.delete}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive transition-colors hover:bg-destructive/15 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Row count footer */}
      {!isLoading && !error && filtered.length > 0 && (
        <p className="text-end text-[11px] text-muted-foreground">
          {isArabic
            ? `عرض ${filtered.length} من ${(evidenceList ?? []).length} دليل`
            : `Showing ${filtered.length} of ${(evidenceList ?? []).length} items`}
        </p>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {isUploadOpen && (
          <UploadModal
            isArabic={isArabic}
            onClose={() => setIsUploadOpen(false)}
            onDone={() => { setIsUploadOpen(false); mutate() }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirm
            count={deleteTarget.length}
            isArabic={isArabic}
            onConfirm={() => confirmDelete(deleteTarget)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
