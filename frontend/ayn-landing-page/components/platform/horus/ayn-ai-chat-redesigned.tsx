"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
  X,
  Loader2,
  MessageSquare,
  Trash2,
  History,
  PlusCircle,
  Settings2,
  CheckCircle2,
  ArrowUpRight,
  Cpu,
  ShieldAlert,
  Lightbulb,
  StopCircle,
  Search
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import { useHorus } from "@/lib/horus-context"

// ─── Types ──────────────────────────────────────────────────────────────────────
interface AttachedFile {
  id: string
  file: File
  preview?: string
  type: "image" | "document"
}

// ─── Markdown Content ───────────────────────────────────────────────────────────
export function MarkdownContent({ content }: { content: string }) {
  // Custom renderer to intercept specific headers and wrap them in styled blocks? 
  // For now, we use standard prose with enhanced styling.
  return (
    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-layer-2 prose-pre:border prose-pre:border-border prose-headings:font-bold prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground prose-ul:list-disc prose-ul:pl-4 text-foreground">
      <ReactMarkdown
        components={{
          h2: ({ children }) => <h2 className="text-lg font-black mt-6 mb-3 flex items-center gap-2 text-foreground border-b border-border pb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold mt-4 mb-2 text-muted-foreground uppercase tracking-wide">{children}</h3>,
          p: ({ children }) => <p className="mb-3 last:mb-0 text-foreground/90 font-medium leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 space-y-1 text-muted-foreground">{children}</ul>,
          li: ({ children }) => <li className="pl-1"><span className="mr-2">•</span>{children}</li>,
          code: ({ inline, children }: any) =>
            inline ? (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground border border-border">{children}</code>
            ) : (
              <code className="block rounded-xl bg-layer-2 p-4 font-mono text-[12px] text-muted-foreground overflow-x-auto w-full border border-border">
                {children}
              </code>
            ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 py-1 my-4 bg-primary/5 rounded-r-lg italic text-muted-foreground">
              {children}
            </blockquote>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// ─── File Preview Component ─────────────────────────────────────────────────────
function FilePreview({ file, onRemove }: { file: AttachedFile; onRemove: () => void }) {
  return (
    <div className="relative group flex items-center gap-2 p-2 pr-8 rounded-xl bg-layer-0 border border-border shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {file.type === 'image' && file.preview ? (
          <img src={file.preview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-foreground truncate max-w-[120px]">{file.file.name}</p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold">{(file.file.size / 1024).toFixed(0)}KB</p>
      </div>
      <button
        onClick={onRemove}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function HorusAIChat() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    messages,
    currentChatId,
    status,
    sendMessage,
    stopGeneration,
    newChat,
    loadChat
  } = useHorus()

  const [input, setInput] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: history, mutate: mutateHistory } = useSWR(user ? "horus-history" : null, () => api.getChatHistory())
  const { data: metrics } = useSWR(user ? "dashboard-metrics" : null, () => api.getDashboardMetrics())

  const indexedAssets = metrics?.evidenceCount ?? 0

  // Auto-scroll effect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, status])

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

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.deleteChat(id)
      mutateHistory()
      if (currentChatId === id) newChat()
      toast.success("Thread deleted")
    } catch (err) {
      toast.error("Failed to delete.")
    }
  }

  const isEmpty = messages.length === 0
  const isProcessing = status !== "idle"

  return (
    <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* ─── Header ─── */}
      <div className="shrink-0 px-6 py-4 flex justify-between items-center bg-layer-1/50 backdrop-blur-md border-b border-border z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              Horus <span className="text-muted-foreground font-medium">Core</span>
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Neural Sync Active</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={newChat} className="h-9 px-3 rounded-xl hover:bg-layer-2 text-muted-foreground hover:text-foreground font-bold text-xs gap-2">
            <PlusCircle className="h-4 w-4" />
            New
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 px-3 rounded-xl hover:bg-layer-2 text-muted-foreground hover:text-foreground font-bold text-xs gap-2">
                <History className="h-4 w-4" />
                History
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 sm:w-96 p-0 border-l border-border bg-layer-1">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-black text-foreground">Session History</h2>
              </div>
              <ScrollArea className="h-[calc(100vh-80px)]">
                <div className="p-4 space-y-2">
                  {(!history || history.length === 0) ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs font-medium text-muted-foreground">No chat history</p>
                    </div>
                  ) : (
                    history.map((session: any) => (
                      <div
                        key={session.id}
                        onClick={() => loadChat(session.id)}
                        className={cn(
                          "group relative p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                          currentChatId === session.id
                            ? "bg-primary/10 border-primary/20 text-primary"
                            : "bg-layer-2 border-border hover:border-primary/30 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className={cn("text-sm font-bold truncate pr-6", currentChatId === session.id ? "text-primary" : "text-foreground")}>
                            {session.title || "Untitled Conversation"}
                          </p>
                          <button
                            onClick={(e) => deleteSession(session.id, e)}
                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ─── Chat Area ─── */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8 pb-4">
            {isEmpty ? (
              <div className="mt-12 animate-fade-in-up space-y-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-tr from-primary/20 to-primary/5 rounded-[32px] mx-auto flex items-center justify-center mb-6">
                  <Cpu className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                  Horus <span className="text-muted-foreground">Online.</span>
                </h2>
                <p className="text-lg text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
                  Institutional intelligence ready. I have indexed <span className="text-foreground font-bold">{indexedAssets} assets</span>.
                  How can I assist your compliance workflow today?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {[
                    { label: "Analyze my latest evidence", desc: "Gap detection", icon: ShieldAlert },
                    { label: "Draft a compliance report", desc: "Standard 4.2", icon: FileText },
                    { label: "Summarize pending gaps", desc: "Action plan", icon: Lightbulb },
                    { label: "Check standard alignment", desc: "Coverage map", icon: CheckCircle2 },
                  ].map((pill, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(pill.label)}
                      className="group flex flex-col items-start p-5 bg-layer-2 border border-border hover:border-primary/30 hover:shadow-lg rounded-2xl transition-all text-left"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
                        <pill.icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-foreground text-sm mb-1">{pill.label}</h3>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                        {pill.desc} <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={cn(
                    "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-layer-2 border border-border text-primary"
                    )}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={cn(
                      "max-w-[85%] rounded-3xl p-6 shadow-sm",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-layer-2 border border-border rounded-tl-none"
                    )}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Horus Analysis</span>
                        </div>
                      )}
                      <MarkdownContent content={msg.content} />
                    </div>
                  </div>
                ))}

                {/* Status Indicator */}
                {status !== "idle" && (
                  <div className="flex gap-4 animate-pulse">
                    <div className="w-8 h-8 rounded-xl bg-layer-2 border border-border flex items-center justify-center text-primary shrink-0">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-layer-2 border border-border rounded-3xl rounded-tl-none p-6 shadow-sm flex items-center gap-3">
                      {status === 'searching' ? (
                        <>
                          <Search className="w-4 h-4 text-primary animate-pulse" />
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Reading Platform Knowledge...</span>
                        </>
                      ) : (
                        <>
                          <span className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                          </span>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Processing</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* ─── Input Area ─── */}
        <div className="flex-shrink-0 p-6 bg-gradient-to-t from-layer-0 via-layer-0/90 to-transparent">
          <div className="max-w-3xl mx-auto relative">
            {/* Attached Files Preview */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 animate-in slide-in-from-bottom-2">
                {attachedFiles.map(file => (
                  <FilePreview key={file.id} file={file} onRemove={() => setAttachedFiles(prev => prev.filter(p => p.id !== file.id))} />
                ))}
              </div>
            )}

            <div className="relative group rounded-[28px] bg-layer-2 border border-border shadow-xl hover:border-primary/30 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
              <div className="flex items-end p-2 pl-4">
                <label className="p-2.5 rounded-full hover:bg-layer-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors mr-2 mb-1">
                  <input type="file" className="hidden" multiple onChange={handleFileSelect} />
                  <Paperclip className="w-5 h-5" />
                </label>

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      if (isProcessing) {
                        stopGeneration()
                      } else {
                        handleSendMessage()
                      }
                    }
                  }}
                  placeholder={status === 'searching' ? "Scanning knowledge base..." : (status === 'generating' ? "Generating response..." : "Ask about compliance status, gaps, or upload evidence...")}
                  disabled={isProcessing}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground py-3.5 max-h-32 resize-none font-medium leading-relaxed disabled:opacity-50"
                  style={{ minHeight: '52px' }}
                />

                {isProcessing ? (
                  <Button
                    onClick={stopGeneration}
                    className="rounded-full w-12 h-12 flex items-center justify-center transition-all mb-0.5 ml-2 shadow-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105 active:scale-95"
                  >
                    <StopCircle className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!input.trim() && attachedFiles.length === 0)}
                    className={cn(
                      "rounded-full w-12 h-12 flex items-center justify-center transition-all mb-0.5 ml-2 shadow-lg",
                      (!input.trim() && attachedFiles.length === 0)
                        ? "bg-muted text-muted-foreground shadow-none"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95"
                    )}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
            <div className="text-center mt-3">
              <p className="text-[10px] text-muted-foreground font-medium">
                Horus can make mistakes. Verify critical compliance data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
