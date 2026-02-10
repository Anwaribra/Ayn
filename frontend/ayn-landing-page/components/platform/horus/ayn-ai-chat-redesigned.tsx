"use client"

/**
 * HORUS AI INTERFACE - Blurs-style Design
 * 
 * Clean, centered layout with 3D orb and quick actions
 */

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Paperclip, 
  X, 
  File, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  FileText, 
  Send,
  Mic,
  Sparkles,
  Upload,
  BarChart3,
  Search,
  FolderOpen,
  Settings,
  Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

const QUICK_ACTIONS = [
  { icon: Upload, label: "Upload Files", action: "upload" },
  { icon: Search, label: "Analyze Standards", action: "analyze" },
  { icon: BarChart3, label: "View Dashboard", action: "dashboard" },
  { icon: FolderOpen, label: "Evidence", action: "evidence" },
  { icon: Sparkles, label: "Run Gap Analysis", action: "gap" },
  { icon: Settings, label: "Settings", action: "settings" },
]

export default function AynAIChatRedesigned() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasStartedChat, setHasStartedChat] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + "px"
    }
  }, [input])
  
  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  const handleSendMessage = async (overrideInput?: string) => {
    const textToSend = overrideInput || input.trim()
    if (!textToSend && pendingFiles.length === 0) return
    
    const userContent = textToSend || "Uploaded files"
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)
    setHasStartedChat(true)
    
    try {
      const obs = await api.horusObserve(userContent)
      const assistantMsg: Message = {
        id: obs.state_hash || Date.now().toString(),
        role: "assistant",
        content: obs.content,
        timestamp: obs.timestamp || Date.now()
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: "error-" + Date.now(),
        role: "assistant",
        content: "⚠️ " + (err.message || "Connection error"),
        timestamp: Date.now()
      }])
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  const handleQuickAction = (action: string) => {
    const prompts: Record<string, string> = {
      upload: "I want to upload compliance documents",
      analyze: "Analyze my uploaded files for standards",
      dashboard: "Show me the dashboard status",
      evidence: "Help me organize evidence",
      gap: "Run a gap analysis on my standards",
      settings: "Open settings",
    }
    handleSendMessage(prompts[action])
  }
  
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    setPendingFiles(prev => [...prev, ...files].slice(0, 5))
    setHasStartedChat(true)
    
    // Upload and record
    for (const file of files.slice(0, 5)) {
      const fileId = crypto.randomUUID()
      try {
        await api.recordFileUpload(fileId, file.name, file.type, file.size)
        const standards = detectStandards(file.name)
        await api.recordFileAnalysis(fileId, standards, undefined, undefined, 0.7)
      } catch (err) {
        console.error("Failed to record file:", err)
      }
    }
    
    if (fileInputRef.current) fileInputRef.current.value = ""
    
    const fileNames = files.map(f => f.name).join(", ")
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Uploaded: ${fileNames}`,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, userMsg])
    setPendingFiles([])
    setIsLoading(true)
    
    try {
      const obs = await api.horusObserve("files uploaded")
      setMessages(prev => [...prev, {
        id: obs.state_hash || Date.now().toString(),
        role: "assistant",
        content: obs.content,
        timestamp: obs.timestamp || Date.now()
      }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: "error-" + Date.now(),
        role: "assistant",
        content: "⚠️ " + (err.message || "Failed to process files"),
        timestamp: Date.now()
      }])
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  const removeFile = useCallback((index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }, [])
  
  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (file.type.includes("pdf")) return <FileText className="h-4 w-4" />
    if (file.type.includes("excel") || file.type.includes("sheet")) return <FileSpreadsheet className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }
  
  const detectStandards = (filename: string): string[] => {
    const name = filename.toLowerCase()
    const standards: string[] = []
    if (name.includes("quality") || name.includes("manual")) standards.push("ISO9001")
    if (name.includes("educational") || name.includes("eoms")) standards.push("ISO21001")
    if (name.includes("naqaae")) standards.push("NAQAAE")
    if (standards.length === 0) standards.push("ISO21001")
    return standards
  }

  return (
    <div className="relative flex h-[calc(100vh-56px)] w-full flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border/40 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Horus AI</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5 text-muted-foreground"
            onClick={() => {
              setMessages([])
              setHasStartedChat(false)
            }}
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6">
          
          {/* Empty State - Centered */}
          {!hasStartedChat && messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-[60vh] flex-col items-center justify-center"
            >
              {/* 3D Glass Orb */}
              <div className="relative mb-8">
                <motion.div 
                  animate={{ 
                    rotateY: [0, 360],
                    rotateX: [0, 10, 0, -10, 0]
                  }}
                  transition={{ 
                    duration: 20, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="relative h-32 w-32"
                >
                  {/* Orb layers for glass effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-200/30 via-blue-300/20 to-purple-300/30 backdrop-blur-xl" />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-white/40 via-cyan-100/20 to-transparent" />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-bl from-blue-400/20 via-transparent to-purple-400/20" />
                  <div className="absolute inset-0 rounded-full shadow-[inset_0_0_30px_rgba(255,255,255,0.5)]" />
                  {/* Shine */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent blur-sm" />
                </motion.div>
                {/* Glow */}
                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-purple-400/20 blur-2xl" />
              </div>

              {/* Heading */}
              <h1 className="mb-8 text-center text-3xl font-light tracking-tight text-foreground">
                Tell <span className="font-medium">Horus</span> what&apos;s the plan
              </h1>

              {/* Input Bar */}
              <div className="w-full max-w-2xl">
                <div className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
                  {/* File previews */}
                  {pendingFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 border-b border-border/30 p-3">
                      {pendingFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-1.5 text-xs"
                        >
                          {getFileIcon(file)}
                          <span className="max-w-[120px] truncate">{file.name}</span>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-end gap-2 p-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                      className="hidden"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Horus about your compliance project..."
                      className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-base outline-none placeholder:text-muted-foreground/60"
                      disabled={isLoading}
                      rows={1}
                    />
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                    
                    <Button
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-xl bg-foreground text-background hover:bg-foreground/90"
                      onClick={() => handleSendMessage()}
                      disabled={isLoading || (!input.trim() && pendingFiles.length === 0)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <Button
                      key={action.action}
                      variant="secondary"
                      size="sm"
                      className="rounded-full border border-border/50 bg-background/50 px-4 py-2 text-xs font-normal text-muted-foreground backdrop-blur-sm hover:bg-muted hover:text-foreground"
                      onClick={() => handleQuickAction(action.action)}
                      disabled={isLoading}
                    >
                      <action.icon className="mr-1.5 h-3.5 w-3.5" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Chat Messages */}
          {hasStartedChat && (
            <div className="space-y-6 py-8">
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index === messages.length - 1 ? 0.1 : 0 }}
                  className={cn(
                    "flex gap-4",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  {msg.role === "assistant" ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                      <span className="text-xs font-medium">You</span>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className={cn(
                    "flex-1 space-y-1",
                    msg.role === "user" ? "text-right" : "text-left"
                  )}>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{msg.role === "user" ? "You" : "Horus"}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={cn(
                      "inline-block max-w-full rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-foreground text-background"
                        : "bg-muted/50 text-foreground"
                    )}>
                      <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Horus</span>
                      <span>•</span>
                      <span>Thinking...</span>
                    </div>
                    <div className="mt-1 inline-block rounded-2xl bg-muted/50 px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={scrollRef} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Input - Only show when chat started */}
      {hasStartedChat && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border/40 bg-background/80 px-6 py-4 backdrop-blur-sm"
        >
          <div className="mx-auto max-w-3xl">
            <div className="relative rounded-2xl border border-border/50 bg-card shadow-sm">
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 border-b border-border/30 p-3">
                  {pendingFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-1.5 text-xs"
                    >
                      {getFileIcon(file)}
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-end gap-2 p-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Horus..."
                  className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-base outline-none placeholder:text-muted-foreground/60"
                  disabled={isLoading}
                  rows={1}
                />
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  <Mic className="h-5 w-5" />
                </Button>
                
                <Button
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || (!input.trim() && pendingFiles.length === 0)}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
