"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Send, 
  Paperclip, 
  Sparkles, 
  BookOpen, 
  FileCheck, 
  HelpCircle, 
  Search, 
  MessageSquare, 
  ClipboardList,
  History,
  Plus,
  X,
  Copy,
  Check,
  Pause,
  Play,
  Shield,
  ArrowUp,
  FileText,
  Target,
  Lightbulb,
  BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { api } from "@/lib/api"
import { toast } from "sonner"
import { useStreamingText, useCursorBlink } from "@/hooks/use-streaming-text"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MarkdownContent } from "./markdown-content"

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp?: number
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

// ─── Storage Keys ───────────────────────────────────────────────────────────────
const CHAT_STORAGE_KEY = "horus-ai-chat-history"
const SESSIONS_STORAGE_KEY = "horus-ai-sessions"

// ─── Quick Actions ──────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    icon: FileText,
    label: "Explain ISO 21001",
    description: "Key clauses & requirements",
    prompt: "Explain the key requirements of ISO 21001 clause by clause, focusing on what an educational institution needs to implement.",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  {
    icon: Target,
    label: "Gap Analysis",
    description: "Identify compliance gaps",
    prompt: "Help me identify common compliance gaps in educational institutions and how to address them.",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  },
  {
    icon: Lightbulb,
    label: "NAQAAE Guidance",
    description: "Self-assessment help",
    prompt: "Guide me through the NAQAAE self-assessment process. What are the main domains and required evidence?",
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
  },
  {
    icon: BarChart3,
    label: "Quality Metrics",
    description: "Track compliance KPIs",
    prompt: "What are the key quality metrics and KPIs I should track for ISO 21001 compliance?",
    color: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
  {
    icon: FileCheck,
    label: "Evidence Review",
    description: "Evaluate documents",
    prompt: "What types of evidence should I collect for compliance criteria and how should they be organized?",
    color: "bg-rose-500/10 text-rose-600 border-rose-200",
  },
  {
    icon: Shield,
    label: "Audit Prep",
    description: "Get assessment ready",
    prompt: "Help me prepare for a compliance assessment. What should I have ready and what are common pitfalls?",
    color: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  },
]

