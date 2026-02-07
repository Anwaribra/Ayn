"use client"

import type React from "react"

import { Header } from "@/components/platform/header"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Upload, FileText, X, Loader2, Check } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"
import { toast } from "sonner"

const ALLOWED_TYPES = [
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".jpg", ".jpeg", ".png", ".gif", ".txt",
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function UploadEvidencePage() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [error, setError] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [selectedStandardId, setSelectedStandardId] = useState<string>("")
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>("")

  const { data: standards } = useSWR("standards-for-upload", () => api.getStandards())
  const { data: criteria } = useSWR(
    selectedStandardId ? `criteria-for-upload-${selectedStandardId}` : null,
    () => api.getCriteria(selectedStandardId)
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (!ALLOWED_TYPES.includes(ext)) {
      return `${file.name}: Unsupported file type. Allowed: ${ALLOWED_TYPES.join(", ")}`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File too large. Maximum size is 10MB.`
    }
    return null
  }

  const addFiles = useCallback((newFiles: File[]) => {
    const errors: string[] = []
    const valid: File[] = []

    for (const file of newFiles) {
      const err = validateFile(file)
      if (err) {
        errors.push(err)
      } else {
        valid.push(file)
      }
    }

    if (errors.length > 0) {
      toast.error(errors.join("\n"))
    }

    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid])
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      const droppedFiles = Array.from(e.dataTransfer.files)
      addFiles(droppedFiles)
    },
    [addFiles]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Parallel upload with concurrency limit
  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setError("")
    setUploadedCount(0)

    const CONCURRENCY = 3
    let completed = 0
    const errors: string[] = []

    const uploadFile = async (file: File) => {
      try {
        const result = await api.uploadEvidence(file)
        // If a criterion is selected, attach it
        if (selectedCriterionId && result.evidence?.id) {
          await api.attachEvidence(result.evidence.id, selectedCriterionId)
        }
        completed++
        setUploadedCount(completed)
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : "Upload failed"}`)
        completed++
        setUploadedCount(completed)
      }
    }

    // Process in batches for parallel upload
    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const batch = files.slice(i, i + CONCURRENCY)
      await Promise.all(batch.map(uploadFile))
    }

    setUploading(false)

    if (errors.length > 0) {
      setError(`${errors.length} file(s) failed to upload:\n${errors.join("\n")}`)
    } else {
      toast.success(`${files.length} file(s) uploaded successfully`)
      router.push("/platform/evidence")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Header
          title="Upload Evidence"
          description="Upload evidence files for your assessments"
          breadcrumbs={[
            { label: "Dashboard", href: "/platform/dashboard" },
            { label: "Evidence", href: "/platform/evidence" },
            { label: "Upload" },
          ]}
        />

        <div className="p-4 md:p-[var(--spacing-content)] max-w-3xl mx-auto">
          <Link
            href="/platform/evidence"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to evidence
          </Link>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg whitespace-pre-line">
                {error}
              </div>
            )}

            {/* Optional Criterion Tagging */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground text-sm">
                Tag with Criterion (Optional)
              </h3>
              <p className="text-xs text-muted-foreground">
                Select a standard and criterion to automatically link uploaded files.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  value={selectedStandardId}
                  onValueChange={(v) => {
                    setSelectedStandardId(v)
                    setSelectedCriterionId("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select standard" />
                  </SelectTrigger>
                  <SelectContent>
                    {standards?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedCriterionId}
                  onValueChange={setSelectedCriterionId}
                  disabled={!selectedStandardId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select criterion" />
                  </SelectTrigger>
                  <SelectContent>
                    {criteria?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-foreground font-medium mb-2">
                Drag and drop files here
              </p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept={ALLOWED_TYPES.join(",")}
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Select Files</span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-4">
                Supported: PDF, Word, Excel, Images, Text (Max 10MB each)
              </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-foreground">
                  Selected Files ({files.length})
                </h3>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-none">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Uploading (parallel)...
                  </span>
                  <span className="text-foreground">
                    {uploadedCount} / {files.length}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{
                      width: `${(uploadedCount / files.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Upload{" "}
                    {files.length > 0
                      ? `${files.length} File${files.length > 1 ? "s" : ""}`
                      : "Files"}
                  </>
                )}
              </Button>
              <Link href="/platform/evidence">
                <Button variant="outline" disabled={uploading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
