"use client"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { CircularGauge } from "@/components/ui/circular-gauge"

interface StatTile {
    label: string
    value: string
    icon: LucideIcon
    status?: "neutral" | "success" | "warning" | "critical"
    /** Localized status badge (e.g. Arabic). Falls back to raw `status` if omitted. */
    statusLabel?: string
    trend?: string
    gaugeValue?: number
}

interface StatusTilesProps {
    stats?: StatTile[]
}

export function StatusTiles({ stats = [] }: StatusTilesProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((tile, i) => {
                const isCritical = tile.status === "critical"
                const isWarning = tile.status === "warning"
                const isSuccess = tile.status === "success"

                const iconBgClass = isCritical ? "bg-red-100/50 dark:bg-red-500/10" :
                    isWarning ? "bg-amber-100/50 dark:bg-amber-500/10" :
                    isSuccess ? "bg-emerald-100/50 dark:bg-emerald-500/10" : "bg-[var(--glass-bg)] dark:bg-gray-500/10"

                const iconTextClass = isCritical ? "text-red-600 dark:text-red-400" :
                    isWarning ? "text-amber-600 dark:text-amber-400" :
                    isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"

                if (tile.gaugeValue !== undefined) {
                    const gaugeColor = isCritical ? "var(--status-critical)" :
                        isWarning ? "var(--status-warning)" :
                        isSuccess ? "var(--status-success)" : "var(--status-info)"

                    return (
                        <div
                            key={i}
                            className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-5 flex flex-row items-center justify-between overflow-hidden"
                        >
                            <div className="flex flex-col justify-between h-full space-y-1">
                                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                    {tile.statusLabel ?? tile.status ?? "status"}
                                </div>
                                <h4 className="text-sm font-bold text-foreground truncate mt-1">
                                    {tile.label}
                                </h4>
                                <div className="text-2xl font-black text-foreground mt-2">
                                    {tile.value}
                                </div>
                            </div>
                            <div className="shrink-0 ml-4 relative -mr-2">
                                <CircularGauge
                                    value={tile.gaugeValue}
                                    label=""
                                    color={gaugeColor}
                                    className="w-[72px] h-[72px]"
                                />
                            </div>
                        </div>
                    )
                }

                return (
                    <div
                        key={i}
                        className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-5 flex flex-row items-start justify-between overflow-hidden"
                    >
                        <div className="flex flex-col h-full justify-between">
                            <div>
                                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                    {tile.statusLabel ?? tile.status ?? "status"}
                                </div>
                                <h4 className="text-sm font-bold text-foreground truncate mt-1">
                                    {tile.label}
                                </h4>
                            </div>
                            <div className="text-2xl font-black text-foreground mt-4">
                                {tile.value}
                            </div>
                        </div>
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-[var(--glass-border)]", iconBgClass)}>
                            <tile.icon className={cn("w-5 h-5", iconTextClass)} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
