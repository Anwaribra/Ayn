import { Play, Pause, Workflow } from "lucide-react"

export function WorkflowStatsRow({
  activeCount,
  pausedCount,
  totalCount,
  isLoading,
}: {
  activeCount: number
  pausedCount: number
  totalCount: number
  isLoading: boolean
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { label: "Active", value: isLoading ? "…" : String(activeCount), icon: Play, color: "text-[var(--status-success)]", note: "running now" },
        { label: "Paused", value: isLoading ? "…" : String(pausedCount), icon: Pause, color: "text-[var(--status-warning)]", note: "temporarily stopped" },
        { label: "Total", value: isLoading ? "…" : String(totalCount), icon: Workflow, color: "text-primary", note: "automations defined" },
      ].map((stat) => (
        <div key={stat.label} className="glass-panel p-5 rounded-2xl flex items-center gap-4 glass-border">
          <div className="w-10 h-10 rounded-xl glass-input flex items-center justify-center shrink-0">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
            <div className="text-[10px] text-muted-foreground">{stat.note}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
