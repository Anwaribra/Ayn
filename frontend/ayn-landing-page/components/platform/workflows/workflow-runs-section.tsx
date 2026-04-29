"use client"

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Timer,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkflowRunItem } from "./types"
import { formatDuration, formatTime } from "./formatters"
import { runStatusClass } from "./status-styles"

export function WorkflowRunsSection({
  workflowRuns,
  runsLoading,
  runsError,
  runsList,
  successRate,
  avgDuration,
  failedCount,
  onExportCsv,
  onSelectRun,
}: {
  workflowRuns: WorkflowRunItem[] | undefined
  runsLoading: boolean
  runsError: unknown
  runsList: WorkflowRunItem[]
  successRate: string
  avgDuration: string
  failedCount: number
  onExportCsv: () => void
  onSelectRun: (run: WorkflowRunItem) => void
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Success Rate", value: successRate, icon: BadgeCheck, color: "text-[var(--status-success)]" },
          { label: "Avg Duration", value: avgDuration, icon: Timer, color: "text-primary" },
          { label: "Failed Runs", value: runsList.length ? String(failedCount) : "—", icon: AlertTriangle, color: "text-[var(--status-critical)]" },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel rounded-2xl p-5 glass-border flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl glass-input flex items-center justify-center shrink-0">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Activity</h3>
          <p className="text-sm text-muted-foreground">Recent automation runs, newest first.</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 hover:text-foreground transition-colors border border-[var(--glass-border)]"
          onClick={onExportCsv}
        >
          Export CSV
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid gap-2">
        {runsLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="glass-panel rounded-2xl h-16 animate-pulse glass-border" />)
        ) : runsError ? (
          <div className="glass-panel rounded-2xl p-10 glass-border text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
            <h4 className="text-sm font-bold text-foreground">Failed to load runs</h4>
            <p className="text-xs text-muted-foreground mt-1">Try refreshing in a moment.</p>
          </div>
        ) : !workflowRuns || workflowRuns.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 glass-border text-center">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h4 className="text-sm font-bold text-foreground">No runs yet</h4>
            <p className="text-xs text-muted-foreground mt-1">Runs appear once automations start executing.</p>
          </div>
        ) : (
          workflowRuns.map((run) => (
            <button
              key={run.id}
              type="button"
              className="glass-panel rounded-2xl p-4 glass-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-[var(--surface)] transition-all w-full group"
              onClick={() => onSelectRun(run)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl glass-input flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{run.workflowName}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatTime(run.startedAt)} · via {run.trigger}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest", runStatusClass(run.status))}>
                  {run.status}
                </span>
                <span className="text-[11px] font-bold text-muted-foreground">{formatDuration(run)}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
