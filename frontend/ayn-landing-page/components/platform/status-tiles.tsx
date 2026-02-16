"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { AlertCircle, CheckCircle2, Clock, Activity } from "lucide-react"

const tiles = [
    {
        label: "Pending Evidence",
        value: "12",
        icon: Clock,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
    },
    {
        label: "Active Alerts",
        value: "3",
        icon: AlertCircle,
        color: "text-red-500",
        bg: "bg-red-500/10",
    },
    {
        label: "Compliance Score",
        value: "94%",
        icon: CheckCircle2,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
    },
    {
        label: "Horus Uptime",
        value: "99.9%",
        icon: Activity,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
]

export function StatusTiles() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {tiles.map((tile, i) => (
                <GlassCard
                    key={i}
                    variant={2}
                    hoverEffect
                    shine
                    className="flex flex-col items-center justify-center p-4 text-center gap-3 aspect-square lg:aspect-auto lg:h-32"
                >
                    <div className={`p-2.5 rounded-xl ${tile.bg}`}>
                        <tile.icon className={`w-5 h-5 ${tile.color}`} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold tracking-tight">{tile.value}</div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{tile.label}</div>
                    </div>
                </GlassCard>
            ))}
        </div>
    )
}
