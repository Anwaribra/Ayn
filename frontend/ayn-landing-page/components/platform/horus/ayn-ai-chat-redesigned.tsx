"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  ImageIcon,
  X,
  Loader2,
  MessageSquare,
  Trash2,
  History,
  PlusCircle,
  ChevronRight,
  Settings2,
  CheckCircle2,
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import { useAuth } from "@/lib/auth-context"
import useSWR, { mutate } from "swr"

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
  createdAt: string
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
              <code className="block rounded-lg bg-muted/50 p-4 font-mono text-sm overflow-x-auto w-full">
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
  const router = useRouter()
  const { user } = useAuth()

  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Remote Data
  const { data: history, mutate: mutateHistory } = useSWR(user ? "horus-history" : null, () => api.getChatHistory())
  const { data: metrics } = useSWR(user ? "dashboard-metrics" : null, () => api.getDashboardMetrics())

  const complianceEquilibrium = metrics?.alignmentPercentage ?? 0
  const indexedAssets = metrics?.evidenceCount ?? 0

  const actionPills = [
    { label: "Map Compliance", icon: Sparkles, href: "/platform/standards" },
    { label: "Verify Evidence", icon: Settings2, href: "/platform/evidence" },
    { label: "Audit Procedure", icon: CheckCircle2, href: "/platform/gap-analysis" },
  ]

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

    // Temporary placeholder for assistant message
    const assistantMsgId = crypto.randomUUID()
    setMessages((prev) => [...prev, {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now()
    }])

    let fullContent = ""
    try {
      await api.horusChatStream(
        text || "Analyze these files.",
        attachedFiles.map(f => f.file),
        currentChatId || undefined,
        (chunk) => {
          // Check for special ChatID chunk
          if (chunk.startsWith("__CHAT_ID__:")) {
            const newId = chunk.split(":")[1].trim()
            setCurrentChatId(newId)
            mutateHistory()
            return
          }

          fullContent += chunk
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: fullContent } : m
          ))
        }
      )
      setAttachedFiles([])
    } catch (err) {
      toast.error("Dialogue interrupted. Connection unstable.")
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId))
    } finally {
      setIsLoading(false)
    }
  }

  // Load session
  const loadSession = async (session: any) => {
    setCurrentChatId(session.id)
    try {
      const fullChat = await api.getChatMessages(session.id)
      setMessages(fullChat.messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp).getTime()
      })))
    } catch (err) {
      toast.error("Failed to retrieve record.")
    }
  }

  // Delete session
  const deleteSession = async (id: string) => {
    try {
      await api.deleteChat(id)
      mutateHistory()
      if (currentChatId === id) {
        newChat()
      }
    } catch (err) {
      toast.error("Deletion failed.")
    }
  }

  // New chat
  const newChat = () => {
    setCurrentChatId(null)
    setMessages([])
    setAttachedFiles([])
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col bg-black/40 backdrop-blur-md">
      {/* V4 Ultra-Modern Header */}
      <div className="shrink-0 px-6 pt-6 pb-4 flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Core Intelligence Active</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            Horus <span className="text-blue-500/80">Brain</span>
          </h1>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={newChat} className="glass-panel border-white/5 bg-white/5 hover:bg-white/10 transition-all rounded-xl h-10 px-4">
            <PlusCircle className="h-4 w-4 mr-2 text-blue-500" />
            New Thread
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="glass-panel border-white/5 bg-white/5 hover:bg-white/10 transition-all rounded-xl h-10 px-4">
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 sm:w-96 bg-zinc-950/95 border-white/5 backdrop-blur-xl">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-xl font-bold">Dialogue History</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-120px)] pr-4">
                {(!history || history.length === 0) ? (
                  <div className="text-center py-20 opacity-30">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-sm">Neural archives empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((session: any) => (
                      <div
                        key={session.id}
                        className={cn(
                          "group relative rounded-2xl border p-4 cursor-pointer transition-all duration-300",
                          currentChatId === session.id
                            ? "bg-blue-500/10 border-blue-500/30"
                            : "bg-white/5 border-white/5 hover:border-white/20"
                        )}
                        onClick={() => loadSession(session)}
                      >
                        <div className="flex items-start gap-3">
                          <MessageSquare className={cn("h-4 w-4 mt-1", currentChatId === session.id ? "text-blue-500" : "text-zinc-500")} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate pr-6">{session.title || "Untitled dialogue"}</p>
                            <p className="text-[10px] text-zinc-500 mt-1">
                              {new Date(session.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSession(session.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex min-h-0 relative">
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1">
            <div className="mx-auto max-w-3xl px-6 py-8">
              {isEmpty ? (
                <div className="space-y-10 mt-12">
                  <div className="space-y-4 max-w-xl">
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                      Platform Intelligence
                    </div>
                    <h2 className="text-4xl font-black text-white leading-tight">
                      Experience the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">future of compliance.</span>
                    </h2>
                    <p className="text-zinc-400 leading-relaxed text-lg">
                      I am Horus — the global brain of Ayn. I analyze your documents, track your alignment, and optimize your institutional quality in real-time.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {actionPills.map((pill) => (
                      <button
                        key={pill.label}
                        onClick={() => router.push(pill.href)}
                        className="group flex flex-col items-start gap-4 p-5 rounded-3xl glass-panel border-white/5 bg-white/5 hover:bg-white/10 transition-all text-left"
                      >
                        <div className="p-3 rounded-2xl bg-blue-500/10 group-hover:scale-110 transition-transform">
                          <pill.icon className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="font-bold text-zinc-200">{pill.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-10">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn(
                      "flex gap-6 items-start animate-in fade-in slide-in-from-bottom-2 duration-500",
                      msg.role === "assistant" ? "flex-row" : "flex-row"
                    )}>
                      <div className={cn(
                        "h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center p-0.5",
                        msg.role === "assistant"
                          ? "bg-gradient-to-br from-blue-600 to-emerald-600 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                          : "bg-zinc-800"
                      )}>
                        {msg.role === "assistant" ? (
                          <Bot className="h-5 w-5 text-white" />
                        ) : (
                          <User className="h-5 w-5 text-zinc-400" />
                        )}
                      </div>

                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-sm uppercase tracking-widest text-zinc-300">
                            {msg.role === "assistant" ? "Horus Intelligence" : "Protocol Operator"}
                          </span>
                          <span className="text-[10px] text-zinc-600 font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={cn(
                          "text-[15px] leading-relaxed",
                          msg.role === "assistant" ? "text-zinc-200" : "text-zinc-300 bg-white/5 p-4 rounded-3xl inline-block"
                        )}>
                          {msg.role === "assistant" ? (
                            msg.content ? (
                              <MarkdownContent content={msg.content} />
                            ) : (
                              <div className="flex gap-1 py-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" />
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                              </div>
                            )
                          ) : (
                            <p>{msg.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} className="h-8" />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-6 shrink-0 max-w-4xl mx-auto w-full">
            <div className="space-y-4">
              {/* File Previews */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-3 px-2">
                  {attachedFiles.map((file) => (
                    <div key={file.id} className="relative flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-3 pr-4 group animate-in zoom-in-95 duration-200">
                      {file.type === "image" && file.preview ? (
                        <img src={file.preview} alt="" className="h-10 w-10 rounded-xl object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold max-w-[120px]">{file.file.name}</p>
                        <p className="text-[10px] text-zinc-500">{(file.file.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        onClick={() => setAttachedFiles((prev) => prev.filter((f) => f.id !== file.id))}
                        className="h-6 w-6 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center hover:bg-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Advanced Input Bar */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
                <div className="relative flex items-end gap-3 rounded-3xl bg-zinc-950 border border-white/10 p-3 shadow-2xl">
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
                    className="shrink-0 h-10 w-10 rounded-2xl transition-all hover:bg-white/10"
                  >
                    <Paperclip className="h-5 w-5 text-zinc-400" />
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
                    className="flex-1 resize-none bg-transparent border-0 outline-none ring-0 focus:ring-0 py-2.5 px-2 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 min-h-[44px] max-h-[200px]"
                    disabled={isLoading}
                  />

                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                    className={cn(
                      "shrink-0 h-10 w-10 rounded-2xl transition-all",
                      isLoading ? "bg-zinc-800" : "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-center text-zinc-600 font-medium">
                Horus can summarize documents, map evidence, and answer platform queries.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Context Sidebar */}
        <aside className="hidden xl:flex w-80 flex-col shrink-0 border-l border-white/5 bg-zinc-950/20 backdrop-blur-sm p-6 space-y-8">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] pl-1">Live Telemetry</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Compliance Equity</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-white">{complianceEquilibrium}%</span>
                  <div className="mb-2 h-1 w-12 bg-emerald-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${complianceEquilibrium}%` }} />
                  </div>
                </div>
              </div>
              <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Neural Assets</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-white">{indexedAssets}</span>
                  <div className="px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400">INDEXED</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] pl-1">System Health</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-zinc-500 font-medium">Memory Sync</span>
                <span className="text-emerald-500 font-bold uppercase tracking-tighter">OPTIMAL</span>
              </div>
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-zinc-500 font-medium">LLM Latency</span>
                <span className="text-zinc-300 font-bold">24ms</span>
              </div>
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-zinc-500 font-medium">Neural Pathways</span>
                <span className="text-zinc-300 font-bold tabular-nums">48,291</span>
              </div>
            </div>
          </div>

          <div className="mt-auto border-t border-white/5 pt-6 flex items-center gap-3 px-1">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center font-black text-[10px] text-white">V4</div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-white uppercase tracking-tighter">Horus Cerebral Core</p>
              <p className="text-[9px] text-zinc-600 font-medium">Build AYN-2024-STABLE</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
