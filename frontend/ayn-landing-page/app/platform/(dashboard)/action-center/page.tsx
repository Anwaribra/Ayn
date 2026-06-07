"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import useSWR from "swr"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  CheckSquare,
  AlertTriangle,
  FileX,
  Eye,
  Clock,
  Plus,
  ChevronDown,
  ChevronRight,
  Calendar,
  Flag,
  Tag,
  X,
  Filter,
  Loader2,
  TriangleAlert,
  ListTodo,
  ShieldAlert,
} from "lucide-react"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { GlassCard } from "@/components/ui/glass-card"
import { InlineEmptyState } from "@/components/platform/empty-state"
import { usePageTitle } from "@/hooks/use-page-title"
import { useUiLanguage } from "@/lib/ui-language-context"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskStatus = "open" | "in_progress" | "blocked" | "done" | "archived"
type TaskPriority = "critical" | "high" | "medium" | "low"
type FilterTab = "all" | "my_tasks" | "open_risks" | "missing_evidence" | "needs_review"

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  due_date?: string
  dueDate?: string
  assigned_to?: string
  reference_type?: string
  source?: "v2" | "legacy"
  createdAt?: string
  created_at?: string
}

interface ActionCenterSummary {
  open_tasks: number
  overdue_tasks: number
  open_risks: number
  critical_risks: number
  missing_evidence: number
  needs_review: number
  expiring_soon: number
  overall_readiness: number
}

interface CreateTaskForm {
  title: string
  description: string
  priority: TaskPriority
  due_date: string
  reference_type: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEffectiveDueDate(task: Task): string | undefined {
  return task.due_date ?? task.dueDate
}

function isOverdue(task: Task): boolean {
  const due = getEffectiveDueDate(task)
  if (!due) return false
  return new Date(due) < new Date() && task.status !== "done" && task.status !== "archived"
}

function formatDueDate(dateStr?: string, isArabic = false): string {
  if (!dateStr) return isArabic ? "لا يوجد" : "No date"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return isArabic ? "لا يوجد" : "No date"
  return date.toLocaleDateString(isArabic ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// ─── Badge Config ─────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  open: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  in_progress: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  blocked: "bg-red-500/15 text-red-400 border-red-500/30",
  done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  archived: "bg-slate-500/15 text-slate-400 border-slate-500/30",
}

const PRIORITY_LABELS_EN: Record<TaskPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
}
const PRIORITY_LABELS_AR: Record<TaskPriority, string> = {
  critical: "حرج",
  high: "عالية",
  medium: "متوسطة",
  low: "منخفضة",
}

const STATUS_LABELS_EN: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
  archived: "Archived",
}
const STATUS_LABELS_AR: Record<TaskStatus, string> = {
  open: "مفتوح",
  in_progress: "قيد التنفيذ",
  blocked: "محجوب",
  done: "مكتمل",
  archived: "مؤرشف",
}

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
}

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  count,
  accentClass,
  onClick,
  isActive,
}: {
  icon: React.ElementType
  label: string
  count: number
  accentClass: string
  onClick: () => void
  isActive: boolean
}) {
  return (
    <motion.div variants={cardVariants}>
      <GlassCard
        className={cn(
          "cursor-pointer p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
          isActive && "ring-1 ring-white/20"
        )}
        hoverEffect
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", accentClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <span
            className={cn(
              "text-2xl font-black tabular-nums",
              count === 0 ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {count}
          </span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      </GlassCard>
    </motion.div>
  )
}

function PriorityBadge({ priority, isArabic }: { priority: TaskPriority; isArabic: boolean }) {
  const labels = isArabic ? PRIORITY_LABELS_AR : PRIORITY_LABELS_EN
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border",
        PRIORITY_STYLES[priority]
      )}
    >
      <Flag className="w-2.5 h-2.5" />
      {labels[priority]}
    </span>
  )
}

