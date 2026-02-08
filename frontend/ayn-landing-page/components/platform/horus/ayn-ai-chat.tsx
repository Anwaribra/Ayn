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
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

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
              className="my-2 overflow-x-auto rounded-lg border border-border/50 bg-background/50 p-3 text-xs font-mono"
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
            className="mb-1 mt-3 text-sm font-semibold text-foreground"
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
            className="mb-1 mt-4 text-base font-semibold text-foreground"
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
            className="mb-2 mt-4 text-lg font-bold text-foreground"
          >
            {renderInline(line.slice(2))}
          </h2>,
        )
        continue
      }

      if (/^[-━─═]{3,}$/.test(line.trim())) {
        elements.push(
          <hr key={`hr-${i}`} className="my-3 border-border/30" />,
        )
        continue
      }

      if (/^[\s]*[-•*]\s/.test(line)) {
        const indent = line.search(/\S/)
        const itemContent = line.replace(/^[\s]*[-•*]\s/, "")
        elements.push(
          <div
            key={`li-${i}`}
            className="my-0.5 flex gap-2"
            style={{ paddingLeft: `${Math.min(indent, 4) * 8}px` }}
          >
            <span className="mt-0.5 shrink-0 text-xs text-[var(--brand)]">
              ●
            </span>
            <span>{renderInline(itemContent)}</span>
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
              className="my-0.5 flex gap-2"
              style={{ paddingLeft: `${Math.min(indent, 4) * 8}px` }}
            >
              <span className="shrink-0 text-sm font-semibold text-[var(--brand)]">
                {match[2]}.
              </span>
              <span>{renderInline(match[3])}</span>
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
          className="my-2 overflow-x-auto rounded-lg border border-border/50 bg-background/50 p-3 text-xs font-mono"
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
            className="rounded bg-[var(--brand)]/10 px-1.5 py-0.5 text-xs font-mono text-[var(--brand)]"
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
    <div className="space-y-0 text-sm leading-relaxed">
      {renderMarkdown(content)}
    </div>
  )
}

