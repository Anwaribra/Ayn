import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
    label: string
    value: string | number
    subValue?: string
    icon: LucideIcon
    trend?: "up" | "down" | "neutral"
    trendValue?: string
    color?: "blue" | "emerald" | "amber" | "rose" | "indigo" | "purple"
    className?: string
}

export function KPICard({
    label,
    value,
    subValue,
    icon: Icon,
    trend,
    trendValue,
    color = "blue",
    className,
}: KPICardProps) {
    const colorStyles: Record<string, string> = {
        blue: "status-info",
        emerald: "status-success",
        amber: "status-warning",
        rose: "status-critical",
        indigo: "status-info",
        purple: "status-info",
    }
    const iconBoxClass = cn("flex h-11 w-11 items-center justify-center rounded-[14px] border", colorStyles[color])
    const trendClass = cn(
        "text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 border",
        trend === "up" ? "status-success" : trend === "down" ? "status-critical" : "bg-muted text-muted-foreground border-border"
    )

    return (
        <div className={cn(
            "glass-panel flex min-h-[120px] flex-col justify-between rounded-xl p-4",
            className
        )}>
            <div className="mb-3 flex items-start justify-between">
                <div className={cn(iconBoxClass, "h-9 w-9 rounded-lg")}>
                    <Icon className="h-4 w-4" />
                </div>
                {trend && (
                    <div className={trendClass}>
                        {trend === "up" ? "↑" : trend === "down" ? "↓" : "•"}
                        {trendValue}
                    </div>
                )}
            </div>

            <div>
                <div className="platform-stat-value mb-0.5 text-foreground">
                    {value}
                </div>
                <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {label}
                    </div>
                    {subValue && (
                        <div className="text-xs font-medium text-muted-foreground">
                            {subValue}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
