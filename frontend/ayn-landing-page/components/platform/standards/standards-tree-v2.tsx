"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Plus,
  X,
  Sparkles,
  Target,
  BookOpen,
  Layers,
  Link2,
  ClipboardList,
  Loader2,
  ExternalLink,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import useSWR from "swr"
import { toast } from "sonner"
import { useUiLanguage } from "@/lib/ui-language-context"

// ─── Types ────────────────────────────────────────────────────────────────────

interface LinkedEvidence {
  id: string
  filename: string
  status: string
  validation_status: string
  confidence: number
  decision: string
  explainability_metadata?: any
}

interface Requirement {
  id: string
  title: string
  description?: string
  weight?: number
  rule_definition?: any
  status: string // "COVERED", "PARTIALLY_COVERED", "NOT_ASSESSED" etc.
  score: number
  linked_evidence?: LinkedEvidence[]
  gaps?: string[]
}

interface Criterion {
  id: string
  title: string
  description?: string
  weight?: number
  score: number
  requirements: Requirement[]
}

interface StandardTreeData {
  id: string
  title: string
  code?: string
  description?: string
  weight?: number
  readiness_score: number
  criteria: Criterion[]
}

// ─── Coverage Badge ────────────────────────────────────────────────────────────

function CoveragePill({ pct }: { pct?: number }) {
  if (pct === undefined || pct === null) return null
  const color =
    pct >= 80
      ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20 border"
      : pct >= 40
        ? "text-amber-400 bg-amber-400/10 border-amber-400/20 border"
        : "text-red-400 bg-red-400/10 border-red-400/20 border"
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums", color)}>
      {Math.round(pct)}%
    </span>
  )
}

function StatusIcon({ status }: { status?: string }) {
  const normalized = (status ?? "").toUpperCase()
  if (normalized === "COVERED" || normalized === "FULLY_COVERED" || normalized === "covered")
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
  if (normalized === "PARTIALLY_COVERED" || normalized === "partial")
    return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
  return <XCircle className="h-4 w-4 shrink-0 text-red-400" />
}

// ─── Requirement Drawer ────────────────────────────────────────────────────────

