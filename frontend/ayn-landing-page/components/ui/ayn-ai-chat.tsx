"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  FileText,
  FileCheck,
  HelpCircle,
  MessageSquare,
  ArrowUpIcon,
  Paperclip,
  Sparkles,
  CircleUserRound,
  ImageIcon,
  BookOpen,
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AutoResizeProps {
  minHeight: number
  maxHeight?: number
}

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

const QUICK_ACTIONS = [
  { icon: FileCheck, label: "About my certificate", prompt: "Tell me about my uploaded certificate and what it indicates." },
  { icon: FileText, label: "Document analysis", prompt: "Analyze the document I uploaded and summarize key points." },
  { icon: HelpCircle, label: "General question", prompt: "I have a general question about education standards or certificates." },
  { icon: MessageSquare, label: "Explain my result", prompt: "Explain the analysis result I received in simple terms." },
  { icon: CircleUserRound, label: "My uploads", prompt: "What documents or evidence have I uploaded? Summarize them." },
  { icon: BookOpen, label: "Standards & criteria", prompt: "Explain the standards and criteria used for certificate assessment." },
  { icon: ImageIcon, label: "Image / evidence", prompt: "I want to ask about an image or evidence I attached." },
]

export default function AynAIChat() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  })

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setMessage("")
    adjustHeight(true)
    setIsLoading(true)

    try {
      const response = await api.generateAnswer(trimmed)
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.result || "No response.",
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to get response")
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I couldn't process that. Please try again.",
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, adjustHeight])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(message)
  }

  const handleQuickAction = (prompt: string) => {
    setMessage(prompt)
    textareaRef.current?.focus()
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-12rem)]">
      {/* Card container: same visual language as Dashboard / Assessments */}
      <div className="flex-1 flex flex-col bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
        {/* Header: same hierarchy as other platform pages */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Horus AI
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask about your certificate or documents — type below.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[160px] max-h-[45vh]">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="w-10 h-10 text-muted-foreground/60 mb-3" />
              <p className="text-sm text-muted-foreground">
                Ask anything about your uploaded certificate or documents.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex w-full",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 border border-border text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-xl px-4 py-3 bg-muted/50 border border-border text-muted-foreground text-sm">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input: same style as platform inputs */}
        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-border bg-background/50">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                adjustHeight()
              }}
              placeholder="Type your request..."
              className={cn(
                "w-full px-4 py-3 resize-none border-0 bg-transparent text-foreground text-sm",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground min-h-[48px]"
              )}
              style={{ overflow: "hidden" }}
              rows={1}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-accent"
                aria-label="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button
                type="submit"
                disabled={!message.trim() || isLoading}
                size="sm"
                className={cn(
                  message.trim() && !isLoading
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "opacity-60 cursor-not-allowed"
                )}
              >
                <ArrowUpIcon className="w-4 h-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </form>

        {/* Quick Actions: same as platform buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-2 rounded-lg border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent text-xs"
              onClick={() => handleQuickAction(action.prompt)}
            >
              <action.icon className="w-3.5 h-3.5 shrink-0" />
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
