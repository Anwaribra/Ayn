"use client"

import { useState } from "react"
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
} from "lucide-react"
import Link from "next/link"
import type { Evidence, Standard, Criterion } from "@/lib/types"
import { toast } from "sonner"

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function EvidencePage() {
  return (
    <ProtectedRoute>
      <EvidenceContent />
    </ProtectedRoute>
  )
}

function EvidenceContent() {
  const { user } = useAuth()
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)
  const [selectedStandardId, setSelectedStandardId] = useState<string>("")
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>("")
  const [isLinking, setIsLinking] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const {
    data: evidence,
    isLoading,
    mutate: mutateEvidence,
  } = useSWR(user ? "evidence-list" : null, () => api.getEvidence())

  const { data: standards } = useSWR(
    user ? "standards-list" : null,
    () => api.getStandards()
  )

  const { data: criteria } = useSWR(
    selectedStandardId ? `criteria-${selectedStandardId}` : null,
    () => api.getCriteria(selectedStandardId)
  )

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this evidence?")) return
    setIsDeleting(id)
    try {
      await api.deleteEvidence(id)
      toast.success("Evidence deleted successfully")
      mutateEvidence()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete evidence")
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
      toast.error(err instanceof Error ? err.message : "Failed to link evidence")
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

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Evidence Management"
        description="Upload, organize, and link evidence files to accreditation criteria"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform/dashboard" },
          { label: "Evidence" },
        ]}
        actions={
          <Link href="/platform/evidence/upload">
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Files
            </Button>
          </Link>
        }
      />

      <div className="p-4 md:p-[var(--spacing-content)] max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Evidence</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{evidence?.length ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Linked</CardTitle>
              <FileCheck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-emerald-500">{linkedCount}</div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unlinked</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-amber-500">{unlinkedCount}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Evidence Table */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Evidence Files</CardTitle>
            <CardDescription>All uploaded evidence with linked criteria</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : !evidence || evidence.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No evidence uploaded</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Upload evidence files to start linking them to your accreditation criteria.
                </p>
                <Link href="/platform/evidence/upload">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Evidence
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Linked Criterion</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evidence.map((ev) => (
                      <TableRow key={ev.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate max-w-[200px]">
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
                            <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                              Linked
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-500 border-amber-500/20">
                              Not linked
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(ev.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => window.open(ev.fileUrl, "_blank")}
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
            )}
          </CardContent>
        </Card>
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
              <Select value={selectedStandardId} onValueChange={(v) => {
                setSelectedStandardId(v)
                setSelectedCriterionId("")
              }}>
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
                <Select value={selectedCriterionId} onValueChange={setSelectedCriterionId}>
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
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
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
