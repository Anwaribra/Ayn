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
    const iconBoxClass = cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm border", colorStyles[color])
    const trendClass = cn(
        "text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 border",
        trend === "up" ? "status-success" : trend === "down" ? "status-critical" : "bg-muted text-muted-foreground border-border"
    )

    return (
        <div className={cn(
            "glass-panel p-6 rounded-2xl flex flex-col justify-between min-h-[160px] group hover:-translate-y-1 transition-transform duration-300",
            className
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className={iconBoxClass}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={trendClass}>
                        {trend === "up" ? "↑" : trend === "down" ? "↓" : "•"}
                        {trendValue}
                    </div>
                )}
            </div>

            <div>
                <div className="text-3xl font-black tracking-tight text-foreground mb-1">
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
