"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useFocusTrap } from "@/hooks/use-focus-trap"
import { useAuth } from "@/lib/auth-context"
import { useUiLanguage } from "@/lib/ui-language-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { toast } from "sonner"
import {
  Archive,
  RotateCcw,
  Trash2,
  Search,
  FileText,
  Shield,
  CalendarDays,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { GapAnalysisListItem } from "@/types"

interface ArchivedItem {
  id: string
  title: string
  type: "evidence" | "record" | "gap_analysis"
  deletedAt: string
  deletedBy: string
  originalLocation: string
  activityId?: string
  score?: number
  status?: string
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
  const { isArabic } = useUiLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [isPurging, setIsPurging] = useState(false)
  const [itemToPurge, setItemToPurge] = useState<string | null>(null)

  const modalRef = useFocusTrap(isPurging, () => setIsPurging(false))

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const { data: archivedReports, error, isLoading, mutate: refreshArchive } = useSWR<GapAnalysisListItem[]>(
    user ? "archived-gap-analyses" : null,
    () => api.getArchivedGapAnalyses()
  )
  const { data: archivedEvidence, isLoading: isLoadingEvidence, mutate: refreshEvidenceArchive } = useSWR<any[]>(
    user ? "archived-evidence" : null,
    () => api.getArchivedEvidence()
  )
  const { data: archivedMilestones, isLoading: isLoadingMilestones, mutate: refreshMilestoneArchive } = useSWR<any[]>(
    user ? "archived-milestones" : null,
    () => api.getArchivedMilestones()
  )

  const reportItems: ArchivedItem[] = archivedReports?.map(report => ({
    id: report.id,
    title: report.standardTitle,
    type: "gap_analysis",
    deletedAt: report.createdAt,
    deletedBy: "System",
    originalLocation: "Gap Analysis Hub",
    score: report.overallScore,
    status: report.status,
  })) || []

  const evidenceItems: ArchivedItem[] = (archivedEvidence || []).map((ev) => ({
    id: ev.id,
    title: ev.title || (isArabic ? "دليل بدون عنوان" : "Untitled evidence"),
    type: "evidence",
    deletedAt: ev.deletedAt,
    deletedBy: ev.deletedBy || "User",
    originalLocation: ev.originalLocation || "Evidence Vault",
    status: ev.status || "deleted",
    score: typeof ev.confidenceScore === "number" ? Math.round(ev.confidenceScore) : undefined,
  }))

  const milestoneItems: ArchivedItem[] = (archivedMilestones || []).map((m) => ({
    id: m.id,
    title: m.title || (isArabic ? "معلم" : "Milestone"),
    type: "record",
    deletedAt: m.deletedAt,
    deletedBy: m.deletedBy || "User",
    originalLocation: m.originalLocation || "Calendar",
    status: m.category || "milestone",
  }))

  const items: ArchivedItem[] = [...reportItems, ...evidenceItems, ...milestoneItems]

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === "all" || item.type === filterType
    return matchesSearch && matchesFilter
  })

  const handleRestore = async (id: string) => {
    try {
      await api.archiveGapAnalysis(id, false)
      toast.success(isArabic ? "تمت استعادة العنصر بنجاح" : "Item restored successfully")
      refreshArchive()
    } catch {
      toast.error(isArabic ? "فشلت استعادة العنصر" : "Failed to restore item")
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
      toast.success(isArabic ? "تم الحذف النهائي للعنصر" : "Item permanently purged")
      refreshArchive()
      refreshEvidenceArchive()
      refreshMilestoneArchive()
      setIsPurging(false)
      setItemToPurge(null)
    } catch {
      toast.error(isArabic ? "فشل الحذف النهائي للعنصر" : "Failed to purge item")
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "evidence": return <Shield className="w-4 h-4 text-primary" />
      case "record": return <CalendarDays className="w-4 h-4 text-primary" />
      case "gap_analysis": return <FileText className="w-4 h-4 text-green-500" />
      default: return <Archive className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getReadableType = (type: string) => {
    if (isArabic) {
      return type === "gap_analysis" ? "تحليل الفجوات" : type === "evidence" ? "أدلة" : "سجل"
    }
    return type === "gap_analysis" ? "Gap Analysis" : type === "evidence" ? "Evidence" : "Milestone"
  }

  return (
    <div className={cn("mx-auto platform-container-wide animate-fade-in-up pb-20", isArabic && "font-arabic")} dir={isArabic ? "rtl" : "ltr"}>
      <header className="mb-6 pt-6 px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <span className="glass-pill inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              {isArabic ? "الأرشيف" : "Archive"}
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{isArabic ? "العناصر المحذوفة" : "Deleted items"}</h1>
            <p className="text-sm text-muted-foreground">
              {isArabic ? "تصفح الأدلة المحذوفة والمعالم وتحليلات الفجوات المؤرشفة." : "Browse deleted evidence, milestones, and archived gap analyses."}
            </p>
          </div>
          <div className="relative group">
            <Search className={cn("absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors", isArabic && "rotate-180")} />
            <input
              type="text"
              placeholder={isArabic ? "ابحث في الأرشيف..." : "Search archive..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input rounded-xl ps-9 pe-4 py-2 text-xs transition-all w-72 max-w-full"
            />
          </div>
        </div>
      </header>

      <div className="flex gap-2 px-4 mb-6 overflow-x-auto no-scrollbar pb-2">
        {["all", "evidence", "record", "gap_analysis"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border",
              filterType === type
                ? "bg-primary text-primary-foreground border-primary shadow-lg"
                : "glass-button text-muted-foreground"
            )}
          >
            {type === "all"
              ? (isArabic ? "الكل" : "All")
              : type === "evidence"
                ? (isArabic ? "أدلة" : "Evidence")
                : type === "record"
                  ? (isArabic ? "سجل" : "Record")
                  : (isArabic ? "تحليل الفجوات" : "Gap Analysis")}
          </button>
        ))}
      </div>

      <div className="px-4">
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground">
            {isArabic ? "فشل في تحميل الأرشيف. " : "Failed to load archive. "}
            <button type="button" onClick={() => refreshArchive()} className="font-semibold text-primary hover:underline">
              {isArabic ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        )}

        {isLoading || isLoadingEvidence || isLoadingMilestones ? (
          <div className="glass-panel rounded-2xl border-glass-border p-10 text-center">
            <Archive className="mx-auto mb-3 h-10 w-10 animate-pulse text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{isArabic ? "جاري تحميل العناصر المؤرشفة..." : "Loading archived items..."}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-panel rounded-2xl border-glass-border p-10 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{isArabic ? "لم يتم العثور على عناصر مؤرشفة." : "No archived items found."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="glass-panel glass-border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg glass-input">
                        {getTypeIcon(item.type)}
                      </span>
                      <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{getReadableType(item.type)}</span>
                      <span>{item.originalLocation}</span>
                      <span>{formatDate(item.deletedAt)}</span>
                    </div>
                  </div>

                  {item.type === "gap_analysis" ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleRestore(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <RotateCcw className={cn("h-3.5 w-3.5", isArabic && "rotate-180")} />
                        {isArabic ? "استعادة" : "Restore"}
                      </button>
                      <button
                        onClick={() => handlePurge(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {isArabic ? "حذف نهائي" : "Purge"}
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground">
                      {isArabic ? "للقراءة فقط" : "Read-only"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isPurging && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsPurging(false)}>
          <div
            ref={modalRef as React.RefObject<HTMLDivElement>}
            role="dialog"
            aria-modal="true"
            className="glass-panel rounded-3xl p-8 max-w-md w-full border border-destructive/20 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6 border border-destructive/20">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">{isArabic ? "حذف التقرير نهائياً؟" : "Permanently delete report?"}</h3>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              {isArabic ? "سيؤدي هذا إلى إزالة تحليل الفجوات المؤرشف بشكل دائم ولا يمكن التراجع عنه." : "This will permanently remove this archived gap analysis and cannot be undone."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPurging(false)}
                className="flex-1 py-3 rounded-xl glass-button text-muted-foreground text-xs font-bold uppercase tracking-widest transition-all"
              >
                {isArabic ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={confirmPurge}
                className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-widest hover:bg-destructive/90 transition-all shadow-lg"
              >
                {isArabic ? "حذف نهائي" : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
