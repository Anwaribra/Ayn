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
  CircleUserRound,
  ImageIcon,
  BookOpen,
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
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

function QuickActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="flex items-center gap-2 rounded-full border-border bg-card/50 text-muted-foreground hover:text-foreground hover:bg-accent/80 backdrop-blur-sm text-xs min-h-[44px] touch-manipulation px-4"
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </Button>
  )
}

export default function AynAIChat() {
  const { user } = useAuth()
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
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

  const handleQuickAction = (prompt: string) => {
    setMessage(prompt)
    textareaRef.current?.focus()
  }

  const hasMessages = messages.length > 0 || isLoading

  return (
    <div
      className="relative w-full min-h-screen flex flex-col items-center overflow-x-hidden bg-background"
      style={{ backgroundAttachment: "fixed" }}
    >
      {/* Ruixen-style background: deep base + primary glow (Ayn colors) */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_70%_at_50%_100%,var(--primary)/20_0%,transparent_50%),linear-gradient(to_bottom,transparent_0%,var(--primary)/10_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-primary/15 via-primary/5 to-transparent"
        aria-hidden
      />

      {/* Signed-in indicator on home */}
      {user && (
        <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-md border border-border text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user.name}</span>
        </div>
      )}

      {/* Scrollable messages (when present) */}
      {hasMessages && (
        <div
          ref={messagesContainerRef}
          className="flex-1 w-full overflow-y-auto min-h-0 px-4 pt-6"
        >
          <div className="w-full max-w-3xl mx-auto space-y-4 pb-4">
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
                    "max-w-[85%] rounded-xl px-4 py-3 text-sm shadow-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card/80 backdrop-blur-md border border-border text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-xl px-4 py-3 bg-card/80 backdrop-blur-md border border-border text-muted-foreground text-sm">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Centered block: title + input + quick actions (Ruixen layout) */}
      <div
        className={cn(
          "w-full flex flex-col items-center px-4 py-8",
          hasMessages ? "shrink-0" : "flex-1 justify-center min-h-0"
        )}
      >
        {/* Centered AI title */}
        <div className="flex-1 w-full flex flex-col items-center justify-center shrink-0">
          <div className="text-center">
            <h1 className="text-4xl font-semibold text-foreground drop-shadow-sm">
              Horus AI
            </h1>
            <p className="mt-2 text-muted-foreground">
              Build something amazing — just start typing below.
            </p>
          </div>
        </div>

        {/* Input box section (Ruixen-style: semi-transparent, backdrop blur, our colors) */}
        <div className="w-full max-w-3xl mb-[10vh] md:mb-[15vh]">
          <div className="relative bg-card/60 backdrop-blur-md rounded-xl border border-border">
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
              placeholder="Type your request..."
              className={cn(
                "w-full px-4 py-3 resize-none border-none bg-transparent text-foreground text-sm min-h-[48px] md:min-h-[52px]",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground"
              )}
              style={{ overflow: "hidden" }}
              rows={1}
              disabled={isLoading}
            />

            {/* Footer buttons */}
            <div className="flex items-center justify-between p-3 border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50 min-h-[44px] min-w-[44px] touch-manipulation"
                aria-label="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                onClick={() => sendMessage(message)}
                disabled={!message.trim() || isLoading}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 rounded-lg min-h-[44px] touch-manipulation",
                  message.trim() && !isLoading
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                aria-label="Send"
              >
                <ArrowUpIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick actions (Ruixen-style grid, Ayn colors) */}
          <div className="flex items-center justify-center flex-wrap gap-3 mt-6">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionButton
                key={action.label}
                icon={<action.icon className="w-4 h-4 shrink-0" />}
                label={action.label}
                onClick={() => handleQuickAction(action.prompt)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