// ─── Helper Functions ───────────────────────────────────────────────────────────
function loadChatHistory(): Message[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveChatHistory(messages: Message[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
}

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(SESSIONS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
}

// ─── Copy Button ────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="rounded-md p-1.5 text-muted-foreground/60 transition-all hover:bg-primary/10 hover:text-primary"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

// ─── Streaming Message ──────────────────────────────────────────────────────────
function StreamingMessage({ content, isStreaming, onStop }: { content: string; isStreaming: boolean; onStop?: () => void }) {
  const [isPaused, setIsPaused] = useState(false)
  const { displayedText, isComplete, stopStreaming } = useStreamingText({
    text: content,
    speed: 400,
    enabled: isStreaming && !isPaused,
  })
  const cursorVisible = useCursorBlink(isStreaming && !isComplete && !isPaused)

  const handleStop = useCallback(() => {
    stopStreaming()
    onStop?.()
  }, [stopStreaming, onStop])

  const displayContent = isStreaming ? displayedText : content

  return (
    <div className="flex max-w-[90%] flex-col gap-2">
      <div className="prose prose-sm max-w-none text-foreground">
        <MarkdownContent content={displayContent} />
        {isStreaming && !isComplete && (
          <span className={cn("inline-block w-[2px] h-[1.2em] bg-primary ml-0.5 align-middle", cursorVisible ? "opacity-100" : "opacity-0")} />
        )}
      </div>
      {isStreaming && (
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPaused((p) => !p)} className="rounded p-1 text-muted-foreground/60 hover:bg-primary/10 hover:text-primary">
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
          <button onClick={handleStop} className="rounded p-1 text-muted-foreground/60 hover:bg-primary/10 hover:text-primary">
            <div className="h-3 w-3 bg-current rounded-sm" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Chat History Drawer ────────────────────────────────────────────────────────
function ChatHistoryDrawer({ open, onClose, sessions, onLoadSession, onDeleteSession }: {
  open: boolean
  onClose: () => void
  sessions: ChatSession[]
  onLoadSession: (session: ChatSession) => void
  onDeleteSession: (id: string) => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-80 border-l border-border bg-background/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <History className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Chat History</h3>
                  <p className="text-[10px] text-muted-foreground">{sessions.length} conversation{sessions.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 h-[calc(100vh-64px)]">
              <div className="p-3">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                      <History className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="group cursor-pointer rounded-xl border border-border/50 bg-card/50 p-3 transition-all hover:border-primary/30 hover:bg-primary/5"
                        onClick={() => onLoadSession(session)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium">{session.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(session.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                            className="rounded p-1 text-muted-foreground/60 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function AynAIChatRedesigned() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const history = loadChatHistory()
    if (history.length > 0) setMessages(history)
    setSessions(loadSessions())

    const initialPrompt = localStorage.getItem("horus-ai-initial-prompt")
    if (initialPrompt) {
      localStorage.removeItem("horus-ai-initial-prompt")
      setTimeout(() => sendMessage(initialPrompt), 100)
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) saveChatHistory(messages)
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const saveCurrentSession = useCallback(() => {
    if (messages.length === 0) return
    const firstUserMsg = messages.find((m) => m.role === "user")
    const title = firstUserMsg ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "..." : "") : "New Conversation"
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title,
      messages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const updated = [session, ...sessions].slice(0, 20)
    setSessions(updated)
    saveSessions(updated)
  }, [messages, sessions])

  const clearChat = useCallback(() => {
    if (messages.length > 0) saveCurrentSession()
    setMessages([])
    localStorage.removeItem(CHAT_STORAGE_KEY)
  }, [messages, saveCurrentSession])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed, timestamp: Date.now() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setMessage("")
    setIsLoading(true)

    try {
      const chatHistory = updatedMessages.map((m) => ({ role: m.role, content: m.content }))
      const response = await api.chat(chatHistory)
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.result || "No response.",
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      setStreamingMessageId(assistantMsg.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to get response")
      const errMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I couldn't process that request. Please try again.", timestamp: Date.now() }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, messages])

  const handleQuickAction = (prompt: string) => sendMessage(prompt)
  const hasMessages = messages.length > 0 || isLoading

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(message)
    }
  }

  return (
    <div className="relative flex h-[calc(100vh-56px)] w-full flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
      {/* Subtle Grid Background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Top Gradient Orb */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl" />

      {/* Floating Actions */}
      <div className="absolute right-6 top-4 z-20 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur-sm" onClick={() => setHistoryOpen(true)}>
          <History className="h-4 w-4" />
        </Button>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur-sm" onClick={clearChat}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Empty State - Hero Design */}
      {!hasMessages && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center text-center w-full max-w-3xl"
          >
            {/* Greeting */}
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Hey! <span className="text-primary">Anwar</span>
            </h1>
            <h2 className="mt-2 text-3xl font-medium tracking-tight text-foreground/60 sm:text-4xl">
              What can I help with?
            </h2>

            {/* Quick Action Chips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 w-full"
            >
              {QUICK_ACTIONS.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  onClick={() => handleQuickAction(action.prompt)}
                  className={cn(
                    "group flex flex-col gap-2 rounded-2xl border bg-card/50 p-4 text-left transition-all",
                    "hover:bg-card hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5",
                    action.color
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 shadow-sm">
                      <action.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </motion.button>
              ))}
            </motion.div>

            {/* Input Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-8 w-full"
            >
              <div className="relative rounded-2xl border border-border/50 bg-card/80 shadow-xl shadow-primary/5 backdrop-blur-xl">
                <div className="flex items-start gap-3 p-4">
                  <Sparkles className="mt-1 h-5 w-5 text-primary" />
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything......"
                    className="flex-1 resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground/60 min-h-[24px] max-h-[200px] py-0.5"
                    rows={1}
                  />
                </div>
                <div className="flex items-center justify-between border-t border-border/30 px-4 py-3">
                  <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-foreground">
                    <Paperclip className="h-4 w-4" />
                    Attach file
                  </Button>
                  <Button
                    size="icon"
                    className="h-9 w-9 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50"
                    onClick={() => sendMessage(message)}
                    disabled={!message.trim() || isLoading}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* Messages Area */}
      {hasMessages && (
        <>
          <div className="relative z-10 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl space-y-8 px-6 py-8">
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isLatestAssistant = msg.role === "assistant" && msg.id === streamingMessageId
                  const isStreaming = isLatestAssistant && !isLoading

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {msg.role === "assistant" ? (
                        isLatestAssistant ? (
                          <StreamingMessage content={msg.content} isStreaming={isStreaming} onStop={() => setStreamingMessageId(null)} />
                        ) : (
                          <div className="flex max-w-[90%] flex-col gap-2">
                            <div className="prose prose-sm max-w-none text-foreground">
                              <MarkdownContent content={msg.content} />
                            </div>
                            <div className="flex items-center gap-1 opacity-0 transition-opacity hover:opacity-100">
                              <CopyButton text={msg.content} />
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="max-w-[80%]">
                          <div className="rounded-2xl bg-[#1a1a2e] px-5 py-3.5 text-white">
                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Loading */}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="flex gap-1">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <motion.span
                          key={i}
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay }}
                          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Bar (when messages exist) */}
          <div className="relative z-10 border-t border-border/50 bg-background/80 px-6 py-4 backdrop-blur-xl">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-end gap-3 rounded-2xl border border-border/50 bg-card/80 p-3 shadow-lg shadow-primary/5">
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/60 min-h-[36px] max-h-[120px]"
                  rows={1}
                />
                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  onClick={() => sendMessage(message)}
                  disabled={!message.trim() || isLoading}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Chat History Drawer */}
      <ChatHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={sessions}
        onLoadSession={(session) => { setMessages(session.messages); setHistoryOpen(false); }}
        onDeleteSession={(id) => setSessions((prev) => prev.filter((s) => s.id !== id))}
      />
    </div>
  )
}