function RequirementDrawer({
  requirement,
  standardId,
  onClose,
  isArabic,
}: {
  requirement: Requirement
  standardId: string
  onClose: () => void
  isArabic: boolean
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "evidence" | "task">("overview")
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium" as string })
  const [submitting, setSubmitting] = useState(false)

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error(isArabic ? "العنوان مطلوب" : "Title is required")
      return
    }
    setSubmitting(true)
    try {
      await api.v2CreateTask({
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority as any,
        reference_type: "requirement",
        reference_id: requirement.id,
      })
      toast.success(isArabic ? "تم إنشاء المهمة" : "Task created successfully")
      setTaskForm({ title: "", description: "", priority: "medium" })
      setActiveTab("overview")
    } catch {
      toast.error(isArabic ? "فشل إنشاء المهمة" : "Failed to create task")
    } finally {
      setSubmitting(false)
    }
  }

  const normalizedStatus = requirement.status.toUpperCase()
  const scorePct = Math.round(requirement.score * 100)

  return (
    <motion.div
      key="drawer"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="fixed end-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-hidden border-s border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] shadow-xl backdrop-blur-2xl"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon status={requirement.status} />
            <span className={cn(
              "text-[9px] font-bold px-2 py-0.5 rounded border uppercase",
              normalizedStatus === "COVERED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
              normalizedStatus === "PARTIALLY_COVERED" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
              "bg-red-500/10 text-red-400 border-red-500/20"
            )}>
              {isArabic 
                ? (normalizedStatus === "COVERED" ? "مكتمل" : normalizedStatus === "PARTIALLY_COVERED" ? "جزئي" : "مفقود")
                : requirement.status.replace("_", " ")}
            </span>
          </div>
          <h3 className="text-sm font-bold text-foreground leading-snug">{requirement.title}</h3>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-muted-foreground hover:bg-[var(--glass-soft-bg)] hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-2">
        {(
          [
            { id: "overview", label: isArabic ? "نظرة عامة" : "Overview", icon: BookOpen },
            { id: "evidence", label: isArabic ? "الأدلة المرتبطة" : "Evidence", icon: FileCheck },
            { id: "task", label: isArabic ? "إنشاء مهمة" : "Create Task", icon: ClipboardList },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer",
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {requirement.description && (
              <div className="rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-soft-bg)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  {isArabic ? "الوصف" : "Description"}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{requirement.description}</p>
              </div>
            )}

            {/* Coverage stats */}
            <div className="rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-soft-bg)] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {isArabic ? "جاهزية المتطلب" : "Readiness score"}
                </p>
                <CoveragePill pct={scorePct} />
              </div>
              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scorePct}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    scorePct >= 80 ? "bg-emerald-400" : scorePct >= 40 ? "bg-amber-400" : "bg-red-400"
                  )}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {requirement.linked_evidence?.length ?? 0}{" "}
                {isArabic ? "أدلة امتثال مربوطة" : "linked compliance documents"}
              </p>
            </div>

            {/* Gaps / Missing warnings */}
            {requirement.gaps && requirement.gaps.length > 0 && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isArabic ? "فجوات مكتشفة" : "Detected Gaps"}
                </p>
                <ul className="space-y-1.5">
                  {requirement.gaps.map((gap, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "evidence" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {requirement.linked_evidence && requirement.linked_evidence.length > 0 ? (
              <div className="space-y-2">
                {requirement.linked_evidence.map((ev) => (
                  <div key={ev.id} className="p-4 rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-soft-bg)] space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold text-foreground leading-normal truncate">{ev.filename}</p>
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border",
                        ev.validation_status === "met" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {ev.validation_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>{Math.round(ev.confidence * 100)}% {isArabic ? "ثقة" : "confidence"}</span>
                      <span className="opacity-45">·</span>
                      <span className="capitalize">{ev.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--glass-border)] py-12 text-center">
                <FileCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {isArabic
                    ? "لا توجد أدلة امتثال مرتبطة بهذا المتطلب حالياً."
                    : "No compliance evidence linked to this requirement yet."}
                </p>
                <button
                  onClick={() => window.open("/platform/evidence", "_blank")}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {isArabic ? "فتح مخزن الأدلة" : "Open Evidence Vault"}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "task" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-[var(--glass-border-subtle)] bg-[var(--glass-soft-bg)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold text-foreground">
                  {isArabic ? "إنشاء مهمة لهذا المتطلب" : "Create a task for this requirement"}
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {isArabic ? "العنوان *" : "Title *"}
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder={isArabic ? "أدخل عنوان المهمة..." : "Enter task title..."}
                    className="mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {isArabic ? "الوصف" : "Description"}
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder={isArabic ? "تفاصيل اختيارية..." : "Optional details..."}
                    className="mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {isArabic ? "الأولوية" : "Priority"}
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="low">{isArabic ? "منخفضة" : "Low"}</option>
                    <option value="medium">{isArabic ? "متوسطة" : "Medium"}</option>
                    <option value="high">{isArabic ? "عالية" : "High"}</option>
                    <option value="critical">{isArabic ? "حرجة" : "Critical"}</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateTask}
                  disabled={submitting || !taskForm.title.trim()}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all cursor-pointer",
                    "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isArabic ? "إنشاء المهمة" : "Create Task"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Requirement Row ───────────────────────────────────────────────────────────

function RequirementRow({
  req,
  onSelect,
  isArabic,
}: {
  req: Requirement
  onSelect: (r: Requirement) => void
  isArabic: boolean
}) {
  const scorePct = Math.round(req.score * 100)
  const normalizedStatus = req.status.toUpperCase()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-all",
        normalizedStatus === "COVERED" || normalizedStatus === "FULLY_COVERED"
          ? "border-emerald-400/15 bg-emerald-400/5 hover:border-emerald-400/30"
          : normalizedStatus === "PARTIALLY_COVERED"
            ? "border-amber-400/15 bg-amber-400/5 hover:border-amber-400/30"
            : "border-red-400/15 bg-red-400/5 hover:border-red-400/30"
      )}
      onClick={() => onSelect(req)}
    >
      <StatusIcon status={req.status} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{req.title}</p>
        {req.description && (
          <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">{req.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <CoveragePill pct={scorePct} />
        {req.linked_evidence && req.linked_evidence.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Link2 className="h-3 w-3" />
            {req.linked_evidence.length}
          </span>
        )}
        {normalizedStatus !== "COVERED" && normalizedStatus !== "FULLY_COVERED" && (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-red-400 border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 rounded-full">
            {isArabic ? "مفقود" : "Missing"}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
      </div>
    </motion.div>
  )
}

// ─── Standards Tree V2 Main ───────────────────────────────────────────────────

export function StandardsTreeV2({
  standardId,
}: {
  standardId: string
}) {
  const { isArabic } = useUiLanguage()
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // Fetch V2 standard details and tree structure
  const { data: treeData, error, isLoading } = useSWR<StandardTreeData>(
    standardId ? `v2-tree-${standardId}` : null,
    () => api.v2GetStandardTree(standardId),
    { revalidateOnFocus: false }
  )

  const toggleSection = useCallback((id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
        <p className="font-semibold text-muted-foreground">{isArabic ? "جاري تحميل هيكل المعايير…" : "Loading standards structure…"}</p>
      </div>
    )
  }

  if (error || !treeData) {
    return (
      <div className="rounded-[28px] border border-dashed border-red-500/20 p-8 text-center bg-red-500/5">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
        <p className="text-sm font-semibold text-foreground">{isArabic ? "فشل تحميل هيكل المعيار" : "Failed to load standard hierarchy"}</p>
        <p className="text-xs text-muted-foreground mt-1">{isArabic ? "يرجى تشغيل تحليل الفجوات أولاً لتهيئة البيانات." : "Please run gap analysis first to initialize the tree data."}</p>
      </div>
    )
  }

  const criteria = treeData.criteria ?? []

  // Aggregate stats
  const allReqs = criteria.flatMap(c => c.requirements ?? [])
  const covered = allReqs.filter((r) => r.status.toUpperCase() === "COVERED" || r.status.toUpperCase() === "FULLY_COVERED").length
  const partial = allReqs.filter((r) => r.status.toUpperCase() === "PARTIALLY_COVERED").length
  const missing = allReqs.filter((r) => r.status.toUpperCase() === "NOT_ASSESSED" || r.status.toUpperCase() === "NOT_COVERED" || r.status.toUpperCase() === "MISSING").length
  const total = allReqs.length

  return (
    <div className="relative">
      {/* Stats strip */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--glass-soft-bg)] px-3 py-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">{isArabic ? "متطلب" : "requirements"}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">{covered}</span>
          <span className="text-xs text-muted-foreground">{isArabic ? "مغطى" : "covered"}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400">{partial}</span>
          <span className="text-xs text-muted-foreground">{isArabic ? "جزئي" : "partial"}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2">
          <XCircle className="h-4 w-4 text-red-400" />
          <span className="text-xs font-semibold text-red-400">{missing}</span>
          <span className="text-xs text-muted-foreground">{isArabic ? "مفقود" : "missing"}</span>
        </div>
      </div>

      {/* Criteria -> Requirement Hierarchy */}
      {criteria.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[var(--glass-border)] py-16 text-center">
          <BookOpen className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            {isArabic ? "لا توجد معايير فرعية لهذا الإطار" : "No criteria defined for this standard"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {criteria.map((crit) => {
            const isOpen = expandedSections.has(crit.id)
            const critReqs = crit.requirements ?? []
            const critCovered = critReqs.filter((r) => r.status.toUpperCase() === "COVERED" || r.status.toUpperCase() === "FULLY_COVERED").length
            const critPct = critReqs.length > 0 ? (critCovered / critReqs.length) * 100 : 0
            
            return (
              <div
                key={crit.id}
                className="rounded-[22px] border border-[var(--glass-border-subtle)] bg-[var(--glass-soft-bg)] overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(crit.id)}
                  className="flex w-full items-center gap-3 px-4 py-4 text-start hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-primary/80 uppercase block mb-0.5">
                      {isArabic ? "معيار فرعي" : "Criterion"}
                    </span>
                    <span className="text-sm font-semibold text-foreground block truncate">
                      {crit.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                      {critReqs.length} {isArabic ? "متطلبات" : "items"}
                    </span>
                    <CoveragePill pct={critPct} />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 px-4 pb-4 pt-1">
                        {crit.description && (
                          <p className="text-xs text-muted-foreground/80 leading-relaxed border-s-2 border-white/10 ps-3 mb-3 italic">
                            {crit.description}
                          </p>
                        )}
                        {critReqs.map((req) => (
                          <RequirementRow
                            key={req.id}
                            req={req}
                            onSelect={setSelectedReq}
                            isArabic={isArabic}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {/* Slide-out drawer */}
      <AnimatePresence>
        {selectedReq && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReq(null)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <RequirementDrawer
              requirement={selectedReq}
              standardId={standardId}
              onClose={() => setSelectedReq(null)}
              isArabic={isArabic}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
