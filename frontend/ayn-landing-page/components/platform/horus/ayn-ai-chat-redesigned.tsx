"use client"

/**
 * HORUS AI INTERFACE
 * 
 * NOT a chat interface.
 * State observation display.
 */

import { useState, useRef, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Paperclip, 
  History,
  Plus,
  X,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  FileText as FileTextIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useHorusBrain, useHorusObserver, useFileUploadHandler } from "@/lib/horus"

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AynAIChatRedesigned() {
  const [observations, setObservations] = useState<Array<{id: string; content: string; timestamp: number}>>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Horus integration
  const brain = useHorusBrain()
  const { observe } = useHorusObserver()
  const { handleUpload } = useFileUploadHandler()
  
  // Get initial observation
  useEffect(() => {
    const obs = observe()
    setObservations([{ id: obs.id, content: obs.content, timestamp: obs.timestamp }])
  }, [])
  
  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [observations])
  
  // File upload
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    setPendingFiles(prev => [...prev, ...files].slice(0, 5))
    
    for (const file of files.slice(0, 5)) {
      const fileId = await handleUpload(file)
      setUploadedFileIds(prev => [...prev, fileId])
    }
    
    if (fileInputRef.current) fileInputRef.current.value = ""
    
    // Generate new observation after upload
    setTimeout(() => {
      const obs = observe("files uploaded")
      setObservations(prev => [...prev, { id: obs.id, content: obs.content, timestamp: obs.timestamp }])
    }, 200)
  }, [handleUpload, observe])
  
  const removeFile = useCallback((index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
    setUploadedFileIds(prev => prev.filter((_, i) => i !== index))
  }, [])
  
  const refreshObservation = useCallback(() => {
    const obs = observe("refresh")
    setObservations(prev => [...prev, { id: obs.id, content: obs.content, timestamp: obs.timestamp }])
  }, [observe])
  
  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (file.type.includes("pdf")) return <FileTextIcon className="h-4 w-4" />
    if (file.type.includes("excel") || file.type.includes("sheet")) return <FileSpreadsheet className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }
  
  const summary = brain.getStateSummary()
  const hasState = summary.fileCount > 0 || summary.evidenceCount > 0 || summary.gapCount > 0
  
  return (
    <div className="relative flex h-[calc(100vh-56px)] w-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Horus</span>
          <span className="text-xs text-muted-foreground/60">state observer</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refreshObservation}>
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Observations */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          {observations.map((obs, i) => (
            <motion.div
              key={obs.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-mono text-sm"
            >
              <div className="mb-1 text-xs text-muted-foreground/60">
                {new Date(obs.timestamp).toLocaleTimeString()}
              </div>
              <pre className="whitespace-pre-wrap text-foreground/90">{obs.content}</pre>
            </motion.div>
          ))}
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
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
                Attach
              </Button>
              
              <div className="flex-1 text-xs text-muted-foreground">
                {hasState ? 
                  `${summary.fileCount} files, ${summary.evidenceCount} evidence, ${summary.gapCount} gaps` :
                  "No state recorded"
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
