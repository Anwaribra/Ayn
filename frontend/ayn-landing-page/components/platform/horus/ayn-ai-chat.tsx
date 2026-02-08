"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  FileCheck,
  HelpCircle,
  MessageSquare,
  ArrowUpIcon,
  Paperclip,
  BookOpen,
  Search,
  ClipboardList,
  Trash2,
  Bot,
  User,
  ChevronDown,
  Sparkles,
  History,
  X,
  Shield,
  GraduationCap,
  Scale,
  Plus,
  Copy,
  Check,
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp?: number
}

interface AutoResizeProps {
  minHeight: number
  maxHeight?: number
}

// ─── Hooks ──────────────────────────────────────────────────────────────────────
function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) return

      if (reset) {
        textarea.style.height = `${minHeight}px`
        return
      }

      textarea.style.height = `${minHeight}px`
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity),
      )
      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight],
  )

  useEffect(() => {
    if (textareaRef.current)
      textareaRef.current.style.height = `${minHeight}px`
  }, [minHeight])

  return { textareaRef, adjustHeight }
}

// ─── Chat history persistence ───────────────────────────────────────────────────
const CHAT_STORAGE_KEY = "horus-ai-chat-history"
const SESSIONS_STORAGE_KEY = "horus-ai-sessions"

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

function loadChatHistory(): Message[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    localStorage.removeItem(CHAT_STORAGE_KEY)
  }
  return []
}

function saveChatHistory(messages: Message[]) {
  if (typeof window === "undefined") return
  try {
    const toSave = messages.slice(-100)
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // Storage full or unavailable
  }
}

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(SESSIONS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    localStorage.removeItem(SESSIONS_STORAGE_KEY)
  }
  return []
}

function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      SESSIONS_STORAGE_KEY,
      JSON.stringify(sessions.slice(0, 20)),
    )
  } catch {
    // Storage full
  }
}

