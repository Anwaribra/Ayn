"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/platform/header"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2, Check } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"
import { toast } from "sonner"
import { FileUpload } from "@/components/ui/file-upload"
import { motion } from "framer-motion"

const ALLOWED_TYPES = [
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".jpg", ".jpeg", ".png", ".gif", ".txt",
]

export default function UploadEvidencePage() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [error, setError] = useState("")
  const [selectedStandardId, setSelectedStandardId] = useState<string>("")
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>("")

  const { data: standards } = useSWR("standards-for-upload", () => api.getStandards())
  const { data: criteria } = useSWR(
    selectedStandardId ? `criteria-for-upload-${selectedStandardId}` : null,
    () => api.getCriteria(selectedStandardId)
  )

  // Handle files from the new FileUpload component
  const handleFilesAdded = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

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

  const handleUploadFiles = async (uploadedFiles: File[]) => {
    await handleFilesAdded(uploadedFiles)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Header
          title="Upload Evidence"
          description="Upload evidence files for framework alignment"
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-6"
          >
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg whitespace-pre-line">
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

            {/* Advanced File Upload */}
            <FileUpload
              onUpload={handleUploadFiles}
              accept={ALLOWED_TYPES.join(",")}
              maxSize={10}
              maxFiles={20}
            />

            {/* Selected Files List (if not using the upload component's internal list) */}
            {files.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {files.length} file{files.length !== 1 ? "s" : ""} ready to upload
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiles([])}
                  disabled={uploading}
                >
                  Clear all
                </Button>
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
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
