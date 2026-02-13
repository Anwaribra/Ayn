"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  Settings2,
  CheckCircle2,
  ArrowUpRight
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
}

interface AttachedFile {
  id: string
  file: File
  preview?: string
  type: "image" | "document"
}

// ─── Markdown Content ───────────────────────────────────────────────────────────
export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
          code: ({ inline, children }: any) =>
            inline ? (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">{children}</code>
            ) : (
              <code className="block rounded-xl bg-muted/30 p-4 font-mono text-[13px] overflow-x-auto w-full border border-border/50">
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

import { useHorus } from "@/lib/horus-context"

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function HorusAIChat() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    messages,
    currentChatId,
    isLoading,
    sendMessage,
    newChat,
    loadChat
  } = useHorus()

  const [input, setInput] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: history, mutate: mutateHistory } = useSWR(user ? "horus-history" : null, () => api.getChatHistory())
  const { data: metrics } = useSWR(user ? "dashboard-metrics" : null, () => api.getDashboardMetrics())

  const complianceScore = metrics?.alignmentPercentage ?? 0
  const indexedAssets = metrics?.evidenceCount ?? 0

  const actionPills = [
    { label: "Compliance Map", icon: Sparkles, href: "/platform/standards" },
    { label: "Asset Library", icon: Settings2, href: "/platform/evidence" },
    { label: "Audit Review", icon: CheckCircle2, href: "/platform/gap-analysis" },
  ]

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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

  const handleSendMessage = async () => {
    const text = input.trim()
    if (!text && attachedFiles.length === 0) return

    setInput("")
    const filesToUpload = attachedFiles.map(af => af.file)
    setAttachedFiles([])

    await sendMessage(text, filesToUpload)
    mutateHistory()
  }

  const loadSession = async (session: any) => {
    await loadChat(session.id)
  }

  const deleteSession = async (id: string) => {
    try {
      await api.deleteChat(id)
      mutateHistory()
      if (currentChatId === id) newChat()
    } catch (err) {
      toast.error("Failed to delete.")
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full flex-col bg-transparent">
      {/* ─── Refined Ultra-Pro Header ─── */}
      <div className="shrink-0 px-8 py-6 flex justify-between items-center border-b border-border/40 bg-surface/30 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Horus <span className="text-muted-foreground font-medium text-sm">/ Brain</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-tertiary font-bold mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Neural Sync Active
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={newChat} className="rounded-xl border-border/50 bg-background/50 hover:bg-accent transition-all h-9 px-4 text-xs font-bold">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Thread
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl border-border/50 bg-background/50 hover:bg-accent transition-all h-9 px-4 text-xs font-bold">
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 sm:w-96 bg-background border-l border-border/50">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-lg font-bold">Chat History</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] pr-4">
                {(!history || history.length === 0) ? (
                  <div className="text-center py-20 text-muted-foreground opacity-50">
                    <MessageSquare className="h-10 w-10 mx-auto mb-4" />
                    <p className="text-sm">No archives found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((session: any) => (
                      <div
                        key={session.id}
                        className={cn(
                          "group relative rounded-xl border p-3.5 cursor-pointer transition-all duration-200",
                          currentChatId === session.id
                            ? "bg-primary/5 border-primary/30"
                            : "bg-surface-card border-border/40 hover:border-border hover:bg-surface-hover"
                        )}
                        onClick={() => loadSession(session)}
                      >
                        <div className="flex items-start gap-3">
                          <MessageSquare className={cn("h-4 w-4 mt-0.5", currentChatId === session.id ? "text-primary" : "text-tertiary")} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate pr-6 text-foreground">{session.title || "Untitled Chat"}</p>
                            <p className="text-[10px] text-tertiary mt-1 font-medium">
                              {new Date(session.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2.5 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
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

      <div className="flex-1 flex min-h-0 relative">
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1">
            <div className="mx-auto max-w-3xl w-full px-6 py-10">
              {isEmpty ? (
                <div className="space-y-12 mt-8 animate-fade-in-up">
                  <div className="space-y-5 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">
                      <Sparkles className="w-3 h-3" /> Intelligence Node
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-foreground leading-[1.1] tracking-tight">
                      How can I assist your <span className="text-primary italic">Compliance Journey?</span>
                    </h2>
                    <p className="text-secondary text-lg font-medium leading-relaxed max-w-xl">
                      I am Horus — your platform brain. I've indexed {indexedAssets} assets. Ask me to analyze files, map standards, or summarize your alignment status.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {actionPills.map((pill) => (
                      <button
                        key={pill.label}
                        onClick={() => router.push(pill.href)}
                        className="group flex flex-col items-start gap-4 p-6 rounded-3xl bg-surface-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-left shadow-sm"
                      >
                        <div className="p-3 rounded-2xl bg-primary/10 group-hover:scale-110 transition-transform">
                          <pill.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <span className="font-bold text-foreground text-sm">{pill.label}</span>
                          <div className="text-[10px] text-tertiary flex items-center gap-1 font-medium group-hover:text-primary transition-colors">
                            Go to module <ArrowUpRight className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-10">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn(
                      "flex gap-6 items-start animate-fade-in-up",
                      msg.role === "system" ? "ml-16 py-2" : ""
                    )}>
                      {msg.role !== "system" && (
                        <div className={cn(
                          "h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center border transition-all shadow-sm",
                          msg.role === "assistant"
                            ? "bg-primary border-primary/20 text-white"
                            : "bg-surface border-border text-tertiary"
                        )}>
                          {msg.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                        </div>
                      )}

                      <div className="flex-1 space-y-2.5 min-w-0">
                        {msg.role !== "system" ? (
                          <>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-xs uppercase tracking-widest text-secondary">
                                {msg.role === "assistant" ? "Horus AI" : "You"}
                              </span>
                              <span className="text-[10px] text-tertiary font-medium">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={cn(
                              "text-[15px] leading-relaxed text-foreground",
                              msg.role === "assistant" ? "" : "bg-primary/5 p-4 rounded-3xl border border-primary/10 inline-block shadow-sm"
                            )}>
                              {msg.role === "assistant" ? (
                                msg.content ? (
                                  <MarkdownContent content={msg.content} />
                                ) : (
                                  <div className="flex gap-1.5 py-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                  </div>
                                )
                              ) : (
                                <p className="font-medium whitespace-pre-wrap">{msg.content}</p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-3 py-1.5 px-4 rounded-full bg-surface-hover/50 border border-border/40 w-fit group">
                            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                            <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">{msg.content}</span>
                            <span className="text-[9px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} className="h-12" />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* ─── Compact Smart Input ─── */}
          <div className="px-6 pb-8 pt-2 shrink-0 max-w-3xl mx-auto w-full">
            <div className="space-y-4">
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2 animate-in slide-in-from-bottom-2 duration-300">
                  {attachedFiles.map((file) => (
                    <div key={file.id} className="relative flex items-center gap-3 rounded-2xl bg-surface-card border border-border/60 p-2.5 pr-4 group shadow-sm">
                      {file.type === "image" && file.preview ? (
                        <img src={file.preview} alt="" className="h-9 w-9 rounded-xl object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold max-w-[120px] text-foreground">{file.file.name}</p>
                        <p className="text-[9px] text-tertiary">{(file.file.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        onClick={() => setAttachedFiles((prev) => prev.filter((f) => f.id !== file.id))}
                        className="h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative group transition-all">
                <div className="flex items-end gap-2 bg-background border border-border/80 rounded-[28px] p-2 shadow-lg focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
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
                    className="shrink-0 h-10 w-10 rounded-full text-tertiary hover:text-foreground hover:bg-accent"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Describe a compliance task or upload evidence..."
                    className="flex-1 resize-none bg-transparent border-0 outline-none ring-0 focus:ring-0 py-2.5 px-3 text-sm leading-relaxed text-foreground placeholder:text-tertiary min-h-[44px] max-h-[200px] font-medium"
                    disabled={isLoading}
                  />

                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                    className={cn(
                      "shrink-0 h-10 w-10 rounded-full transition-all shadow-md active:scale-95",
                      isLoading ? "bg-muted" : "bg-primary hover:bg-primary/90 text-white"
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
              <p className="text-[10px] text-center text-tertiary font-bold uppercase tracking-widest opacity-60">
                Authorized Platform Intelligence Node AYN-001
              </p>
            </div>
          </div>
        </div>

        {/* ─── Minimal Context Sidebar ─── */}
        <aside className="hidden xl:flex w-72 flex-col shrink-0 border-l border-border/40 bg-surface/10 p-6 space-y-10">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-tertiary uppercase tracking-[0.3em] pl-1">Compliance Pulse</h4>
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-surface-card border border-border/50 space-y-2 shadow-sm">
                <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Alignment Index</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-foreground">{complianceScore}%</span>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${complianceScore}%` }} />
                  </div>
                </div>
              </div>
              <div className="p-5 rounded-3xl bg-surface-card border border-border/50 space-y-2 shadow-sm">
                <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Indexed Evidence</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-foreground">{indexedAssets}</span>
                  <div className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-500">SYNCED</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h4 className="text-[10px] font-black text-tertiary uppercase tracking-[0.3em] pl-1">Platform Status</h4>
            <div className="space-y-3.5 px-1">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-tertiary uppercase tracking-tighter">Availability</span>
                <span className="text-emerald-500">99.9%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-tertiary uppercase tracking-tighter">Latency</span>
                <span className="text-foreground">22ms</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-tertiary uppercase tracking-tighter">Neural Load</span>
                <span className="text-foreground uppercase italic px-1.5 py-0.5 bg-muted rounded text-[9px]">Normal</span>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.1em] mb-1">Cerebral Core</p>
              <p className="text-[9px] text-secondary font-medium leading-relaxed">
                Platform Awareness: Global <br />
                Encryption: 256-bit AES
              </p>
            </div>
            <div className="flex items-center gap-3 px-1 text-tertiary">
              <div className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center font-black text-[9px]">V4</div>
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Build STABLE-2024.2.13</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
