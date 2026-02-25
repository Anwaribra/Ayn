"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, Clock, Activity } from "lucide-react"
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

const defaultTiles: StatTile[] = []

export function StatusTiles({ stats = defaultTiles }: StatusTilesProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((tile, i) => {
                const statusClass = tile.status === "critical" ? "status-critical" :
                    tile.status === "warning" ? "status-warning" :
                        tile.status === "success" ? "status-success" : "status-info"

                return (
                    <GlassCard
                        key={i}
                        variant={2}
                        hoverEffect
                        shine
                        className="flex flex-col items-center justify-center p-4 text-center gap-3 aspect-auto min-h-[140px] sm:aspect-square lg:aspect-auto lg:h-32"
                    >
                        <div className={cn("p-2.5 rounded-xl border", statusClass)}>
                            <tile.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold tracking-tight">{tile.value}</div>
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{tile.label}</div>
                        </div>
                    </GlassCard>
                )
            })}
        </div>
    )
}