// ─── Markdown Renderer ──────────────────────────────────────────────────────────
function MarkdownContent({ content }: { content: string }) {
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n")
    const elements: React.ReactNode[] = []
    let inCodeBlock = false
    let codeContent: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith("```")) {
        if (inCodeBlock) {
          elements.push(
            <pre
              key={`code-${i}`}
              className="my-3 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/20 p-4 text-xs font-mono text-foreground/80 backdrop-blur-sm"
            >
              <code>{codeContent.join("\n")}</code>
            </pre>,
          )
          codeContent = []
          inCodeBlock = false
        } else {
          inCodeBlock = true
        }
        continue
      }

      if (inCodeBlock) {
        codeContent.push(line)
        continue
      }

      if (line.trim() === "") {
        elements.push(<div key={`br-${i}`} className="h-2" />)
        continue
      }

      if (line.startsWith("### ")) {
        elements.push(
          <h4
            key={`h3-${i}`}
            className="mb-1.5 mt-4 text-sm font-semibold text-foreground"
          >
            {renderInline(line.slice(4))}
          </h4>,
        )
        continue
      }
      if (line.startsWith("## ")) {
        elements.push(
          <h3
            key={`h2-${i}`}
            className="mb-1.5 mt-5 text-base font-semibold text-foreground"
          >
            {renderInline(line.slice(3))}
          </h3>,
        )
        continue
      }
      if (line.startsWith("# ")) {
        elements.push(
          <h2
            key={`h1-${i}`}
            className="mb-2 mt-5 text-lg font-bold text-foreground"
          >
            {renderInline(line.slice(2))}
          </h2>,
        )
        continue
      }

      if (/^[-━─═]{3,}$/.test(line.trim())) {
        elements.push(
          <hr key={`hr-${i}`} className="my-4 border-border/20" />,
        )
        continue
      }

      if (/^[\s]*[-•*]\s/.test(line)) {
        const indent = line.search(/\S/)
        const itemContent = line.replace(/^[\s]*[-•*]\s/, "")
        elements.push(
          <div
            key={`li-${i}`}
            className="my-1 flex items-start gap-2.5"
            style={{ paddingLeft: `${Math.min(indent, 4) * 8}px` }}
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
            <span className="leading-relaxed">{renderInline(itemContent)}</span>
          </div>,
        )
        continue
      }

      if (/^\s*\d+[.)]\s/.test(line)) {
        const match = line.match(/^(\s*)(\d+)[.)]\s(.*)$/)
        if (match) {
          const indent = match[1].length
          elements.push(
            <div
              key={`ol-${i}`}
              className="my-1 flex items-start gap-2.5"
              style={{ paddingLeft: `${Math.min(indent, 4) * 8}px` }}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[10px] font-bold text-[var(--brand)]">
                {match[2]}
              </span>
              <span className="leading-relaxed">{renderInline(match[3])}</span>
            </div>,
          )
          continue
        }
      }

      elements.push(
        <p key={`p-${i}`} className="my-1 leading-relaxed">
          {renderInline(line)}
        </p>,
      )
    }

    if (inCodeBlock && codeContent.length > 0) {
      elements.push(
        <pre
          key="code-end"
          className="my-3 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/20 p-4 text-xs font-mono text-foreground/80 backdrop-blur-sm"
        >
          <code>{codeContent.join("\n")}</code>
        </pre>,
      )
    }

    return elements
  }

  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    let remaining = text
    let key = 0

    while (remaining.length > 0) {
      const boldMatch = remaining.match(
        /^([\s\S]*?)\*\*(.+?)\*\*([\s\S]*)$/,
      )
      if (boldMatch) {
        if (boldMatch[1])
          parts.push(<span key={key++}>{boldMatch[1]}</span>)
        parts.push(
          <strong key={key++} className="font-semibold text-foreground">
            {boldMatch[2]}
          </strong>,
        )
        remaining = boldMatch[3]
        continue
      }

      const codeMatch = remaining.match(/^([\s\S]*?)`(.+?)`([\s\S]*)$/)
      if (codeMatch) {
        if (codeMatch[1])
          parts.push(<span key={key++}>{codeMatch[1]}</span>)
        parts.push(
          <code
            key={key++}
            className="rounded-md bg-[var(--brand)]/10 px-1.5 py-0.5 text-xs font-mono text-[var(--brand)]"
          >
            {codeMatch[2]}
          </code>,
        )
        remaining = codeMatch[3]
        continue
      }

      parts.push(<span key={key++}>{remaining}</span>)
      break
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>
  }

  return (
    <div className="space-y-0 text-sm leading-relaxed text-foreground/90">
      {renderMarkdown(content)}
    </div>
  )
}

// ─── Context Badges ─────────────────────────────────────────────────────────────
const CONTEXT_BADGES = [
  {
    icon: Shield,
    label: "ISO 21001",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    icon: Scale,
    label: "ISO 9001",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    icon: GraduationCap,
    label: "NAQAAE",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
]

// ─── Quick Actions ──────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    icon: BookOpen,
    label: "Explain ISO 21001",
    description: "Key clauses & requirements",
    prompt:
      "Explain the key requirements of ISO 21001 clause by clause, focusing on what an educational institution needs to implement.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: FileCheck,
    label: "Evaluate evidence",
    description: "Evidence assessment guide",
    prompt:
      "I want to evaluate my institution's evidence against accreditation criteria. What types of evidence should I collect and how should they be organized?",
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: HelpCircle,
    label: "NAQAAE self-assessment",
    description: "Domain-by-domain guidance",
    prompt:
      "Guide me through the NAQAAE self-assessment process. What are the main domains I need to address and what evidence is required for each?",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400",
  },
  {
    icon: Search,
    label: "Gap analysis tips",
    description: "Common gaps & remediation",
    prompt:
      "What are the most common gaps educational institutions face when preparing for ISO 21001 certification? How can we address them?",
    gradient: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: MessageSquare,
    label: "Quality management",
    description: "QMS for education",
    prompt:
      "How do ISO 9001 quality management principles apply to educational institutions? Give me practical examples.",
    gradient: "from-rose-500/20 to-red-500/20",
    iconColor: "text-rose-400",
  },
  {
    icon: ClipboardList,
    label: "Assessment prep",
    description: "Audit readiness checklist",
    prompt:
      "Help me prepare for an accreditation assessment. What should I have ready and what are common pitfalls to avoid?",
    gradient: "from-indigo-500/20 to-violet-500/20",
    iconColor: "text-indigo-400",
  },
]

