"use client"

import { Header } from "@/components/platform/header"
import { api } from "@/lib/api"
import useSWR from "swr"
import { FileText, Plus, Search, Download, Trash2, LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Evidence } from "@/lib/types"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

export default function EvidencePage() {
  const { data: evidence, isLoading, mutate } = useSWR("evidence", () => api.getEvidence())
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredEvidence = evidence?.filter((item: Evidence) =>
    item.fileUrl.toLowerCase().includes(search.toLowerCase()),
  )

  const handleDeleteClick = (id: string) => setDeleteId(id)

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await api.deleteEvidence(deleteId)
      mutate()
      toast.success("Evidence deleted")
      setDeleteId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete evidence")
    } finally {
      setIsDeleting(false)
    }
  }

  const getFileName = (url: string) => {
    try {
      return url.split("/").pop() || "Unknown file"
    } catch {
      return "Unknown file"
    }
  }

  const getFileType = (url: string) => {
    const ext = url.split(".").pop()?.toLowerCase()
    if (["pdf"].includes(ext || "")) return "PDF"
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "Image"
    if (["doc", "docx"].includes(ext || "")) return "Word"
    if (["xls", "xlsx"].includes(ext || "")) return "Excel"
    return "File"
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Evidence" description="Manage uploaded evidence files" />

      <div className="p-4 md:p-[var(--spacing-content)] max-w-7xl mx-auto space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search evidence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
          <Link href="/platform/evidence/upload">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload Evidence
            </Button>
          </Link>
        </div>

        {/* Evidence Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredEvidence?.length === 0 ? (
          <Empty className="bg-card border border-border rounded-xl py-16 border-solid shadow-sm">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No evidence found</EmptyTitle>
              <EmptyDescription>
                {search ? "Try adjusting your search" : "Get started by uploading your first evidence file"}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {!search && (
                <Link href="/platform/evidence/upload">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Evidence
                  </Button>
                </Link>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvidence?.map((item: Evidence) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <FileText className="w-6 h-6 text-foreground" />
                  </div>
                  <span className="px-2 py-1 text-xs bg-muted rounded-full text-muted-foreground">
                    {getFileType(item.fileUrl)}
                  </span>
                </div>
                <h3 className="font-medium text-foreground mb-1 truncate" title={getFileName(item.fileUrl)}>
                  {getFileName(item.fileUrl)}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Uploaded {new Date(item.createdAt).toLocaleDateString()}
                </p>
                {item.criterionId && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <LinkIcon className="w-3 h-3" />
                    <span>Linked to criterion</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete evidence?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The file will be removed from your evidence list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteConfirm()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
