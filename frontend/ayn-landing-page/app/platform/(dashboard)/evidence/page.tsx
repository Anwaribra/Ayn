"use client"

import { useState, useCallback, useRef } from "react"
import { Header } from "@/components/platform/header"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Upload,
  FileText,
  Link2,
  Trash2,
  ExternalLink,
  Plus,
  FileCheck,
  AlertCircle,
  LayoutGrid,
  LayoutList,
  Search,
  Filter,
  FileImage,
  FileSpreadsheet,
  File,
  CloudUpload,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import type { Evidence } from "@/types/evidence"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getFileName(url: string): string {
  try {
    const parts = url.split("/")
    const last = parts[parts.length - 1]
    return decodeURIComponent(last.split("?")[0]) || "Unknown file"
  } catch {
    return "Unknown file"
  }
}

function getFileType(url: string): string {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase()
  const typeMap: Record<string, string> = {
    pdf: "PDF",
    doc: "Word",
    docx: "Word",
    xls: "Excel",
    xlsx: "Excel",
    jpg: "Image",
    jpeg: "Image",
    png: "Image",
    gif: "Image",
    txt: "Text",
  }
  return typeMap[ext || ""] || "File"
}

function getFileIcon(url: string) {
  const type = getFileType(url)
  switch (type) {
    case "PDF":
      return <FileText className="h-5 w-5 text-red-500" />
    case "Word":
      return <FileText className="h-5 w-5 text-blue-500" />
    case "Excel":
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
    case "Image":
      return <FileImage className="h-5 w-5 text-purple-500" />
    default:
      return <File className="h-5 w-5 text-muted-foreground" />
  }
}

