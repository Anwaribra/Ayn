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
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--status-success)' }} />
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Optimal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--status-warning)' }} />
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Warning</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--status-critical)' }} />
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Critical</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            "aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110 cursor-pointer shadow-sm border text-primary-foreground",
                            item.status === "unknown" && "bg-muted text-muted-foreground border-border"
                        )}
                        style={item.status !== "unknown" ? {
                            backgroundColor: item.status === "optimal" ? "var(--status-success)" : item.status === "warning" ? "var(--status-warning)" : "var(--status-critical)",
                            borderColor: item.status === "optimal" ? "var(--status-success-border)" : item.status === "warning" ? "var(--status-warning-border)" : "var(--status-critical-border)"
                        } : undefined}
                        title={`${item.label} - ${item.status.toUpperCase()}`}
                    >
                        {item.label}
                    </div>
                ))}
                {Array.from({ length: Math.max(0, 20 - items.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square rounded-lg bg-muted border border-border" />
                ))}
            </div>
        </div>
    )
}