// ─── Context Badges ─────────────────────────────────────────────────────────────
const CONTEXT_BADGES = [
  { icon: Shield, label: "ISO 21001", color: "bg-blue-500/10 text-blue-500" },
  {
    icon: Scale,
    label: "ISO 9001",
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    icon: GraduationCap,
    label: "NAQAAE",
    color: "bg-purple-500/10 text-purple-500",
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
  },
  {
    icon: FileCheck,
    label: "Evaluate evidence",
    description: "Evidence assessment guide",
    prompt:
      "I want to evaluate my institution's evidence against accreditation criteria. What types of evidence should I collect and how should they be organized?",
  },
  {
    icon: HelpCircle,
    label: "NAQAAE self-assessment",
    description: "Domain-by-domain guidance",
    prompt:
      "Guide me through the NAQAAE self-assessment process. What are the main domains I need to address and what evidence is required for each?",
  },
  {
    icon: Search,
    label: "Gap analysis tips",
    description: "Common gaps & remediation",
    prompt:
      "What are the most common gaps educational institutions face when preparing for ISO 21001 certification? How can we address them?",
  },
  {
    icon: MessageSquare,
    label: "Quality management",
    description: "QMS for education",
    prompt:
      "How do ISO 9001 quality management principles apply to educational institutions? Give me practical examples.",
  },
  {
    icon: ClipboardList,
    label: "Assessment prep",
    description: "Audit readiness checklist",
    prompt:
      "Help me prepare for an accreditation assessment. What should I have ready and what are common pitfalls to avoid?",
  },
]

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
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Chat History</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No saved conversations
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50"
                  onClick={() => onLoadSession(session)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {session.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.updatedAt).toLocaleDateString()} -{" "}
                      {session.messages.length} messages
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Main Chat Component ────────────────────────────────────────────────────────
export default function AynAIChat() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  })

  useEffect(() => {
    const history = loadChatHistory()
    if (history.length > 0) {
      setMessages(history)
      setQuickActionsOpen(false)
    }
    setSessions(loadSessions())
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
      ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "..." : "")
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
    setQuickActionsOpen(true)
  }, [messages, saveCurrentSession])

  const loadSession = useCallback((session: ChatSession) => {
    setMessages(session.messages)
    setHistoryOpen(false)
    setQuickActionsOpen(false)
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
      setQuickActionsOpen(false)

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
    <div className="relative flex h-[calc(100vh-56px)] w-full flex-col bg-background">
      {/* Top Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand)]/10">
            <Bot className="h-4 w-4 text-[var(--brand)]" />
          </div>
          <div>
            <p className="text-sm font-semibold">Horus AI</p>
            <p className="text-[10px] text-muted-foreground">
              Quality Assurance Advisor
            </p>
          </div>
          <div className="ml-2 flex gap-1">
            {CONTEXT_BADGES.map((badge) => (
              <Badge
                key={badge.label}
                variant="secondary"
                className={`px-1.5 py-0 text-[9px] font-medium ${badge.color} border-0`}
              >
                {badge.label}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setHistoryOpen(true)}
            title="Chat history"
          >
            <History className="h-4 w-4" />
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={clearChat}
              title="New chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {!hasMessages && (
        <div className="flex shrink-0 flex-col items-center px-4 pb-4 pt-16 text-center">
          <div className="relative mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand)]/20 to-purple-500/20">
              <Sparkles className="h-8 w-8 text-[var(--brand)]" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-background">
              <Shield className="h-3 w-3" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            How can I help?
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            I&apos;m your expert quality assurance advisor, trained on ISO
            21001, ISO 9001 &amp; NAQAAE standards for educational
            institutions.
          </p>
        </div>
      )}

      {/* Messages area */}
      {hasMessages && (
        <div
          ref={messagesContainerRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 pt-4"
        >
          <div className="mx-auto w-full max-w-3xl space-y-5 pb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {msg.role === "assistant" && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand)]/15 to-[var(--brand)]/5 ring-1 ring-[var(--brand)]/10">
                    <Bot className="h-4 w-4 text-[var(--brand)]" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] px-4 py-3",
                    msg.role === "user"
                      ? "rounded-2xl rounded-br-md bg-[var(--brand)] text-[var(--brand-foreground)] shadow-sm"
                      : "rounded-2xl rounded-bl-md border border-border/50 bg-card shadow-sm",
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
                {msg.role === "user" && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand)]/15 to-[var(--brand)]/5 ring-1 ring-[var(--brand)]/10">
                  <Bot className="h-4 w-4 text-[var(--brand)]" />
                </div>
                <div className="rounded-2xl rounded-bl-md border border-border/50 bg-card px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--brand)]" />
                      <span
                        className="h-2 w-2 animate-pulse rounded-full bg-[var(--brand)]"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <span
                        className="h-2 w-2 animate-pulse rounded-full bg-[var(--brand)]"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                    <span className="text-xs">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input area */}
      <div
        className={cn(
          "flex w-full flex-col items-center px-4 pb-4",
          !hasMessages && "flex-1 justify-end",
        )}
      >
        <div className="w-full max-w-3xl">
          {/* Quick Actions */}
          {!hasMessages && (
            <Collapsible
              open={quickActionsOpen}
              onOpenChange={setQuickActionsOpen}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mx-auto mb-3 flex gap-1 text-muted-foreground"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Try asking about
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      quickActionsOpen && "rotate-180",
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="group flex flex-col gap-1 rounded-xl border border-border bg-card/50 px-3 py-3 text-left transition-all hover:border-[var(--brand)]/20 hover:bg-accent/50 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <action.icon className="h-4 w-4 text-[var(--brand)]" />
                        <span className="text-xs font-medium text-foreground">
                          {action.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {action.description}
                      </span>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Input box */}
          <div className="relative rounded-xl border border-border bg-card shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-1 focus-within:ring-[var(--brand)]/20">
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
                "min-h-[48px] w-full resize-none border-none bg-transparent px-4 py-3 text-sm text-foreground",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground",
              )}
              style={{ overflow: "hidden" }}
              rows={1}
              disabled={isLoading}
            />

            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
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
                    "h-8 w-8 rounded-lg transition-all",
                    message.trim() && !isLoading
                      ? "bg-[var(--brand)] text-[var(--brand-foreground)] shadow-sm hover:bg-[var(--brand)]/90"
                      : "bg-muted text-muted-foreground",
                  )}
                  aria-label="Send"
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Horus AI is your quality assurance expert. Responses may need
            verification against official standards.
          </p>
        </div>
      </div>

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