function getFileColor(url: string) {
  const type = getFileType(url)
  switch (type) {
    case "PDF":
      return "bg-red-500/10"
    case "Word":
      return "bg-blue-500/10"
    case "Excel":
      return "bg-emerald-500/10"
    case "Image":
      return "bg-purple-500/10"
    default:
      return "bg-muted/50"
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// ─── Drag & Drop Upload Zone ────────────────────────────────────────────────────

function DropZone({
  onFilesSelected,
  isUploading,
}: {
  onFilesSelected: (files: File[]) => void
  isUploading: boolean
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) onFilesSelected(files)
    },
    [onFilesSelected],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length > 0) onFilesSelected(files)
      if (inputRef.current) inputRef.current.value = ""
    },
    [onFilesSelected],
  )

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "group relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all",
        isDragOver
          ? "border-[var(--brand)] bg-[var(--brand)]/5"
          : "border-border hover:border-[var(--brand)]/50 hover:bg-accent/30",
        isUploading && "pointer-events-none opacity-60",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
            isDragOver
              ? "bg-[var(--brand)]/10"
              : "bg-muted group-hover:bg-[var(--brand)]/10",
          )}
        >
          {isUploading ? (
            <Loader2 className="h-7 w-7 animate-spin text-[var(--brand)]" />
          ) : (
            <CloudUpload
              className={cn(
                "h-7 w-7 transition-colors",
                isDragOver
                  ? "text-[var(--brand)]"
                  : "text-muted-foreground group-hover:text-[var(--brand)]",
              )}
            />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {isUploading
              ? "Uploading files..."
              : "Drop files here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, Word, Excel, Images up to 10MB each
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Evidence Grid Card ─────────────────────────────────────────────────────────

function EvidenceGridCard({
  ev,
  onLink,
  onDelete,
  isDeleting,
}: {
  ev: Evidence
  onLink: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <Card className="group border-border bg-card shadow-sm transition-all hover:shadow-md platform-card">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getFileColor(ev.fileUrl)}`}
          >
            {getFileIcon(ev.fileUrl)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {getFileName(ev.fileUrl)}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {getFileType(ev.fileUrl)}
              </Badge>
              {ev.criterionId ? (
                <Badge
                  variant="default"
                  className="border border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-500"
                >
                  <CheckCircle2 className="mr-0.5 h-3 w-3" />
                  Linked
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-500/20 text-[10px] text-amber-500"
                >
                  Unlinked
                </Badge>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {formatDate(ev.createdAt)}
            </p>
          </div>
        </div>
        {/* Actions */}
        <div className="mt-3 flex items-center gap-1 border-t border-border/50 pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => window.open(ev.fileUrl, "_blank")}
          >
            <ExternalLink className="h-3 w-3" />
            Open
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={onLink}
          >
            <Link2 className="h-3 w-3" />
            Link
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function EvidencePage() {
  return (
    <ProtectedRoute>
      <EvidenceContent />
    </ProtectedRoute>
  )
}

function EvidenceContent() {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "linked" | "unlinked">("all")
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)
  const [selectedStandardId, setSelectedStandardId] = useState<string>("")
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>("")
  const [isLinking, setIsLinking] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const {
    data: evidence,
    isLoading,
    mutate: mutateEvidence,
  } = useSWR(user ? "evidence-list" : null, () => api.getEvidence())

  const { data: standards } = useSWR(user ? "standards-list" : null, () =>
    api.getStandards(),
  )

  const { data: criteria } = useSWR(
    selectedStandardId ? `criteria-${selectedStandardId}` : null,
    () => api.getCriteria(selectedStandardId),
  )

  // ── Filter & search ───────────────────────────────────────────────────
  const filteredEvidence = (evidence ?? []).filter((ev) => {
    const matchesSearch =
      !searchQuery ||
      getFileName(ev.fileUrl).toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "linked" && ev.criterionId) ||
      (filterStatus === "unlinked" && !ev.criterionId)
    return matchesSearch && matchesFilter
  })

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true)
    let successCount = 0
    let failCount = 0

    // Parallel upload
    await Promise.allSettled(
      files.map(async (file) => {
        try {
          await api.uploadEvidence(file)
          successCount++
        } catch {
          failCount++
        }
      }),
    )

    setIsUploading(false)
    mutateEvidence()

    if (successCount > 0) {
      toast.success(
        `${successCount} file${successCount > 1 ? "s" : ""} uploaded successfully`,
      )
    }
    if (failCount > 0) {
      toast.error(`${failCount} file${failCount > 1 ? "s" : ""} failed to upload`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this evidence?")) return
    setIsDeleting(id)
    try {
      await api.deleteEvidence(id)
      toast.success("Evidence deleted successfully")
      mutateEvidence()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete evidence",
      )
    } finally {
      setIsDeleting(null)
    }
  }

  const handleLink = async () => {
    if (!selectedEvidence || !selectedCriterionId) return
    setIsLinking(true)
    try {
      await api.attachEvidence(selectedEvidence.id, selectedCriterionId)
      toast.success("Evidence linked to criterion successfully")
      mutateEvidence()
      setLinkDialogOpen(false)
      setSelectedEvidence(null)
      setSelectedStandardId("")
      setSelectedCriterionId("")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to link evidence",
      )
    } finally {
      setIsLinking(false)
    }
  }

  const openLinkDialog = (ev: Evidence) => {
    setSelectedEvidence(ev)
    setSelectedStandardId("")
    setSelectedCriterionId("")
    setLinkDialogOpen(true)
  }

  const linkedCount = evidence?.filter((e) => e.criterionId).length ?? 0
  const unlinkedCount = evidence?.filter((e) => !e.criterionId).length ?? 0
  const totalCount = evidence?.length ?? 0
  const completeness = totalCount > 0 ? Math.round((linkedCount / totalCount) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Evidence Management"
        description="Upload, organize, and link evidence files to accreditation criteria"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform/dashboard" },
          { label: "Evidence" },
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        {/* Drag & Drop Upload Zone */}
        <DropZone onFilesSelected={handleFilesSelected} isUploading={isUploading} />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Evidence
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalCount}</div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Linked
              </CardTitle>
              <FileCheck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-emerald-500">
                  {linkedCount}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unlinked
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-amber-500">
                  {unlinkedCount}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completeness
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-[var(--brand)]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-[var(--brand)]">
                    {completeness}%
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[var(--brand)] transition-all"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Select
                value={filterStatus}
                onValueChange={(v) =>
                  setFilterStatus(v as "all" | "linked" | "unlinked")
                }
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Files</SelectItem>
                  <SelectItem value="linked">Linked</SelectItem>
                  <SelectItem value="unlinked">Unlinked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8 rounded-r-none"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8 rounded-l-none"
                  onClick={() => setViewMode("list")}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
              <Link href="/platform/evidence/upload">
                <Button size="sm" className="gap-2">
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Evidence Content */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-border bg-card">
                <CardContent className="p-4">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEvidence.length === 0 ? (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  {searchQuery || filterStatus !== "all"
                    ? "No matching files"
                    : "No evidence uploaded"}
                </h3>
                <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                  {searchQuery || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Upload evidence files to start linking them to your accreditation criteria."}
                </p>
                {!searchQuery && filterStatus === "all" && (
                  <Link href="/platform/evidence/upload">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Upload Evidence
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvidence.map((ev) => (
              <EvidenceGridCard
                key={ev.id}
                ev={ev}
                onLink={() => openLinkDialog(ev)}
                onDelete={() => handleDelete(ev.id)}
                isDeleting={isDeleting === ev.id}
              />
            ))}
          </div>
        ) : (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvidence.map((ev) => (
                      <TableRow key={ev.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-lg ${getFileColor(ev.fileUrl)}`}
                            >
                              {getFileIcon(ev.fileUrl)}
                            </div>
                            <span className="max-w-[200px] truncate font-medium">
                              {getFileName(ev.fileUrl)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {getFileType(ev.fileUrl)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ev.criterionId ? (
                            <Badge
                              variant="default"
                              className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Linked
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-amber-500/20 text-amber-500"
                            >
                              Not linked
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(ev.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                window.open(ev.fileUrl, "_blank")
                              }
                              title="Open file"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openLinkDialog(ev)}
                              title="Link to criterion"
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(ev.id)}
                              disabled={isDeleting === ev.id}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Link to Criterion Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Evidence to Criterion</DialogTitle>
            <DialogDescription>
              Select a standard and criterion to link this evidence file to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Standard</label>
              <Select
                value={selectedStandardId}
                onValueChange={(v) => {
                  setSelectedStandardId(v)
                  setSelectedCriterionId("")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a standard" />
                </SelectTrigger>
                <SelectContent>
                  {standards?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStandardId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Criterion</label>
                <Select
                  value={selectedCriterionId}
                  onValueChange={setSelectedCriterionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a criterion" />
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
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLink}
              disabled={!selectedCriterionId || isLinking}
            >
              {isLinking ? "Linking..." : "Link Evidence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
