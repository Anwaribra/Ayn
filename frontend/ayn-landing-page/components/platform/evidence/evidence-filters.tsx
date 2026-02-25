"use client"

import { useState } from "react"
import { Search, Filter, SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import { api } from "@/lib/api"

const STATUSES = ["pending", "processing", "analyzed", "linked", "failed"] as const
type Status = typeof STATUSES[number]

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
    const [query, setQuery] = useState("")
    const [showStatusMenu, setShowStatusMenu] = useState(false)
    const [showStandardMenu, setShowStandardMenu] = useState(false)

    const { data: standards } = useSWR("standards", () => api.getStandards(), {
        revalidateOnFocus: false,
    })

    const hasActiveFilters = activeStatus !== "" || activeStandard !== ""

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
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
            {/* Text Search */}
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search evidence by title, content, or ID..."
                    className="w-full pl-11 pr-4 py-3 glass-layer-2 rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                />
                {query && (
                    <button
                        onClick={() => handleSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <div className="flex gap-2 relative">
                {/* Status Filter */}
                <div className="relative">
                    <button
                        onClick={() => { setShowStatusMenu(!showStatusMenu); setShowStandardMenu(false) }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 glass-layer-2 rounded-xl text-sm font-bold transition-all shadow-sm",
                            activeStatus
                                ? "text-primary border border-primary/40 bg-primary/5"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        {activeStatus ? <span className="capitalize">{activeStatus}</span> : "Status"}
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
                        <div className="absolute top-full left-0 mt-1 z-30 glass-layer-3 rounded-xl border border-border shadow-2xl min-w-[140px] py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                            {STATUSES.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => { onStatusChange(s); setShowStatusMenu(false) }}
                                    className={cn(
                                        "w-full text-left px-4 py-2 text-sm font-medium capitalize hover:bg-muted/50 transition-colors",
                                        activeStatus === s ? "text-primary font-bold" : "text-foreground"
                                    )}
                                >
                                    {s}
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
                            "flex items-center gap-2 px-4 py-3 glass-layer-2 rounded-xl text-sm font-bold transition-all shadow-sm",
                            activeStandard
                                ? "text-primary border border-primary/40 bg-primary/5"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        {activeStandard && standards
                            ? (standards.find((s: any) => s.id === activeStandard)?.code ?? "Standard")
                            : "By Standard"}
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
                        <div className="absolute top-full right-0 mt-1 z-30 glass-layer-3 rounded-xl border border-border shadow-2xl min-w-[200px] py-1 animate-in fade-in slide-in-from-top-2 duration-150 max-h-60 overflow-y-auto">
                            {!standards || standards.length === 0 ? (
                                <p className="px-4 py-3 text-sm text-muted-foreground">No standards configured</p>
                            ) : (
                                standards.map((s: any) => (
                                    <button
                                        key={s.id}
                                        onClick={() => { onStandardChange(s.id); setShowStandardMenu(false) }}
                                        className={cn(
                                            "w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors",
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
                        className="flex items-center gap-1.5 px-3 py-3 text-xs font-bold text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear
                    </button>
                )}
            </div>
        </div>
    )
}
