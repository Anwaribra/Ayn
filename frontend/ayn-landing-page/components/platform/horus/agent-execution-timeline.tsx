"use client"

import { useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Check, Loader2, Wrench, AlertCircle, FileText, ChevronDown, ChevronUp, Clock, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ToolStep } from "@/lib/horus-context"

export type ExecutionStepStatus = "pending" | "active" | "done"

export type ExecutionStep = {
  id: string
  label: string
  status: ExecutionStepStatus
  /** Optional tool/action name for agent steps */
  tool?: string
  /** Live progress percentage (0-100) */
  progress_percent?: number
  /** Estimated duration in milliseconds */
  estimated_duration_ms?: number
  /** Live progress message */
  progress_message?: string
}

export type AgentExecutionPhase =
  | "planning"
  | "tool_selected"
  | "waiting_confirmation"
  | "executing"
  | "completed"

interface AgentExecutionTimelineProps {
  /** Steps derived from __THINKING__ or __TOOL_STEP__ events */
  steps: ExecutionStep[]
  /** Current phase for visual emphasis */
  phase: AgentExecutionPhase
  /** Step X of Y when from __TOOL_STEP__ */
  stepProgress?: { current: number; total: number }
  /** Tool name when waiting for confirmation */
  pendingTool?: string
  /** Whether we're waiting for user to confirm */
  isWaitingConfirmation?: boolean
  /** Compact mode for inline display */
  compact?: boolean
  /** File names being processed (Cursor-style chips) */
  activeFiles?: string[]
  /** Per-file status for chips */
  fileStatuses?: Record<string, string>
  /** Collapsible when complete — show compact summary when collapsed */
  collapsible?: boolean
  /** Render labels in Arabic when the surrounding message is Arabic */
  isArabic?: boolean
  className?: string
}

const PHASE_LABELS: Record<AgentExecutionPhase, string> = {
  planning: "Preparing",
  tool_selected: "Action selected",
  waiting_confirmation: "Awaiting confirmation",
  executing: "Working",
  completed: "Completed",
}

const PHASE_BAR_STEPS = ["Prepare", "Read", "Execute", "Done"]

function phaseToBarIndex(phase: AgentExecutionPhase): number {
  if (phase === "completed") return 3
  if (phase === "executing") return 2
  if (phase === "tool_selected" || phase === "waiting_confirmation") return 1
  return 0
}

