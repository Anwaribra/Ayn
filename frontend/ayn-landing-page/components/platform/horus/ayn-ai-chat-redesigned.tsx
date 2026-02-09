"use client"

/**
 * HORUS AI INTERFACE
 * 
 * State observer + Chat interface
 */

import { useState, useRef, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Paperclip, X, File, Image as ImageIcon, FileSpreadsheet, FileText, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

export default function AynAIChatRedesigned() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Welcome message on first load
  useEffect(() => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Horus state observer active.\n\nPlatform state:\n- Files: 0\n- Evidence: 0\n- Gaps: 0\n\nUpload files or ask about platform state.",
      timestamp: Date.now()
    }])
  }, [])
  
  // Auto-scroll to latest
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  const handleSendMessage = async () => {
    if (!input.trim() && pendingFiles.length === 0) return
    
    const userContent = input.trim() || "Uploaded files"
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)
    setError(null)
    
    try {
      // Send to backend
      const obs = await api.horusObserve(userContent)
      const assistantMsg: Message = {
        id: obs.state_hash || Date.now().toString(),
        role: "assistant",
        content: obs.content,
        timestamp: obs.timestamp || Date.now()
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err: any) {
      setError(err.message || "Failed to get response")
      // Add error as assistant message
      setMessages(prev => [...prev, {
        id: "error-" + Date.now(),
        role: "assistant",
        content: "⚠️ " + (err.message || "Failed to get response from backend."),
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
  
  // File upload - records to backend state
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    setPendingFiles(prev => [...prev, ...files].slice(0, 5))
    
    // Upload each file and record to backend state
    for (const file of files.slice(0, 5)) {
      const fileId = crypto.randomUUID()
      try {
        // Record file upload in backend state
        await api.recordFileUpload(fileId, file.name, file.type, file.size)
        
        // Simulate analysis (in real app, this would be async processing)
        const standards = detectStandards(file.name)
        await api.recordFileAnalysis(fileId, standards, undefined, undefined, 0.7)
      } catch (err) {
        console.error("Failed to record file:", err)
      }
    }
    
    if (fileInputRef.current) fileInputRef.current.value = ""
    
    // Clear pending and send message about files
    setPendingFiles([])
    
    // Trigger message send for files
    const fileNames = files.map(f => f.name).join(", ")
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Uploaded: ${fileNames}`,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, userMsg])
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
      setError(err.message)
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
  
  // Detect standards from filename (client-side helper)
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
    <div className="relative flex h-[calc(100vh-56px)] w-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Horus</span>
          <span className="text-xs text-muted-foreground/60">state observer</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleSendMessage()}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-sm text-muted-foreground">
              No messages yet.
            </div>
          )}
          
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                {msg.role === "user" ? "You" : "H"}
              </div>
              
              {/* Content */}
              <div className={cn(
                "flex-1 space-y-1",
                msg.role === "user" ? "text-right" : "text-left"
              )}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{msg.role === "user" ? "You" : "Horus Observer"}</span>
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className={cn(
                  "inline-block max-w-full rounded-2xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
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
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                H
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Horus Observer</span>
                  <span>•</span>
                  <span>Thinking...</span>
                </div>
                <div className="mt-1 inline-block rounded-2xl bg-muted px-4 py-3">
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
      </div>
      
      {/* Input */}
      <div className="border-t border-border/50 px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-border/50 bg-card p-3">
            {/* File preview */}
            {pendingFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2 border-b border-border/30 pb-3">
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
            
            <div className="flex items-center gap-3">
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
                className="h-9 w-9 shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Horus about platform state..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              
              <Button
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleSendMessage}
                disabled={isLoading || (!input.trim() && pendingFiles.length === 0)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
