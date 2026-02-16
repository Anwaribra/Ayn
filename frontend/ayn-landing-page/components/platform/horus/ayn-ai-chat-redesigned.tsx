"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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
  StopCircle,
  Search,
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import { useHorus } from "@/lib/horus-context"
import { Component as AILoader } from "@/components/ui/ai-loader"

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
    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:glass-layer-2 prose-pre:border prose-pre:border-glass-border prose-headings:font-bold prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground prose-ul:list-disc prose-ul:pl-4 text-foreground">
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
              <code className="block rounded-xl glass-layer-2 p-4 font-mono text-[12px] text-muted-foreground overflow-x-auto w-full border border-glass-border">
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
      {/* New + History as floating top-right (no header bar) */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={newChat} className="h-8 w-8 p-0 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground" title="New chat">
          <PlusCircle className="h-4 w-4" />
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground" title="History">
              <History className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 sm:w-96 p-0 border-l border-border bg-[var(--layer-0)]">
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
                          : "glass-layer-2 hover:border-primary/30 text-muted-foreground hover:text-foreground"
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

      {/* ─── Chat Area (full height, no header) ─── */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {isEmpty ? (
              <div className="animate-fade-in-up pt-8 md:pt-12 pb-6">
                <div className="text-center max-w-xl mx-auto space-y-6">
                  {/* Multiple loaders visible on welcome screen */}
                  <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
                    <AILoader variant="inline" size={72} text="AI" className="shrink-0" />
                    <AILoader variant="inline" size={88} text="Horus" className="shrink-0" />
                    <AILoader variant="inline" size={72} text="Ready" className="shrink-0" />
                    <AILoader variant="inline" size={64} text="..." className="shrink-0" />
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-2">
                      What can I help you with?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Ask about compliance, gaps, or upload evidence. I have access to {indexedAssets} indexed asset{indexedAssets !== 1 ? "s" : ""}.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {[
                      "Analyze my latest evidence",
                      "Draft a compliance report",
                      "Summarize pending gaps",
                      "Check standard alignment",
                    ].map((label) => (
                      <button
                        key={label}
                        onClick={() => sendMessage(label)}
                        className="px-4 py-2 rounded-full text-sm font-medium bg-muted/80 hover:bg-muted text-foreground/90 hover:text-foreground border border-transparent hover:border-[var(--border-subtle)] transition-all"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={cn(
                    "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted/80 text-foreground rounded-bl-md border border-[var(--border-subtle)]"
                    )}>
                      <MarkdownContent content={msg.content} />
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {status !== "idle" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-muted/80 border border-[var(--border-subtle)] flex items-center gap-2 text-sm text-muted-foreground">
                      {status === "searching" ? (
                        <> <Search className="w-3.5 h-3.5" /> Reading knowledge base… </>
                      ) : (
                        <> <span className="flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" /><span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" /><span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" /></span> Thinking… </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* ─── Input: compact bar (matches platform dark background) ─── */}
        <div className="flex-shrink-0 p-4 md:p-5 border-t border-[var(--border-subtle)] bg-[var(--layer-0)] z-20">
          <div className="max-w-3xl mx-auto">
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachedFiles.map(file => (
                  <FilePreview key={file.id} file={file} onRemove={() => setAttachedFiles(prev => prev.filter(p => p.id !== file.id))} />
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 rounded-2xl bg-muted/60 border border-[var(--border-subtle)] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all p-1.5 pl-4">
              <label className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
                <input type="file" className="hidden" multiple onChange={handleFileSelect} />
                <Paperclip className="w-4 h-4" />
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    if (isProcessing) stopGeneration()
                    else handleSendMessage()
                  }
                }}
                placeholder={status === "searching" ? "Scanning…" : status === "generating" ? "Generating…" : "Message Horus…"}
                disabled={isProcessing}
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-foreground placeholder:text-muted-foreground py-2.5 max-h-28 resize-none text-sm leading-relaxed disabled:opacity-50 min-h-[40px]"
                rows={1}
              />
              {isProcessing ? (
                <Button type="button" onClick={stopGeneration} size="icon" className="rounded-xl h-9 w-9 shrink-0 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  <StopCircle className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!input.trim() && attachedFiles.length === 0}
                  size="icon"
                  className={cn(
                    "rounded-xl h-9 w-9 shrink-0",
                    (!input.trim() && attachedFiles.length === 0) ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">Horus can make mistakes. Verify important data.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
