"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
  Loader2,
  MessageSquare,
  Trash2,
  History,
  PlusCircle,
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

// ─── Markdown Content ───────────────────────────────────────────────────────────
export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          code: ({ inline, children }: any) =>
            inline ? (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{children}</code>
            ) : (
              <code className="block rounded-lg bg-muted/50 p-4 font-mono text-sm overflow-x-auto">
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load sessions on mount (but start fresh chat)
  useEffect(() => {
    const savedSessions = loadSessions()
    if (savedSessions.length > 0) setSessions(savedSessions)
    // Always start with fresh chat - don't auto-load old messages
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
        response = await api.chatWithFiles(text || "Analyze these files.", attachedFiles.map((f) => f.file))
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

  // Save current chat
  const saveCurrentSession = () => {
    if (messages.length === 0) return
    const firstMsg = messages.find((m) => m.role === "user")
    const title = firstMsg ? firstMsg.content.slice(0, 40) + "..." : "New Chat"
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title,
      messages,
      createdAt: Date.now(),
    }
    setSessions((prev) => [session, ...prev])
  }

  // Load session
  const loadSession = (session: ChatSession) => {
    setMessages(session.messages)
  }

  // Delete session
  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  // New chat
  const newChat = () => {
    if (messages.length >= 2) {
      // Auto-save only if there's actual conversation (at least 2 messages)
      saveCurrentSession()
    }
    setMessages([])
    setAttachedFiles([])
    localStorage.removeItem(MESSAGES_KEY)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col bg-background">
      {/* Header - Always Visible */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={newChat} className="shadow-sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="shadow-sm">
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </SheetTrigger>
            <SheetContent side="right" className="w-80 sm:w-96">
              <SheetHeader>
                <SheetTitle>Previous Conversations</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <Button onClick={newChat} variant="default" className="w-full mb-4">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Start New Chat
                </Button>
              <ScrollArea className="h-[calc(100vh-180px)]">
                {sessions.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-12">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p>No saved conversations</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="group relative rounded-lg border bg-card p-3 hover:shadow-sm cursor-pointer transition-all"
                        onClick={() => loadSession(session)}
                      >
                        <div className="flex items-start gap-3">
                          <MessageSquare className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2 mb-1">{session.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100"
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
          </SheetContent>
        </Sheet>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {isEmpty ? (
            <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center">
              <div className="text-center space-y-6 max-w-2xl px-4">
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                  What do you want to know?
                </h1>
                <p className="text-muted-foreground text-base md:text-lg">
                  Ask about ISO standards, analyze evidence, review compliance gaps, or upload documents
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-4 items-start">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={cn(
                        msg.role === "assistant"
                          ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                          : "bg-muted"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <Bot className="h-4 w-4 text-white" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="font-semibold text-sm">
                      {msg.role === "assistant" ? "Horus" : "You"}
                    </div>
                    <div className="text-sm leading-relaxed">
                      {msg.role === "assistant" ? (
                        <MarkdownContent content={msg.content} />
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 items-start">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500">
                      <Bot className="h-4 w-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="font-semibold text-sm">Horus</div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Analyzing...</span>
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
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* File Previews */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1">
              {attachedFiles.map((file) => (
                <div key={file.id} className="relative flex items-center gap-3 rounded-xl border bg-card p-2.5 shadow-sm">
                  {file.type === "image" && file.preview ? (
                    <img src={file.preview} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : file.type === "image" ? (
                    <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-blue-500" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-purple-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium max-w-[150px]">{file.file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setAttachedFiles((prev) => prev.filter((f) => f.id !== file.id))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="relative flex items-end gap-3 rounded-3xl border bg-card p-3 shadow-md focus-within:ring-2 focus-within:ring-primary/20 transition-all">
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
              className="shrink-0 h-9 w-9"
            >
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Ask anything..."
              className="flex-1 resize-none bg-transparent border-0 shadow-none focus-visible:ring-0 min-h-[40px] max-h-[200px] text-sm"
              disabled={isLoading}
            />

            <Button
              size="icon"
              onClick={sendMessage}
              disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
              className="shrink-0 h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
