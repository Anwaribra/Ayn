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

  // Mock archived data since backend doesn't have a unified archive yet
  // This demonstrates the requested concept
  const mockArchivedItems: ArchivedItem[] = [
    {
      id: "arc-001",
      title: "Quarterly Compliance Audit Q3",
      type: "gap_analysis",
      deletedAt: "2026-02-10T14:30:00Z",
      deletedBy: "Sarah Chen",
      originalLocation: "Gap Analysis Hub",
      priority: "High"
    },
    {
      id: "arc-002",
      title: "Employee Safety Certification.pdf",
      type: "evidence",
      deletedAt: "2026-02-11T09:15:00Z",
      deletedBy: "Admin System",
      originalLocation: "Evidence Library / HR",
      size: "2.4 MB"
    },
    {
      id: "arc-003",
      title: "Neural Briefing - Financial Risks",
      type: "analytic",
      deletedAt: "2026-02-12T11:00:00Z",
      deletedBy: "John Doe",
      originalLocation: "Analytics / Intelligence",
    },
    {
      id: "arc-004",
      title: "Data Residency Verification",
      type: "record",
      deletedAt: "2026-02-05T16:45:00Z",
      deletedBy: "Sarah Chen",
      originalLocation: "Data Management",
    },
    {
      id: "arc-005",
      title: "ISO 27001 Gap Assessment",
      type: "gap_analysis",
      deletedAt: "2026-01-20T08:20:00Z",
      deletedBy: "Sarah Chen",
      originalLocation: "Gap Analysis Hub",
      priority: "Medium"
    }
  ]

  const filteredItems = mockArchivedItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === "all" || item.type === filterType
    return matchesSearch && matchesFilter
  })

  const handleRestore = (id: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: "Restoring item to original location...",
        success: "Item restored successfully",
        error: "Failed to restore item"
      }
    )
  }

  const handlePurge = (id: string) => {
    setItemToPurge(id)
    setIsPurging(true)
  }

  const confirmPurge = () => {
    toast.success("Item permanently purged from secure storage")
    setIsPurging(false)
    setItemToPurge(null)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "evidence": return <Shield className="w-4 h-4 text-blue-400" />
      case "record": return <Database className="w-4 h-4 text-indigo-400" />
      case "analytic": return <BarChart3 className="w-4 h-4 text-purple-400" />
      case "gap_analysis": return <FileText className="w-4 h-4 text-cyan-400" />
      default: return <Archive className="w-4 h-4 text-zinc-400" />
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
                <span className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Vault Layer</span>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search vault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all w-64"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Archive Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 mb-8">
        {[
          { label: "Archived Items", value: mockArchivedItems.length, icon: Archive },
          { label: "Vault Storage", value: "342 MB", icon: Database },
          { label: "Retention Policy", value: "7 Years", icon: Clock },
          { label: "Last Purge", value: "12 Days Ago", icon: Trash2 },
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-5 rounded-2xl border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{stat.label}</span>
              <stat.icon className="w-3.5 h-3.5 text-zinc-600" />
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
                ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                : "bg-[var(--surface)] text-[var(--text-tertiary)] border-[var(--border-subtle)] hover:bg-[var(--surface-subtle)]"
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
                  <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Deleted At</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Removed By</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-zinc-600">
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
                          <ExternalLink className="w-3 h-3 text-zinc-500" />
                          <span className="text-[11px] font-medium text-[var(--text-secondary)]">{item.originalLocation}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-[var(--text-secondary)]">{formatDate(item.deletedAt).split(",")[0]}</span>
                          <span className="text-[9px] text-[var(--text-tertiary)] font-medium uppercase">{formatDate(item.deletedAt).split(",")[1]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
                            <User className="w-2.5 h-2.5 text-zinc-500" />
                          </div>
                          <span className="text-[11px] font-medium text-[var(--text-secondary)]">{item.deletedBy}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] text-zinc-500 hover:text-white hover:border-zinc-700 transition-all opacity-0 group-hover:opacity-100"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRestore(item.id)}
                            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all opacity-0 group-hover:opacity-100"
                            title="Restore Item"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePurge(item.id)}
                            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all opacity-0 group-hover:opacity-100"
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
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface)] text-zinc-500 hover:text-white transition-colors"
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
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2"
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
            className="bg-zinc-950 rounded-3xl p-8 max-w-md w-full border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Purge Protocol</h3>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              You are about to permanently purge an object from the Horus Vault. This will overwrite the data sectors and destroy all metadata. <span className="text-red-400 font-bold uppercase text-xs">This action is irreversible.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPurging(false)}
                className="flex-1 py-3 rounded-xl border border-white/5 text-zinc-400 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
              >
                Abort
              </button>
              <button
                onClick={confirmPurge}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
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
