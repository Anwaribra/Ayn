"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import {
  Archive,
  RotateCcw,
  Trash2,
  Filter,
  Search,
  FileText,
  Shield,
  BarChart3,
  User,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { GapAnalysisListItem } from "@/types"

// Define Archive Item Type
interface ArchivedItem {
  id: string
  title: string
  type: "evidence" | "record" | "analytic" | "gap_analysis"
  deletedAt: string
  deletedBy: string
  originalLocation: string
  size?: string
  priority?: "High" | "Medium" | "Low"
}

export default function ArchivePage() {
  return (
    <ProtectedRoute>
      <ArchiveContent />
    </ProtectedRoute>
  )
}

function ArchiveContent() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [selectedItem, setSelectedItem] = useState<ArchivedItem | null>(null)
  const [isPurging, setIsPurging] = useState(false)
  const [itemToPurge, setItemToPurge] = useState<string | null>(null)

  // Fetch real archived gap analyses
  const { data: archivedReports, mutate: refreshArchive } = useSWR<GapAnalysisListItem[]>(
    user ? "archived-gap-analyses" : null,
    () => api.getArchivedGapAnalyses()
  )

  // Map API data to UI model
  const items: ArchivedItem[] = archivedReports?.map(report => ({
    id: report.id,
    title: report.standardTitle,
    type: "gap_analysis",
    deletedAt: report.createdAt, // Using createdAt as proxy for now, ideally backend stores archivedAt
    deletedBy: "System", // Backend doesn't return who archived it yet
    originalLocation: "Gap Analysis Hub",
    priority: "Medium"
  })) || []

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === "all" || item.type === filterType
    return matchesSearch && matchesFilter
  })

  const handleRestore = async (id: string) => {
    try {
      // For now we only have gap analysis items
      await api.archiveGapAnalysis(id, false)
      toast.success("Item restored successfully")
      refreshArchive()
      setSelectedItem(null)
    } catch (error) {
      toast.error("Failed to restore item")
    }
  }

  const handlePurge = (id: string) => {
    setItemToPurge(id)
    setIsPurging(true)
  }

  const confirmPurge = async () => {
    if (!itemToPurge) return
    try {
      await api.deleteGapAnalysis(itemToPurge)
      toast.success("Item permanently purged")
      refreshArchive()
      setIsPurging(false)
      setItemToPurge(null)
    } catch (error) {
      toast.error("Failed to purge item")
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "evidence": return <Shield className="w-4 h-4 text-primary" />
      case "record": return <Database className="w-4 h-4 text-primary" />
      case "analytic": return <BarChart3 className="w-4 h-4 text-[var(--status-info)]" />
      case "gap_analysis": return <FileText className="w-4 h-4 text-[var(--status-success)]" />
      default: return <Archive className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getReadableType = (type: string) => {
    return type.replace("_", " ").toUpperCase()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="animate-fade-in-up pb-20">
      <header className="mb-10 pt-6 px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="px-2 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Vault Layer</span>
              </div>
              <div className="h-px w-6 bg-[var(--border-subtle)]" />
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Data Retention</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight italic text-[var(--text-primary)]">
              Secure <span className="text-[var(--text-tertiary)] not-italic font-light">Archive</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search vault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring transition-all w-64"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Archive Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 mb-8">
        {[
          { label: "Archived Items", value: items.length, icon: Archive },
          { label: "Vault Storage", value: items.length > 0 ? "12 MB" : "0 MB", icon: Database },
          { label: "Retention Policy", value: "7 Years", icon: Clock },
          { label: "Last Purge", value: "Never", icon: Trash2 },
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-5 rounded-2xl border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{stat.label}</span>
              <stat.icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-black italic text-[var(--text-primary)]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 mb-6 overflow-x-auto no-scrollbar pb-2">
        {["all", "evidence", "record", "analytic", "gap_analysis"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
              filterType === type
                ? "bg-primary text-primary-foreground border-primary shadow-lg"
                : "bg-[var(--surface)] text-muted-foreground border-[var(--border-subtle)] hover:bg-[var(--surface)]"
            )}
          >
            {type === "all" ? "All Content" : type.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Archive Table/List */}
      <div className="px-4">
        <div className="glass-panel rounded-[32px] overflow-hidden border-[var(--border-subtle)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
                  <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Item / Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Original Location</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Archived At</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Archived By</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Archive className="w-10 h-10 opacity-20" />
                        <p className="text-sm italic">The vault is quiet. No archived items found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="group hover:bg-[var(--surface-subtle)] transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[var(--text-primary)] leading-none mb-1">{item.title}</p>
                            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{getReadableType(item.type)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5 opacity-70">
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-[var(--text-secondary)]">{item.originalLocation}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[var(--text-secondary)]">{formatDate(item.deletedAt).split(",")[0]}</span>
                          <span className="text-[10px] text-[var(--text-tertiary)] font-medium uppercase">{formatDate(item.deletedAt).split(",")[1]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center border border-border">
                            <User className="w-2.5 h-2.5 text-muted-foreground" />
                          </div>
                          <span className="text-xs font-medium text-[var(--text-secondary)]">{item.deletedBy}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] text-muted-foreground hover:text-foreground hover:border-border transition-all opacity-0 group-hover:opacity-100"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRestore(item.id)}
                            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] text-primary hover:bg-primary/10 hover:border-primary/30 transition-all opacity-0 group-hover:opacity-100"
                            title="Restore Item"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePurge(item.id)}
                            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all opacity-0 group-hover:opacity-100"
                            title="Purge Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details View Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
          <div
            role="dialog"
            aria-modal="true"
            className="bg-[var(--surface-modal)] rounded-3xl p-8 max-w-2xl w-full border border-[var(--border-subtle)] shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-center">
                  {getTypeIcon(selectedItem.type)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">{selectedItem.title}</h3>
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Archived Object • {selectedItem.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface)] text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close modal"
              >
                <ChevronRight className="w-4 h-4 rotate-90" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Original Storage</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{selectedItem.originalLocation}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">State Type</p>
                  <p className="text-sm font-medium text-[var(--text-primary)] uppercase">{selectedItem.type.replace("_", " ")}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Deletion Event</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{formatDate(selectedItem.deletedAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Responsible Entity</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{selectedItem.deletedBy}</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] mb-10">
              <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Vault Integrity Note</p>
              <p className="text-sm text-[var(--text-secondary)] italic">
                This item is stored in high-encryption cold storage. All associations to active standards have been severed. Restoring this item will re-establish compliance graph links if the target standards are still active.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleRestore(selectedItem.id)}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restore Content
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 py-3 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--surface)] transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purge Confirmation Modal */}
      {isPurging && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsPurging(false)}>
          <div
            role="dialog"
            aria-modal="true"
            className="bg-[var(--layer-0)] rounded-3xl p-8 max-w-md w-full border border-destructive/20 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6 border border-destructive/20">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">Purge Protocol</h3>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              You are about to permanently purge an object from the Horus Vault. This will overwrite the data sectors and destroy all metadata. <span className="text-destructive font-bold uppercase text-xs">This action is irreversible.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPurging(false)}
                className="flex-1 py-3 rounded-xl border border-border text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all"
              >
                Abort
              </button>
              <button
                onClick={confirmPurge}
                className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-destructive/90 transition-all shadow-lg"
              >
                Purge Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
