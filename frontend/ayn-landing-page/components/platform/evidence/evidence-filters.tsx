"use client"

import { useState } from "react"
import { Search, Filter, SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import { api } from "@/lib/api"
import { useUiLanguage } from "@/lib/ui-language-context"

const STATUSES = ["uploaded", "pending", "processing", "analyzed", "linked", "failed"] as const
type Status = typeof STATUSES[number]

const STATUS_LABELS: Record<Status, string> = {
    uploaded: "Uploaded",
    pending: "Queued",
    processing: "Analyzing",
    analyzed: "Analyzed",
    linked: "Linked",
    failed: "Failed",
}

interface EvidenceFiltersProps {
    onSearch: (q: string) => void
    onStatusChange: (status: Status | "") => void
    onStandardChange: (standardId: string) => void
    activeStatus: Status | ""
    activeStandard: string
}

export function EvidenceFilters({
    onSearch,
    onStatusChange,
    onStandardChange,
    activeStatus,
    activeStandard,
}: EvidenceFiltersProps) {
    const { isArabic } = useUiLanguage()
    const [query, setQuery] = useState("")
    const [showStatusMenu, setShowStatusMenu] = useState(false)
    const [showStandardMenu, setShowStandardMenu] = useState(false)

    const { data: standards } = useSWR("standards", () => api.getStandards(), {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 30000,
    })

    const hasActiveFilters = activeStatus !== "" || activeStandard !== ""
    const statusLabels: Record<Status, string> = {
        uploaded: isArabic ? "تم الرفع" : "Uploaded",
        pending: isArabic ? "قيد الانتظار" : "Queued",
        processing: isArabic ? "قيد التحليل" : "Analyzing",
        analyzed: isArabic ? "تم التحليل" : "Analyzed",
        linked: isArabic ? "مرتبط" : "Linked",
        failed: isArabic ? "فشل" : "Failed",
    }

    const handleSearch = (v: string) => {
        setQuery(v)
        onSearch(v)
    }

    const clearAll = () => {
        setQuery("")
        onSearch("")
        onStatusChange("")
        onStandardChange("")
    }

    return (
        <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Text Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={isArabic ? "ابحث بالعنوان أو اسم الملف…" : "Search by title or filename…"}
                    className="w-full pl-10 pr-4 py-2.5 border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
                />
                {query && (
                    <button
                        onClick={() => handleSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={isArabic ? "مسح البحث" : "Clear search"}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2 relative">
                {/* Status Filter */}
                <div className="relative">
                    <button
                        onClick={() => { setShowStatusMenu(!showStatusMenu); setShowStandardMenu(false) }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
                            activeStatus
                                ? "text-primary border-primary/40 bg-primary/10"
                                : "text-muted-foreground border-[var(--glass-border)] bg-[var(--glass-soft-bg)] hover:border-primary/25 hover:text-foreground"
                        )}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        {activeStatus ? <span>{statusLabels[activeStatus] ?? activeStatus}</span> : isArabic ? "الحالة" : "Status"}
                        {activeStatus && (
                            <span
                                onClick={(e) => { e.stopPropagation(); onStatusChange("") }}
                                className="ml-1 p-0.5 rounded-full hover:bg-primary/20 cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </span>
                        )}
                    </button>
                    {showStatusMenu && (
                        <div className="absolute top-full left-0 mt-2 z-30 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-modal)]/95 shadow-2xl min-w-[160px] py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl">
                            {STATUSES.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => { onStatusChange(s); setShowStatusMenu(false) }}
                                    className={cn(
                                        "w-full text-left px-5 py-2.5 text-sm font-medium hover:bg-[var(--surface-modal)] transition-colors first:rounded-t-2xl last:rounded-b-2xl",
                                        activeStatus === s ? "text-primary font-bold" : "text-foreground"
                                    )}
                                >
                                    {statusLabels[s]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Standard Filter */}
                <div className="relative">
                    <button
                        onClick={() => { setShowStandardMenu(!showStandardMenu); setShowStatusMenu(false) }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
                            activeStandard
                                ? "text-primary border-primary/40 bg-primary/10"
                                : "text-muted-foreground border-[var(--glass-border)] bg-[var(--glass-soft-bg)] hover:border-primary/25 hover:text-foreground"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        {activeStandard && standards
                            ? (standards.find((s: any) => s.id === activeStandard)?.code ?? (isArabic ? "المعيار" : "Standard"))
                            : isArabic ? "حسب المعيار" : "By Standard"}
                        {activeStandard && (
                            <span
                                onClick={(e) => { e.stopPropagation(); onStandardChange("") }}
                                className="ml-1 p-0.5 rounded-full hover:bg-primary/20 cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </span>
                        )}
                    </button>
                    {showStandardMenu && (
                        <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 z-30 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-modal)]/95 shadow-2xl min-w-[220px] max-w-[calc(100vw-2rem)] py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-xl">
                            {!standards || standards.length === 0 ? (
                                <p className="px-5 py-4 text-sm text-muted-foreground text-center">{isArabic ? "لا توجد معايير مهيأة" : "No standards configured"}</p>
                            ) : (
                                standards.map((s: any) => (
                                    <button
                                        key={s.id}
                                        onClick={() => { onStandardChange(s.id); setShowStandardMenu(false) }}
                                        className={cn(
                                            "w-full text-left px-5 py-3 text-sm hover:bg-[var(--surface-modal)] transition-colors first:rounded-t-2xl last:rounded-b-2xl group",
                                            activeStandard === s.id ? "text-primary font-bold" : "text-foreground font-medium"
                                        )}
                                    >
                                        <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">{s.code}</span>
                                        <span className="truncate">{s.title}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Clear all */}
                {hasActiveFilters && (
                    <button
                        onClick={clearAll}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-transparent"
                    >
                        <X className="w-3.5 h-3.5" />
                        {isArabic ? "مسح" : "Clear"}
                    </button>
                )}
            </div>
        </div>
    </div>
    )
}