function StatusDropdown({
  task,
  onStatusChange,
  isArabic,
}: {
  task: Task
  onStatusChange: (taskId: string, status: TaskStatus, source: "v2" | "legacy") => Promise<void>
  isArabic: boolean
}) {
  const [open, setOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const labels = isArabic ? STATUS_LABELS_AR : STATUS_LABELS_EN

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const statuses: TaskStatus[] = ["open", "in_progress", "blocked", "done"]

  async function handleSelect(status: TaskStatus) {
    if (status === task.status) { setOpen(false); return }
    setUpdating(true)
    setOpen(false)
    try {
      await onStatusChange(task.id, status, task.source ?? "v2")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        disabled={updating}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all hover:opacity-80 cursor-pointer",
          STATUS_STYLES[task.status]
        )}
      >
        {updating ? (
          <Loader2 className="w-2.5 h-2.5 animate-spin" />
        ) : (
          <ChevronDown className="w-2.5 h-2.5" />
        )}
        {labels[task.status]}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full mt-1 end-0 min-w-[140px] rounded-xl border border-[var(--glass-border)] bg-[var(--surface-modal)] shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            {statuses.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSelect(s)}
                className={cn(
                  "w-full text-start px-3 py-2 text-xs font-medium hover:bg-white/5 transition-colors flex items-center gap-2",
                  s === task.status && "opacity-50 cursor-default"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", {
                  "bg-blue-400": s === "open",
                  "bg-purple-400": s === "in_progress",
                  "bg-red-400": s === "blocked",
                  "bg-emerald-400": s === "done",
                })} />
                {labels[s]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TaskRow({
  task,
  onStatusChange,
  isArabic,
}: {
  task: Task
  onStatusChange: (taskId: string, status: TaskStatus, source: "v2" | "legacy") => Promise<void>
  isArabic: boolean
}) {
  const overdue = isOverdue(task)
  const dueDate = getEffectiveDueDate(task)

  return (
    <motion.div
      variants={listItemVariants}
      className={cn(
        "group flex items-center gap-3 px-4 py-3.5 rounded-xl border border-transparent transition-all duration-200",
        "hover:bg-white/[0.03] hover:border-[var(--border-subtle)]",
        overdue && "border-s-2 border-s-red-500/50 rounded-s-none ps-3"
      )}
    >
      {/* Priority accent dot */}
      <span className={cn(
        "w-2 h-2 rounded-full shrink-0",
        task.priority === "critical" && "bg-red-400",
        task.priority === "high" && "bg-orange-400",
        task.priority === "medium" && "bg-amber-400",
        task.priority === "low" && "bg-slate-400",
      )} />

      {/* Title & meta */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium text-foreground truncate",
          task.status === "done" && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.reference_type && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wider">
              <Tag className="w-2.5 h-2.5" />
              {task.reference_type}
            </span>
          )}
          {task.source === "legacy" && (
            <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">
              {isArabic ? "قديم" : "legacy"}
            </span>
          )}
        </div>
      </div>

      {/* Priority */}
      <div className="hidden sm:block shrink-0">
        <PriorityBadge priority={task.priority} isArabic={isArabic} />
      </div>

      {/* Status (clickable dropdown) */}
      <div className="shrink-0">
        <StatusDropdown task={task} onStatusChange={onStatusChange} isArabic={isArabic} />
      </div>

      {/* Due date */}
      <div className={cn(
        "hidden md:flex items-center gap-1 text-xs shrink-0 min-w-[90px] justify-end",
        overdue ? "text-red-400 font-semibold" : "text-muted-foreground"
      )}>
        <Calendar className="w-3 h-3" />
        {formatDueDate(dueDate, isArabic)}
        {overdue && (
          <span className="ms-0.5 text-xs font-bold uppercase text-red-400">
            {isArabic ? "متأخر" : "overdue"}
          </span>
        )}
      </div>
    </motion.div>
  )
}

function CreateTaskDialog({
  open,
  onClose,
  onCreated,
  isArabic,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  isArabic: boolean
}) {
  const [form, setForm] = useState<CreateTaskForm>({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    reference_type: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => titleRef.current?.focus(), 80)
      setForm({ title: "", description: "", priority: "medium", due_date: "", reference_type: "" })
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error(isArabic ? "العنوان مطلوب" : "Title is required")
      return
    }
    setSubmitting(true)
    try {
      await api.v2CreateTask({
        title: form.title.trim(),
        description: form.description || undefined,
        priority: form.priority,
        due_date: form.due_date || undefined,
        reference_type: form.reference_type || undefined,
      })
      toast.success(isArabic ? "تم إنشاء المهمة" : "Task created")
      onCreated()
      onClose()
    } catch (err: any) {
      toast.error(err?.message ?? (isArabic ? "فشل الإنشاء" : "Failed to create task"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-lg rounded-[24px] border border-[var(--glass-border)] bg-[var(--surface-modal)] shadow-2xl backdrop-blur-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">
                    {isArabic ? "إنشاء مهمة جديدة" : "Create New Task"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                    {isArabic ? "العنوان *" : "Title *"}
                  </label>
                  <input
                    ref={titleRef}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder={isArabic ? "عنوان المهمة..." : "Task title..."}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.04] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                    {isArabic ? "الوصف" : "Description"}
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder={isArabic ? "وصف اختياري..." : "Optional description..."}
                    rows={3}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.04] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                  />
                </div>

                {/* Priority & Due Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                      {isArabic ? "الأولوية" : "Priority"}
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.04] px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="critical">{isArabic ? "حرج" : "Critical"}</option>
                      <option value="high">{isArabic ? "عالية" : "High"}</option>
                      <option value="medium">{isArabic ? "متوسطة" : "Medium"}</option>
                      <option value="low">{isArabic ? "منخفضة" : "Low"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                      {isArabic ? "تاريخ الاستحقاق" : "Due Date"}
                    </label>
                    <input
                      type="date"
                      value={form.due_date}
                      onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.04] px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                {/* Reference Type */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                    {isArabic ? "نوع المرجع" : "Reference Type"}
                  </label>
                  <select
                    value={form.reference_type}
                    onChange={(e) => setForm((f) => ({ ...f, reference_type: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.04] px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">{isArabic ? "بدون مرجع" : "No reference"}</option>
                    <option value="risk">{isArabic ? "مخاطرة" : "Risk"}</option>
                    <option value="evidence">{isArabic ? "دليل" : "Evidence"}</option>
                    <option value="gap">{isArabic ? "فجوة" : "Gap"}</option>
                    <option value="standard">{isArabic ? "معيار" : "Standard"}</option>
                    <option value="criterion">{isArabic ? "معيار فرعي" : "Criterion"}</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-white/5"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold transition-all hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    {isArabic ? "إنشاء" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Main page content ────────────────────────────────────────────────────────

function ActionCenterContent() {
  const { isArabic } = useUiLanguage()
  usePageTitle(isArabic ? "مركز الإجراءات" : "Action Center")

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [usingLegacy, setUsingLegacy] = useState(false)

  // ── Data fetching: summary ───────────────────────────────────────────────
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
    mutate: mutateSummary,
  } = useSWR<ActionCenterSummary>(
    "action-center-summary",
    async () => {
      try {
        const result = await api.v2GetActionCenterSummary()
        setUsingLegacy(false)
        return result
      } catch {
        // Fallback to legacy command center
        const legacy = await api.getCommandCenter()
        setUsingLegacy(true)
        return {
          open_tasks: legacy.overdueTasksCount ?? 0,
          overdue_tasks: legacy.overdueTasksCount ?? 0,
          open_risks: legacy.openGapsCount ?? 0,
          critical_risks: 0,
          missing_evidence: legacy.staleEvidenceCount ?? 0,
          needs_review: legacy.pendingReviewsCount ?? 0,
          expiring_soon: 0,
          overall_readiness: legacy.auditReadinessScore ?? 0,
        } satisfies ActionCenterSummary
      }
    },
    {
      refreshInterval: 120_000,
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  )

  // ── Data fetching: v2 tasks ──────────────────────────────────────────────
  const {
    data: v2Tasks,
    isLoading: v2Loading,
    mutate: mutateV2Tasks,
  } = useSWR<any[]>(
    "v2-tasks",
    () => api.v2GetTasks({ limit: 100 }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
      onError: () => { /* silently handled */ },
    }
  )

  // ── Data fetching: legacy action plan tasks ──────────────────────────────
  const {
    data: legacyTasks,
    isLoading: legacyLoading,
    mutate: mutateLegacyTasks,
  } = useSWR<any[]>(
    "legacy-action-plan-tasks",
    () => api.getActionPlanTasks(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
      onError: () => { /* silently handled */ },
    }
  )

  // Normalise tasks into a unified shape
  const allTasks: Task[] = (() => {
    const v2 = Array.isArray(v2Tasks)
      ? v2Tasks.map((t) => ({ ...t, source: "v2" as const }))
      : []

    // Avoid duplicates: only add legacy tasks not already in v2
    const v2Ids = new Set(v2.map((t) => t.id))
    const legacy = Array.isArray(legacyTasks)
      ? legacyTasks
          .filter((t) => !v2Ids.has(t.id))
          .map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: (t.status === "todo" ? "open" : t.status) as TaskStatus,
            priority: (t.priority ?? "medium") as TaskPriority,
            dueDate: t.dueDate,
            source: "legacy" as const,
            reference_type: t.criterionId ? "criterion" : t.gapId ? "gap" : undefined,
            createdAt: t.createdAt,
          }))
      : []

    return [...v2, ...legacy]
  })()

  const tasksLoading = v2Loading || legacyLoading

  // ── Filtered tasks ────────────────────────────────────────────────────────
  const filteredTasks = allTasks.filter((t) => {
    if (t.status === "archived") return false
    switch (activeFilter) {
      case "my_tasks":
        return t.status !== "done"
      case "open_risks":
        return t.reference_type === "risk" || t.reference_type === "gap"
      case "missing_evidence":
        return t.reference_type === "evidence"
      case "needs_review":
        return t.status === "blocked" || t.status === "open"
      default:
        return true
    }
  })

  // ── Status update handler ─────────────────────────────────────────────────
  const handleStatusChange = useCallback(
    async (taskId: string, status: TaskStatus, source: "v2" | "legacy") => {
      try {
        if (source === "v2") {
          await api.v2UpdateTask(taskId, { status })
        } else {
          const legacyStatus = status === "open" ? "todo" : status as any
          await api.updateActionPlanTask(taskId, { status: legacyStatus })
        }
        // Optimistic mutate
        await Promise.all([mutateV2Tasks(), mutateLegacyTasks(), mutateSummary()])
        toast.success(isArabic ? "تم تحديث الحالة" : "Status updated")
      } catch (err: any) {
        toast.error(err?.message ?? (isArabic ? "فشل التحديث" : "Failed to update"))
      }
    },
    [mutateV2Tasks, mutateLegacyTasks, mutateSummary, isArabic]
  )

  // ── After create: mutate all ──────────────────────────────────────────────
  const handleCreated = useCallback(() => {
    mutateV2Tasks()
    mutateSummary()
  }, [mutateV2Tasks, mutateSummary])

  // ── Summary numbers ───────────────────────────────────────────────────────
  const summary: ActionCenterSummary = summaryData ?? {
    open_tasks: 0,
    overdue_tasks: 0,
    open_risks: 0,
    critical_risks: 0,
    missing_evidence: 0,
    needs_review: 0,
    expiring_soon: 0,
    overall_readiness: 0,
  }

  // ── Filter tabs ───────────────────────────────────────────────────────────
  const tabs: { id: FilterTab; labelEn: string; labelAr: string }[] = [
    { id: "all", labelEn: "All", labelAr: "الكل" },
    { id: "my_tasks", labelEn: "My Tasks", labelAr: "مهامي" },
    { id: "open_risks", labelEn: "Open Risks", labelAr: "المخاطر المفتوحة" },
    { id: "missing_evidence", labelEn: "Missing Evidence", labelAr: "أدلة مفقودة" },
    { id: "needs_review", labelEn: "Needs Review", labelAr: "يحتاج مراجعة" },
  ]

  const statCards = [
    {
      icon: ListTodo,
      labelEn: "My Open Tasks",
      labelAr: "مهامي المفتوحة",
      count: summary.open_tasks,
      accentClass: "bg-blue-500/10 border-blue-500/30 text-blue-400",
      filter: "my_tasks" as FilterTab,
    },
    {
      icon: ShieldAlert,
      labelEn: "Open Risks",
      labelAr: "مخاطر مفتوحة",
      count: summary.open_risks,
      accentClass: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      filter: "open_risks" as FilterTab,
    },
    {
      icon: FileX,
      labelEn: "Missing Evidence",
      labelAr: "أدلة مفقودة",
      count: summary.missing_evidence,
      accentClass: "bg-red-500/10 border-red-500/30 text-red-400",
      filter: "missing_evidence" as FilterTab,
    },
    {
      icon: Eye,
      labelEn: "Needs Review",
      labelAr: "يحتاج مراجعة",
      count: summary.needs_review,
      accentClass: "bg-purple-500/10 border-purple-500/30 text-purple-400",
      filter: "needs_review" as FilterTab,
    },
    {
      icon: Clock,
      labelEn: "Expiring Soon",
      labelAr: "ينتهي قريباً",
      count: summary.expiring_soon,
      accentClass: "bg-orange-500/10 border-orange-500/30 text-orange-400",
      filter: "all" as FilterTab,
    },
  ]

  return (
    <div className={cn("mx-auto platform-container-wide space-y-6 pb-20 animate-fade-in-up", isArabic && "font-arabic")}>
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {isArabic ? "مركز الإجراءات" : "Action Center"}
            </h1>
            {usingLegacy && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-400">
                <TriangleAlert className="w-2.5 h-2.5" />
                {isArabic ? "بيانات قديمة" : "Using legacy data"}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isArabic
              ? "تتبع المهام والمخاطر والأدلة المطلوبة والعناصر التي تحتاج مراجعة."
              : "Track tasks, risks, missing evidence, and items that need your attention."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold transition-all hover:bg-primary/90 hover:-translate-y-0.5 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          {isArabic ? "مهمة جديدة" : "New Task"}
        </button>
      </div>

      {/* ── Summary stat cards ─────────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
      >
        {statCards.map((card) => (
          <StatCard
            key={card.filter + card.labelEn}
            icon={card.icon}
            label={isArabic ? card.labelAr : card.labelEn}
            count={summaryLoading ? 0 : card.count}
            accentClass={card.accentClass}
            onClick={() => setActiveFilter(card.filter)}
            isActive={activeFilter === card.filter}
          />
        ))}
      </motion.div>

      {/* ── Summary error / loading state ─────────────────────────────── */}
      {summaryError && !usingLegacy && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {isArabic
            ? "تعذر تحميل ملخص مركز الإجراءات."
            : "Could not load action center summary."}
        </div>
      )}

      {/* ── Readiness meter ───────────────────────────────────────────── */}
      <GlassCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {isArabic ? "مؤشر الجاهزية الكلي" : "Overall Readiness"}
          </span>
          <span className={cn(
            "text-sm font-black tabular-nums",
            summary.overall_readiness >= 80 ? "text-emerald-400" :
            summary.overall_readiness >= 60 ? "text-amber-400" : "text-red-400"
          )}>
            {Math.round(summary.overall_readiness)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              summary.overall_readiness >= 80 ? "bg-emerald-500" :
              summary.overall_readiness >= 60 ? "bg-amber-500" : "bg-red-500"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, summary.overall_readiness)}%` }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
          />
        </div>
      </GlassCard>

      {/* ── Filter tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] w-full overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              "flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap",
              activeFilter === tab.id
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            {isArabic ? tab.labelAr : tab.labelEn}
          </button>
        ))}

        <div className="ms-auto flex items-center gap-1 ps-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {filteredTasks.length} {isArabic ? "عنصر" : "items"}
          </span>
        </div>
      </div>

      {/* ── Task list ─────────────────────────────────────────────────── */}
      <GlassCard className="p-0 overflow-hidden">
        {/* Table header */}
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex-1">
            {isArabic ? "العنوان" : "Title"}
          </span>
          <span className="hidden sm:block text-xs font-bold uppercase tracking-widest text-muted-foreground w-20 text-center">
            {isArabic ? "الأولوية" : "Priority"}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground w-24 text-center">
            {isArabic ? "الحالة" : "Status"}
          </span>
          <span className="hidden md:block text-xs font-bold uppercase tracking-widest text-muted-foreground w-24 text-end">
            {isArabic ? "الاستحقاق" : "Due Date"}
          </span>
        </div>

        {/* Loading skeleton */}
        {tasksLoading && (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-0 py-2 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-white/10 shrink-0" />
                <div className="flex-1 h-4 rounded bg-white/10" />
                <div className="w-16 h-5 rounded-full bg-white/10 hidden sm:block" />
                <div className="w-20 h-5 rounded-full bg-white/10" />
                <div className="w-20 h-4 rounded bg-white/10 hidden md:block" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!tasksLoading && filteredTasks.length === 0 && (
          <div className="p-8">
            <InlineEmptyState
              icon={CheckSquare}
              title={isArabic ? "لا توجد مهام" : "No tasks found"}
              description={
                isArabic
                  ? "لا توجد مهام تطابق هذا الفلتر. أنشئ مهمة جديدة للبدء."
                  : "No tasks match this filter. Create a new task to get started."
              }
              action={
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all hover:bg-primary/90"
                >
                  <Plus className="w-3 h-3" />
                  {isArabic ? "إنشاء مهمة" : "Create Task"}
                </button>
              }
            />
          </div>
        )}

        {/* Task rows */}
        {!tasksLoading && filteredTasks.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="px-2 py-2 space-y-0.5"
          >
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  isArabic={isArabic}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </GlassCard>

      {/* ── Overdue callout ───────────────────────────────────────────── */}
      {!tasksLoading && summary.overdue_tasks > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-sm text-red-400"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {isArabic
              ? `لديك ${summary.overdue_tasks} مهمة متأخرة تحتاج اهتمامك.`
              : `You have ${summary.overdue_tasks} overdue task${summary.overdue_tasks !== 1 ? "s" : ""} that need attention.`}
          </span>
          <button
            type="button"
            className="ms-auto text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
            onClick={() => {
              setActiveFilter("my_tasks")
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
          >
            {isArabic ? "عرض" : "View"}
            <ChevronRight className="w-3 h-3" />
          </button>
        </motion.div>
      )}

      {/* ── Create task dialog ────────────────────────────────────────── */}
      <CreateTaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
        isArabic={isArabic}
      />
    </div>
  )
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function ActionCenterPage() {
  return (
    <ProtectedRoute>
      <ActionCenterContent />
    </ProtectedRoute>
  )
}
