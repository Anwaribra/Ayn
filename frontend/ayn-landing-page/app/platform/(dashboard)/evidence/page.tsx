"use client"

import { Header } from "@/components/platform/header"
import { api } from "@/lib/api"
import useSWR from "swr"
import { FileText, Plus, Search, Download, Trash2, LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState } from "react"
import type { Evidence } from "@/lib/types"

export default function EvidencePage() {
  const { data: evidence, isLoading, mutate } = useSWR("evidence", () => api.getEvidence())
  const [search, setSearch] = useState("")

  const filteredEvidence = evidence?.filter((item: Evidence) =>
    item.fileUrl.toLowerCase().includes(search.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this evidence?")) return
    try {
      await api.deleteEvidence(id)
      mutate()
    } catch (err) {
      console.error(err)
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
    <div className="min-h-screen">
      <Header title="Evidence" description="Manage uploaded evidence files" />

      <div className="p-4 md:p-[var(--spacing-content)] space-y-6">
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
              <div key={i} className="bg-card/50 border border-border rounded-xl p-6 animate-pulse">
                <div className="h-12 bg-muted rounded w-12 mb-4" />
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredEvidence?.length === 0 ? (
          <div className="text-center py-16 bg-card/50 border border-border rounded-xl">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No evidence found</h3>
            <p className="text-muted-foreground mb-4">
              {search ? "Try adjusting your search" : "Get started by uploading your first evidence file"}
            </p>
            {!search && (
              <Link href="/platform/evidence/upload">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Evidence
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvidence?.map((item: Evidence) => (
              <div
                key={item.id}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-foreground/20 transition-all"
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
                    onClick={() => handleDelete(item.id)}
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
    </div>
  )
}
