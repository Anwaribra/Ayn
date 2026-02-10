"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  Send,
  Paperclip,
  Bot,
  User,
  Sparkles,
  FileText,
  Image as ImageIcon,
  X,
  Copy,
  Check,
  Loader2,
  MessageSquare,
  Trash2,
  Menu,
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

interface AttachedFile {
  id: string
  file: File
  preview?: string
  type: "image" | "document"
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

// ─── Storage ────────────────────────────────────────────────────────────────────
const MESSAGES_KEY = "horus-messages"
const SESSIONS_KEY = "horus-sessions"

function saveMessages(messages: Message[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages))
  } catch {}
}

function loadMessages(): Message[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(MESSAGES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  } catch {}
}

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(SESSIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// ─── Copy Button ────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )
}

// ─── Markdown Content ───────────────────────────────────────────────────────────
export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          code: ({ inline, children }: any) =>
            inline ? (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{children}</code>
            ) : (
              <code className="block rounded-lg bg-muted p-3 font-mono text-sm overflow-x-auto">
                {children}
              </code>
            ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function HorusAIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load on mount
  useEffect(() => {
    const savedMessages = loadMessages()
    const savedSessions = loadSessions()
    if (savedMessages.length > 0) setMessages(savedMessages)
    if (savedSessions.length > 0) setSessions(savedSessions)
  }, [])

  // Save on change
  useEffect(() => {
    if (messages.length > 0) saveMessages(messages)
  }, [messages])

  useEffect(() => {
    if (sessions.length > 0) saveSessions(sessions)
  }, [sessions])

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newFiles: AttachedFile[] = files.slice(0, 5 - attachedFiles.length).map((file) => ({
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

  // Send message
  const sendMessage = async () => {
    const text = input.trim()
    if ((!text && attachedFiles.length === 0) || isLoading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text || "📎 Files attached",
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      let response

      if (attachedFiles.length > 0) {
        response = await api.chatWithFiles(
          text || "Analyze these files for compliance.",
          attachedFiles.map((f) => f.file)
        )
        setAttachedFiles([])
      } else {
        const chatHistory = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
        response = await api.chat(chatHistory)
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.result || "No response.",
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  // Save current chat as session
  const saveCurrentSession = () => {
    if (messages.length === 0) return
    const firstMsg = messages.find((m) => m.role === "user")
    const title = firstMsg ? firstMsg.content.slice(0, 50) + "..." : "New Chat"
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title,
      messages,
      createdAt: Date.now(),
    }
    setSessions((prev) => [session, ...prev])
    toast.success("Chat saved")
  }

  // Load session
  const loadSession = (session: ChatSession) => {
    setMessages(session.messages)
    setHistoryOpen(false)
  }

  // Delete session
  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  // New chat
  const newChat = () => {
    if (messages.length > 0) {
      saveCurrentSession()
    }
    setMessages([])
    setAttachedFiles([])
    localStorage.removeItem(MESSAGES_KEY)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Sidebar - Chat History */}
      <div className="hidden md:flex w-64 flex-col border-r bg-muted/20">
        <div className="p-4 border-b">
          <Button onClick={newChat} className="w-full" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          {sessions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground p-4">No chat history</div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="group flex items-center gap-2 rounded-lg p-2 hover:bg-accent cursor-pointer"
                  onClick={() => loadSession(session)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm">{session.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSession(session.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="p-4 border-b">
            <Button onClick={newChat} className="w-full" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1 p-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="group flex items-center gap-2 rounded-lg p-2 hover:bg-accent cursor-pointer"
                onClick={() => loadSession(session)}
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">{session.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSession(session.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setHistoryOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h1 className="font-semibold">Horus</h1>
          </div>
          {!isEmpty && (
            <Button variant="ghost" size="sm" onClick={newChat}>
              New Chat
            </Button>
          )}
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
          <div className="mx-auto max-w-3xl py-6">
            {isEmpty ? (
              <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold">Horus AI</h1>
                  <p className="text-muted-foreground max-w-md">
                    Your platform intelligence. Ask anything about evidence, gaps, standards, or upload files.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "")}>
                    {msg.role === "assistant" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500">
                          <Bot className="h-4 w-4 text-white" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={cn("max-w-[80%] space-y-1", msg.role === "user" && "items-end")}>
                      <div
                        className={cn(
                          "rounded-2xl p-4 shadow-sm",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <MarkdownContent content={msg.content} />
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1 px-2">
                          <CopyButton text={msg.content} />
                        </div>
                      )}
                    </div>

                    {msg.role === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500">
                        <Bot className="h-4 w-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl border bg-card p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={scrollRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="mx-auto max-w-3xl space-y-3">
            {/* File Previews */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file) => (
                  <div key={file.id} className="relative flex items-center gap-2 rounded-lg border bg-card p-2">
                    {file.type === "image" && file.preview ? (
                      <img src={file.preview} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : file.type === "image" ? (
                      <ImageIcon className="h-10 w-10 rounded bg-muted p-2" />
                    ) : (
                      <FileText className="h-10 w-10 rounded bg-muted p-2" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium max-w-[150px]">{file.file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-1 -top-1 h-5 w-5"
                      onClick={() => setAttachedFiles((prev) => prev.filter((f) => f.id !== file.id))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachedFiles.length >= 5}
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Message Horus..."
                className="flex-1 resize-none bg-transparent text-sm outline-none min-h-[44px] max-h-[200px] py-3"
                disabled={isLoading}
                rows={1}
              />

              <Button size="icon" onClick={sendMessage} disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Horus can access your platform data. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
