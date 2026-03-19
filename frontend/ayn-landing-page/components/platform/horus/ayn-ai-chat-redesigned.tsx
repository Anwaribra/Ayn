"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  ArrowUpRight,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Download,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import { useHorus } from "@/lib/horus-context"
import { AIChatInput } from "@/components/ui/ai-chat-input"
import { AttachedFile } from "./types"
import { HorusMarkdown } from "./horus-markdown"
import { AgentResultRenderer } from "./agent-result-renderer"
import { MiniOrb } from "./agent-orb"
import { AiLoader } from "@/components/ui/ai-loader"
import { AgentExecutionTimeline, deriveAgentSteps } from "./agent-execution-timeline"
import { ThinkStepper } from "./think-stepper"
import { useLiveStreamingText } from "@/hooks/use-streaming-text"

/** Renders assistant content with typing effect when streaming */
function StreamingAssistantContent({
  content,
  isStreaming,
  onAction,
}: {
  content: string
  isStreaming: boolean
  onAction: (type: string, payload: string) => void
}) {
  const displayed = useLiveStreamingText(content, isStreaming, 220)
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



// ─── File Preview Component ─────────────────────────────────────────────────────
function FilePreview({ file, onRemove }: { file: AttachedFile; onRemove: () => void }) {
  return (
    <div className="relative group flex items-center gap-2 p-2 pr-8 rounded-xl horus-file-chip transition-all hover:border-primary/40 hover:shadow-md">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {file.type === 'image' && file.preview ? (
          <img src={file.preview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-foreground truncate max-w-[120px]">{file.file.name}</p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold">{(file.file.size / 1024).toFixed(0)}KB</p>
      </div>
      <button
        onClick={onRemove}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function HorusAIChat() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const {
    messages,
    currentChatId,
    status,
    thinkingSteps,
    activeFiles,
    streamError,
    sendMessage,
    resolveActionConfirmation,
    retryLastMessage,
    stopGeneration,
    newChat,
    loadChat
  } = useHorus()

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [responseMode, setResponseMode] = useState<"ask" | "think" | "agent">("ask")
  const [activeResponseMode, setActiveResponseMode] = useState<"ask" | "think" | "agent">("ask")
  const [reasoning, setReasoning] = useState<ReasoningState | null>(null)
  // M2: per-message feedback — tracks both optimistic state and server-persisted state
  const [feedback, setFeedback] = useState<Record<string, "up" | "down" | null>>({})
  const [feedbackPersisted, setFeedbackPersisted] = useState<Set<string>>(new Set())
  // M1: copy state tracking
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fallbackQueueRef = useRef<string[]>([])
  const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const didLoadFromQueryRef = useRef(false)
  const [completionPulseKey, setCompletionPulseKey] = useState(0)
  const prevStatusRef = useRef<typeof status>(status)

  const { data: history, mutate: mutateHistory } = useSWR(user ? "horus-history" : null, () => api.getChatHistory())

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

  // Auto-scroll effect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, status])

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
    if (thinkingSteps.length === 0) return

    setReasoning((prev) => {
      const base = prev && !prev.isComplete ? prev : {
        steps: [] as { text: string; status: "pending" | "active" | "done" }[],
        startTime: Date.now(),
        duration: null,
        isExpanded: true,
        isComplete: false,
        tempUserMessage: null,
      }

      const nextSteps = thinkingSteps.map((text, idx) => ({
        text,
        status: idx === thinkingSteps.length - 1 ? ("active" as const) : ("done" as const),
      }))

      return {
        ...base,
        steps: nextSteps,
        isExpanded: true,
        isComplete: false,
      }
    })

    // Real backend steps take priority over fallback animation.
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
    fallbackQueueRef.current = []
  }, [thinkingSteps])

  useEffect(() => {
    if (prevStatusRef.current === "generating" && status === "idle") {
      setCompletionPulseKey((k) => k + 1)
    }
    prevStatusRef.current = status
  }, [status])

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
        isExpanded: false,
        duration: prev.duration ?? (Date.now() - prev.startTime) / 1000,
        tempUserMessage: null,
      }
    })
  }, [status])

  // Seed fallback reasoning steps for Think mode when backend sends no __THINKING__
  useEffect(() => {
    if (status !== "generating" || thinkingSteps.length > 0) return
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
  }, [status, thinkingSteps.length, activeResponseMode, messages])

  // Fallback sequential animation for non-tool/general chat when no __THINKING__ steps are emitted.
  useEffect(() => {
    if (status !== "generating") return
    if (thinkingSteps.length > 0) return
    if (fallbackTimerRef.current) return

    fallbackTimerRef.current = setInterval(() => {
      setReasoning((prev) => {
        if (!prev || prev.isComplete) return prev
        if (thinkingSteps.length > 0) return prev

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
  }, [status, thinkingSteps.length])

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

  // M2: Wire feedback to backend
  const handleFeedback = useCallback(async (msgId: string, rating: "up" | "down") => {
    const next = feedback[msgId] === rating ? null : rating
    setFeedback(prev => ({ ...prev, [msgId]: next }))
    if (!next) return // un-vote — no server call needed
    try {
      await api.submitMessageFeedback(msgId, currentChatId, next)
      setFeedbackPersisted(prev => new Set([...prev, msgId]))
    } catch {
      // Silently fail — optimistic state is still correct locally
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
    mutateHistory()
  }

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

  // Derive the id of the last assistant message for M1 contextual actions
  const lastAssistantMsgId = messages.filter((m) => m.role === "assistant").pop()?.id
  const lastAssistantMsg = messages.filter((m) => m.role === "assistant").pop()
  const showLoadingBubble = status === "generating" && lastAssistantMsg && !lastAssistantMsg.content?.trim()
  const isAskLoading = showLoadingBubble && activeResponseMode === "ask"

  const isEmpty = messages.length === 0
  const isProcessing = status !== "idle"
  const currentResponseMode = RESPONSE_MODES.find((mode) => mode.key === responseMode) ?? RESPONSE_MODES[0]

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

  const formatTimestamp = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
      <div className="flex flex-col h-full min-h-0 bg-transparent relative overflow-hidden">
      
      {/* New + History + Export as floating top-right (no header bar) */}
      <div className="absolute right-3 top-4 z-20 flex items-center gap-1.5 sm:right-3 sm:top-3 sm:gap-1">
        {/* M8: Export chat — only visible when conversation has messages */}
        {!isEmpty && (
          <Button variant="ghost" size="sm" onClick={handleExportChat} className="horus-tool-button h-8 w-8 p-0 md:h-8 md:w-8" title="Export chat (.txt)">
            <Download className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={newChat} className="horus-tool-button h-8 w-8 p-0 md:h-8 md:w-8" title="New chat (⌘N)">
          <PlusCircle className="h-4 w-4" />
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="horus-tool-button h-8 w-8 p-0 md:h-8 md:w-8" title="History">
              <History className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="glass-flyout glass-text-primary inset-x-3 top-6 bottom-6 h-auto w-auto overflow-hidden rounded-[var(--radius-xl)] border border-[var(--glass-border)] p-0 sm:inset-y-4 sm:right-4 sm:left-auto sm:h-auto sm:w-[380px] sm:max-w-[380px]">
            <div className="glass-border flex items-center justify-between border-b px-5 pb-4 pt-5 pr-14 sm:px-6 sm:pb-5 sm:pt-6">
              <h2 className="text-lg font-black tracking-tight text-foreground">Session History</h2>
              <span className="glass-pill glass-text-secondary px-2.5 py-1 text-[10px] font-medium">
                ⌘N new chat
              </span>
            </div>
            <ScrollArea className="h-[calc(100dvh-8.25rem)] sm:h-[calc(100dvh-7rem)]">
              <div className="space-y-3 p-3 sm:p-4">
                {(!history || history.length === 0) ? (
                  <div className="glass-panel rounded-[var(--radius-lg)] px-5 py-10 text-center sm:py-12">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs font-medium text-muted-foreground">No chat history</p>
                  </div>
                ) : (
                  history.map((session: any) => (
                    <div
                      key={session.id}
                      onClick={() => loadChat(session.id)}
                      className={cn(
                        "group relative cursor-pointer rounded-[var(--radius-lg)] border p-3.5 transition-all sm:p-4",
                        currentChatId === session.id
                          ? "glass-panel border-primary/25 bg-primary/10 text-primary shadow-[0_20px_40px_-28px_rgba(37,99,235,0.55)]"
                          : "horus-history-card hover:border-primary/30 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className={cn("pr-6 text-sm font-bold leading-snug", currentChatId === session.id ? "text-primary" : "text-foreground")}>
                          {session.title || "Untitled Conversation"}
                        </p>
                        <button
                          onClick={(e) => deleteSession(session.id, e)}
                          className="horus-tool-button min-h-[36px] min-w-[36px] p-2 text-muted-foreground transition-opacity hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {session.description && (
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                          {session.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {new Date(session.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {session.messageCount > 0 && (
                          <span className="glass-pill glass-text-secondary px-1.5 py-0.5 text-[9px] font-bold">
                            {session.messageCount} msg{session.messageCount !== 1 ? "s" : ""}
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
          className={cn(
            "flex-1 w-full px-6 pt-8 custom-scrollbar flex flex-col items-center",
            isEmpty ? "overflow-hidden pb-0" : "overflow-y-auto pb-36 md:pb-28"
          )}
        >
          <div className={cn("flex-1 w-full max-w-[760px] flex flex-col", isEmpty ? "min-h-0" : "gap-6 pb-4")}>
            {isEmpty ? (
              <div className="flex-1 min-h-0 w-full flex items-center justify-center pb-44 md:pb-36">
                <div className="flex flex-col items-center justify-center gap-8 md:gap-10 w-full min-h-0 max-h-full py-2">
                  {/* Classic Orb Loader */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center"
                  >
                    <AiLoader size={220} text="Horus AI" />
                  </motion.div>
                  <div className="text-center max-w-[620px]">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Ask anything about your compliance</h1>
                    <p className="mt-2 text-sm text-muted-foreground md:text-base">
                      <span className="sm:hidden">Run analysis or get your next best action.</span>
                      <span className="hidden sm:inline">Upload evidence, run gap analysis, or get a prioritized remediation plan in seconds.</span>
                    </p>
                  </div>

                  {/* Quick prompts */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-[780px] flex flex-wrap items-center justify-center gap-x-3 gap-y-3"
                  >
                    {[
                      { label: "Compliance overview", prompt: "Give me a full compliance overview of my institution" },
                      { label: "Run gap analysis", prompt: "Run a full gap analysis against our active standards" },
                      { label: "What's missing?", prompt: "Which NCAAA criteria are not covered by our current evidence?" },
                      { label: "Remediation plan", prompt: "Create a prioritized remediation plan for our open gaps" },
                    ].map((item, index) => (
                        <button
                          key={item.prompt}
                          onClick={() => handleSendMessage(item.prompt)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-[12px] md:text-[13px] text-muted-foreground border transition-all duration-200 glass-pill horus-quick-action hover:text-foreground hover:border-primary/35"
                          hidden={index > 1}
                        >
                          <span>{item.label}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/75" />
                        </button>
                    ))}
                    <div className="hidden sm:contents">
                      {[
                        { label: "What's missing?", prompt: "Which NCAAA criteria are not covered by our current evidence?" },
                        { label: "Remediation plan", prompt: "Create a prioritized remediation plan for our open gaps" },
                      ].map((item) => (
                        <button
                          key={`desktop-${item.prompt}`}
                          onClick={() => handleSendMessage(item.prompt)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-[12px] md:text-[13px] text-muted-foreground border transition-all duration-200 glass-pill horus-quick-action hover:text-foreground hover:border-primary/35"
                        >
                          <span>{item.label}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/75" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
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
                {visibleMessages.map((msg) => {
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
                           <div className="horus-user-bubble max-w-[90%] whitespace-pre-wrap rounded-3xl rounded-tr-lg px-4 py-3 text-[14px] font-semibold sm:max-w-[88%]">
                             {msg.content}
                           </div>
                           {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2 justify-end max-w-[88%]">
                              {msg.attachments.map((file, idx) => (
                                <div key={`${msg.id}-att-${idx}`} className="flex items-center gap-2 rounded-xl glass-panel glass-border px-2 py-1.5">
                                  {file.type === "image" && file.preview ? (
                                    <img src={file.preview} alt={file.name} className="h-10 w-10 rounded-lg object-cover" />
                                  ) : (
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                      <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                  )}
                                  <div className="text-[11px] text-muted-foreground truncate max-w-[120px]">{file.name}</div>
                                </div>
                              ))}
                            </div>
                           )}
                           <span className="mt-1.5 text-[10px] text-muted-foreground/70 sm:mt-2">{formatTimestamp(msg.timestamp)}</span>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "w-full space-y-2 py-2 sm:space-y-3 sm:py-4",
                            msg.id === lastAssistantMsgId && status === "idle" && completionPulseKey > 0 && "horus-completion-pulse"
                          )}
                        >
                          {/* Inline thinking disabled for cleaner UI */}

                          {/* Agent execution timeline — hide in Ask mode unless user attached files */}
                          {msg.role === "assistant" &&
                            msg.id === lastAssistantMsgId &&
                            (activeResponseMode !== "ask" || !![...messages].reverse().find((m) => m.role === "user")?.attachments?.length) &&
                            (thinkingSteps.length > 0 || msg.pendingConfirmation) &&
                            (() => {
                              const { steps, phase } = deriveAgentSteps(
                                thinkingSteps,
                                msg.pendingConfirmation ?? null,
                                !!(msg as any).structuredResult,
                                status === "generating"
                              )
                              if (steps.length === 0 && !msg.pendingConfirmation) return null
                              return (
                                <div className="mb-3">
                                  <AgentExecutionTimeline
                                    steps={steps}
                                    phase={phase}
                                    pendingTool={msg.pendingConfirmation?.title}
                                    isWaitingConfirmation={!!msg.pendingConfirmation}
                                    activeFiles={activeFiles}
                                    collapsible
                                    compact
                                  />
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
                            <div className="mb-3 rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-200 glass-surface-strong">
                              <p className="text-sm font-semibold text-foreground mb-1">{msg.pendingConfirmation.title}</p>
                              <p className="text-sm text-muted-foreground">
                                I&apos;m about to {msg.pendingConfirmation.description}. Confirm?
                              </p>
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  onClick={() => resolveActionConfirmation(msg.pendingConfirmation!.id, "confirm")}
                                  className="glass-button h-11 rounded-xl bg-primary/90 px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => resolveActionConfirmation(msg.pendingConfirmation!.id, "cancel")}
                                  className="glass-button glass-text-secondary h-11 rounded-xl px-3 py-2 text-xs font-semibold transition-colors hover:text-foreground"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {msg.content ? (
                            <div
                              dir="auto"
                              className={cn(
                                "horus-assistant-bubble horus-markdown-wrapper w-full max-w-none rounded-3xl rounded-tl-lg border border-transparent px-4 py-3.5 text-[15px] leading-relaxed text-foreground prose text-start [unicode-bidi:plaintext] dark:prose-invert sm:px-5 sm:py-4",
                                isStreamingThis && "horus-streaming-active"
                              )}
                            >
                              <StreamingAssistantContent
                                content={msg.content}
                                isStreaming={isStreamingThis}
                                onAction={handleAction}
                              />
                              {isStreamingThis && (
                                <span className="inline-flex items-center gap-0.5 ml-1 align-middle">
                                  <span
                                    className="horus-stream-cursor inline-block w-[3px] h-[1em] bg-primary rounded-sm align-middle"
                                    style={{ marginLeft: "2px" }}
                                  />
                                </span>
                              )}
                            </div>
                          ) : msg.role === "assistant" &&
                            msg.id === lastAssistantMsgId &&
                            status === "idle" &&
                            !(msg as any).structuredResult &&
                            (thinkingSteps.length > 0 || [...messages].reverse().find((m) => m.role === "user")?.attachments?.length) ? (
                            <div className="horus-assistant-bubble rounded-3xl rounded-tl-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3.5 text-sm text-muted-foreground">
                              التحليل لم يُولّد. يرجى المحاولة مرة أخرى أو إرفاق ملف مختلف.
                            </div>
                          ) : null}

                          {/* Suggestion chips — Cursor-style follow-ups (only for last assistant message) */}
                          {msg.role === "assistant" &&
                            msg.id === lastAssistantMsgId &&
                            status === "idle" &&
                            msg.content?.trim() && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {(() => {
                                const struct = (msg as any).structuredResult
                                const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || ""
                                const hasArabic = /[\u0600-\u06FF]/.test(lastUserMsg)
                                const auditAr = ["تحليل أعمق", "ربط بالمعايير", "تصدير التقرير"]
                                const auditEn = ["Deeper analysis", "Link to standards", "Export report"]
                                const gapAr = ["عرض التفاصيل", "تشغيل تحليل", "ربط أدلة"]
                                const gapEn = ["Show details", "Run analysis", "Link evidence"]
                                const defaultAr = ["اشرح أكثر", "أمثلة عملية", "سؤال آخر"]
                                const defaultEn = ["Explain more", "Practical examples", "Another question"]
                                const suggestions = struct?.type === "audit_report" || struct?.type === "analytics_report"
                                  ? (hasArabic ? auditAr : auditEn)
                                  : struct?.type === "gap_table"
                                    ? (hasArabic ? gapAr : gapEn)
                                    : (hasArabic ? defaultAr : defaultEn)
                                return suggestions.map((label) => (
                                  <button
                                    key={label}
                                    type="button"
                                    onClick={() => sendMessage(label)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-colors"
                                  >
                                    <ArrowUpRight className="w-3 h-3" />
                                    {label}
                                  </button>
                                ))
                              })()}
                            </div>
                          )}

                          {/* M3: Feedback buttons + M1: Copy button — only on completed assistant messages */}
                          {msg.role === "assistant" && status === "idle" && (
                            <div className="glass-panel mt-2 flex w-fit items-center gap-1 rounded-2xl p-1 sm:mt-3 sm:p-1.5">
                              {/* M1: Copy */}
                              {msg.content && (
                                <button
                                  onClick={() => handleCopy(msg.id, msg.content)}
                                  className={cn(
                                    "horus-tool-button inline-flex h-7 w-7 items-center justify-center md:h-8 md:w-8",
                                    copiedMsgId === msg.id
                                      ? "text-green-500 bg-green-500/10"
                                      : ""
                                  )}
                                  title={copiedMsgId === msg.id ? "Copied!" : "Copy response"}
                                >
                                  {copiedMsgId === msg.id ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                                </button>
                              )}
                              {/* Divider */}
                              <div className="mx-0.5 h-3 w-px bg-[var(--glass-border)]" />
                              {/* M2: Feedback */}
                              <button
                                onClick={() => handleFeedback(msg.id, "up")}
                                className={cn(
                                  "horus-tool-button inline-flex h-7 w-7 items-center justify-center md:h-8 md:w-8",
                                  feedback[msg.id] === "up"
                                    ? "text-green-500 bg-green-500/10"
                                    : "hover:text-green-500 hover:bg-green-500/10"
                                )}
                                title="Helpful"
                              >
                                <ThumbsUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, "down")}
                                className={cn(
                                  "horus-tool-button inline-flex h-7 w-7 items-center justify-center md:h-8 md:w-8",
                                  feedback[msg.id] === "down"
                                    ? "text-red-500 bg-red-500/10"
                                    : "hover:text-red-500 hover:bg-red-500/10"
                                )}
                                title="Not helpful"
                              >
                                <ThumbsDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </button>
                              {/* Persisted check — shows after feedback is saved to backend */}
                              {feedbackPersisted.has(msg.id) && (
                                <span className="text-[10px] text-muted-foreground/60 font-medium ml-1">Saved</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )
                })}

                {showLoadingBubble && (
                  <div className="w-full py-2 sm:py-4 animate-in fade-in">
                    {(activeResponseMode !== "ask" || !![...messages].reverse().find((m) => m.role === "user")?.attachments?.length) &&
                    (thinkingSteps.length > 0 || messages.filter((m) => m.role === "assistant").pop()?.pendingConfirmation || (activeResponseMode !== "ask" && [...messages].reverse().find((m) => m.role === "user")?.attachments?.length)) ? (
                      (() => {
                        const lastMsg = messages.filter((m) => m.role === "assistant").pop()
                        const lastUserHasAttachments = !![...messages].reverse().find((m) => m.role === "user")?.attachments?.length
                        const effectiveSteps = thinkingSteps.length > 0 ? thinkingSteps : (activeResponseMode !== "ask" && lastUserHasAttachments ? ["Preparing your request..."] : [])
                        const { steps, phase } = deriveAgentSteps(
                          effectiveSteps,
                          lastMsg?.pendingConfirmation ?? null,
                          !!(lastMsg as any)?.structuredResult,
                          status === "generating"
                        )
                        if (steps.length === 0 && !lastMsg?.pendingConfirmation) return null
                        return (
                          <AgentExecutionTimeline
                            steps={steps}
                            phase={phase}
                            pendingTool={lastMsg?.pendingConfirmation?.title}
                            isWaitingConfirmation={!!lastMsg?.pendingConfirmation}
                            activeFiles={activeFiles}
                            collapsible
                          />
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
                      <div className="glass-pill glass-text-secondary flex w-fit items-center gap-2 px-3 py-2 animate-in fade-in duration-200">
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary horus-ask-dot" style={{ animationDelay: "0ms" }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-primary horus-ask-dot" style={{ animationDelay: "150ms" }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-primary horus-ask-dot" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-[11px] font-medium">Answering…</span>
                      </div>
                    ) : (
                      <div className="glass-panel flex max-w-[14rem] items-center gap-3 rounded-2xl p-3 sm:max-w-none">
                        <MiniOrb state="generating" className="shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="horus-loading-line w-24 sm:w-40" />
                          <div className="horus-loading-line w-36 sm:w-64" />
                        </div>
                      </div>
                    )}
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

        {/* ─── Input: centered, no heavy bar ─── */}
        <div className="sticky bottom-0 z-20 flex w-full flex-shrink-0 flex-col items-center bg-gradient-to-t from-background/70 via-background/25 to-transparent px-2.5 pb-1 pt-1 sm:px-4 sm:pb-2">
          <div className="mx-auto w-full max-w-[760px] space-y-1.5 sm:space-y-2">
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
                onSend={(message) => {
                  handleSendMessage(message, attachedFiles.map((af) => af.file));
                }}
                onStop={() => {
                  stopGeneration();
                }}
                onFileAttach={(file) => {
                  handleFileSelect({
                    target: { files: [file] },
                  } as unknown as React.ChangeEvent<HTMLInputElement>);
                }}
                isLoading={isProcessing}
                disabled={isProcessing}
                hasFiles={attachedFiles.length > 0}
                footer={
                  <div className="flex items-center gap-2">
                    <Select value={responseMode} onValueChange={(value) => setResponseMode(value as typeof responseMode)}>
                      <SelectTrigger
                        size="sm"
                        className="h-8 min-w-0 rounded-full border-transparent bg-transparent px-1.5 py-1 text-[11px] font-medium text-muted-foreground shadow-none hover:text-foreground"
                        aria-label="Horus response mode"
                      >
                        <span className="flex items-center gap-1.5">
                          <currentResponseMode.icon className="h-3.5 w-3.5 text-primary" />
                          <span>{currentResponseMode.label}</span>
                        </span>
                      </SelectTrigger>
                      <SelectContent className="w-56">
                        {RESPONSE_MODES.map((mode) => (
                          <SelectItem key={mode.key} value={mode.key}>
                            <span className="flex items-center gap-2">
                              <mode.icon className="h-4 w-4 text-primary" />
                              <span className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">{mode.label}</span>
                                <span className="text-[11px] text-muted-foreground">{mode.description}</span>
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="hidden h-4 w-px bg-white/8 sm:block" />
                    <span className="hidden text-[11px] font-medium text-muted-foreground/80 sm:block">
                      Fast mode available
                    </span>
                  </div>
                }
              />
            </div>
            
            <p className="w-full pb-1 pt-0.5 text-center text-[10px] font-medium tracking-wide text-muted-foreground sm:pb-2 sm:pt-1 sm:text-[11px]">
                Horus can make mistakes. Verify important data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
