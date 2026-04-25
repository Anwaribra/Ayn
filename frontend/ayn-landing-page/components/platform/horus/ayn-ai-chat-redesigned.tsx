"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Brain,
  FileText,
  X,
  MessageSquare,
  Trash2,
  History,
  PlusCircle,
  Search,
  Check,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Download,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sun,
  Moon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import { useHorus, type CitationSource, type ToolStep, type FileStatus, type Message as HorusMessage, type AgentRunMeta } from "@/lib/horus-context"
import { SuggestedActionsPanel } from "./suggested-actions"
import { useFocusMode } from "@/lib/focus-mode-context"
import { AIChatInput } from "@/components/ui/ai-chat-input"
import { AttachedFile } from "./types"
import { HorusMarkdown } from "./horus-markdown"
import { AgentResultRenderer } from "./agent-result-renderer"
import { MiniOrb } from "./agent-orb"
import { AiLoader } from "@/components/ui/ai-loader"
import { AgentExecutionTimeline, deriveAgentSteps } from "./agent-execution-timeline"
import { ThinkStepper } from "./think-stepper"
import { ThinkingPanel } from "./thinking-panel"
import { useLiveStreamingText } from "@/hooks/use-streaming-text"
import { AgentContextIndicator } from "./agent-context-indicator"

const EMPTY_STRINGS: string[] = []
const EMPTY_TOOL_STEPS: ToolStep[] = []
const EMPTY_FILES: string[] = []
const EMPTY_FILE_STATUSES: Record<string, FileStatus> = {}
const LAST_CHAT_STORAGE_KEY = "horus-last-chat-id"

/** Renders assistant content with typing effect when streaming */
function StreamingAssistantContent({
  content,
  isStreaming,
  onAction,
  speedMs = 220,
}: {
  content: string
  isStreaming: boolean
  onAction: (type: string, payload: string) => void
  speedMs?: number
}) {
  const displayed = useLiveStreamingText(content, isStreaming, speedMs)
  return <HorusMarkdown content={displayed} onAction={onAction} />
}

export type ReasoningState = {
  steps: { text: string; status: "pending" | "active" | "done" }[]
  startTime: number
  duration: number | null
  isExpanded: boolean
  isComplete: boolean
  tempUserMessage: string | null
}

const RESPONSE_MODES = [
  {
    key: "ask",
    label: "Ask",
    description: "Direct answers",
    icon: MessageSquare,
  },
  {
    key: "think",
    label: "Think",
    description: "Deeper reasoning",
    icon: Brain,
  },
  {
    key: "agent",
    label: "Agent",
    description: "Action-oriented",
    icon: Sparkles,
  },
] as const

// ── Agent Commands for Slash Palette ────────────────────────────────────────
const AGENT_COMMANDS = [
  { command: "audit", label: "Run full audit", description: "Generate audit report from existing analysis data", icon: "shield-check", category: "analysis" },
  { command: "gaps", label: "Check compliance gaps", description: "Show criteria-level gap/met status table", icon: "alert-triangle", category: "analysis" },
  { command: "remediation", label: "Generate remediation plan", description: "AI-powered action plan for open gaps", icon: "wrench", category: "analysis" },
  { command: "analytics", label: "Get analytics report", description: "KPIs, trends, scores, and growth metrics", icon: "bar-chart-2", category: "analytics" },
  { command: "link", label: "Link evidence to criterion", description: "Attach evidence to a specific criterion", icon: "link", category: "actions" },
  { command: "export", label: "Export report", description: "Generate downloadable report link", icon: "download", category: "actions" },
  { command: "snapshot", label: "Platform snapshot", description: "View current platform state overview", icon: "search", category: "info" },
  { command: "analyze", label: "Start gap analysis", description: "Queue a new gap analysis for a standard", icon: "sparkles", category: "actions" },
]

function containsArabic(text?: string | null): boolean {
  return !!text && /[\u0600-\u06FF]/.test(text)
}

function getResponseModeLabel(mode?: "ask" | "think" | "agent", isArabic = false) {
  if (mode === "think") return isArabic ? "إجابة تحليلية" : "Reasoned answer"
  if (mode === "agent") return isArabic ? "تنفيذ وكيل" : "Agent run"
  return isArabic ? "إجابة مباشرة" : "Direct answer"
}

function getResponseModeTone(mode?: "ask" | "think" | "agent") {
  if (mode === "think") return "border-amber-500/20 bg-amber-500/10 text-amber-200"
  if (mode === "agent") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
  return "border-sky-500/20 bg-sky-500/10 text-sky-200"
}

function getAttachmentContextLabel(message?: HorusMessage | null, isArabic = false) {
  if (!message?.attachments?.length) return null
  const hasImages = message.attachments.some((file) => file.type === "image")
  const hasDocs = message.attachments.some((file) => file.type === "document")

  if (hasImages && hasDocs) return isArabic ? "تحليل مرفقات" : "Mixed attachment analysis"
  if (hasImages) return isArabic ? "تحليل صورة" : "Image analysis"
  if (hasDocs) return isArabic ? "تحليل مستند" : "Document analysis"
  return null
}

function formatAgentRoute(meta?: AgentRunMeta | null, isArabic = false) {
  if (!meta?.route) return null
  if (meta.route === "file_analysis") return isArabic ? "تحليل مباشر للمرفق" : "Direct file analysis"
  if (meta.route === "tool") return isArabic ? "تنفيذ أداة واحدة" : "Single tool execution"
  if (meta.route === "plan" || meta.route === "planner") return isArabic ? "خطة متعددة الخطوات" : "Multi-step workflow"
  if (meta.route === "chat") return isArabic ? "إجابة مباشرة داخل وضع الوكيل" : "Direct agent response"
  return meta.route
}

function formatAgentIntent(meta?: AgentRunMeta | null, isArabic = false) {
  if (!meta?.intent) return null
  if (meta.intent === "file_analysis") return isArabic ? "تحليل ملف" : "File analysis"
  if (meta.intent === "platform_action") return isArabic ? "إجراء على بيانات المنصة" : "Platform action"
  if (meta.intent === "multi_step_workflow") return isArabic ? "سير عمل تحليلي" : "Workflow"
  if (meta.intent === "agent_chat") return isArabic ? "محادثة وكيل" : "Agent chat"
  return meta.intent
}

