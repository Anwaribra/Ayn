"use client"

import useSWR from "swr"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"

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
        return (
            <div className={cn("space-y-2", className)}>
                <div className="flex items-center justify-between gap-3 text-[10px]">
                    <span className="font-medium text-muted-foreground">Coverage</span>
                    <span className="font-bold tabular-nums text-foreground">
                        {coveredCriteria}
                        <span className="mx-1 text-muted-foreground">/</span>
                        <span className="text-muted-foreground">{totalCriteria}</span>
                        <span className={cn("ml-2", pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-300" : "text-rose-400")}>
                            {Math.round(pct)}%
                        </span>
                    </span>
                </div>
                <div className="relative h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={cn("absolute top-0 left-0 h-full rounded-full", statusColor)}
                    />
                </div>
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
            <div className="h-2.5 rounded-full bg-muted overflow-hidden relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={cn("absolute top-0 left-0 h-full rounded-full shadow-inner", statusColor)}
                />
            </div>
        </div>
    )
}
