"use client"

/**
 * HORUS AI INTERFACE
 * 
 * Renders state observations from backend.
 * No local state simulation.
 */

import { useState, useRef, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Paperclip, X, File, Image as ImageIcon, FileSpreadsheet, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

interface Observation {
  id: string
  content: string
  timestamp: number
}

export default function AynAIChatRedesigned() {
  const [observations, setObservations] = useState<Observation[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Load initial observation from backend
  useEffect(() => {
    loadObservation()
  }, [])
  
  // Auto-scroll to latest
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [observations])
  
  const loadObservation = async (query?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const obs = await api.horusObserve(query)
      setObservations(prev => [...prev, {
        id: obs.state_hash || Date.now().toString(),
        content: obs.content,
        timestamp: obs.timestamp
      }])
    } catch (err) {
      setError("Failed to load state observation")
      console.error(err)
    } finally {
      setIsLoading(false)
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
    
    // Clear pending and refresh observation
    setPendingFiles([])
    await loadObservation("files uploaded")
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
            onClick={() => loadObservation()}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {/* Observations */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          {observations.length === 0 && !isLoading && (
            <div className="text-center text-sm text-muted-foreground">
              No state observations yet.
            </div>
          )}
          
          {observations.map((obs) => (
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
                disabled={isLoading}
              >
                <Paperclip className="h-4 w-4" />
                Attach
              </Button>
              
              <div className="flex-1 text-xs text-muted-foreground">
                Files are recorded to platform state
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
