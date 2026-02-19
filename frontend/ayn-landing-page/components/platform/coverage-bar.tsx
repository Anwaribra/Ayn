"use client"

import useSWR from "swr"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ShieldCheck } from "lucide-react"

interface CoverageResult {
    standardId: string
    totalCriteria: number
    coveredCriteria: number
    coveragePct: number
}

interface CoverageBarProps {
    standardId: string
    /** If true, renders a compact single-line bar (for dashboard lists) */
    compact?: boolean
    className?: string
}

export function CoverageBar({ standardId, compact = false, className }: CoverageBarProps) {
    const { data, isLoading } = useSWR<CoverageResult>(
        standardId ? `coverage-${standardId}` : null,
        () => api.getStandardCoverage(standardId),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000, // Cache for 60s — no need to re-fetch on every render
        }
    )

    // Skeleton
    if (isLoading) {
        return (
            <div className={cn("animate-pulse space-y-1.5", className)}>
                <div className="h-3 bg-muted rounded-full w-2/3" />
                <div className="h-2 bg-muted rounded-full w-full" />
            </div>
        )
    }

    // No criteria at all
    if (!data || data.totalCriteria === 0) {
        return (
            <div className={cn("text-[10px] text-muted-foreground font-medium italic", className)}>
                No criteria mapped yet
            </div>
        )
    }

    const { coveredCriteria, totalCriteria, coveragePct } = data
    const pct = Math.min(100, Math.max(0, coveragePct))

    const statusColor =
        pct >= 80 ? "bg-emerald-500" :
            pct >= 50 ? "bg-amber-500" :
                "bg-red-500"

    if (compact) {
        // One-liner: "[bar] 47/80 (59%)"
        return (
            <div className={cn("flex items-center gap-3", className)}>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-700", statusColor)}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <span className="text-[10px] font-bold tabular-nums text-muted-foreground whitespace-nowrap">
                    {coveredCriteria}/{totalCriteria}
                    <span className={cn("ml-1", pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-red-500")}>
                        ({Math.round(pct)}%)
                    </span>
                </span>
            </div>
        )
    }

    // Full variant: label + bar + count
    return (
        <div className={cn("space-y-1.5", className)}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Criteria Coverage
                </span>
                <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                    <span className={pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-red-500"}>
                        {coveredCriteria}
                    </span>
                    /{totalCriteria} covered
                </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-700", statusColor)}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}
