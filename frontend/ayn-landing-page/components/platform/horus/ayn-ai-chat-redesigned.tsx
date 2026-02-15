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
  Lightbulb
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
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900/50 prose-pre:border prose-pre:border-white/10 prose-headings:font-bold prose-headings:text-zinc-900 prose-a:text-blue-600 prose-strong:text-zinc-900 prose-ul:list-disc prose-ul:pl-4">
      <ReactMarkdown
        components={{
          h2: ({ children }) => <h2 className="text-lg font-black mt-6 mb-3 flex items-center gap-2 text-zinc-800 border-b border-zinc-100 pb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold mt-4 mb-2 text-zinc-700 uppercase tracking-wide">{children}</h3>,
          p: ({ children }) => <p className="mb-3 last:mb-0 text-zinc-600 font-medium leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 space-y-1 text-zinc-600">{children}</ul>,
          li: ({ children }) => <li className="pl-1"><span className="mr-2">•</span>{children}</li>,
          code: ({ inline, children }: any) =>
            inline ? (
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[12px] text-zinc-800 border border-zinc-200">{children}</code>
            ) : (
              <code className="block rounded-xl bg-zinc-900 p-4 font-mono text-[12px] text-zinc-300 overflow-x-auto w-full">
                {children}
              </code>
            ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-4 bg-blue-50/50 rounded-r-lg italic text-blue-900/80">
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
    <div className="relative group flex items-center gap-2 p-2 pr-8 rounded-xl bg-white border border-zinc-200 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
        {file.type === 'image' && file.preview ? (
          <img src={file.preview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-zinc-700 truncate max-w-[120px]">{file.file.name}</p>
        <p className="text-[10px] text-zinc-400 uppercase font-bold">{(file.file.size / 1024).toFixed(0)}KB</p>
      </div>
      <button
        onClick={onRemove}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
    isLoading,
    sendMessage,
    newChat,
    loadChat
  } = useHorus()

  const [input, setInput] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: history, mutate: mutateHistory } = useSWR(user ? "horus-history" : null, () => api.getChatHistory())
  const { data: metrics } = useSWR(user ? "dashboard-metrics" : null, () => api.getDashboardMetrics())

  const indexedAssets = metrics?.evidenceCount ?? 0

  const actionPills = [
    { label: "Compliance Map", icon: Sparkles, href: "/platform/standards", desc: "View alignment status" },
    { label: "Asset Library", icon: Settings2, href: "/platform/evidence", desc: "Manage evidence" },
    { label: "Audit Review", icon: CheckCircle2, href: "/platform/gap-analysis", desc: "Check for gaps" },
  ]

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

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

  return (
    <div className="flex h-full flex-col bg-transparent relative">
      {/* ─── Header ─── */}
      <div className="shrink-0 px-6 py-4 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-zinc-100 z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-900/10">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-zinc-900 flex items-center gap-2">
              Horus <span className="text-zinc-400 font-medium">Core</span>
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Neural Sync Active</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={newChat} className="h-9 px-3 rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 font-bold text-xs gap-2">
            <PlusCircle className="h-4 w-4" />
            New
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 px-3 rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 font-bold text-xs gap-2">
                <History className="h-4 w-4" />
                History
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 sm:w-96 p-0 border-l border-zinc-100">
              <div className="p-6 border-b border-zinc-100">
                <h2 className="text-lg font-black text-zinc-900">Session History</h2>
              </div>
              <ScrollArea className="h-[calc(100vh-80px)]">
                <div className="p-4 space-y-2">
                  {(!history || history.length === 0) ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-xs font-medium text-zinc-500">No chat history</p>
                    </div>
                  ) : (
                    history.map((session: any) => (
                      <div
                        key={session.id}
                        onClick={() => loadChat(session.id)}
                        className={cn(
                          "group relative p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                          currentChatId === session.id
                            ? "bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-zinc-900/20"
                            : "bg-white border-zinc-100 hover:border-zinc-200 text-zinc-600"
                        )}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className={cn("text-sm font-bold truncate pr-6", currentChatId === session.id ? "text-white" : "text-zinc-800")}>
                            {session.title || "Untitled Conversation"}
                          </p>
                          <button
                            onClick={(e) => deleteSession(session.id, e)}
                            className={cn(
                              "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg",
                              currentChatId === session.id ? "hover:bg-white/20 text-white/50 hover:text-white" : "hover:bg-red-50 text-zinc-400 hover:text-red-500"
                            )}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className={cn("text-[10px] font-medium mt-1 uppercase tracking-wide", currentChatId === session.id ? "text-zinc-400" : "text-zinc-400")}>
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
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-8 pb-4">
            {isEmpty ? (
              <div className="mt-12 animate-fade-in-up space-y-12 text-center">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[32px] mx-auto flex items-center justify-center shadow-xl shadow-blue-600/20 mb-6">
                    <Cpu className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight">
                    Horus <span className="text-zinc-400">Online.</span>
                  </h2>
                  <p className="text-lg text-zinc-500 font-medium max-w-lg mx-auto leading-relaxed">
                    Institutional intelligence ready. I have indexed <span className="text-zinc-900 font-bold">{indexedAssets} assets</span>.
                    How can I assist your compliance workflow today?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {actionPills.map((pill) => (
                    <button
                      key={pill.label}
                      onClick={() => router.push(pill.href)}
                      className="group p-4 rounded-3xl bg-white border border-zinc-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                        <pill.icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-zinc-900 text-sm mb-1">{pill.label}</h3>
                      <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide flex items-center gap-1">
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
                      msg.role === 'user' ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-blue-600"
                    )}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={cn(
                      "max-w-[85%] rounded-3xl p-6 shadow-sm",
                      msg.role === 'user'
                        ? "bg-zinc-900 text-zinc-100 rounded-tr-none"
                        : "bg-white border border-zinc-200 rounded-tl-none"
                    )}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-100">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Horus Analysis</span>
                        </div>
                      )}
                      <MarkdownContent content={msg.content} />
                    </div>
                  </div>
                ))}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex gap-4 animate-pulse">
                    <div className="w-8 h-8 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-blue-600 shrink-0">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-white border border-zinc-200 rounded-3xl rounded-tl-none p-6 shadow-sm flex items-center gap-3">
                      <span className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                      </span>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Processing</span>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* ─── Input Area ─── */}
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            {/* Attached Files Preview */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 animate-in slide-in-from-bottom-2">
                {attachedFiles.map(file => (
                  <FilePreview key={file.id} file={file} onRemove={() => setAttachedFiles(prev => prev.filter(p => p.id !== file.id))} />
                ))}
              </div>
            )}

            <div className="relative group rounded-[28px] bg-white border border-zinc-200 shadow-xl shadow-zinc-200/50 hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              <div className="flex items-end p-2 pl-4">
                <label className="p-2.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 cursor-pointer transition-colors mr-2 mb-1">
                  <input type="file" className="hidden" multiple onChange={handleFileSelect} />
                  <Paperclip className="w-5 h-5" />
                </label>

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Ask about compliance status, gaps, or upload evidence..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-900 placeholder:text-zinc-400 py-3.5 max-h-32 resize-none font-medium leading-relaxed"
                  style={{ minHeight: '52px' }}
                />

                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
                  className={cn(
                    "rounded-full w-12 h-12 flex items-center justify-center transition-all mb-0.5 ml-2 shadow-lg",
                    isLoading || (!input.trim() && attachedFiles.length === 0)
                      ? "bg-zinc-100 text-zinc-300 shadow-none"
                      : "bg-zinc-900 text-white hover:bg-zinc-800 hover:scale-105 active:scale-95 shadow-zinc-900/20"
                  )}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            <div className="text-center mt-3">
              <p className="text-[10px] text-zinc-400 font-medium">
                Horus can make mistakes. Verify critical compliance data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
