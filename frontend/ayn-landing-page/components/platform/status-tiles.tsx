"use client"

import { GlassCard } from "@/components/ui/glass-card"
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
                const color = tile.status === "critical" ? "text-red-500" :
                    tile.status === "warning" ? "text-amber-500" :
                        tile.status === "success" ? "text-emerald-500" : "text-blue-500"

                const bg = tile.status === "critical" ? "bg-red-500/10" :
                    tile.status === "warning" ? "bg-amber-500/10" :
                        tile.status === "success" ? "bg-emerald-500/10" : "bg-blue-500/10"

                return (
                    <GlassCard
                        key={i}
                        variant={2}
                        hoverEffect
                        shine
                        className="flex flex-col items-center justify-center p-4 text-center gap-3 aspect-square lg:aspect-auto lg:h-32"
                    >
                        <div className={`p-2.5 rounded-xl ${bg}`}>
                            <tile.icon className={`w-5 h-5 ${color}`} />
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
