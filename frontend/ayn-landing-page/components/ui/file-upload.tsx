"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  X,
  FileText,
  Image,
  File,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
} from "lucide-react"

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: string
  maxSize?: number // in MB
  maxFiles?: number
  className?: string
}

interface UploadedFile {
  file: File
  id: string
  progress: number
  status: "uploading" | "success" | "error"
  error?: string
}

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return Image
  if (type.includes("pdf")) return FileText
  if (type.includes("spreadsheet") || type.includes("excel")) return FileSpreadsheet
  if (type.includes("json") || type.includes("javascript")) return FileCode
  return File
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function FileUpload({
  onUpload,
  accept = "*",
  maxSize = 50,
  maxFiles = 10,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`
    }
    return null
  }

  const handleFiles = useCallback(
    async (newFiles: FileList | null) => {
      if (!newFiles) return

      const fileArray = Array.from(newFiles).slice(0, maxFiles)
      
      const uploadedFiles: UploadedFile[] = fileArray.map((file) => ({
        file,
        id: Math.random().toString(36).substring(7),
        progress: 0,
        status: "uploading",
      }))

      setFiles((prev) => [...prev, ...uploadedFiles])

      // Simulate upload progress
      uploadedFiles.forEach((uploadedFile, index) => {
        const interval = setInterval(() => {
          setFiles((prev) =>
            prev.map((f) => {
              if (f.id === uploadedFile.id) {
                const error = validateFile(uploadedFile.file)
                if (error) {
                  clearInterval(interval)
                  return { ...f, progress: 0, status: "error", error }
                }
                
                if (f.progress >= 100) {
                  clearInterval(interval)
                  return { ...f, progress: 100, status: "success" }
                }
                return { ...f, progress: Math.min(f.progress + Math.random() * 15 + 5, 100) }
              }
              return f
            })
          )
        }, 200 + index * 100)
      })

      // Actually upload files
      try {
        await onUpload(fileArray)
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            uploadedFiles.find((uf) => uf.id === f.id)
              ? { ...f, status: "error", error: "Upload failed" }
              : f
          )
        )
      }
    },
    [maxFiles, maxSize, onUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
      e.target.value = "" // Reset input
    },
    [handleFiles]
  )

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setFiles([])
  }, [])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? "hsl(var(--primary))" : "hsl(var(--border))",
        }}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-8 transition-colors",
          "bg-muted/30 hover:bg-muted/50",
          isDragging && "border-primary bg-primary/5",
          "cursor-pointer"
        )}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{
              y: isDragging ? -5 : 0,
            }}
            className={cn(
              "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl",
              "bg-primary/10 text-primary",
              isDragging && "bg-primary/20"
            )}
          >
            <Upload className="h-8 w-8" />
          </motion.div>

          <h3 className="mb-2 text-lg font-semibold">
            {isDragging ? "Drop files here" : "Drag & drop files"}
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            or click to browse from your computer
          </p>
          <p className="text-xs text-muted-foreground">
            Supports: PDF, Images, Docs (Max {maxSize}MB)
          </p>
        </div>

        {/* Animated border gradient */}
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20"
            style={{ zIndex: -1, filter: "blur(8px)" }}
          />
        )}
      </motion.div>

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {files.length} file{files.length !== 1 ? "s" : ""} uploading
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-auto py-1 text-xs"
              >
                Clear all
              </Button>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {files.map((file) => {
                const Icon = getFileIcon(file.file.type)
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    layout
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl border bg-card p-3",
                      file.status === "success" && "border-emerald-500/30 bg-emerald-500/5",
                      file.status === "error" && "border-red-500/30 bg-red-500/5"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        file.status === "uploading" && "bg-primary/10 text-primary",
                        file.status === "success" && "bg-emerald-500/10 text-emerald-500",
                        file.status === "error" && "bg-red-500/10 text-red-500"
                      )}
                    >
                      {file.status === "success" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : file.status === "error" ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{file.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.file.size)}
                        {file.error && (
                          <span className="ml-2 text-red-500">{file.error}</span>
                        )}
                      </p>

                      {file.status === "uploading" && (
                        <div className="mt-2">
                          <Progress value={file.progress} className="h-1" />
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
