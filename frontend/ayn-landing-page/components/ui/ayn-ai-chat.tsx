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
    <div
      className={cn(
        "relative w-full min-h-[calc(100vh-8rem)] rounded-xl overflow-hidden flex flex-col items-center",
        "bg-black"
      )}
    >
      {/* Blue/purple glow from bottom like reference */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(99, 102, 241, 0.35) 0%, rgba(139, 92, 246, 0.2) 40%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex-1 w-full flex flex-col items-center justify-center px-4">
        {/* Title + subtitle at top center */}
        <div className="flex-1 w-full flex flex-col items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-semibold text-white drop-shadow-sm">
              Horus AI
            </h1>
            <p className="mt-2 text-neutral-200">
              Build something amazing — just start typing below.
            </p>
          </div>
        </div>

        {/* Messages (when present) above input */}
        {messages.length > 0 && (
          <div className="w-full max-w-3xl flex-1 overflow-y-auto space-y-4 mb-4 min-h-[120px] max-h-[40vh]">
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
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/10 border border-neutral-600 text-neutral-100"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-white/10 border border-neutral-600 text-neutral-400 text-sm">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input box: wide, translucent dark, paperclip left, send right */}
        <div className="w-full max-w-3xl mb-[20vh]">
          <form onSubmit={handleSubmit}>
            <div className="relative bg-black/60 backdrop-blur-md rounded-xl border border-neutral-700">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value)
                  adjustHeight()
                }}
                placeholder="Type your request..."
                className={cn(
                  "w-full px-4 py-3 resize-none border-none",
                  "bg-transparent text-white text-sm",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "placeholder:text-neutral-400 min-h-[48px]"
                )}
                style={{ overflow: "hidden" }}
                rows={1}
                disabled={isLoading}
              />
              <div className="flex items-center justify-between p-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-neutral-700"
                  aria-label="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                    message.trim() && !isLoading
                      ? "bg-neutral-600 text-white hover:bg-neutral-500"
                      : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                  )}
                >
                  <ArrowUpIcon className="w-4 h-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
          </form>

          {/* Quick Actions: two rows, dark bg, light border, rounded (like reference) */}
          <div className="flex items-center justify-center flex-wrap gap-3 mt-6">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.label}
                type="button"
                variant="outline"
                className="flex items-center gap-2 rounded-lg border-neutral-700 bg-black/50 text-neutral-300 hover:text-white hover:bg-neutral-700 text-xs px-4 py-2"
                onClick={() => handleQuickAction(action.prompt)}
              >
                <action.icon className="w-4 h-4 shrink-0" />
                <span>{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