export function AgentExecutionTimeline({
  steps,
  phase,
  stepProgress,
  pendingTool,
  isWaitingConfirmation,
  compact = false,
  activeFiles = [],
  fileStatuses = {},
  collapsible = false,
  isArabic = false,
  className,
}: AgentExecutionTimelineProps) {
  const reducedMotion = useReducedMotion()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null)
  const hasSteps = steps.length > 0
  const activeToolStep = steps.find((s) => s.status === "active" && s.tool)
  const isExecuting = phase === "executing"
  const isComplete = phase === "completed"
  const canCollapse = collapsible && isComplete && hasSteps
  const showExpanded = !canCollapse || !isCollapsed
  const animDuration = reducedMotion ? 0 : 0.25
  const activeBarIndex = phaseToBarIndex(phase)
  const phaseLabels: Record<AgentExecutionPhase, string> = isArabic
    ? {
        planning: "جارٍ التحضير",
        tool_selected: "تم اختيار الإجراء",
        waiting_confirmation: "بانتظار التأكيد",
        executing: "جارٍ التنفيذ",
        completed: "اكتمل",
      }
    : PHASE_LABELS
  const phaseDescription =
    phase === "planning"
      ? (isArabic ? "جارٍ قراءة حالة المنصة واختيار أفضل مسار." : "Reading platform state, selecting action…")
      : phase === "tool_selected"
        ? (isArabic ? "جارٍ تجهيز التنفيذ." : "Preparing to run…")
        : phase === "waiting_confirmation"
          ? (isArabic ? "مطلوب تأكيد منك قبل المتابعة." : "User approval required")
          : phase === "executing"
            ? (
              stepProgress && stepProgress.total > 1
                ? (isArabic ? `الخطوة ${stepProgress.current} من ${stepProgress.total}` : `Step ${stepProgress.current} of ${stepProgress.total}…`)
                : (isArabic ? "جارٍ تنفيذ الإجراء المحدد." : "Running selected action…")
            )
            : (isArabic ? "النتيجة جاهزة." : "Result ready")

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animDuration, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] shadow-[0_18px_44px_-34px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.03)]",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      {/* Phase Progress Bar — horizontal bar above timeline */}
      <div className="mb-3 flex items-center gap-1">
        {PHASE_BAR_STEPS.map((label, idx) => {
          const isDone = idx < activeBarIndex || (idx === activeBarIndex && isComplete)
          const isActive = idx === activeBarIndex && !isComplete
          const isPending = idx > activeBarIndex
          return (
            <div key={label} className="flex flex-1 items-center min-w-0">
              <div
                className={cn(
                  "h-1 flex-1 min-w-[12px] rounded-full transition-all duration-300",
                  isDone && "bg-emerald-400/60",
                  isActive && "bg-primary/55 horus-step-pulse",
                  isPending && "bg-white/8"
                )}
              />
              {idx < PHASE_BAR_STEPS.length - 1 && (
                <div className="h-px w-1 shrink-0 bg-white/8" />
              )}
            </div>
          )
        })}
      </div>

      {/* Header: current phase with AnimatePresence for phase transitions */}
      <div className="mb-3 flex items-start gap-3">
        {canCollapse && (
          <button
            type="button"
            onClick={() => setIsCollapsed((c) => !c)}
            className="shrink-0 rounded-full p-1 transition-colors hover:bg-white/6"
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full border",
              phase === "completed"
                ? "h-9 w-9 border-emerald-500/20 bg-emerald-500/12 text-emerald-400"
                : phase === "waiting_confirmation"
                  ? "h-9 w-9 border-amber-500/20 bg-amber-500/12 text-amber-400"
                  : "h-9 w-9 border-primary/20 bg-primary/12 text-primary"
            )}
          >
            {phase === "completed" ? (
              <Check className="w-4 h-4" />
            ) : phase === "waiting_confirmation" ? (
              <AlertCircle className="w-4 h-4 animate-pulse" />
            ) : (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-foreground">
            {isWaitingConfirmation && pendingTool
              ? (isArabic ? `تأكيد: ${pendingTool}` : `Confirm: ${pendingTool}`)
              : phaseLabels[phase]}
          </p>
          <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
            {phaseDescription}
          </p>
        </div>
      </div>

      {/* File chips — Cursor-style with status */}
      {activeFiles.length > 0 && (
        <div className="mb-3 mt-1 flex flex-wrap gap-1.5">
          {activeFiles.map((filename, i) => {
            const status = fileStatuses[filename]
            const statusLabel =
              status === "uploading"
                ? (isArabic ? "جارٍ الرفع…" : "Uploading…")
                : status === "extracting"
                  ? (isArabic ? "جارٍ الاستخراج…" : "Extracting…")
                  : status === "analyzing"
                    ? (isArabic ? "جارٍ التحليل…" : "Analyzing…")
                    : status === "error"
                      ? (isArabic ? "خطأ" : "Error")
                      : null
            return (
              <motion.span
                key={`${filename}-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                  isExecuting
                    ? "border border-primary/20 bg-primary/12 text-primary"
                    : "border border-white/8 bg-white/[0.03] text-muted-foreground"
                )}
              >
                <FileText className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[120px]">{filename}</span>
                {statusLabel && (
                  <span className="text-[10px] opacity-80">({statusLabel})</span>
                )}
              </motion.span>
            )
          })}
        </div>
      )}

      {/* Tool chip — highlighted when executing, with live progress */}
      {activeToolStep?.tool && (
        <motion.div
          layout
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="mb-3 space-y-1.5"
        >
          <motion.span
            animate={
              reducedMotion
                ? { scale: 1, boxShadow: "0 0 0 transparent" }
                : {
                    scale: isExecuting ? [1, 1.02, 1] : 1,
                    boxShadow: isExecuting
                      ? "0 0 12px rgba(59, 130, 246, 0.35)"
                      : "0 0 0 transparent",
                  }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    scale: { duration: 1.2, repeat: isExecuting ? Infinity : 0, repeatDelay: 0.4 },
                    boxShadow: { duration: 0.3 },
                  }
            }
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              isExecuting
                ? "border border-primary/25 bg-primary/14 text-primary"
                : "bg-primary/10 text-primary"
            )}
          >
            <Wrench className="w-3 h-3" />
            {activeToolStep.tool}
            {activeToolStep.progress_percent != null && activeToolStep.progress_percent > 0 && (
              <span className="ml-1 font-mono text-[10px] opacity-80">
                {activeToolStep.progress_percent}%
              </span>
            )}
          </motion.span>

          {/* Progress bar */}
          {isExecuting && (
            <div className="flex items-center gap-2 px-0.5">
              <div className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
                {activeToolStep.progress_percent != null && activeToolStep.progress_percent > 0 ? (
                  <motion.div
                    className="h-full rounded-full bg-primary/60"
                    initial={{ width: 0 }}
                    animate={{ width: `${activeToolStep.progress_percent}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                ) : (
                  <motion.div
                    className="h-full w-1/3 rounded-full bg-primary/40"
                    animate={{ x: ["-100%", "300%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </div>
              {activeToolStep.estimated_duration_ms && !activeToolStep.progress_percent && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  ~{Math.ceil(activeToolStep.estimated_duration_ms / 1000)}s
                </span>
              )}
            </div>
          )}

          {/* Progress message */}
          {activeToolStep.progress_message && (
            <motion.p
              key={activeToolStep.progress_message}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-muted-foreground/80 pl-0.5"
            >
              {activeToolStep.progress_message}
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Collapsed summary */}
      {canCollapse && isCollapsed && (
        <p className="text-[12px] text-muted-foreground">
          {isArabic
            ? `تم إنجاز ${steps.length} ${steps.length > 1 ? "خطوات" : "خطوة"}`
            : `${steps.length} step${steps.length !== 1 ? "s" : ""} completed`}
        </p>
      )}

      {/* Step list — hide when collapsed */}
      {hasSteps && showExpanded && (
        <div className="space-y-2.5">
          <div className="h-px bg-white/8" />
          <AnimatePresence>
            {steps.map((step, idx) => (
              <motion.div
                key={step.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  delay: reducedMotion ? 0 : idx * 0.08,
                  duration: reducedMotion ? 0 : 0.25,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (step.status === "done") {
                      setExpandedStepId((prev) => prev === step.id ? null : step.id)
                    }
                  }}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-2xl border border-white/6 bg-white/[0.02] px-2.5 py-2 text-left",
                    step.status === "done" && "cursor-pointer hover:bg-white/[0.04] transition-colors"
                  )}
                >
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                    step.status === "done"
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : step.status === "active"
                        ? "border-primary/40 bg-primary/10 horus-step-pulse-glow"
                        : "border-white/10 bg-transparent"
                  )}
                >
                  {step.status === "done" ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : step.status === "active" ? (
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                  ) : null}
                </div>
                <span
                  className={cn(
                    "min-w-0 flex-1 text-[13px] font-medium leading-6",
                    step.status === "active"
                      ? "text-foreground"
                      : step.status === "done"
                        ? "text-foreground/76"
                        : "text-muted-foreground/60"
                  )}
                >
                  {step.label}
                </span>
                {step.tool && !activeToolStep?.tool && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                    <Wrench className="w-2.5 h-2.5" />
                    {step.tool}
                  </span>
                )}
                {step.status === "done" && (
                  <Maximize2 className={cn(
                    "w-3 h-3 shrink-0 text-muted-foreground/40 transition-transform",
                    expandedStepId === step.id && "rotate-45"
                  )} />
                )}
                </button>

                {/* Expandable detail panel */}
                <AnimatePresence>
                  {expandedStepId === step.id && step.status === "done" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 ml-7 rounded-xl border border-white/6 bg-white/[0.015] px-3 py-2 space-y-1.5">
                        {step.tool && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-muted-foreground/60 min-w-[60px]">Tool</span>
                            <span className="font-mono text-foreground/80">{step.tool}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-muted-foreground/60 min-w-[60px]">Status</span>
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <Check className="h-2.5 w-2.5" />
                            Completed
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-muted-foreground/60 min-w-[60px]">Step</span>
                          <span className="text-foreground/80">{idx + 1} of {steps.length}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

/** Derive execution steps from thinking steps, tool steps (__TOOL_STEP__), and confirmation state */
export function deriveAgentSteps(
  thinkingSteps: string[],
  pendingConfirmation: { title: string; tool: string } | null,
  hasStructuredResult: boolean,
  isGenerating: boolean,
  toolSteps?: ToolStep[]
): { steps: ExecutionStep[]; phase: AgentExecutionPhase; stepProgress?: { current: number; total: number } } {
  const steps: ExecutionStep[] = []
  let phase: AgentExecutionPhase = "planning"
  let stepProgress: { current: number; total: number } | undefined

  // Prefer __TOOL_STEP__ when available — Step X of Y with tool names
  if (toolSteps && toolSteps.length > 0) {
    const total = Math.max(...toolSteps.map((t) => t.total), 1)
    const runningOrLast = toolSteps.find((t) => t.status === "running") ?? toolSteps[toolSteps.length - 1]
    stepProgress = { current: runningOrLast?.step ?? 1, total }
    phase = "executing"
    if (hasStructuredResult) phase = "completed"
    toolSteps.forEach((t) => {
      const status: ExecutionStepStatus =
        t.status === "running" ? "active" : t.status === "done" ? "done" : t.status === "error" ? "done" : "pending"
      steps.push({
        id: `tool-${t.step}`,
        label: t.total > 1 ? `Step ${t.step} of ${t.total}: ${t.title ?? t.tool}` : (t.title ?? t.tool),
        status,
        tool: t.tool,
        progress_percent: t.progress_percent,
        estimated_duration_ms: t.estimated_duration_ms,
        progress_message: t.progress_message,
      })
    })
    if (!isGenerating && phase === "executing") {
      phase = "completed"
      steps.forEach((s) => (s.status = "done"))
    }
    return { steps, phase, stepProgress }
  }

  // Map backend thinking steps to our format
  thinkingSteps.forEach((text, idx) => {
    const isLast = idx === thinkingSteps.length - 1
    const isActive = isLast && isGenerating && !pendingConfirmation && !hasStructuredResult
    const status: ExecutionStepStatus = hasStructuredResult || (idx < thinkingSteps.length - 1)
      ? "done"
      : isActive
        ? "active"
        : "pending"

    const toolMatch = text.match(/^Identified action:\s*(.+)$/)
    const tool = toolMatch ? toolMatch[1].trim() : undefined

    steps.push({
      id: `step-${idx}`,
      label: text.replace(/^Identified action:\s*/, "Selected: "),
      status,
      tool,
    })
  })

  if (hasStructuredResult) {
    phase = "completed"
    if (steps.length > 0) steps.forEach((s) => (s.status = "done"))
  } else if (pendingConfirmation) {
    phase = "waiting_confirmation"
    if (steps.length > 0) steps.forEach((s) => (s.status = "done"))
    steps.push({
      id: "confirm",
      label: "Ready to execute — please confirm",
      status: "active",
      tool: pendingConfirmation.title,
    })
  } else if (thinkingSteps.some((t) => t.includes("Identified action:"))) {
    phase = "tool_selected"
    if (thinkingSteps.some((t) => t.includes("Executing"))) phase = "executing"
  } else if (
    thinkingSteps.some((t) =>
      t.includes("Preparing") ||
      t.includes("Got it") ||
      t.includes("Processing") ||
      t.startsWith("Phase ") ||
      t.includes("Reading") ||
      t.includes("Generating") ||
      t.includes("Searching")
    )
  ) {
    phase = "executing"
  }

  if (!isGenerating && phase === "executing") {
    phase = "completed"
    steps.forEach((s) => (s.status = "done"))
  }

  return { steps, phase }
}
