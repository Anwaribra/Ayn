"use client"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatTile {
    label: string
    value: string
    icon: LucideIcon
    status?: "neutral" | "success" | "warning" | "critical"
    /** Localized status badge (e.g. Arabic). Falls back to raw `status` if omitted. */
    statusLabel?: string
    trend?: string
}

interface StatusTilesProps {
    stats?: StatTile[]
}

export function StatusTiles({ stats = [] }: StatusTilesProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((tile, i) => {
                const statusClass = tile.status === "critical" ? "status-critical" :
                    tile.status === "warning" ? "status-warning" :
                        tile.status === "success" ? "status-success" : "status-info"

                const accentGlow = tile.status === "critical"
                    ? "shadow-[0_24px_60px_-34px_rgba(239,68,68,0.45)]"
                    : tile.status === "warning"
                        ? "shadow-[0_24px_60px_-34px_rgba(245,158,11,0.38)]"
                        : tile.status === "success"
                            ? "shadow-[0_24px_60px_-34px_rgba(16,185,129,0.38)]"
                            : "shadow-[0_24px_60px_-34px_rgba(59,130,246,0.38)]"

                return (
                    <div
                        key={i}
                        className={cn(
                            "glass-card group relative overflow-hidden rounded-[28px] p-5 sm:p-6 min-h-[152px] transition-all duration-300 hover:-translate-y-1",
                            accentGlow
                        )}
                    >
                        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] opacity-80" />
                        <div className="relative z-10 flex h-full flex-col justify-between gap-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className={cn("inline-flex p-3 rounded-2xl border backdrop-blur-sm", statusClass)}>
                                    <tile.icon className="w-5 h-5" />
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.22em]">
                                        {tile.statusLabel ?? tile.status ?? "status"}
                                    </div>
                                    {tile.trend && (
                                        <div className="mt-1 text-[11px] font-medium text-muted-foreground">
                                            {tile.trend}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl sm:text-[2rem] font-black tracking-[-0.04em] text-foreground leading-none">
                                    {tile.value}
                                </div>
                                <div className="mt-2 text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-[0.18em]">
                                    {tile.label}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