// ─── Copy Button ────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleCopy}
          className="rounded-md p-1 text-muted-foreground/50 opacity-0 transition-all hover:bg-accent/50 hover:text-muted-foreground group-hover/msg:opacity-100"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied!" : "Copy"}</TooltipContent>
    </Tooltip>
  )
}

// ─── Chat History Drawer ────────────────────────────────────────────────────────
function ChatHistoryDrawer({
  open,
  onClose,
  sessions,
  onLoadSession,
  onDeleteSession,
}: {
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-white/[0.06] bg-background/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)]/10">
                  <History className="h-4 w-4 text-[var(--brand)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Chat History</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {sessions.length} conversation{sessions.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                      <History className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      No saved conversations
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Your chat history will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 transition-all hover:bg-accent/50"
                        onClick={() => onLoadSession(session)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {session.title}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {new Date(session.updatedAt).toLocaleDateString()}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                            <span>{session.messages.length} messages</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 rounded-lg opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteSession(session.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </motion.div>
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

// ─── Main Chat Component ────────────────────────────────────────────────────────
export default function AynAIChat() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 164,
  })

  useEffect(() => {
    const history = loadChatHistory()
    if (history.length > 0) {
      setMessages(history)
    }
    setSessions(loadSessions())

    // Check for initial prompt from command palette
    const initialPrompt = localStorage.getItem("horus-ai-initial-prompt")
    if (initialPrompt) {
      // Clear it immediately to prevent re-triggering
      localStorage.removeItem("horus-ai-initial-prompt")
      // Send the message after a short delay to ensure component is ready
      setTimeout(() => {
        sendMessage(initialPrompt)
      }, 100)
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages)
    }
  }, [messages])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const saveCurrentSession = useCallback(() => {
    if (messages.length === 0) return
    const firstUserMsg = messages.find((m) => m.role === "user")
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 60) +
        (firstUserMsg.content.length > 60 ? "..." : "")
      : "New Conversation"
    const now = Date.now()
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title,
      messages,
      createdAt: now,
      updatedAt: now,
    }
    const updated = [session, ...sessions].slice(0, 20)
    setSessions(updated)
    saveSessions(updated)
  }, [messages, sessions])

  const clearChat = useCallback(() => {
    if (messages.length > 0) {
      saveCurrentSession()
    }
    setMessages([])
    localStorage.removeItem(CHAT_STORAGE_KEY)
  }, [messages, saveCurrentSession])

  const loadSession = useCallback((session: ChatSession) => {
    setMessages(session.messages)
    setHistoryOpen(false)
  }, [])

  const deleteSession = useCallback(
    (id: string) => {
      const updated = sessions.filter((s) => s.id !== id)
      setSessions(updated)
      saveSessions(updated)
    },
    [sessions],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      }
      const updatedMessages = [...messages, userMsg]
      setMessages(updatedMessages)
      setMessage("")
      adjustHeight(true)
      setIsLoading(true)

      try {
        const chatHistory = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const response = await api.chat(chatHistory)
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.result || "No response.",
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to get response",
        )
        const errMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, I couldn't process that request. Please try again.",
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, errMsg])
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, adjustHeight, messages],
  )

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt)
  }

  const hasMessages = messages.length > 0 || isLoading

  return (
    <div className="relative flex h-[calc(100vh-56px)] w-full flex-col overflow-hidden bg-background">
      {/* Subtle background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--brand)]/[0.03] blur-3xl" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[400px] w-[400px] rounded-full bg-purple-500/[0.02] blur-3xl" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-background/80 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand)]/20 to-[var(--brand)]/5 ring-1 ring-[var(--brand)]/20">
              <Bot className="h-5 w-5 text-[var(--brand)]" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight">Horus AI</h1>
              <span className="rounded-md bg-[var(--brand)]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--brand)]">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Quality Assurance Advisor
            </p>
          </div>
          <div className="ml-3 hidden items-center gap-1.5 sm:flex">
            {CONTEXT_BADGES.map((badge) => (
              <Badge
                key={badge.label}
                variant="outline"
                className={`gap-1 px-2 py-0.5 text-[10px] font-medium ${badge.color} backdrop-blur-sm`}
              >
                <badge.icon className="h-2.5 w-2.5" />
                {badge.label}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => setHistoryOpen(true)}
              >
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chat history</TooltipContent>
          </Tooltip>
          {messages.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={clearChat}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New chat</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* ──── Empty State ──── */}
      {!hasMessages && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center text-center"
          >
            {/* Hero icon */}
            <div className="relative mb-6">
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(var(--brand-rgb, 59 130 246), 0)",
                    "0 0 40px 8px rgba(var(--brand-rgb, 59 130 246), 0.1)",
                    "0 0 0 0 rgba(var(--brand-rgb, 59 130 246), 0)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--brand)]/20 via-[var(--brand)]/10 to-purple-500/10 ring-1 ring-[var(--brand)]/20"
              >
                <Sparkles className="h-10 w-10 text-[var(--brand)]" />
              </motion.div>
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-background">
                <Shield className="h-3.5 w-3.5" />
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              How can I help?
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              I&apos;m your expert quality assurance advisor, trained on{" "}
              <span className="font-medium text-foreground/80">ISO 21001</span>,{" "}
              <span className="font-medium text-foreground/80">ISO 9001</span> &{" "}
              <span className="font-medium text-foreground/80">NAQAAE</span>{" "}
              standards for educational institutions.
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="mt-10 w-full max-w-3xl"
          >
            <div className="mb-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>Try asking about</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
              {QUICK_ACTIONS.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.25 + index * 0.06,
                    ease: "easeOut",
                  }}
                  onClick={() => handleQuickAction(action.prompt)}
                  className={cn(
                    "group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-white/[0.06] bg-card/50 px-4 py-3.5 text-left backdrop-blur-sm",
                    "transition-all duration-300 hover:border-[var(--brand)]/20 hover:bg-accent/40 hover:shadow-lg hover:shadow-[var(--brand)]/5",
                    "hover:-translate-y-0.5",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                      action.gradient,
                    )}
                  />
                  <div className="relative flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] transition-colors group-hover:bg-white/[0.1]",
                      )}
                    >
                      <action.icon
                        className={cn("h-4 w-4", action.iconColor)}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {action.label}
                    </span>
                  </div>
                  <p className="relative text-xs leading-relaxed text-muted-foreground">
                    {action.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Input area at bottom */}
          <div className="mt-auto w-full max-w-3xl pb-6 pt-8">
            <ChatInput
              message={message}
              setMessage={setMessage}
              textareaRef={textareaRef}
              adjustHeight={adjustHeight}
              sendMessage={sendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* ──── Messages Area ──── */}
      {hasMessages && (
        <>
          <div
            ref={messagesContainerRef}
            className="relative z-10 min-h-0 flex-1 overflow-y-auto"
          >
            <div className="mx-auto w-full max-w-3xl space-y-1 px-4 py-6">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={cn(
                      "group/msg flex w-full gap-3 py-2",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand)]/15 to-[var(--brand)]/5 ring-1 ring-[var(--brand)]/10">
                        <Bot className="h-4 w-4 text-[var(--brand)]" />
                      </div>
                    )}
                    <div className="flex max-w-[80%] flex-col gap-1">
                      <div
                        className={cn(
                          "px-4 py-3",
                          msg.role === "user"
                            ? "rounded-2xl rounded-br-md bg-[var(--brand)] text-[var(--brand-foreground)] shadow-md shadow-[var(--brand)]/10"
                            : "rounded-2xl rounded-bl-md border border-white/[0.06] bg-card/80 shadow-sm backdrop-blur-sm",
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <MarkdownContent content={msg.content} />
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {msg.content}
                          </p>
                        )}
                      </div>
                      {/* Action buttons for assistant messages */}
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1 pl-1">
                          <CopyButton text={msg.content} />
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 py-2"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand)]/15 to-[var(--brand)]/5 ring-1 ring-[var(--brand)]/10">
                    <Bot className="h-4 w-4 text-[var(--brand)]" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md border border-white/[0.06] bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <motion.span
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: 0,
                          }}
                          className="h-2 w-2 rounded-full bg-[var(--brand)]"
                        />
                        <motion.span
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: 0.15,
                          }}
                          className="h-2 w-2 rounded-full bg-[var(--brand)]"
                        />
                        <motion.span
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: 0.3,
                          }}
                          className="h-2 w-2 rounded-full bg-[var(--brand)]"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area when messages exist */}
          <div className="relative z-10 border-t border-white/[0.06] bg-background/80 px-4 pb-4 pt-3 backdrop-blur-xl">
            <div className="mx-auto w-full max-w-3xl">
              <ChatInput
                message={message}
                setMessage={setMessage}
                textareaRef={textareaRef}
                adjustHeight={adjustHeight}
                sendMessage={sendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>
        </>
      )}

      {/* Chat History Drawer */}
      <ChatHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={sessions}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
      />
    </div>
  )
}

