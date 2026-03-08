"use client"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatTile {
    label: string
    value: string
    icon: LucideIcon
    status?: "neutral" | "success" | "warning" | "critical"
    trend?: string
}

interface StatusTilesProps {
    stats?: StatTile[]
}

const statusStyles: Record<string, { bg: string; border: string; text: string }> = {
    critical: { bg: "bg-red-50", border: "border-red-200/60", text: "text-red-600" },
    warning: { bg: "bg-amber-50", border: "border-amber-200/60", text: "text-amber-600" },
    success: { bg: "bg-emerald-50", border: "border-emerald-200/60", text: "text-emerald-600" },
    neutral: { bg: "bg-slate-50", border: "border-slate-200/60", text: "text-slate-500" },
}

export function StatusTiles({ stats = [] }: StatusTilesProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((tile, i) => {
                const style = statusStyles[tile.status ?? "neutral"] ?? statusStyles.neutral

                return (
                    <div
                        key={i}
                        className="bg-white rounded-3xl border border-slate-200/60 shadow-sm flex flex-col items-center justify-center p-5 text-center gap-3 min-h-[140px] hover:-translate-y-0.5 transition-transform duration-300"
                    >
                        <div className={cn("p-2.5 rounded-xl border", style.bg, style.border, style.text)}>
                            <tile.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold tracking-tight text-slate-900">{tile.value}</div>
                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">{tile.label}</div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
