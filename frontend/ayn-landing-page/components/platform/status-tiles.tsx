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

export function StatusTiles({ stats = [] }: StatusTilesProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((tile, i) => {
                const statusClass = tile.status === "critical" ? "status-critical" :
                    tile.status === "warning" ? "status-warning" :
                        tile.status === "success" ? "status-success" : "status-info"

                return (
                    <div
                        key={i}
                        className="glass-card flex flex-col items-center justify-center p-5 text-center gap-3 min-h-[140px] hover:-translate-y-0.5 transition-transform duration-300 rounded-3xl"
                    >
                        <div className={cn("p-2.5 rounded-xl border", statusClass)}>
                            <tile.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold tracking-tight text-foreground">{tile.value}</div>
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{tile.label}</div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