// ─── Chat Input ─────────────────────────────────────────────────────────────────
function ChatInput({
  message,
  setMessage,
  textareaRef,
  adjustHeight,
  sendMessage,
  isLoading,
}: {
  message: string
  setMessage: (v: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  adjustHeight: (reset?: boolean) => void
  sendMessage: (text: string) => void
  isLoading: boolean
}) {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative rounded-2xl border bg-card/60 shadow-sm backdrop-blur-sm transition-all duration-300",
          "border-white/[0.06]",
          "focus-within:border-[var(--brand)]/30 focus-within:shadow-lg focus-within:shadow-[var(--brand)]/5 focus-within:ring-1 focus-within:ring-[var(--brand)]/10",
        )}
      >
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            adjustHeight()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              sendMessage(message)
            }
          }}
          placeholder="Ask about ISO 21001, NAQAAE, evidence, gap analysis..."
          className={cn(
            "min-h-[48px] w-full resize-none border-none bg-transparent px-4 py-3.5 text-sm text-foreground",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "placeholder:text-muted-foreground/50",
          )}
          style={{ overflow: "hidden" }}
          rows={1}
          disabled={isLoading}
        />

        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground/30 cursor-not-allowed"
                  aria-label="Attach file"
                  disabled
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>File attachment coming soon</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] text-muted-foreground/50">
              {message.length > 0
                ? `${message.length} chars`
                : "Shift+Enter for new line"}
            </span>
            <Button
              type="button"
              onClick={() => sendMessage(message)}
              disabled={!message.trim() || isLoading}
              size="icon"
              className={cn(
                "h-8 w-8 rounded-xl transition-all duration-300",
                message.trim() && !isLoading
                  ? "bg-[var(--brand)] text-[var(--brand-foreground)] shadow-md shadow-[var(--brand)]/20 hover:bg-[var(--brand)]/90 hover:shadow-lg hover:shadow-[var(--brand)]/30"
                  : "bg-muted/50 text-muted-foreground/50",
              )}
              aria-label="Send"
            >
              <ArrowUpIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-foreground/40">
        Horus AI is your quality assurance expert. Responses may need
        verification against official standards.
      </p>
    </div>
  )
}
