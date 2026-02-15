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
    const colorStyles = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100",
        rose: "text-rose-600 bg-rose-50 border-rose-100",
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
        purple: "text-purple-600 bg-purple-50 border-purple-100",
    }

    return (
        <div className={cn(
            "glass-panel p-6 rounded-2xl flex flex-col justify-between min-h-[160px] group hover:-translate-y-1 transition-transform duration-300",
            className
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm", colorStyles[color])}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1",
                        trend === "up" ? "bg-emerald-100 text-emerald-700" :
                            trend === "down" ? "bg-rose-100 text-rose-700" :
                                "bg-zinc-100 text-zinc-600"
                    )}>
                        {trend === "up" ? "↑" : trend === "down" ? "↓" : "•"}
                        {trendValue}
                    </div>
                )}
            </div>

            <div>
                <div className="text-3xl font-black tracking-tight text-zinc-900 mb-1">
                    {value}
                </div>
                <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        {label}
                    </div>
                    {subValue && (
                        <div className="text-xs font-medium text-zinc-400">
                            {subValue}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
