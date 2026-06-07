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
import { useUiLanguage } from "@/lib/ui-language-context"
import { cn } from "@/lib/utils"

const ALLOWED_TYPES = [
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".jpg", ".jpeg", ".png", ".gif", ".txt",
]

export default function UploadEvidencePage() {
  const router = useRouter()
  const { isArabic } = useUiLanguage()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [error, setError] = useState("")
  const [selectedStandardId, setSelectedStandardId] = useState<string>("")
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>("")

  const { data: standards } = useSWR("standards-for-upload", () => api.getStandards(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000,
  })
  const { data: criteria } = useSWR(
    selectedStandardId ? `criteria-for-upload-${selectedStandardId}` : null,
    () => api.getCriteria(selectedStandardId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
    }
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
        errors.push(`${file.name}: ${err instanceof Error ? err.message : (isArabic ? "فشل الرفع" : "Upload failed")}`)
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
      setError(isArabic
        ? `فشل رفع ${errors.length} ملف:\n${errors.join("\n")}`
        : `${errors.length} file(s) failed to upload:\n${errors.join("\n")}`
      )
    } else {
      toast.success(isArabic
        ? `تم رفع ${files.length} ملف بنجاح`
        : `${files.length} file(s) uploaded successfully`
      )
      router.push("/platform/evidence")
    }
  }

  const handleUploadFiles = async (uploadedFiles: File[]) => {
    await handleFilesAdded(uploadedFiles)
  }

  return (
    <ProtectedRoute>
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className={cn("min-h-screen", isArabic && "font-arabic")}
      >
        <Header
          title={isArabic ? "رفع دليل" : "Upload Evidence"}
          description={isArabic ? "رفع ملفات الدليل لتتوافق مع الإطار" : "Upload evidence files for framework alignment"}
          breadcrumbs={[
            { label: isArabic ? "لوحة التحكم" : "Dashboard", href: "/platform/dashboard" },
            { label: isArabic ? "الأدلة" : "Evidence", href: "/platform/evidence" },
            { label: isArabic ? "رفع" : "Upload" },
          ]}
        />

        <div className="p-4 md:p-[var(--spacing-content)] platform-container-narrow mx-auto">
          <Link
            href="/platform/evidence"
            className={cn(
              "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors",
              isArabic && "flex-row-reverse"
            )}
          >
            <ArrowLeft className={cn("w-4 h-4", isArabic && "rtl:rotate-180")} />
            {isArabic ? "العودة إلى الأدلة" : "Back to evidence"}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel glass-border rounded-xl p-6 space-y-6"
          >
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg whitespace-pre-line">
                {error}
              </div>
            )}

            {/* Optional Criterion Tagging */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground text-sm">
                {isArabic ? "وضع علامة على المعيار (اختياري)" : "Tag with Criterion (Optional)"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isArabic
                  ? "اختر معيارًا لربط الملفات المرفوعة به تلقائيًا."
                  : "Select a standard and criterion to automatically link uploaded files."}
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
                    <SelectValue placeholder={isArabic ? "اختر المعيار" : "Select standard"} />
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
                    <SelectValue placeholder={isArabic ? "اختر المعيار الفرعي" : "Select criterion"} />
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
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                <span className="text-sm text-muted-foreground">
                  {isArabic
                    ? `الملف${files.length !== 1 ? "ات" : ""} جاهزة للرفع (${files.length})`
                    : `${files.length} file${files.length !== 1 ? "s" : ""} ready to upload`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiles([])}
                  disabled={uploading}
                >
                  {isArabic ? "مسح الكل" : "Clear all"}
                </Button>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {isArabic ? "جارٍ الرفع (بالتوازي)..." : "Uploading (parallel)..."}
                  </span>
                  <span className="text-foreground">
                    {uploadedCount} / {files.length}
                  </span>
                </div>
                <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
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
                    <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                    {isArabic ? "جارٍ الرفع..." : "Uploading..."}
                  </>
                ) : (
                  <>
                    <Check className={cn("w-4 h-4", isArabic ? "ml-2" : "mr-2")} />
                    {files.length > 0
                      ? isArabic
                        ? `رفع ${files.length} ملف`
                        : `Upload ${files.length} File${files.length > 1 ? "s" : ""}`
                      : isArabic
                        ? "رفع الملفات"
                        : "Upload Files"}
                  </>
                )}
              </Button>
              <Link href="/platform/evidence">
                <Button variant="outline" disabled={uploading}>
                  {isArabic ? "إلغاء" : "Cancel"}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
