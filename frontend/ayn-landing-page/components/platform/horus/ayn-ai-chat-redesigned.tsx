"use client"

import { useState, useRef, useEffect } from "react"
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

function getReasoningSteps(text: string, hasFiles: boolean) {
  const steps = ["Analyzing your request"]
  const lowerText = text.toLowerCase()
  if (/(iso|ncaaa|criteria|standard|audit)/.test(lowerText)) {
    steps.push("Searching standards library")
  }
  if (hasFiles) {
    steps.push("Processing evidence files")
  }
  if (/(evidence|gap|compliance|score|remediation)/.test(lowerText)) {
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
    sendMessage,
    stopGeneration,
    newChat,
    loadChat
  } = useHorus()

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [reasoning, setReasoning] = useState<ReasoningState | null>(null)
  const [inputValue, setInputValue] = useState("")
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: history, mutate: mutateHistory } = useSWR(user ? "horus-history" : null, () => api.getChatHistory())

  // Auto-scroll effect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, status])

  // Cleanup on unmount to prevent ghost streams
  useEffect(() => {
    return () => {
      stopGeneration()
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];

    const files = Array.from(e.target.files || [])

    if (files.length + attachedFiles.length > 5) {
      toast.error("Maximum 5 files can be attached at once.")
    }

    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      if (!file.type.startsWith("image/") && !ALLOWED_TYPES.includes(file.type)) {
        toast.error(`File ${file.name} has an unsupported type.`);
        return false;
      }
      return true;
    });

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

    const calculatedSteps = getReasoningSteps(text || "", filesToUpload.length > 0)
    const initialStartTime = Date.now()

    if (calculatedSteps.length > 0) {
      setReasoning({
        steps: calculatedSteps.map((s) => ({ text: s, status: "pending" })),
        startTime: initialStartTime,
        duration: null,
        isExpanded: true,
        isComplete: false,
        tempUserMessage: text || "Attached files for analysis",
      })

      // Advance steps smoothly
      for (let i = 0; i < calculatedSteps.length; i++) {
        setReasoning((prev) => {
          if (!prev) return prev
          const newSteps = [...prev.steps]
          newSteps[i].status = "active"
          return { ...prev, steps: newSteps }
        })
        
        await new Promise((r) => setTimeout(r, 600 + (Math.random() * 200)))
        
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

  const isEmpty = messages.length === 0 && !reasoning
  const isProcessing = status !== "idle" || (reasoning !== null && !reasoning.isComplete)

  return (
    <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* New + History as floating top-right (no header bar) */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={newChat} className="h-8 w-8 p-0 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground" title="New chat">
          <PlusCircle className="h-4 w-4" />
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground" title="History">
              <History className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 sm:w-96 p-0 border-l border-border bg-[var(--layer-0)]">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-black text-foreground">Session History</h2>
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
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </p>
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
        <div className="flex-1 w-full overflow-y-auto px-6 py-8 custom-scrollbar flex flex-col items-center">
          <div className="flex-1 w-full max-w-[760px] flex flex-col gap-10 pb-4">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-0 w-full min-h-[40vh] animate-in fade-in zoom-in-95">
                <AiLoader size={220} text="Horus AI" />
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

                          {/* Agent Structured Result — rendered ABOVE the text content */}
                          {msg.role === "assistant" && (msg as any).structuredResult && (
                            <div className="mb-4">
                              <AgentResultRenderer result={(msg as any).structuredResult} />
                            </div>
                          )}

                          {/* Only show text content if there's something meaningful to show
                              (for agent messages the summary text is short and intentional) */}
                          {msg.content && (
                            <div className="text-foreground text-[15px] leading-relaxed horus-markdown-wrapper w-full prose prose-invert max-w-none">
                              <HorusMarkdown content={msg.content} onAction={handleAction} />
                            </div>
                          )}
                          
                          {/* Contextual Action Cards */}
                          {msg.role === "assistant" && status !== "generating" && (
                            <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                              {/* Gap / Compliance logic */}
                              {/(gap|compliance|score|remediate|remediation|shortfall)/i.test(msg.content) && (
                                <button
                                  onClick={() => handleSendMessage("Generate Remediation Plan")}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-semibold rounded-md transition-colors shadow-sm"
                                >
                                  Generate Remediation Plan
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                              
                              {/* Audit Findings logic */}
                              {/(audit findings|audit report|non-conformity|observation|major|minor)/i.test(msg.content) && (
                                <button
                                  onClick={() => handleSendMessage("Export Audit Report")}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-semibold rounded-md transition-colors shadow-sm"
                                >
                                  Export Audit Report
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                              
                              {/* Evidence Analysis logic */}
                              {/(evidence|document|policy|procedure|manual|reviewed files)/i.test(msg.content) && (
                                <button
                                  onClick={() => handleSendMessage("Show me in the Evidence Vault")}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-semibold rounded-md transition-colors shadow-sm"
                                >
                                  View in Evidence Vault
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
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
        <div className="flex-shrink-0 px-4 pb-6 pt-2 z-20 flex flex-col items-center w-full bg-gradient-to-t from-[var(--layer-0)] via-[var(--layer-0)] to-transparent">
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
            
            {/* Quick Action Buttons */}
            {isEmpty && !inputValue && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2 animate-in fade-in duration-300">
                {["Run Full Audit", "Check Compliance Gaps", "Generate Remediation Report"].map((action) => (
                  <button
                    key={action}
                    onClick={() => handleSendMessage(action)}
                    className="px-4 py-1.5 text-[13px] font-medium text-muted-foreground border border-[var(--border-subtle)] rounded-full hover:bg-[var(--surface-modal)] hover:text-foreground transition-all duration-200"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
            
            <p className="text-zinc-500 dark:text-white/30 font-medium text-[12px] pb-4 pt-2 text-center w-full">
                Horus can make mistakes. Verify important data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
