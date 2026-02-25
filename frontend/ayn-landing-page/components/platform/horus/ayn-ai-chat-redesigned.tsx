"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  Paperclip,
  User,
  FileText,
  X,
  Loader2,
  MessageSquare,
  Trash2,
  History,
  PlusCircle,
  StopCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  Brain,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Copy,
  Download,
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import { useHorus } from "@/lib/horus-context"
import { ShiningText } from "@/components/ui/shining-text"
import { AiLoader } from "@/components/ui/ai-loader"
import { AIChatInput } from "@/components/ui/ai-chat-input"
import { AttachedFile } from "./types"
import { HorusMarkdown } from "./horus-markdown"
import { AgentResultRenderer } from "./agent-result-renderer"

type ReasoningState = {
  steps: { text: string; status: "pending" | "active" | "done" }[]
  startTime: number
  duration: number | null
  isExpanded: boolean
  isComplete: boolean
  tempUserMessage: string | null
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

function ReasoningBlock({
  reasoning,
  setReasoning,
}: {
  reasoning: ReasoningState
  setReasoning: React.Dispatch<React.SetStateAction<ReasoningState | null>>
}) {
  if (!reasoning) return null

  return (
    <div className="w-full max-w-3xl bg-[var(--surface)]/50 border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-sm transition-all duration-300 mb-6">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-[var(--surface-modal)] transition-colors"
        onClick={() =>
          setReasoning((prev) => (prev ? { ...prev, isExpanded: !prev.isExpanded } : prev))
        }
      >
        <div className="flex items-center gap-3">
          {reasoning.isComplete ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Brain className="w-4 h-4 text-primary animate-pulse" />
          )}
          <span className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
            {reasoning.isComplete
              ? `Analyzed in ${reasoning.duration?.toFixed(1)} seconds`
              : "Thinking Process"}
          </span>
        </div>
        {reasoning.isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {reasoning.isExpanded && (
        <div className="px-5 pb-5 pt-2 space-y-4">
          {reasoning.steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 relative before:absolute before:left-[7px] before:top-6 before:bottom-[-16px] before:w-px before:bg-[var(--border-subtle)] last:before:hidden"
            >
              <div className="relative z-10 w-4 h-4 flex items-center justify-center bg-[var(--surface)]">
                {step.status === "done" ? (
                  <Check className="w-4 h-4 text-muted-foreground" />
                ) : step.status === "active" ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  step.status === "active"
                    ? "text-[var(--text-primary)] animate-pulse"
                    : step.status === "done"
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)]"
                )}
              >
                {step.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── File Preview Component ─────────────────────────────────────────────────────
function FilePreview({ file, onRemove }: { file: AttachedFile; onRemove: () => void }) {
  return (
    <div className="relative group flex items-center gap-2 p-2 pr-8 rounded-xl bg-[var(--layer-0)] border border-[var(--border-subtle)] shadow-sm transition-all hover:border-[var(--brand-primary)]/50 hover:shadow-md">
      <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)] shrink-0">
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
  const { user } = useAuth()
  const {
    messages,
    currentChatId,
    status,
    thinkingSteps,
    sendMessage,
    stopGeneration,
    newChat,
    loadChat
  } = useHorus()

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [reasoning, setReasoning] = useState<ReasoningState | null>(null)
  const [inputValue, setInputValue] = useState("")
  // M2: per-message feedback — tracks both optimistic state and server-persisted state
  const [feedback, setFeedback] = useState<Record<string, "up" | "down" | null>>({})
  const [feedbackPersisted, setFeedbackPersisted] = useState<Set<string>>(new Set())
  // M1: copy state tracking
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: history, mutate: mutateHistory } = useSWR(user ? "horus-history" : null, () => api.getChatHistory())

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
    }
  }, [])

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

    const initialStartTime = Date.now()

    // Seed reasoning with any thinking steps already received from the backend.
    // If none arrive (agent action or very fast response), fall back to computed steps.
    const seedSteps = thinkingSteps.length > 0
      ? thinkingSteps
      : getReasoningSteps(text || "", filesToUpload.length > 0)

    if (seedSteps.length > 0) {
      setReasoning({
        steps: seedSteps.map((s) => ({ text: s, status: "pending" })),
        startTime: initialStartTime,
        duration: null,
        isExpanded: true,
        isComplete: false,
        tempUserMessage: text || "Attached files for analysis",
      })

      // Run fallback animation through the seed steps
      for (let i = 0; i < seedSteps.length; i++) {
        setReasoning((prev) => {
          if (!prev) return prev
          const newSteps = [...prev.steps]
          newSteps[i].status = "active"
          return { ...prev, steps: newSteps }
        })
        
        await new Promise((r) => setTimeout(r, 500 + (Math.random() * 150)))
        
        setReasoning((prev) => {
          if (!prev) return prev
          const newSteps = [...prev.steps]
          newSteps[i].status = "done"
          return { ...prev, steps: newSteps }
        })
      }

      // Complete Reasoning
      setReasoning((prev) => {
        if (!prev) return prev
        const newSteps = prev.steps.map((s) => ({ ...s, status: "done" as const }))
        const finalDuration = (Date.now() - prev.startTime) / 1000
        return {
          ...prev,
          steps: newSteps,
          isComplete: true,
          isExpanded: false,
          duration: finalDuration,
          tempUserMessage: null,
        }
      })
    }

    await sendMessage(text || " ", filesToUpload.length ? filesToUpload : undefined)
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
  const lastAssistantMsgId = messages.filter(m => m.role === "assistant").pop()?.id

  const isEmpty = messages.length === 0 && !reasoning
  const isProcessing = status !== "idle" || (reasoning !== null && !reasoning.isComplete)

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
                          : "glass-layer-2 hover:border-primary/30 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className={cn("text-sm font-bold truncate pr-6", currentChatId === session.id ? "text-primary" : "text-foreground")}>
                          {session.title || "Untitled Conversation"}
                        </p>
                        <button
                          onClick={(e) => deleteSession(session.id, e)}
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-2 min-h-[36px] min-w-[36px]"
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
          <div className={cn("flex-1 w-full max-w-[760px] flex flex-col", isEmpty ? "min-h-0" : "gap-10 pb-4")}>
            {isEmpty ? (
              // M3: Example prompts empty state — replaces the spinning AI loader
              <div className="flex-1 min-h-0 w-full flex items-center justify-center pb-44 md:pb-36">
                <div className="flex flex-col items-center justify-center gap-5 md:gap-6 w-full min-h-0 max-h-full animate-in fade-in zoom-in-95 py-2">
                  <div className="flex flex-col items-center gap-3">
                    <div className="lg:hidden">
                      <AiLoader size={200} text="Horus AI" />
                    </div>
                    <div className="hidden lg:block scale-90 2xl:scale-100">
                      <AiLoader size={300} text="Horus AI" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Your compliance intelligence assistant</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-[640px]">
                    {[
                      { label: "Compliance overview", prompt: "Give me a full compliance overview of my institution" },
                      { label: "Run gap analysis", prompt: "Run a full gap analysis against our active standards" },
                      { label: "What's missing?", prompt: "Which NCAAA criteria are not covered by our current evidence?" },
                      { label: "Remediation plan", prompt: "Create a prioritized remediation plan for our open gaps" },
                    ].map((item) => (
                      <button
                        key={item.prompt}
                        onClick={() => {
                          setInputValue(item.prompt)
                          handleSendMessage(item.prompt)
                        }}
                        className="w-full text-left px-4 py-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)]/50 hover:bg-[var(--surface-modal)] hover:border-primary/30 transition-all group"
                      >
                        <span className="flex items-center justify-between gap-2 text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                          <span className="truncate">{item.label}</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.slice(-30).filter(msg => {
                  if ((msg.content || "").toUpperCase().startsWith("EVENT:")) return false;
                  return true;
                }).map((msg, i) => {
                  if (msg.role === "system") {
                    return (
                      <div key={msg.id} className="flex justify-center my-2 animate-in fade-in">
                        <span className="text-[10px] bg-muted text-muted-foreground px-3 py-1 rounded-full uppercase tracking-wider font-bold border border-border">
                          {msg.content}
                        </span>
                      </div>
                    )
                  }

                  return (
                    <div key={msg.id} className="w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
                      {msg.role === "user" ? (
                        <div className="w-full py-4 flex flex-col items-end">
                           <div className="text-[14px] text-foreground bg-[var(--surface-modal)] border border-[var(--border-subtle)] px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] whitespace-pre-wrap font-medium shadow-sm">
                             {msg.content}
                           </div>
                        </div>
                      ) : (
                        <div className="w-full py-4">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary/10 text-primary flex-shrink-0">
                              <Brain className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm font-bold text-foreground">Horus</span>
                          </div>

                          {/* Inject Reasoning Block ONLY for the latest assistant message */}
                          {msg.role === "assistant" &&
                            msg.id === messages.filter((m) => m.role === "assistant").pop()?.id &&
                            reasoning?.isComplete && (
                              <ReasoningBlock reasoning={reasoning} setReasoning={setReasoning} />
                            )}

                          {/* M6: Skeleton card — show while agent action is loading for this message */}
                          {msg.role === "assistant" && !(msg as any).structuredResult && status === "generating" &&
                            msg.id === messages.filter(m => m.role === "assistant").pop()?.id &&
                            !msg.content && (
                            <div className="mb-4 animate-pulse">
                              <div className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/60 p-5 space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-[var(--border-subtle)]" />
                                  <div className="h-3.5 bg-[var(--border-subtle)] rounded w-40" />
                                </div>
                                <div className="h-2.5 bg-[var(--border-subtle)] rounded w-full" />
                                <div className="h-2.5 bg-[var(--border-subtle)] rounded w-4/5" />
                                <div className="h-2.5 bg-[var(--border-subtle)] rounded w-3/5" />
                              </div>
                            </div>
                          )}

                          {/* Agent Structured Result — rendered ABOVE the text content */}
                          {msg.role === "assistant" && (msg as any).structuredResult && (
                            <div className="mb-4">
                              <AgentResultRenderer result={(msg as any).structuredResult} />
                            </div>
                          )}

                          {/* Only show text content if there's something meaningful to show */}
                          {msg.content && (
                            <div className="text-foreground text-[15px] leading-relaxed horus-markdown-wrapper w-full prose dark:prose-invert max-w-none">
                              <HorusMarkdown content={msg.content} onAction={handleAction} />
                              {/* M4: blinking caret during live streaming of THIS message */}
                              {status === "generating" && msg.id === messages.filter(m => m.role === "assistant").pop()?.id && (
                                <span className="inline-block w-[2px] h-[1em] ml-0.5 bg-primary align-middle animate-pulse rounded-full" />
                              )}
                            </div>
                          )}

                          {/* M1: Contextual Action Cards — only on the LAST assistant message */}
                          {msg.role === "assistant" && status !== "generating" && msg.id === lastAssistantMsgId && (
                            <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                              {/(gap|compliance|score|remediate|remediation|shortfall)/i.test(msg.content) && (
                                <button
                                  onClick={() => handleSendMessage("Generate Remediation Plan")}
                                  className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-semibold rounded-md transition-colors shadow-sm"
                                >
                                  Generate Remediation Plan
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {/(audit findings|audit report|non-conformity|observation|major|minor)/i.test(msg.content) && (
                                <button
                                  onClick={() => handleSendMessage("Export Audit Report")}
                                  className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-semibold rounded-md transition-colors shadow-sm"
                                >
                                  Export Audit Report
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {/(evidence|document|policy|procedure|manual|reviewed files)/i.test(msg.content) && (
                                <button
                                  onClick={() => handleSendMessage("Show me in the Evidence Vault")}
                                  className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-semibold rounded-md transition-colors shadow-sm"
                                >
                                  View in Evidence Vault
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
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

                {/* Incomplete Reasoning Phase (before real message is appended) */}
                {reasoning && !reasoning.isComplete && (
                  <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {reasoning.tempUserMessage && (
                      <div className="w-full py-4 flex flex-col items-end">
                        <div className="text-[14px] text-foreground bg-[var(--surface-modal)] border border-[var(--border-subtle)] px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] whitespace-pre-wrap font-medium shadow-sm">
                          {reasoning.tempUserMessage}
                        </div>
                      </div>
                    )}
                    <div className="w-full py-4 mt-2">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary/10 text-primary flex-shrink-0">
                          <Brain className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-bold text-foreground">Horus</span>
                      </div>
                      <ReasoningBlock reasoning={reasoning} setReasoning={setReasoning} />
                    </div>
                  </div>
                )}

                {/* Typing indicator */}
                {status !== "idle" && (!reasoning || reasoning.isComplete) && status === "searching" && (
                  <div className="w-full py-4 animate-in fade-in">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded flex items-center justify-center bg-muted text-muted-foreground text-[10px] font-bold flex-shrink-0">
                         <Loader2 className="w-3 h-3 animate-spin" />
                      </div>
                      <span className="text-sm font-bold text-muted-foreground">System</span>
                    </div>
                    <div className="text-muted-foreground text-[14px] flex items-center gap-2 font-medium">
                      <Search className="w-4 h-4" /> Reading knowledge base…
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* ─── Input: centered, no heavy bar ─── */}
        <div className="sticky bottom-0 flex-shrink-0 px-4 pb-2 pt-1 z-20 flex flex-col items-center w-full bg-gradient-to-t from-background/45 via-background/15 to-transparent">
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
            
            <div className="-mb-6 sm:-mb-4">
              <AIChatInput
                onSend={(message) => {
                  setInputValue("")
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
                onChange={setInputValue}
                isLoading={isProcessing}
                disabled={isProcessing}
                hasFiles={attachedFiles.length > 0}
              />
            </div>
            
            {/* Quick Action Buttons */}
            {isEmpty && !inputValue && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2 animate-in fade-in duration-300">
                {["Run Full Audit", "Check Compliance Gaps", "Generate Remediation Report"].map((action) => (
                  <button
                    key={action}
                    onClick={() => handleSendMessage(action)}
                    className="px-4 py-2.5 min-h-[44px] text-[13px] font-medium text-muted-foreground border border-[var(--border-subtle)] rounded-full hover:bg-[var(--surface-modal)] hover:text-foreground transition-all duration-200"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
            
            <p className="text-zinc-500 dark:text-white/30 font-medium text-[12px] pb-2 pt-1 text-center w-full">
                Horus can make mistakes. Verify important data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
