"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
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
  ListChecks,
  RefreshCw,
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

export type ReasoningState = {
  steps: { text: string; status: "pending" | "active" | "done" }[]
  startTime: number
  duration: number | null
  isExpanded: boolean
  isComplete: boolean
  tempUserMessage: string | null
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
    streamError,
    sendMessage,
    resolveActionConfirmation,
    retryLastMessage,
    stopGeneration,
    newChat,
    loadChat
  } = useHorus()

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [responseMode, setResponseMode] = useState<"quick" | "report" | "json">("quick")
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
    const filesToUpload = files ?? attachedFiles.map((af) => af.file)
    setAttachedFiles([])
    const attachments = (files ?? attachedFiles).map((file, idx) => {
      const isFile = file instanceof File
      const fallback = attachedFiles[idx]
      return {
        name: isFile ? file.name : file.file.name,
        type: (isFile ? file.type : file.file.type).startsWith("image/") ? "image" : "document",
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

  const isEmpty = messages.length === 0
  const isProcessing = status !== "idle"

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
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
        {/* M8: Export chat — only visible when conversation has messages */}
        {!isEmpty && (
          <Button variant="ghost" size="sm" onClick={handleExportChat} className="h-11 w-11 md:h-8 md:w-8 p-0 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground" title="Export chat (.txt)">
            <Download className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={newChat} className="h-11 w-11 md:h-8 md:w-8 p-0 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground" title="New chat (⌘N)">
          <PlusCircle className="h-4 w-4" />
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-11 w-11 md:h-8 md:w-8 p-0 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground" title="History">
              <History className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 sm:w-96 p-0 border-l border-border bg-[var(--layer-0)]">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-black text-foreground">Session History</h2>
              <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                ⌘N new chat
              </span>
            </div>
            <ScrollArea className="h-[calc(100vh-80px)]">
              <div className="p-4 space-y-2">
                {(!history || history.length === 0) ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs font-medium text-muted-foreground">No chat history</p>
                  </div>
                ) : (
                  history.map((session: any) => (
                    <div
                      key={session.id}
                      onClick={() => loadChat(session.id)}
                      className={cn(
                        "group relative p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                        currentChatId === session.id
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : "horus-history-card hover:border-primary/30 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className={cn("text-sm font-bold truncate pr-6", currentChatId === session.id ? "text-primary" : "text-foreground")}>
                          {session.title || "Untitled Conversation"}
                        </p>
                        <button
                          onClick={(e) => deleteSession(session.id, e)}
                          className="text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-2 min-h-[36px] min-w-[36px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* L1: Preview — description or date */}
                      {session.description && (
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                          {session.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {new Date(session.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {session.messageCount > 0 && (
                          <span className="text-[9px] font-bold text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded-full">
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
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold glass-pill text-foreground">
                    <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                    Horus AI
                  </div>
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
                    <p className="text-sm md:text-base text-muted-foreground mt-2">
                      Upload evidence, run gap analysis, or get a prioritized remediation plan in seconds.
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
                    ].map((item) => (
                        <button
                          key={item.prompt}
                          onClick={() => handleSendMessage(item.prompt)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-[12px] md:text-[13px] text-muted-foreground border transition-all duration-200 glass-pill horus-quick-action hover:text-foreground hover:border-primary/35"
                        >
                          <span>{item.label}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/75" />
                        </button>
                    ))}
                  </motion.div>
                </div>
              </div>
            ) : (
              <>
                {messages.length > 30 && (
                  <div className="flex justify-center py-3">
                    <span className="text-[11px] text-muted-foreground/60 bg-muted/50 px-3 py-1 rounded-full">
                      Showing latest 30 of {messages.length} messages
                    </span>
                  </div>
                )}
                {visibleMessages.map((msg) => {
                  if (msg.role === "system") {
                    return (
                      <div key={msg.id} className="flex justify-center my-2 animate-in fade-in">
                        <span className="text-[10px] bg-muted text-muted-foreground px-3 py-1 rounded-full uppercase tracking-wider font-bold border border-border">
                          {msg.content}
                        </span>
                      </div>
                    )
                  }

                  const isStreamingThis = status === "generating" && msg.role === "assistant" && msg.id === lastAssistantMsgId

                  return (
                    <div key={msg.id} className="w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
                      {msg.role === "user" ? (
                        <div className="w-full py-4 flex flex-col items-end">
                           <div className="text-[14px] px-4 py-3 rounded-3xl rounded-tr-lg max-w-[88%] whitespace-pre-wrap font-semibold horus-user-bubble">
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
                           <span className="mt-2 text-[10px] text-muted-foreground/70">{formatTimestamp(msg.timestamp)}</span>
                        </div>
                      ) : (
                        <div className="w-full py-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <MiniOrb
                              state={status === "generating" && msg.id === lastAssistantMsgId ? status : "idle"}
                            />
                            <span className="text-sm font-bold text-foreground">Horus</span>
                            <span className="text-[10px] text-muted-foreground/60">{formatTimestamp(msg.timestamp)}</span>
                          </div>

                          {/* Inline thinking disabled for cleaner UI */}

                          {/* Agent Structured Result — rendered ABOVE the text content */}
                          {msg.role === "assistant" && (msg as any).structuredResult && (
                            <div className="mb-3">
                              <AgentResultRenderer result={(msg as any).structuredResult} />
                            </div>
                          )}

                          {/* Pending action confirmation */}
                          {msg.role === "assistant" && msg.pendingConfirmation && (
                            <div className="mb-3 rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-200 glass-surface">
                              <p className="text-sm font-semibold text-foreground mb-1">{msg.pendingConfirmation.title}</p>
                              <p className="text-sm text-muted-foreground">
                                I&apos;m about to {msg.pendingConfirmation.description}. Confirm?
                              </p>
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  onClick={() => resolveActionConfirmation(msg.pendingConfirmation!.id, "confirm")}
                                  className="px-3 py-2 min-h-[44px] rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => resolveActionConfirmation(msg.pendingConfirmation!.id, "cancel")}
                                  className="px-3 py-2 min-h-[44px] rounded-md border border-[var(--border-subtle)] text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-[var(--surface-modal)] transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {msg.content && (
                            <div
                              className={cn(
                                "text-foreground text-[15px] leading-relaxed horus-markdown-wrapper w-full prose dark:prose-invert max-w-none rounded-3xl rounded-tl-lg border border-transparent px-5 py-4 horus-assistant-bubble",
                                isStreamingThis && "horus-streaming-active"
                              )}
                            >
                              <HorusMarkdown content={msg.content} onAction={handleAction} />
                              {isStreamingThis && (
                                <span className="inline-flex items-center gap-0.5 ml-1 align-middle">
                                  <span
                                    className="inline-block w-[2.5px] h-[1.1em] bg-primary rounded-full"
                                    style={{ animation: "orbBreathe 1.2s ease-in-out infinite" }}
                                  />
                                  <span
                                    className="inline-block w-[2px] h-[0.8em] bg-primary/50 rounded-full"
                                    style={{ animation: "orbBreathe 1.2s ease-in-out infinite 0.2s" }}
                                  />
                                </span>
                              )}
                            </div>
                          )}

                          {/* The 'Dual Action' Footer (Spec-Driven Workflow) */}
                          {msg.role === "assistant" && status !== "generating" && msg.id === lastAssistantMsgId && (
                            <div className="mt-6 flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <button
                                onClick={() => handleSendMessage("Generate Export Audit Report for this analysis")}
                                className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-[var(--surface-modal)] hover:bg-primary/10 border border-[var(--border-subtle)] hover:border-primary/40 text-foreground font-semibold text-[13px] rounded-xl shadow-sm transition-all group"
                              >
                                <FileText className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                Export Audit Report
                              </button>
                              <button
                                onClick={() => handleSendMessage("Apply Recommendations to optimize this document")}
                                className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-[var(--surface-modal)] hover:bg-emerald-500/10 border border-[var(--border-subtle)] hover:border-emerald-500/40 text-foreground font-semibold text-[13px] rounded-xl shadow-sm transition-all group"
                              >
                                <ListChecks className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                                Apply Recommendations
                              </button>
                            </div>
                          )}

                          {/* M3: Feedback buttons + M1: Copy button — only on completed assistant messages */}
                          {msg.role === "assistant" && status === "idle" && (
                            <div className="flex items-center gap-1 mt-3">
                              {/* M1: Copy */}
                              {msg.content && (
                                <button
                                  onClick={() => handleCopy(msg.id, msg.content)}
                                  className={cn(
                                    "h-11 w-11 md:h-8 md:w-8 rounded-lg transition-colors inline-flex items-center justify-center",
                                    copiedMsgId === msg.id
                                      ? "text-green-500 bg-green-500/10"
                                      : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/50"
                                  )}
                                  title={copiedMsgId === msg.id ? "Copied!" : "Copy response"}
                                >
                                  {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              )}
                              {/* Divider */}
                              <div className="w-px h-3 bg-border mx-1" />
                              {/* M2: Feedback */}
                              <button
                                onClick={() => handleFeedback(msg.id, "up")}
                                className={cn(
                                  "h-11 w-11 md:h-8 md:w-8 rounded-lg transition-colors inline-flex items-center justify-center",
                                  feedback[msg.id] === "up"
                                    ? "text-green-500 bg-green-500/10"
                                    : "text-muted-foreground/40 hover:text-green-500 hover:bg-green-500/10"
                                )}
                                title="Helpful"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, "down")}
                                className={cn(
                                  "h-11 w-11 md:h-8 md:w-8 rounded-lg transition-colors inline-flex items-center justify-center",
                                  feedback[msg.id] === "down"
                                    ? "text-red-500 bg-red-500/10"
                                    : "text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10"
                                )}
                                title="Not helpful"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                              {/* Persisted check — shows after feedback is saved to backend */}
                              {feedbackPersisted.has(msg.id) && (
                                <span className="text-[10px] text-muted-foreground/60 font-medium ml-1">Saved</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {showLoadingBubble && (
                  <div className="w-full py-4 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <div className="horus-loading-orb" />
                      <div className="flex-1 space-y-2">
                        <div className="horus-loading-line w-40" />
                        <div className="horus-loading-line w-64" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Stream error with retry */}
                {streamError && status === "idle" && (
                  <div className="w-full py-4 animate-in fade-in">
                    <div className="flex items-center gap-3 p-4 rounded-2xl border border-destructive/20 bg-destructive/5">
                      <div className="flex-1 text-sm text-destructive font-medium">{streamError}</div>
                      <button
                        onClick={() => retryLastMessage()}
                        className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
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
        <div className="sticky bottom-0 flex-shrink-0 px-3 sm:px-4 pb-2 pt-1 z-20 flex flex-col items-center w-full bg-gradient-to-t from-background/60 via-background/20 to-transparent">
          <div className="w-full max-w-[760px] mx-auto space-y-2">
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

            <div className="flex items-center justify-center gap-2">
              {[
                { key: "quick", label: "Quick answer" },
                { key: "report", label: "Report" },
                { key: "json", label: "JSON" },
              ].map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setResponseMode(mode.key as typeof responseMode)}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-full transition-colors glass-pill",
                    responseMode === mode.key ? "bg-primary text-primary-foreground border-primary/40" : "text-muted-foreground"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            
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
              />
            </div>
            
            <p className="text-muted-foreground font-medium text-[11px] pb-2 pt-1 text-center w-full tracking-wide">
                Horus can make mistakes. Verify important data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
