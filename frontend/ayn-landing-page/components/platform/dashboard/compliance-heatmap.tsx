import { cn } from "@/lib/utils"

interface HeatmapItem {
    id: string
    label: string
    status: "optimal" | "warning" | "critical" | "unknown"
    value?: number
}

interface ComplianceHeatmapProps {
    items: HeatmapItem[]
    title?: string
    className?: string
}

export function ComplianceHeatmap({ items, title = "Standards Health Matrix", className }: ComplianceHeatmapProps) {
    return (
        <div className={cn("glass-panel p-6 rounded-3xl", className)}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-zinc-800">{title}</h3>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Optimal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Warning</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Critical</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            "aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110 cursor-pointer shadow-sm border",
                            item.status === "optimal" && "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-400",
                            item.status === "warning" && "bg-amber-500 text-white border-amber-600 hover:bg-amber-400",
                            item.status === "critical" && "bg-rose-500 text-white border-rose-600 hover:bg-rose-400",
                            item.status === "unknown" && "bg-zinc-100 text-zinc-400 border-zinc-200"
                        )}
                        title={`${item.label} - ${item.status.toUpperCase()}`}
                    >
                        {item.label}
                    </div>
                ))}
                {Array.from({ length: Math.max(0, 20 - items.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square rounded-lg bg-zinc-50 border border-zinc-100/50" />
                ))}
            </div>
        </div>
    )
}
