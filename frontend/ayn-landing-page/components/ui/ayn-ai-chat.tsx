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
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
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
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
      )
      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight]
  )

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`
  }, [minHeight])

  return { textareaRef, adjustHeight }
}

// ─── Chat history persistence ───────────────────────────────────────────────────
const CHAT_STORAGE_KEY = "horus-ai-chat-history"

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
            <pre key={`code-${i}`} className="bg-background/50 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono border border-border/50">
              <code>{codeContent.join("\n")}</code>
            </pre>
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
        elements.push(<h4 key={`h3-${i}`} className="text-sm font-semibold mt-3 mb-1 text-foreground">{renderInline(line.slice(4))}</h4>)
        continue
      }
      if (line.startsWith("## ")) {
        elements.push(<h3 key={`h2-${i}`} className="text-base font-semibold mt-4 mb-1 text-foreground">{renderInline(line.slice(3))}</h3>)
        continue
      }
      if (line.startsWith("# ")) {
        elements.push(<h2 key={`h1-${i}`} className="text-lg font-bold mt-4 mb-2 text-foreground">{renderInline(line.slice(2))}</h2>)
        continue
      }

      if (/^[-━─═]{3,}$/.test(line.trim())) {
        elements.push(<hr key={`hr-${i}`} className="my-3 border-border/30" />)
        continue
      }

      if (/^[\s]*[-•*]\s/.test(line)) {
        const indent = line.search(/\S/)
        const content = line.replace(/^[\s]*[-•*]\s/, "")
        elements.push(
          <div key={`li-${i}`} className="flex gap-2 my-0.5" style={{ paddingLeft: `${Math.min(indent, 4) * 8}px` }}>
            <span className="text-[var(--brand)] mt-0.5 shrink-0 text-xs">●</span>
            <span>{renderInline(content)}</span>
          </div>
        )
        continue
      }

      if (/^\s*\d+[.)]\s/.test(line)) {
        const match = line.match(/^(\s*)(\d+)[.)]\s(.*)$/)
        if (match) {
          const indent = match[1].length
          elements.push(
            <div key={`ol-${i}`} className="flex gap-2 my-0.5" style={{ paddingLeft: `${Math.min(indent, 4) * 8}px` }}>
              <span className="text-[var(--brand)] font-semibold shrink-0 text-sm">{match[2]}.</span>
              <span>{renderInline(match[3])}</span>
            </div>
          )
          continue
        }
      }

      elements.push(<p key={`p-${i}`} className="my-1 leading-relaxed">{renderInline(line)}</p>)
    }

    if (inCodeBlock && codeContent.length > 0) {
      elements.push(
        <pre key="code-end" className="bg-background/50 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono border border-border/50">
          <code>{codeContent.join("\n")}</code>
        </pre>
      )
    }

    return elements
  }

  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    let remaining = text
    let key = 0

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/^([\s\S]*?)\*\*(.+?)\*\*([\s\S]*)$/)
      if (boldMatch) {
        if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>)
        parts.push(<strong key={key++} className="font-semibold text-foreground">{boldMatch[2]}</strong>)
        remaining = boldMatch[3]
        continue
      }

      const codeMatch = remaining.match(/^([\s\S]*?)`(.+?)`([\s\S]*)$/)
      if (codeMatch) {
        if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>)
        parts.push(
          <code key={key++} className="bg-[var(--brand)]/10 text-[var(--brand)] px-1.5 py-0.5 rounded text-xs font-mono">
            {codeMatch[2]}
          </code>
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
    <div className="leading-relaxed text-sm space-y-0">
      {renderMarkdown(content)}
    </div>
  )
}

// ─── Quick Actions ──────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    icon: BookOpen,
    label: "Explain ISO 21001 clause",
    prompt: "Explain the key requirements of ISO 21001 clause by clause, focusing on what an educational institution needs to implement.",
  },
  {
    icon: FileCheck,
    label: "Evaluate my evidence",
    prompt: "I want to evaluate my institution's evidence against accreditation criteria. What types of evidence should I collect and how should they be organized?",
  },
  {
    icon: HelpCircle,
    label: "NAQAAE self-assessment",
    prompt: "Guide me through the NAQAAE self-assessment process. What are the main domains I need to address and what evidence is required for each?",
  },
  {
    icon: Search,
    label: "Gap analysis tips",
    prompt: "What are the most common gaps educational institutions face when preparing for ISO 21001 certification? How can we address them?",
  },
  {
    icon: MessageSquare,
    label: "Quality management",
    prompt: "How do ISO 9001 quality management principles apply to educational institutions? Give me practical examples.",
  },
  {
    icon: ClipboardList,
    label: "Assessment prep",
    prompt: "Help me prepare for an accreditation assessment. What should I have ready and what are common pitfalls to avoid?",
  },
]

// ─── Main Chat Component ────────────────────────────────────────────────────────
export default function AynAIChat() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(true)
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

  const clearChat = useCallback(() => {
    setMessages([])
    localStorage.removeItem(CHAT_STORAGE_KEY)
    setQuickActionsOpen(true)
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
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
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to get response"
        )
        const errMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I couldn't process that request. Please try again.",
        }
        setMessages((prev) => [...prev, errMsg])
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, adjustHeight, messages]
  )

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt)
  }

  const hasMessages = messages.length > 0 || isLoading

  return (
    <div className="relative w-full h-[calc(100vh-0px)] flex flex-col bg-background">
      {/* Header area */}
      {!hasMessages && (
        <div className="flex-shrink-0 pt-16 pb-8 px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-[var(--brand)]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Horus AI</h1>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Your expert quality assurance advisor for ISO 21001, ISO 9001 &amp; NAQAAE standards.
          </p>
        </div>
      )}

      {/* Messages area */}
      {hasMessages && (
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto min-h-0 px-4 pt-4"
        >
          <div className="w-full max-w-3xl mx-auto space-y-4 pb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 w-full",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-[var(--brand)]" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    msg.role === "user"
                      ? "bg-[var(--brand)] text-[var(--brand-foreground)] rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <MarkdownContent content={msg.content} />
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">
                      {msg.content}
                    </p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-[var(--brand)]" />
                </div>
                <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-card border border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-[var(--brand)] animate-pulse" />
                      <span className="h-2 w-2 rounded-full bg-[var(--brand)] animate-pulse delay-100" style={{ animationDelay: "0.2s" }} />
                      <span className="h-2 w-2 rounded-full bg-[var(--brand)] animate-pulse delay-200" style={{ animationDelay: "0.4s" }} />
                    </div>
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input area */}
      <div className={cn(
        "w-full flex flex-col items-center px-4 pb-6",
        !hasMessages && "flex-1 justify-end"
      )}>
        <div className="w-full max-w-3xl">
          {/* Quick Actions (collapsible) */}
          {!hasMessages && (
            <Collapsible open={quickActionsOpen} onOpenChange={setQuickActionsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-3 text-muted-foreground gap-1 mx-auto flex"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Quick Actions
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", quickActionsOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-card/50 hover:bg-accent/50 px-3 py-2.5 text-left transition-colors"
                    >
                      <action.icon className="h-4 w-4 text-[var(--brand)] shrink-0" />
                      <span className="text-xs text-muted-foreground">{action.label}</span>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Input box */}
          <div className="relative bg-card rounded-xl border border-border shadow-sm">
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
                "w-full px-4 py-3 resize-none border-none bg-transparent text-foreground text-sm min-h-[48px]",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground"
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
                  <Paperclip className="w-4 h-4" />
                </Button>
                {messages.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label="Clear chat"
                    onClick={clearChat}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <Button
                type="button"
                onClick={() => sendMessage(message)}
                disabled={!message.trim() || isLoading}
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg",
                  message.trim() && !isLoading
                    ? "bg-[var(--brand)] text-[var(--brand-foreground)] hover:bg-[var(--brand)]/90"
                    : "bg-muted text-muted-foreground"
                )}
                aria-label="Send"
              >
                <ArrowUpIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Horus AI is your quality assurance expert. Responses may need verification.
          </p>
        </div>
      </div>
    </div>
  )
}