// ─── Inline Thinking Bubble ──────────────────────────────────────────────────
function InlineThinking({ reasoning }: { reasoning: ReasoningState | null }) {
  const [expanded, setExpanded] = useState(false)

  if (!reasoning || reasoning.steps.length === 0) return null

  const isActive = !reasoning.isComplete
  const activeStep = reasoning.steps.find(s => s.status === "active")

  // Auto-expand while actively thinking, allow manual toggle once done
  const isOpen = isActive || expanded

  return (
    <div className="mb-2">
      <button
        onClick={() => { if (!isActive) setExpanded(prev => !prev) }}
        className={cn(
          "inline-flex items-center gap-2 text-[13px] font-medium transition-colors",
          isActive
            ? "text-muted-foreground cursor-default"
            : "text-muted-foreground/70 hover:text-muted-foreground cursor-pointer"
        )}
      >
        {isActive ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span>{activeStep?.text || "Thinking..."}</span>
          </>
        ) : (
          <>
            <Check className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span>Thought for {reasoning.duration?.toFixed(1)}s</span>
            <svg
              className={cn("w-3 h-3 text-muted-foreground/40 transition-transform", isOpen && "rotate-180")}
              viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M3 5l3 3 3-3" />
            </svg>
          </>
        )}
      </button>

      {isOpen && (
        <div className="mt-2 ml-1 pl-3 border-l-2 border-[var(--border-subtle)] space-y-1.5">
          {reasoning.steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[12px]">
              {step.status === "done" ? (
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
              ) : step.status === "active" ? (
                <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
              ) : (
                <span className="w-3 h-3 rounded-full border border-[var(--border-subtle)] shrink-0" />
              )}
              <span className={cn(
                "font-medium",
                step.status === "active" ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AssistantMessageMeta({
  mode,
  sourceLabel,
  timestamp,
  isArabic,
}: {
  mode?: "ask" | "think" | "agent"
  sourceLabel?: string | null
  timestamp: number
  isArabic: boolean
}) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-medium">
      <span className={cn("rounded-full border px-2 py-0.5 tracking-[0.08em] uppercase", getResponseModeTone(mode))}>
        {getResponseModeLabel(mode, isArabic)}
      </span>
      {sourceLabel && (
        <span className="rounded-full border border-white/8 bg-white/[0.025] px-2 py-0.5 text-muted-foreground/85">
          {sourceLabel}
        </span>
      )}
      <span className="text-muted-foreground/50">{formatTimestamp(timestamp, isArabic)}</span>
    </div>
  )
}

function AgentRunHeader({
  meta,
  isArabic,
}: {
  meta?: AgentRunMeta | null
  isArabic: boolean
}) {
  const [planExpanded, setPlanExpanded] = useState(false)
  if (!meta) return null

  const routeLabel = formatAgentRoute(meta, isArabic)
  const intentLabel = formatAgentIntent(meta, isArabic)
  const isPlan = meta.route === "plan" || meta.route === "planner"
  const hasMultipleSteps = (meta.step_count ?? 0) > 1
  const stepCountLabel = hasMultipleSteps
    ? (isArabic ? `${meta.step_count} خطوات` : `${meta.step_count} steps`)
    : null

  // Plan card — shown for multi-step workflows
  if (isPlan && meta.goal) {
    const planSteps: string[] = meta.tools?.length
      ? meta.tools
      : meta.step_count
        ? Array.from({ length: meta.step_count }, (_, i) => `Step ${i + 1}`)
        : []

    return (
      <div className="mb-2 overflow-hidden rounded-2xl border border-emerald-500/15 bg-[linear-gradient(180deg,rgba(16,185,129,0.10),rgba(16,185,129,0.04))] shadow-[0_16px_44px_-32px_rgba(16,185,129,0.45)]">
        <div className="flex items-start justify-between gap-2 px-3.5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
              {isArabic ? "خطة الوكيل" : "Agent plan"}
            </span>
            {stepCountLabel && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                {stepCountLabel}
              </span>
            )}
            {intentLabel && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                {intentLabel}
              </span>
            )}
          </div>
          {planSteps.length > 0 && (
            <button
              onClick={() => setPlanExpanded(p => !p)}
              className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={planExpanded ? "Collapse plan" : "Expand plan"}
            >
              {planExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        <div className="border-t border-white/8 px-3.5 py-3">
          <p className="text-[12px] font-semibold text-foreground/90">
            {meta.goal}
          </p>
          {meta.reason && (
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{meta.reason}</p>
          )}
        </div>

        {planExpanded && planSteps.length > 0 && (
          <div className="border-t border-white/8 px-3.5 py-3 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
              {isArabic ? "خطوات التنفيذ" : "Execution steps"}
            </p>
            {planSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[9px] font-bold text-emerald-300">
                  {i + 1}
                </span>
                <span className="text-[12px] text-foreground/80">{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mb-2 rounded-2xl border border-emerald-500/12 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(16,185,129,0.03))] p-3 shadow-[0_16px_40px_-32px_rgba(16,185,129,0.5)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200">
          {isArabic ? "وضع الوكيل" : "Agent mode"}
        </span>
        {intentLabel && (
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
            {intentLabel}
          </span>
        )}
        {routeLabel && (
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
            {routeLabel}
          </span>
        )}
        {stepCountLabel && (
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
            {stepCountLabel}
          </span>
        )}
      </div>
      {meta.goal && (
        <p className="mt-2 text-[12px] font-medium text-foreground/92">
          <span className="text-muted-foreground">{isArabic ? "الهدف:" : "Goal:"}</span>{" "}
          {meta.goal}
        </p>
      )}
      {meta.reason && (
        <p className="mt-1 text-[11px] leading-6 text-muted-foreground">
          {meta.reason}
        </p>
      )}
    </div>
  )
}

function ComposerStatusStrip({
  attachedCount,
  isProcessing,
  agentRun,
  isArabic,
}: {
  attachedCount: number
  isProcessing: boolean
  agentRun?: AgentRunMeta | null
  isArabic: boolean
}) {
  const routeLabel = formatAgentRoute(agentRun, isArabic)
  const intentLabel = formatAgentIntent(agentRun, isArabic)
  const summaryLabel = isProcessing
    ? (agentRun?.goal || (isArabic ? "الوكيل يعمل الآن" : "Agent is working"))
    : attachedCount > 0
      ? (isArabic
        ? `${attachedCount} ${attachedCount > 1 ? "مرفقات جاهزة" : "مرفق جاهز"}`
        : `${attachedCount} attachment${attachedCount > 1 ? "s are" : " is"} ready`)
      : (isArabic ? "جاهز للمحادثة" : "Ready for chat")

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 text-[11px]">
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground/90">{summaryLabel}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-muted-foreground/65">
          {intentLabel && <span>{intentLabel}</span>}
          {routeLabel && <span>{intentLabel ? "· " : ""}{routeLabel}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {agentRun?.step_count ? (
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 font-medium text-muted-foreground/80">
            {isArabic ? `${agentRun.step_count} خطوات` : `${agentRun.step_count} steps`}
          </span>
        ) : null}
        {isProcessing && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 font-medium text-primary/90">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {isArabic ? "يعمل" : "Running"}
          </span>
        )}
      </div>
    </div>
  )
}

function getAgentActivityText({
  mode,
  status,
  hasAttachments,
  isArabic,
  phase,
}: {
  mode: "ask" | "think" | "agent"
  status: string
  hasAttachments: boolean
  isArabic: boolean
  phase?: string
}) {
  if (status !== "generating") return isArabic ? "جاهز" : "Ready"
  if (mode === "agent") {
    if (phase === "waiting_confirmation") return isArabic ? "بانتظار التأكيد" : "Waiting for approval"
    if (phase === "executing") return isArabic ? "ينفذ الخطوات" : "Running tools"
    if (hasAttachments) return isArabic ? "يحلل الملفات وينفذ المهام" : "Analyzing files and running tools"
    return isArabic ? "يخطط وينفذ المهمة" : "Planning and executing"
  }
  if (mode === "think") return isArabic ? "يفكر في أفضل إجابة" : "Reasoning through the answer"
  if (hasAttachments) return isArabic ? "يحلل المرفقات" : "Analyzing attachments"
  return isArabic ? "يكتب الرد" : "Writing the reply"
}

function LiveTaskCards({
  phase,
  stepProgress,
  activeFiles,
  isArabic,
}: {
  phase: string
  stepProgress?: { current: number; total: number }
  activeFiles?: string[]
  isArabic: boolean
}) {
  const phaseTitle =
    phase === "waiting_confirmation"
      ? (isArabic ? "بانتظار التأكيد" : "Awaiting approval")
      : phase === "completed"
        ? (isArabic ? "النتيجة جاهزة" : "Result ready")
        : phase === "executing"
          ? (isArabic ? "قيد التنفيذ" : "In progress")
          : (isArabic ? "قيد التجهيز" : "Preparing")

  const progressText = stepProgress
    ? (isArabic
      ? `الخطوة ${stepProgress.current} من ${stepProgress.total}`
      : `Step ${stepProgress.current} of ${stepProgress.total}`)
    : (isArabic ? "تجهيز المسار الأنسب" : "Preparing the best route")

  const fileText = activeFiles?.length
    ? (isArabic
      ? `${activeFiles.length} ${activeFiles.length > 1 ? "ملفات نشطة" : "ملف نشط"}`
      : `${activeFiles.length} active file${activeFiles.length > 1 ? "s" : ""}`)
    : (isArabic ? "بدون مرفقات نشطة" : "No active attachments")

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 shadow-[0_14px_30px_-28px_rgba(0,0,0,0.8)]">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{isArabic ? "الحالة" : "Status"}</p>
        <p className="mt-1 text-[13px] font-semibold text-foreground">{phaseTitle}</p>
      </div>
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 shadow-[0_14px_30px_-28px_rgba(0,0,0,0.8)]">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{isArabic ? "التقدم" : "Progress"}</p>
        <p className="mt-1 text-[13px] font-semibold text-foreground">{progressText}</p>
      </div>
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 shadow-[0_14px_30px_-28px_rgba(0,0,0,0.8)]">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{isArabic ? "المرفقات" : "Attachments"}</p>
        <p className="mt-1 text-[13px] font-semibold text-foreground">{fileText}</p>
      </div>
    </div>
  )
}

function SmartConfirmationCard({
  title,
  description,
  isArabic,
  onConfirm,
  onCancel,
}: {
  title: string
  description: string
  isArabic: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="mb-3 overflow-hidden rounded-[24px] border border-amber-500/18 bg-[linear-gradient(180deg,rgba(245,158,11,0.10),rgba(245,158,11,0.04))] shadow-[0_20px_44px_-34px_rgba(245,158,11,0.35)]">
      <div className="border-b border-white/8 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/18 bg-amber-500/12 text-amber-300">
            <AlertCircle className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground">{title}</p>
            <p className="text-[11px] text-muted-foreground">
              {isArabic ? "يلزم تأكيدك قبل تنفيذ هذا الإجراء." : "This action needs your approval before it runs."}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{isArabic ? "ما الذي سيحدث" : "What will happen"}</p>
          <p className="mt-1 text-[13px] leading-6 text-foreground/90">{description}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{isArabic ? "نوع الإجراء" : "Action type"}</p>
            <p className="mt-1 text-[13px] font-medium text-foreground">{isArabic ? "إجراء تشغيلي" : "Operational action"}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{isArabic ? "التحكم" : "Control"}</p>
            <p className="mt-1 text-[13px] font-medium text-foreground">{isArabic ? "لن يتم التنفيذ إلا بعد موافقتك" : "Nothing runs until you approve"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-[0_14px_26px_-18px_rgba(37,99,235,0.7)] transition-colors hover:bg-primary/90"
          >
            {isArabic ? "تأكيد التنفيذ" : "Approve and run"}
          </button>
          <button
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
          >
            {isArabic ? "إلغاء" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  )
}

// Real thinking steps are now driven by __THINKING__: events from the backend.
// This function is kept as a FALLBACK for when no thinking events arrive within 500ms
// (e.g. very fast responses or agent actions).
function getReasoningSteps(text: string, hasFiles: boolean) {
  const steps: string[] = []
  if (hasFiles) steps.push("Processing attached files...")
  steps.push("Reading platform state...")
  if (/(iso|ncaaa|criteria|standard|audit)/i.test(text)) {
    steps.push("Searching standards library")
  }
  if (/(evidence|gap|compliance|score|remediation)/i.test(text)) {
    steps.push("Calculating compliance gaps")
  }
  return steps
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}


// ─── File Preview Component ─────────────────────────────────────────────────────
function FilePreview({ file, onRemove }: { file: AttachedFile; onRemove: () => void }) {
  const isImage = file.type === "image" && !!file.preview

  return (
    <div className="group relative flex items-center gap-3 rounded-xl border border-white/8 bg-[#0d131b]/92 p-2.5 pr-10 shadow-[0_14px_28px_-24px_rgba(0,0,0,0.9)] transition-all hover:border-primary/30 hover:bg-[#111927]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/8 bg-primary/10 text-primary">
        {isImage ? (
          <img src={file.preview} alt={file.file.name} className="h-full w-full object-cover" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium text-foreground">{file.file.name}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground/65">
          <span className="rounded-md border border-white/8 bg-white/[0.03] px-1.5 py-0.5 font-medium uppercase tracking-[0.08em]">
            {file.type}
          </span>
          <span>{formatFileSize(file.file.size)}</span>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground/55 transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Remove ${file.file.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function formatTimestamp(timestamp: number, isArabic = false) {
  return new Intl.DateTimeFormat(isArabic ? "ar-EG" : undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp)
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function HorusAIChat() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const {
    messages,
    currentChatId,
    status,
    streamError,
    sendMessage,
    resolveActionConfirmation,
    retryLastMessage,
    stopGeneration,
    newChat,
    loadChat,
    appendMessages,
  } = useHorus()

  const isEmpty = messages.length === 0
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [responseMode, setResponseMode] = useState<"ask" | "think" | "agent">("ask")
  const [activeResponseMode, setActiveResponseMode] = useState<"ask" | "think" | "agent">("ask")
  const [reasoning, setReasoning] = useState<ReasoningState | null>(null)
  // M2: per-message feedback — tracks both optimistic state and server-persisted state
  const [feedback, setFeedback] = useState<Record<string, "up" | "down" | null>>({})
  const [feedbackPersisted, setFeedbackPersisted] = useState<Set<string>>(new Set())
  // Tiered feedback: when thumbs down, expand to show categories + optional "Tell us more"
  const [detailedFeedbackCategory, setDetailedFeedbackCategory] = useState<string | null>(null)
  const [feedbackDownExpanded, setFeedbackDownExpanded] = useState<string | null>(null)
  const [feedbackTellMore, setFeedbackTellMore] = useState<Record<string, string>>({})
  // M1: copy state tracking
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const userRequestedScrollRef = useRef(false)
  const fallbackQueueRef = useRef<string[]>([])
  const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const didLoadFromQueryRef = useRef(false)
  const [completionPulseKey, setCompletionPulseKey] = useState(0)
  const [thinkingPanelExpanded, setThinkingPanelExpanded] = useState(false)
  const [expandedMsgIds, setExpandedMsgIds] = useState<Set<string>>(new Set())
  const [draftMessage, setDraftMessage] = useState("")
  const [deepResearchRunning, setDeepResearchRunning] = useState(false)
  const [inputResetKey, setInputResetKey] = useState(0)
  const [historySheetOpen, setHistorySheetOpen] = useState(false)
  const [historyQuery, setHistoryQuery] = useState("")
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true
    return !localStorage.getItem("horus-sound-disabled")
  })
  const prevStatusRef = useRef<typeof status>(status)
  const COLLAPSE_THRESHOLD = 600

  const { data: history, mutate: mutateHistory } = useSWR(user ? "horus-history" : null, () => api.getChatHistory())
  const { data: deepagentsStatus } = useSWR(
    user ? "deepagents-status" : null,
    () => api.getDeepagentsStatus(),
    { revalidateOnFocus: false }
  )
  const { focusMode, setFocusMode } = useFocusMode()
  const { theme: _theme, setTheme, resolvedTheme } = useTheme()

  const lastAssistantMsgId = messages.filter((m) => m.role === "assistant").pop()?.id
  const lastAssistantMsg = messages.filter((m) => m.role === "assistant").pop()
  const activeAssistantMsg = status === "generating"
    ? (messages.find((m) => m.id === lastAssistantMsgId) ?? lastAssistantMsg)
    : [...messages].reverse().find((m) => m.role === "assistant" && !!m.pendingConfirmation)
  const activeThinkingSteps = activeAssistantMsg?.thinkingSteps ?? EMPTY_STRINGS
  const activeToolSteps = activeAssistantMsg?.toolSteps ?? EMPTY_TOOL_STEPS
  const activeFiles = activeAssistantMsg?.activeFiles ?? EMPTY_FILES
  const fileStatuses = activeAssistantMsg?.fileStatuses ?? EMPTY_FILE_STATUSES
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")
  const lastUserHasAttachments = !!lastUserMessage?.attachments?.length
  const preferArabicUi = containsArabic(lastUserMessage?.content) || messages.some((message) => containsArabic(message.content))

  // Handoff support: /platform/horus-ai?chat=<id>
  useEffect(() => {
    const chatIdFromQuery = searchParams.get("chat")
    if (!chatIdFromQuery || didLoadFromQueryRef.current) return
    if (currentChatId === chatIdFromQuery) {
      didLoadFromQueryRef.current = true
      return
    }

    didLoadFromQueryRef.current = true
    loadChat(chatIdFromQuery).catch(() => {
      // loadChat already surfaces toast errors.
    })
  }, [searchParams, currentChatId, loadChat])

  useEffect(() => {
    const chatIdFromQuery = searchParams.get("chat")
    if (chatIdFromQuery || didLoadFromQueryRef.current) return
    if (typeof window === "undefined") return
    const lastChatId = window.localStorage.getItem(LAST_CHAT_STORAGE_KEY)
    if (!lastChatId || currentChatId === lastChatId) return

    didLoadFromQueryRef.current = true
    loadChat(lastChatId).catch(() => {
      window.localStorage.removeItem(LAST_CHAT_STORAGE_KEY)
    })
  }, [searchParams, currentChatId, loadChat])

  useEffect(() => {
    const currentUrlChatId = searchParams.get("chat")
    if (currentChatId === currentUrlChatId) return

    const nextParams = new URLSearchParams(searchParams.toString())
    if (currentChatId) nextParams.set("chat", currentChatId)
    else nextParams.delete("chat")

    const nextQuery = nextParams.toString()
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname
    router.replace(nextUrl, { scroll: false })
  }, [currentChatId, pathname, router, searchParams])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (currentChatId) window.localStorage.setItem(LAST_CHAT_STORAGE_KEY, currentChatId)
    else window.localStorage.removeItem(LAST_CHAT_STORAGE_KEY)
  }, [currentChatId])

  // Check if user is near bottom (within 100px)
  const checkNearBottom = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return true
    const { scrollTop, scrollHeight, clientHeight } = el
    const threshold = 100
    return scrollTop + clientHeight >= scrollHeight - threshold
  }, [])

  // Scroll handler: update isNearBottom (debounced)
  const handleScroll = useCallback(() => {
    const near = checkNearBottom()
    setIsNearBottom(near)
    if (near) userRequestedScrollRef.current = false
  }, [checkNearBottom])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    let raf: number
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(handleScroll)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      el.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [handleScroll])

  // Re-check near-bottom when chat switches or messages load (after layout)
  useEffect(() => {
    if (isEmpty) return
    const el = scrollContainerRef.current
    if (!el) return
    const check = () => {
      const near = el.scrollTop + el.clientHeight >= el.scrollHeight - 100
      setIsNearBottom(near)
    }
    const t = setTimeout(check, 100)
    return () => clearTimeout(t)
  }, [currentChatId, isEmpty, messages.length])

  // Smart auto-scroll: only when near bottom or user just clicked "scroll to bottom"
  useEffect(() => {
    if (!messagesEndRef.current) return
    if (isNearBottom || userRequestedScrollRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, status, isNearBottom])

  // L2: Keyboard shortcut — Ctrl/Cmd+N → new chat (⌘K is reserved for the global command palette)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault()
        newChat()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [newChat])

  // Enhancement: Document title + favicon update during agent processing
  useEffect(() => {
    const originalTitle = document.title
    if (status === "generating") {
      const goalText = activeAssistantMsg?.agentRun?.goal
      if (activeResponseMode === "agent" && goalText) {
        document.title = `⚡ ${goalText.slice(0, 40)}… — Horus AI`
      } else if (activeResponseMode === "think") {
        document.title = `🧠 Thinking… — Horus AI`
      } else {
        document.title = `✨ Generating… — Horus AI`
      }
    }
    return () => { document.title = originalTitle }
  }, [status, activeResponseMode, activeAssistantMsg?.agentRun?.goal])

  // Enhancement: Escape key to cancel pending confirmation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeAssistantMsg?.pendingConfirmation) {
        e.preventDefault()
        resolveActionConfirmation(activeAssistantMsg.pendingConfirmation.id, "cancel")
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [activeAssistantMsg?.pendingConfirmation, resolveActionConfirmation])

  // Cleanup on unmount to prevent ghost streams
  useEffect(() => {
    return () => {
      stopGeneration()
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Drive reasoning UI from real backend thinking events.
  useEffect(() => {
    if (activeThinkingSteps.length === 0) return

    setReasoning((prev) => {
      const base = prev && !prev.isComplete ? prev : {
        steps: [] as { text: string; status: "pending" | "active" | "done" }[],
        startTime: Date.now(),
        duration: null,
        isExpanded: thinkingPanelExpanded,
        isComplete: false,
        tempUserMessage: null,
      }

      const nextSteps = activeThinkingSteps.map((text, idx) => ({
        text,
        status: idx === activeThinkingSteps.length - 1 ? ("active" as const) : ("done" as const),
      }))

      return {
        ...base,
        steps: nextSteps,
        isExpanded: thinkingPanelExpanded,
        isComplete: false,
      }
    })

    // Real backend steps take priority over fallback animation.
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
    fallbackQueueRef.current = []
  }, [activeThinkingSteps, thinkingPanelExpanded])

  useEffect(() => {
    if (prevStatusRef.current === "generating" && status === "idle") {
      setCompletionPulseKey((k) => k + 1)
      // Sound notification on completion (respect user preference)
      if (typeof window !== "undefined" && soundEnabled) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.setValueAtTime(880, ctx.currentTime)
          osc.frequency.setValueAtTime(660, ctx.currentTime + 0.05)
          gain.gain.setValueAtTime(0.05, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.15)
        } catch (_) {}
      }
    }
    prevStatusRef.current = status
  }, [status, soundEnabled])

  useEffect(() => {
    if (status !== "idle") return

    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
    fallbackQueueRef.current = []

    setReasoning((prev) => {
      if (!prev || prev.isComplete || prev.steps.length === 0) return prev
      return {
        ...prev,
        steps: prev.steps.map((s) => ({ ...s, status: "done" as const })),
        isComplete: true,
        isExpanded: thinkingPanelExpanded,
        duration: prev.duration ?? (Date.now() - prev.startTime) / 1000,
        tempUserMessage: null,
      }
    })
  }, [status, thinkingPanelExpanded])

  // Seed fallback reasoning steps for Think mode when backend sends no __THINKING__
  useEffect(() => {
    if (status !== "generating" || activeThinkingSteps.length > 0) return
    if (activeResponseMode !== "think") return

    const lastUser = [...messages].reverse().find((m) => m.role === "user")
    const hasFiles = !!(lastUser?.attachments?.length)
    const text = lastUser?.content ?? ""
    const steps = getReasoningSteps(text, !!hasFiles)
    if (steps.length > 0) {
      fallbackQueueRef.current = steps
      setReasoning((prev) => {
        const base = prev && !prev.isComplete ? prev : {
          steps: [] as { text: string; status: "pending" | "active" | "done" }[],
          startTime: Date.now(),
          duration: null,
          isExpanded: true,
          isComplete: false,
          tempUserMessage: null,
        }
        const first = steps[0]
        return {
          ...base,
          steps: [{ text: first, status: "active" as const }],
          isExpanded: true,
          isComplete: false,
        }
      })
    }
  }, [status, activeThinkingSteps.length, activeResponseMode, messages])

  // Fallback sequential animation for non-tool/general chat when no __THINKING__ steps are emitted.
  useEffect(() => {
    if (status !== "generating") return
    if (activeThinkingSteps.length > 0) return
    if (fallbackTimerRef.current) return

    fallbackTimerRef.current = setInterval(() => {
      setReasoning((prev) => {
        if (!prev || prev.isComplete) return prev
        if (activeThinkingSteps.length > 0) return prev

        const steps = [...prev.steps]
        const activeIndex = steps.findIndex((s) => s.status === "active")
        if (activeIndex >= 0) steps[activeIndex] = { ...steps[activeIndex], status: "done" }

        const next = fallbackQueueRef.current.shift()
        if (next) {
          steps.push({ text: next, status: "active" })
          return { ...prev, steps }
        }

        return { ...prev, steps }
      })
    }, 700)

    return () => {
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }
    }
  }, [status, activeThinkingSteps.length])

  // Collapse smoothly once real assistant content starts streaming.
  useEffect(() => {
    if (status !== "generating") return
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")
    if (!lastAssistant?.content?.trim()) return

    setReasoning((prev) => {
      if (!prev || prev.isComplete) return prev
      const alreadyHasGeneration = prev.steps.some((s) => s.text === "Generating response...")
      const steps = alreadyHasGeneration
        ? prev.steps.map((s) => ({ ...s, status: "done" as const }))
        : [...prev.steps.map((s) => ({ ...s, status: "done" as const })), { text: "Generating response...", status: "done" as const }]
      return {
        ...prev,
        steps,
        isComplete: true,
        isExpanded: false,
        duration: prev.duration ?? (Date.now() - prev.startTime) / 1000,
        tempUserMessage: null,
      }
    })
  }, [messages, status])

  // Confirmation phase step.
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")
    if (!lastAssistant?.pendingConfirmation) return

    setReasoning((prev) => {
      if (!prev) return prev
      const exists = prev.steps.some((s) => s.text === "Ready to execute — please confirm")
      if (exists) return prev
      return {
        ...prev,
        steps: [...prev.steps.map((s) => ({ ...s, status: "done" as const })), { text: "Ready to execute — please confirm", status: "done" as const }],
        isComplete: true,
        isExpanded: false,
        duration: prev.duration ?? (Date.now() - prev.startTime) / 1000,
      }
    })
  }, [messages])

  // M1: Copy message text to clipboard
  const handleCopy = useCallback(async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMsgId(msgId)
      setTimeout(() => setCopiedMsgId(null), 2000)
    } catch {
      toast.error("Clipboard unavailable")
    }
  }, [])

  // M2: Wire feedback to backend (tiered: category + optional comment for thumbs down)
  const handleFeedback = useCallback(async (
    msgId: string,
    rating: "up" | "down",
    category?: string,
    comment?: string
  ) => {
    if (rating === "up") {
      const next = feedback[msgId] === "up" ? null : "up"
      setFeedback(prev => ({ ...prev, [msgId]: next }))
      setFeedbackDownExpanded(null)
      setFeedbackTellMore(prev => { const p = { ...prev }; delete p[msgId]; return p })
      if (!next) return
      try {
        await api.submitMessageFeedback(msgId, currentChatId, next)
        setFeedbackPersisted(prev => new Set([...prev, msgId]))
      } catch { /* optimistic state kept */ }
      return
    }
    // Thumbs down: toggle or expand for tiered feedback
    if (feedback[msgId] !== "down") {
      setFeedback(prev => ({ ...prev, [msgId]: "down" }))
      setFeedbackDownExpanded(msgId)
      return
    }
    // Already down — if category/comment provided, submit and close
    if (category || comment) {
      try {
        await api.submitMessageFeedback(msgId, currentChatId, "down", category, comment)
        setFeedbackPersisted(prev => new Set([...prev, msgId]))
      } catch { /* optimistic state kept */ }
      setFeedbackDownExpanded(null)
      setFeedbackTellMore(prev => { const p = { ...prev }; delete p[msgId]; return p })
    } else {
      // Un-vote
      setFeedback(prev => ({ ...prev, [msgId]: null }))
      setFeedbackDownExpanded(null)
      setFeedbackTellMore(prev => { const p = { ...prev }; delete p[msgId]; return p })
    }
  }, [feedback, currentChatId])

  // M8: Export conversation as .txt download
  const handleExportChat = useCallback(() => {
    if (!messages.length) return
    const lines = messages
      .filter(m => m.role !== "system")
      .map(m => `[${m.role.toUpperCase()}]\n${m.content}\n`)
      .join("\n---\n\n")
    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `horus-chat-${new Date().toISOString().slice(0,10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Chat exported")
  }, [messages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB hard limit
    const PDF_INLINE_LIMIT = 5 * 1024 * 1024 // 5MB — above this, Gemini inline limit risks
    const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]

    const files = Array.from(e.target.files || [])

    if (files.length + attachedFiles.length > 5) {
      toast.error("Maximum 5 files can be attached at once.")
      return
    }

    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
        return false
      }
      // M4: Large PDF guard — warn user to upload via Evidence Vault instead
      if (file.type === "application/pdf" && file.size > PDF_INLINE_LIMIT) {
        toast.warning(
          `${file.name} is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Large PDFs are best uploaded via the Evidence Vault for full processing.`,
          { duration: 5000 }
        )
        // Still allow it — just warn the user
      }
      if (!file.type.startsWith("image/") && !ALLOWED_TYPES.includes(file.type)) {
        toast.error(`File ${file.name} has an unsupported type.`)
        return false
      }
      return true
    })

    const newFiles: AttachedFile[] = validFiles.slice(0, 5 - attachedFiles.length).map((file) => ({
      id: crypto.randomUUID(),
      file,
      type: file.type.startsWith("image/") ? "image" : "document",
    }))

    newFiles.forEach((f) => {
      if (f.type === "image") {
        const reader = new FileReader()
        reader.onload = (e) => {
          setAttachedFiles((prev) =>
            prev.map((item) => (item.id === f.id ? { ...item, preview: e.target?.result as string } : item))
          )
        }
        reader.readAsDataURL(f.file)
      }
    })

    setAttachedFiles((prev) => [...prev, ...newFiles])
    if (e.target) e.target.value = ""
  }

  const handleSendMessage = async (text: string, files?: File[]) => {
    setActiveResponseMode(responseMode)
    const filesToUpload = files ?? attachedFiles.map((af) => af.file)
    setAttachedFiles([])
    const attachments = (files ?? attachedFiles).map((file, idx) => {
      const isFile = file instanceof File
      const fallback = attachedFiles[idx]
      const fileType = (isFile ? file.type : file.file.type).startsWith("image/") ? "image" : "document"
      return {
        name: isFile ? file.name : file.file.name,
        type: fileType as "image" | "document",
        preview: fallback?.preview,
      }
    })
    await sendMessage(text || " ", filesToUpload.length ? filesToUpload : undefined, {
      responseMode,
      attachments,
      visibleText: text,
    })
    setDraftMessage("")
    setInputResetKey((prev) => prev + 1)
    mutateHistory()
  }

  const showLoadingBubble = status === "generating" && lastAssistantMsg && !lastAssistantMsg.content?.trim()
  const isAskLoading = showLoadingBubble && activeResponseMode === "ask"
  const shouldShowAskAttachmentLoader = showLoadingBubble && activeResponseMode === "ask" && lastUserHasAttachments

  const isProcessing = status !== "idle"
  const currentResponseMode = RESPONSE_MODES.find((mode) => mode.key === responseMode) ?? RESPONSE_MODES[0]
  const modeTone = responseMode === "ask"
    ? "text-sky-400"
    : responseMode === "think"
      ? "text-amber-400"
      : "text-emerald-400"

  const handleDeepResearch = useCallback(async () => {
    const prompt = draftMessage.trim()
    if (!prompt) {
      toast.error("Write a research prompt first.")
      return
    }
    if (!deepagentsStatus?.enabled || !deepagentsStatus?.provider_ready) {
      toast.error("Deep Research is not ready yet.")
      return
    }
    if (isProcessing || deepResearchRunning) return

    setDeepResearchRunning(true)
    try {
      const result = await api.runDeepResearch(prompt, currentChatId)
      const now = Date.now()
      const researchMessages: HorusMessage[] = [
        {
          id: crypto.randomUUID(),
          role: "user",
          content: prompt,
          timestamp: now,
          responseMode: "agent",
        },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.result?.trim()
            ? `## Deep Research\n\n${result.result}`
            : "Deep Research completed, but no text result was returned.",
          timestamp: now + 1,
        },
      ]
      appendMessages(researchMessages)
      setDraftMessage("")
      setInputResetKey((prev) => prev + 1)
      toast.success("Deep Research finished")
    } catch (error: any) {
      toast.error(error?.message || "Deep Research failed")
    } finally {
      setDeepResearchRunning(false)
    }
  }, [appendMessages, currentChatId, deepResearchRunning, deepagentsStatus?.enabled, deepagentsStatus?.provider_ready, draftMessage, isProcessing])

  useEffect(() => {
    if (status !== "idle" || !currentChatId) return
    mutateHistory()
  }, [status, currentChatId, mutateHistory])

  const handleAction = async (type: string, payload: string) => {
    if (type === 'gap_report') {
      toast.promise(api.downloadGapAnalysisReport(payload), {
        loading: "Generating PDF report...",
        success: "Report downloaded!",
        error: "Failed to download report."
      })
    } else if (type === 'view_gap') {
      router.push(`/platform/gap-analysis?highlight=${payload}`)
    } else if (type === 'run_analysis') {
      router.push(`/platform/gap-analysis?standardId=${payload}&autoRun=true`)
    } else if (type === 'link_evidence') {
      router.push(`/platform/evidence?highlight=${payload}`)
    }
  }

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.deleteChat(id)
      mutateHistory()
      if (currentChatId === id) newChat()
      toast.success("Thread deleted")
    } catch (err) {
      toast.error("Failed to delete.")
    }
  }

  const visibleMessages = useMemo(() => {
    const sliced = messages.slice(-30).filter((msg) => {
      if ((msg.content || "").toUpperCase().startsWith("EVENT:")) return false
      return true
    })
    return sliced.filter((msg, idx, arr) => {
      if (msg.role !== "assistant") return true
      const current = (msg.content || "").trim()
      if (!current || current.length < 180) return true
      const prev = arr.slice(0, idx).reverse().find((m) => m.role === "assistant")
      if (!prev) return true
      return current !== (prev.content || "").trim()
    })
  }, [messages])

  const filteredHistory = useMemo(() => {
    if (!historyQuery.trim()) return history ?? []
    const needle = historyQuery.trim().toLowerCase()
    return (history ?? []).filter((session: any) =>
      [session.title, session.description]
        .filter(Boolean)
        .some((value: string) => value.toLowerCase().includes(needle))
    )
  }, [history, historyQuery])

  const copySessionLink = useCallback(async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const url = typeof window !== "undefined"
        ? `${window.location.origin}${pathname}?chat=${encodeURIComponent(sessionId)}`
        : `${pathname}?chat=${encodeURIComponent(sessionId)}`
      await navigator.clipboard.writeText(url)
      setCopiedSessionId(sessionId)
      setTimeout(() => setCopiedSessionId((current) => current === sessionId ? null : current), 1800)
      toast.success("Chat link copied")
    } catch {
      toast.error("Failed to copy chat link")
    }
  }, [pathname])

  return (
      <div className="flex flex-col h-full min-h-0 bg-transparent relative overflow-hidden">
      
      {/* New + History as floating top-right */}
      <div className="absolute right-3 top-4 z-20 flex items-center gap-1.5 sm:right-3 sm:top-3 sm:gap-1">
        {currentChatId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => copySessionLink(currentChatId, e as unknown as React.MouseEvent)}
            className="horus-tool-button h-8 w-8 p-0 md:h-8 md:w-8"
            title="Copy active chat link"
          >
            {copiedSessionId === currentChatId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={newChat} className="horus-tool-button h-8 w-8 p-0 md:h-8 md:w-8" title="New chat (⌘N)">
          <PlusCircle className="h-4 w-4" />
        </Button>
        <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="horus-tool-button h-8 w-8 p-0 md:h-8 md:w-8" title="History" onClick={() => setHistorySheetOpen(true)}>
              <History className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="inset-x-3 top-6 bottom-6 h-auto w-auto overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117]/96 p-0 text-foreground shadow-[0_28px_80px_-38px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:inset-y-4 sm:right-4 sm:left-auto sm:w-[360px] sm:max-w-[360px]">
            <div className="flex items-center justify-between border-b border-white/8 px-5 pb-4 pt-5 pr-14 sm:px-5 sm:pb-4 sm:pt-5">
              <h2 className="text-base font-semibold tracking-tight text-foreground">Session History</h2>
              <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-muted-foreground/75">
                ⌘N new chat
              </span>
            </div>
            <ScrollArea className="h-[calc(100dvh-8.25rem)] sm:h-[calc(100dvh-7rem)]">
              <div className="space-y-2.5 p-3 sm:p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/45" />
                  <input
                    value={historyQuery}
                    onChange={(e) => setHistoryQuery(e.target.value)}
                    placeholder="Search chats"
                    className="h-9 w-full rounded-lg border border-white/8 bg-white/[0.03] pl-9 pr-3 text-[12px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-primary/30"
                  />
                </div>
                {(!history || history.length === 0) ? (
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] px-5 py-10 text-center sm:py-12">
                    <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/25" />
                    <p className="text-xs font-medium text-muted-foreground/75">No chat history</p>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] px-5 py-10 text-center sm:py-12">
                    <Search className="mx-auto mb-2 h-7 w-7 text-muted-foreground/25" />
                    <p className="text-xs font-medium text-muted-foreground/75">No chats match your search</p>
                  </div>
                ) : (
                  filteredHistory.map((session: any) => (
                    <div
                      key={session.id}
                      onClick={() => { setHistorySheetOpen(false); loadChat(session.id) }}
                      className={cn(
                        "group relative cursor-pointer rounded-xl border px-3.5 py-3 transition-all",
                        currentChatId === session.id
                          ? "border-primary/35 bg-primary/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                          : "border-white/8 bg-white/[0.02] hover:border-white/14 hover:bg-white/[0.035]"
                      )}
                    >
                      {currentChatId === session.id && (
                        <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-primary/80" />
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("pr-6 text-[13px] font-medium leading-snug", currentChatId === session.id ? "text-primary" : "text-foreground/92")}>
                          {session.title || "Untitled Conversation"}
                        </p>
                        <div className="flex items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                          <button
                            onClick={(e) => copySessionLink(session.id, e)}
                            className="rounded-md p-1.5 text-muted-foreground/45 transition-all hover:bg-white/[0.04] hover:text-foreground"
                            title="Copy chat link"
                          >
                            {copiedSessionId === session.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={(e) => deleteSession(session.id, e)}
                            className="rounded-md p-1.5 text-muted-foreground/45 transition-all hover:bg-white/[0.04] hover:text-destructive"
                            title="Delete chat"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {session.description && (
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/70">
                          {session.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-[10px] font-medium text-muted-foreground/60">
                          {new Date(session.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {session.messageCount > 0 && (
                          <span className="rounded-md border border-white/8 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/75">
                            {session.messageCount}m
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* ─── Chat Area (full height, centered) ─── */}
      <div className="flex-1 overflow-hidden relative flex flex-col items-center w-full">
        <div
          ref={scrollContainerRef}
          className={cn(
            "flex-1 w-full px-3 pt-6 custom-scrollbar flex flex-col items-center sm:px-6 sm:pt-8",
            isEmpty ? "overflow-hidden pb-0" : "overflow-y-auto pb-40 md:pb-28"
          )}
        >
          <div className={cn("flex-1 w-full max-w-[760px] flex flex-col", isEmpty ? "min-h-0" : "gap-6 pb-4")}>
            {isEmpty ? (
              <div className="flex min-h-0 w-full flex-1 items-center justify-center pb-40 md:pb-36">
                <div className="flex max-h-full min-h-0 w-full flex-col items-center justify-center gap-5 py-2 md:gap-7">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center"
                  >
                    <AiLoader size={200} text="Horus AI" />
                  </motion.div>
                  <div className="max-w-[560px] text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Your compliance agent</h1>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Ask a question, attach evidence, or let Horus reason through standards, gaps, and remediation work.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground/70">
                      <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">Chat</span>
                      <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">Reason</span>
                      <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">Run tasks</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.length > 30 && (
                  <div className="flex justify-center py-3">
                    <span className="glass-pill glass-text-secondary px-3 py-1 text-[11px]">
                      Showing latest 30 of {messages.length} messages
                    </span>
                  </div>
                )}
                {visibleMessages.map((msg, idx) => {
                  if (msg.role === "system") {
                    return (
                      <div key={msg.id} className="flex justify-center my-2 animate-in fade-in">
                        <span className="glass-pill glass-text-secondary px-3 py-1 text-[10px] uppercase tracking-wider font-bold">
                          {msg.content}
                        </span>
                      </div>
                    )
                  }

                  const isStreamingThis = status === "generating" && msg.role === "assistant" && msg.id === lastAssistantMsgId
                  const relatedUserMessage =
                    msg.role === "assistant"
                      ? [...visibleMessages.slice(0, idx)].reverse().find((entry) => entry.role === "user")
                      : null
                  const isArabicMessage = containsArabic(msg.content)
                  const assistantSourceLabel = msg.role === "assistant" ? getAttachmentContextLabel(relatedUserMessage, isArabicMessage) : null
                  const isAgentMessage = msg.role === "assistant" && msg.responseMode === "agent"
                  const hasToolState = (msg.toolSteps?.length ?? 0) > 0 || !!msg.pendingConfirmation
                  const hasRenderableAssistantBody =
                    msg.role === "assistant" &&
                    (
                      !!msg.content?.trim() ||
                      !!(msg as any).structuredResult ||
                      !!msg.pendingConfirmation ||
                      ((msg as any).citations?.length ?? 0) > 0
                    )
                  const shouldHideAssistantPlaceholder =
                    msg.role === "assistant" &&
                    isStreamingThis &&
                    !msg.content?.trim() &&
                    !(msg as any).structuredResult &&
                    !msg.pendingConfirmation

                  if (shouldHideAssistantPlaceholder) {
                    return null
                  }

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full"
                    >
                      {msg.role === "user" ? (
                        <div className="flex w-full flex-col items-end py-2 sm:py-4">
                           <div className="horus-user-bubble max-w-[90%] whitespace-pre-wrap rounded-[22px] rounded-tr-md px-4 py-3 text-[14px] font-medium leading-6 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.52)] sm:max-w-[82%]">
                             {msg.content}
                           </div>
                           {msg.attachments && msg.attachments.length > 0 && (
                           <div className="mt-2 flex max-w-[85%] flex-wrap justify-end gap-2">
                              {msg.attachments.map((file, idx) => (
                                <div key={`${msg.id}-att-${idx}`} className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-2.5 py-2 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.8)]">
                                  {file.type === "image" && file.preview ? (
                                    <img src={file.preview} alt={file.name} className="h-10 w-10 rounded-lg object-cover" />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/8 bg-primary/10">
                                      <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="max-w-[140px] truncate text-[11px] font-medium text-foreground/90">{file.name}</div>
                                    <div className="text-[10px] text-muted-foreground/60">{file.type === "image" ? "Image" : "Document"}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                           )}
                           <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground/60 sm:mt-2">
                             {msg.responseMode && (
                               <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
                                 {msg.responseMode}
                               </span>
                             )}
                             <span>{formatTimestamp(msg.timestamp, isArabicMessage)}</span>
                           </div>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "w-full space-y-2 py-2 sm:space-y-3 sm:py-4",
                            msg.id === lastAssistantMsgId && status === "idle" && completionPulseKey > 0 && "horus-completion-pulse"
                          )}
                        >
                          {/* Inline thinking disabled for cleaner UI */}

                          {msg.role === "assistant" && msg.responseMode === "agent" && msg.agentRun && (
                            <AgentRunHeader meta={msg.agentRun} isArabic={isArabicMessage} />
                          )}

                          {/* Agent execution timeline — only show when there is real agent/tool state */}
                          {msg.role === "assistant" &&
                            msg.id === lastAssistantMsgId &&
                            isAgentMessage &&
                            hasToolState &&
                            (() => {
                              const msgThinkingSteps = msg.thinkingSteps ?? EMPTY_STRINGS
                              const msgToolSteps = msg.toolSteps ?? EMPTY_TOOL_STEPS
                              const msgActiveFiles = msg.activeFiles ?? EMPTY_FILES
                              const msgFileStatuses = msg.fileStatuses ?? EMPTY_FILE_STATUSES
                              const { steps, phase, stepProgress } = deriveAgentSteps(
                                msgThinkingSteps,
                                msg.pendingConfirmation ?? null,
                                !!(msg as any).structuredResult,
                                status === "generating",
                                msgToolSteps
                              )
                              if (steps.length === 0 && !msg.pendingConfirmation) return null
                              return (
                                <div className="mb-2">
                                  <LiveTaskCards
                                    phase={phase}
                                    stepProgress={stepProgress}
                                    activeFiles={msgActiveFiles}
                                    isArabic={isArabicMessage}
                                  />
                                  <div className="mt-2">
                                  <AgentExecutionTimeline
                                    steps={steps}
                                    phase={phase}
                                    stepProgress={stepProgress}
                                    pendingTool={msg.pendingConfirmation?.title}
                                    isWaitingConfirmation={!!msg.pendingConfirmation}
                                    activeFiles={msgActiveFiles}
                                    fileStatuses={msgFileStatuses}
                                    isArabic={isArabicMessage}
                                    collapsible
                                    compact
                                  />
                                  </div>
                                </div>
                              )
                            })()}

                          {/* Agent Structured Result — rendered ABOVE the text content */}
                          {msg.role === "assistant" && (msg as any).structuredResult && (
                            <motion.div
                              className="mb-3"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            >
                              <AgentResultRenderer result={(msg as any).structuredResult} />
                            </motion.div>
                          )}

                          {/* Pending action confirmation */}
                          {msg.role === "assistant" && msg.pendingConfirmation && (
                            <SmartConfirmationCard
                              title={msg.pendingConfirmation.title}
                              description={msg.pendingConfirmation.description}
                              isArabic={isArabicMessage}
                              onConfirm={() => resolveActionConfirmation(msg.pendingConfirmation!.id, "confirm")}
                              onCancel={() => resolveActionConfirmation(msg.pendingConfirmation!.id, "cancel")}
                            />
                          )}

                          {msg.content ? (
                            <>
                              <AssistantMessageMeta
                                mode={msg.responseMode}
                                sourceLabel={assistantSourceLabel}
                                timestamp={msg.timestamp}
                                isArabic={isArabicMessage}
                              />
                              <div
                                dir="auto"
                                aria-live={isStreamingThis ? "polite" : undefined}
                                aria-atomic={isStreamingThis ? false : undefined}
                                aria-busy={isStreamingThis}
                                className={cn(
                                  "horus-assistant-bubble horus-markdown-wrapper w-full max-w-none rounded-[20px] rounded-tl-md border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.016))] px-4 py-4 text-[15px] leading-7 text-foreground prose text-start shadow-[0_18px_40px_-36px_rgba(15,23,42,0.92),inset_0_1px_0_rgba(255,255,255,0.02)] [unicode-bidi:plaintext] dark:prose-invert sm:px-5 sm:py-[18px]",
                                  isStreamingThis && "horus-streaming-active"
                                )}
                              >
                                {(() => {
                                  const isLong = msg.content.length > COLLAPSE_THRESHOLD && !isStreamingThis
                                  const isExpanded = expandedMsgIds.has(msg.id)
                                  const showContent = !isLong || isExpanded
                                  return (
                                    <>
                                      <StreamingAssistantContent
                                        content={showContent ? msg.content : msg.content.slice(0, COLLAPSE_THRESHOLD) + "…"}
                                        isStreaming={isStreamingThis}
                                        speedMs={isStreamingThis && activeResponseMode === "ask" ? 30 : 160}
                                        onAction={handleAction}
                                      />
                                      {isStreamingThis && (
                                        <span className="ml-1 inline-flex items-center gap-0.5 align-middle">
                                          <span
                                            className="horus-stream-cursor inline-block h-[1em] w-[3px] rounded-sm bg-primary align-middle"
                                            style={{ marginLeft: "2px" }}
                                          />
                                        </span>
                                      )}
                                      {isLong && (
                                        <button
                                          type="button"
                                          onClick={() => setExpandedMsgIds((s) => {
                                            const next = new Set(s)
                                            if (isExpanded) next.delete(msg.id)
                                            else next.add(msg.id)
                                            return next
                                          })}
                                          className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-primary transition-colors hover:border-primary/25 hover:text-primary/80"
                                        >
                                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                          {isExpanded
                                            ? (isArabicMessage ? "عرض أقل" : "Show less")
                                            : (isArabicMessage ? "عرض المزيد" : "Show more")}
                                        </button>
                                      )}
                                    </>
                                  )
                                })()}
                              </div>
                            </>
                          ) : msg.role === "assistant" &&
                            msg.id === lastAssistantMsgId &&
                            status === "idle" &&
                            !(msg as any).structuredResult &&
                            ((msg.thinkingSteps?.length ?? 0) > 0 || [...messages].reverse().find((m) => m.role === "user")?.attachments?.length) ? (
                            <div className="horus-assistant-bubble rounded-3xl rounded-tl-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3.5 text-sm text-muted-foreground">
                              {isArabicMessage
                                ? "التحليل لم يُولّد. يرجى المحاولة مرة أخرى أو إرفاق ملف مختلف."
                                : "No response was generated. Please retry or attach a different file."}
                            </div>
                          ) : null}

                          {/* Confidence indicator — when RAG sources cited */}
                          {msg.role === "assistant" && (msg as any).citations?.length > 0 && (
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {isArabicMessage ? "استنادًا إلى الأدلة المرفقة" : "Based on your evidence"}
                            </div>
                          )}

                          {/* Citation sources — RAG sources when available */}
                          {msg.role === "assistant" && (msg as any).citations?.length > 0 && (
                            <div className="mt-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--glass-panel)]/60 p-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{isArabicMessage ? "المصادر" : "Sources"}</p>
                              <div className="space-y-2">
                                {(msg as any).citations.map((src: CitationSource, idx: number) => (
                                  <a
                                    key={src.document_id}
                                    href={`/platform/evidence?highlight=${encodeURIComponent(src.document_id)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex gap-2 rounded-xl border border-[var(--border-subtle)]/60 bg-background/50 p-2.5 text-left hover:bg-primary/5 hover:border-primary/20 transition-colors"
                                  >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                                      {idx + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[12px] font-medium text-foreground truncate">
                                        {src.title || `Document ${src.document_id.slice(0, 8)}`}
                                      </p>
                                      {src.excerpt && (
                                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                                          {src.excerpt}
                                        </p>
                                      )}
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Suggested next-step actions — shown after last assistant message when idle */}
                          {msg.role === "assistant" &&
                            msg.id === lastAssistantMsgId &&
                            status === "idle" &&
                            !!(msg as any).agentSuggestions?.length && (
                            <SuggestedActionsPanel
                              suggestions={(msg as any).agentSuggestions}
                              onSelect={(prompt) => handleSendMessage(prompt)}
                              isArabic={isArabicMessage}
                            />
                          )}

                          {/* Context / token limit warning */}
                          {msg.role === "assistant" && (msg as any).contextLimitHit && (
                            <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                              <span className="mt-0.5 shrink-0">⚠️</span>
                              <span>
                                {isArabicMessage
                                  ? "الرد اتقطع لأن الإجابة وصلت للحد الأقصى للتوكنز. لو محتاج تكملة، ابعت رسالة جديدة بـ \"كمّل\" أو اسأل من حيث وقف."
                                  : "Response was cut off because it reached the output token limit. Send a new message saying \"continue\" to get the rest."}
                              </span>
                            </div>
                          )}

                          {/* Regenerate (last only) + Copy + Feedback — on completed assistant messages */}
                          {msg.role === "assistant" && status === "idle" && hasRenderableAssistantBody && (
                            <div className="relative mt-2 flex w-fit flex-wrap items-center gap-1 rounded-full border border-white/8 bg-white/[0.02] px-1.5 py-1.5 shadow-[0_12px_28px_-24px_rgba(0,0,0,0.85)] sm:mt-3">
                              {/* Regenerate — only on last message */}
                              {msg.id === lastAssistantMsgId && (
                                <>
                                  <button
                                    onClick={() => retryLastMessage()}
                                    className="horus-tool-button inline-flex h-8 w-8 items-center justify-center rounded-md md:h-8 md:w-8"
                                    title={isArabicMessage ? "إعادة توليد الرد" : "Regenerate response"}
                                  >
                                    <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  </button>
                                  <div className="mx-0.5 h-3 w-px bg-white/10" />
                                </>
                              )}
                              {msg.id === lastAssistantMsgId && (
                                <>
                                  <button
                                    onClick={handleExportChat}
                                    className="horus-tool-button inline-flex h-8 w-8 items-center justify-center rounded-md md:h-8 md:w-8"
                                    title={isArabicMessage ? "تصدير المحادثة" : "Export chat (.txt)"}
                                  >
                                    <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  </button>
                                  <div className="mx-0.5 h-3 w-px bg-white/10" />
                                </>
                              )}
                              {/* M1: Copy */}
                              {msg.content && (
                                <button
                                  onClick={() => handleCopy(msg.id, msg.content)}
                                  className={cn(
                                    "horus-tool-button inline-flex h-8 w-8 items-center justify-center rounded-md md:h-8 md:w-8",
                                    copiedMsgId === msg.id
                                      ? "text-green-500 bg-green-500/10"
                                      : ""
                                  )}
                                  title={copiedMsgId === msg.id ? (isArabicMessage ? "تم النسخ" : "Copied!") : (isArabicMessage ? "نسخ الرد" : "Copy response")}
                                >
                                  {copiedMsgId === msg.id ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                                </button>
                              )}
                              {/* Divider */}
                              <div className="mx-0.5 h-3 w-px bg-white/10" />
                              {/* M2: Feedback */}
                              <button
                                onClick={() => handleFeedback(msg.id, "up")}
                                className={cn(
                                  "horus-tool-button inline-flex h-8 w-8 items-center justify-center rounded-md md:h-8 md:w-8",
                                  feedback[msg.id] === "up"
                                    ? "text-green-500 bg-green-500/10"
                                    : "hover:text-green-500 hover:bg-green-500/10"
                                )}
                                title={isArabicMessage ? "مفيد" : "Helpful"}
                              >
                                <ThumbsUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (feedback[msg.id] === "down" && feedbackDownExpanded === msg.id) {
                                    setFeedbackDownExpanded(null)
                                    return
                                  }
                                  handleFeedback(msg.id, "down")
                                }}
                                className={cn(
                                  "horus-tool-button inline-flex h-8 w-8 items-center justify-center rounded-md md:h-8 md:w-8",
                                  feedback[msg.id] === "down"
                                    ? "text-red-500 bg-red-500/10"
                                    : "hover:text-red-500 hover:bg-red-500/10"
                                )}
                                title={isArabicMessage ? "غير مفيد" : "Not helpful"}
                              >
                                <ThumbsDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </button>
                              {/* Tiered feedback: categories + Tell us more when thumbs down expanded */}
                              {feedback[msg.id] === "down" && feedbackDownExpanded === msg.id && !feedbackPersisted.has(msg.id) && (
                                <div className="absolute left-0 top-full z-10 mt-1.5 w-full min-w-[220px] rounded-2xl border border-white/10 bg-[rgba(11,14,22,0.94)] p-2.5 shadow-lg backdrop-blur-xl">
                                  <p className="text-[11px] font-medium text-muted-foreground mb-2">{isArabicMessage ? "ما المشكلة في الرد؟" : "What was wrong?"}</p>
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    {(isArabicMessage
                                      ? ["غير دقيق", "غير مرتبط", "ناقص", "مضر"]
                                      : ["Inaccurate", "Not relevant", "Incomplete", "Harmful"]
                                    ).map((cat) => (
                                      <button
                                        key={cat}
                                        type="button"
                                        onClick={() => handleFeedback(msg.id, "down", cat)}
                                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-muted/50 hover:bg-muted text-foreground"
                                      >
                                        {cat}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="border-t border-[var(--border-subtle)] pt-2">
                                    <textarea
                                      placeholder={isArabicMessage ? "أخبرنا بتفاصيل أكثر (اختياري)" : "Tell us more (optional)"}
                                      value={feedbackTellMore[msg.id] ?? ""}
                                      onChange={(e) => setFeedbackTellMore(prev => ({ ...prev, [msg.id]: e.target.value }))}
                                      className="w-full min-h-[60px] rounded-lg border border-[var(--border-subtle)] bg-background px-2.5 py-2 text-[12px] placeholder:text-muted-foreground/60 resize-none"
                                      rows={2}
                                    />
                                    <div className="flex justify-end gap-1.5 mt-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setFeedbackDownExpanded(null)}
                                        className="px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                                      >
                                        {isArabicMessage ? "إلغاء" : "Cancel"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleFeedback(msg.id, "down", undefined, feedbackTellMore[msg.id] || undefined)}
                                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                                      >
                                        {isArabicMessage ? "إرسال" : "Submit"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {/* Persisted check — shows after feedback is saved to backend */}
                              {feedbackPersisted.has(msg.id) && (
                                <span className="text-[10px] text-muted-foreground/60 font-medium ml-1">{isArabicMessage ? "تم الحفظ" : "Saved"}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )
                })}

                {showLoadingBubble && (
                  <div role="status" aria-live="polite" aria-label="Processing your request" className="w-full py-2 sm:py-4 animate-in fade-in">
                    {shouldShowAskAttachmentLoader ? (
                      <div className="flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[11px] text-muted-foreground shadow-[0_16px_36px_-28px_rgba(0,0,0,0.82)]">
                        <MiniOrb state="generating" className="scale-[0.82]" />
                        <span className="font-medium">{preferArabicUi ? "يحلل المرفق" : "Analyzing your attachment"}</span>
                      </div>
                    ) : (
                    activeResponseMode === "agent" &&
                    (activeAssistantMsg?.agentRun || activeThinkingSteps.length > 0 || activeToolSteps.length > 0 || messages.filter((m) => m.role === "assistant").pop()?.pendingConfirmation) ? (
                      (() => {
                        const lastMsg = activeAssistantMsg
                        const effectiveSteps = activeThinkingSteps.length > 0 ? activeThinkingSteps : []
                        const { steps, phase, stepProgress } = deriveAgentSteps(
                          effectiveSteps,
                          lastMsg?.pendingConfirmation ?? null,
                          !!(lastMsg as any)?.structuredResult,
                          status === "generating",
                          activeToolSteps
                        )
                        if (!lastMsg?.agentRun && steps.length === 0 && !lastMsg?.pendingConfirmation) return null
                        return (
                          <div className="space-y-2">
                            <AgentRunHeader meta={lastMsg?.agentRun} isArabic={preferArabicUi} />
                            <LiveTaskCards
                              phase={phase}
                              stepProgress={stepProgress}
                              activeFiles={activeFiles}
                              isArabic={preferArabicUi}
                            />
                            {(steps.length > 0 || lastMsg?.pendingConfirmation) && (
                              <AgentExecutionTimeline
                                steps={steps}
                                phase={phase}
                                stepProgress={stepProgress}
                                pendingTool={lastMsg?.pendingConfirmation?.title}
                                isWaitingConfirmation={!!lastMsg?.pendingConfirmation}
                                activeFiles={activeFiles}
                                fileStatuses={fileStatuses}
                                isArabic={preferArabicUi}
                                collapsible
                              />
                            )}
                          </div>
                        )
                      })()
                    ) : activeResponseMode === "think" && reasoning ? (
                      <ThinkStepper
                        steps={reasoning.steps}
                        isComplete={reasoning.isComplete}
                        duration={reasoning.duration}
                        compact
                      />
                    ) : isAskLoading ? (
                      <div className="flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[11px] text-muted-foreground shadow-[0_16px_36px_-28px_rgba(0,0,0,0.82)]">
                        <MiniOrb state="generating" className="scale-[0.82]" />
                        <span className="font-medium">{preferArabicUi ? "يكتب الرد" : "Writing the reply"}</span>
                      </div>
                    ) : (
                      <div className="flex w-fit max-w-full items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[11px] text-muted-foreground shadow-[0_16px_36px_-28px_rgba(0,0,0,0.82)]">
                        <MiniOrb state="generating" className="scale-[0.82]" />
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="font-medium text-foreground/88">
                            {getAgentActivityText({
                              mode: activeResponseMode,
                              status,
                              hasAttachments: lastUserHasAttachments,
                              isArabic: preferArabicUi,
                            })}
                          </span>
                          <span className="text-muted-foreground/45">·</span>
                          <div className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary horus-ask-dot" style={{ animationDelay: "0ms" }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-primary horus-ask-dot" style={{ animationDelay: "150ms" }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-primary horus-ask-dot" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stream error with retry */}
                {streamError && status === "idle" && (
                  <div className="w-full py-4 animate-in fade-in">
                    <div className="glass-panel flex items-center gap-3 rounded-2xl border-destructive/20 bg-destructive/5 p-4">
                      <div className="flex-1 text-sm text-destructive font-medium">{streamError}</div>
                      <button
                        onClick={() => retryLastMessage()}
                        className="glass-button flex min-h-[40px] items-center gap-1.5 rounded-xl bg-primary/90 px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry
                      </button>
                    </div>
                  </div>
                )}

                {/* Searching indicator removed for cleaner UI */}
              </>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Scroll-to-bottom button — when user scrolled up */}
        {!isEmpty && !isNearBottom && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 sm:bottom-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              type="button"
              onClick={() => {
                userRequestedScrollRef.current = true
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
              }}
              className="glass-pill glass-text-primary inline-flex items-center gap-2 px-3 py-2 text-[12px] font-medium shadow-lg hover:bg-[var(--glass-soft-bg)] transition-colors rounded-full border border-[var(--glass-border)]"
              aria-label="Scroll to bottom"
            >
              {isProcessing ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  New message
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Scroll to bottom
                </>
              )}
            </button>
          </div>
        )}

        {/* ─── Input: centered, no heavy bar ─── */}
        <div className="sticky bottom-0 z-20 flex w-full flex-shrink-0 flex-col items-center bg-gradient-to-t from-[#060913]/92 via-[#060913]/38 to-transparent px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-2 sm:px-4 sm:pb-2">
          <div className="relative mx-auto w-full max-w-[760px] space-y-1.5 sm:space-y-2">
            <div className="pointer-events-none absolute inset-x-8 bottom-6 top-8 -z-10 overflow-hidden rounded-[40px]">
              <div className="absolute left-[6%] top-[18%] h-28 w-52 rounded-full bg-sky-500/10 blur-3xl" />
              <div className="absolute right-[10%] top-[26%] h-24 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="absolute bottom-[2%] left-1/2 h-24 w-[72%] -translate-x-1/2 rounded-full bg-blue-600/8 blur-3xl" />
            </div>
            {(isProcessing || activeAssistantMsg?.pendingConfirmation) && (
              <div className="flex items-center justify-between gap-3 rounded-full border border-white/10 bg-[rgba(255,255,255,0.035)] px-4 py-2.5 shadow-[0_16px_44px_-34px_rgba(0,0,0,0.85)] backdrop-blur-xl">
                <div className="flex min-w-0 items-center gap-3">
                  <MiniOrb state="generating" className="scale-[0.82]" />
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-foreground/92">
                      {activeAssistantMsg?.agentRun?.goal || getAgentActivityText({
                        mode: activeResponseMode,
                        status,
                        hasAttachments: lastUserHasAttachments,
                        isArabic: preferArabicUi,
                      })}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground/72">
                      {activeAssistantMsg?.agentRun?.reason || getAgentActivityText({
                        mode: activeResponseMode,
                        status,
                        hasAttachments: lastUserHasAttachments,
                        isArabic: preferArabicUi,
                        phase: activeAssistantMsg?.pendingConfirmation ? "waiting_confirmation" : undefined,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {activeAssistantMsg?.agentRun?.step_count ? (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {preferArabicUi
                        ? `${activeAssistantMsg.agentRun.step_count} خطوة`
                        : `${activeAssistantMsg.agentRun.step_count} step${activeAssistantMsg.agentRun.step_count > 1 ? "s" : ""}`}
                    </span>
                  ) : null}
                  {isProcessing && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                </div>
              </div>
            )}

            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file) => (
                  <FilePreview
                    key={file.id}
                    file={file}
                    onRemove={() => setAttachedFiles((prev) => prev.filter((p) => p.id !== file.id))}
                  />
                ))}
              </div>
            )}

            <div>
              <AIChatInput
                key={inputResetKey}
                onSend={(message) => {
                  handleSendMessage(message, attachedFiles.map((af) => af.file));
                }}
                onChange={setDraftMessage}
                onStop={() => {
                  stopGeneration();
                }}
                onFileAttach={(file) => {
                  handleFileSelect({
                    target: { files: [file] },
                  } as unknown as React.ChangeEvent<HTMLInputElement>);
                }}
                onThinkingSelect={() => setResponseMode("think")}
                responseMode={responseMode}
                draftKey={currentChatId ?? undefined}
                lastUserMessage={[...messages].reverse().find((m) => m.role === "user")?.content ?? undefined}
                isLoading={isProcessing}
                disabled={isProcessing}
                hasFiles={attachedFiles.length > 0}
                header={
                  <ComposerStatusStrip
                    attachedCount={attachedFiles.length}
                    isProcessing={isProcessing}
                    agentRun={isProcessing ? activeAssistantMsg?.agentRun : null}
                    isArabic={preferArabicUi}
                  />
                }
                quickPrompts={[
                  { label: "Compliance overview", prompt: "Give me a full compliance overview of my institution" },
                  { label: "Run gap analysis", prompt: "Run a full gap analysis against our active standards" },
                  { label: "What's missing?", prompt: "Which NCAAA criteria are not covered by our current evidence?" },
                  { label: "Remediation plan", prompt: "Create a prioritized remediation plan for our open gaps" },
                ]}
                agentCommands={AGENT_COMMANDS}
                footer={
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground/75">
                    <Select value={responseMode} onValueChange={(value) => setResponseMode(value as typeof responseMode)}>
                      <SelectTrigger
                        size="sm"
                        className={cn(
                          "h-7 min-w-0 rounded-md border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium shadow-none hover:bg-white/[0.05] hover:text-foreground",
                          modeTone
                        )}
                        aria-label="Horus response mode"
                      >
                        <span className="flex items-center gap-1.5">
                          <currentResponseMode.icon className="h-3.5 w-3.5" />
                          <span>{currentResponseMode.label}</span>
                        </span>
                      </SelectTrigger>
                      <SelectContent className="w-56">
                        {RESPONSE_MODES.map((mode) => (
                          <SelectItem key={mode.key} value={mode.key}>
                            <span className="flex items-center gap-2">
                              <mode.icon className={cn("h-4 w-4", mode.key === "ask" ? "text-sky-400" : mode.key === "think" ? "text-amber-400" : "text-emerald-400")} />
                              <span className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">{mode.label}</span>
                                <span className="text-[11px] text-muted-foreground">{mode.description}</span>
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <AgentContextIndicator
                      messages={messages}
                      status={status}
                      className="hidden sm:flex"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-full border border-white/8 bg-white/[0.03] px-2.5 text-[11px] text-muted-foreground/75 hover:bg-white/[0.05] hover:text-foreground disabled:opacity-50"
                      onClick={handleDeepResearch}
                      disabled={isProcessing || deepResearchRunning || !draftMessage.trim() || !deepagentsStatus?.enabled || !deepagentsStatus?.provider_ready}
                    >
                      <Sparkles className="mr-1 h-3.5 w-3.5" />
                      {deepResearchRunning ? "Researching..." : "Deep Research"}
                    </Button>
                    {reasoning && reasoning.steps.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-full border border-white/8 bg-white/[0.03] px-2.5 text-[11px] text-muted-foreground/75 hover:bg-white/[0.05] hover:text-foreground"
                        onClick={() => setThinkingPanelExpanded(!thinkingPanelExpanded)}
                      >
                        <Brain className="mr-1 h-3.5 w-3.5" />
                        {thinkingPanelExpanded ? "Hide" : "Show"} reasoning
                      </Button>
                    )}
                  </div>
                }
              />
            </div>
            
            <p className="w-full pb-1 pt-0.5 text-center text-[10px] font-medium tracking-wide text-muted-foreground sm:pb-2 sm:pt-1 sm:text-[11px]">
                Horus can make mistakes. Verify important data.
            </p>
          </div>
        </div>

        <ThinkingPanel
          reasoning={reasoning ? { ...reasoning, isExpanded: thinkingPanelExpanded } : null}
          status={status}
          onClose={() => setThinkingPanelExpanded(false)}
        />
      </div>
    </div>
  )
}
