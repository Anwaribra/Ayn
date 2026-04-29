"use client"

import { Zap, Play, Pause, Pencil, Clock, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkflowData, WorkflowRunItem } from "./types"
import { formatDuration, formatTime } from "./formatters"
import { runStatusClass, statusBadgeClass, statusLabel } from "./status-styles"

export function WorkflowDetailsDrawer({
  workflow,
  selectedWorkflowRuns,
  runsTotalForWorkflow,
  onClose,
  onViewAllRuns,
  onStartRun,
  onEdit,
  onPause,
  onEnable,
  onOpenRun,
}: {
  workflow: WorkflowData
  selectedWorkflowRuns: WorkflowRunItem[]
  runsTotalForWorkflow: number
  onClose: () => void
  onViewAllRuns: () => void
  onStartRun: (w: WorkflowData) => void
  onEdit: (w: WorkflowData) => void
  onPause: (id: string) => void
  onEnable: (id: string) => void
  onOpenRun: (run: WorkflowRunItem) => void
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-end">
      <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-label="Close workflow details" />
      <div className="relative w-full max-w-[520px] h-full glass-panel glass-border p-6 overflow-y-auto flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest mb-2", statusBadgeClass(workflow.status))}>
              {statusLabel(workflow.status)}
            </span>
            <h3 className="text-lg font-bold text-foreground">{workflow.name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{workflow.description}</p>
          </div>
          <button type="button" className="p-2 rounded-lg glass-button shrink-0" onClick={onClose}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="glass-panel p-4 rounded-2xl glass-border">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Trigger</div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Zap className="w-4 h-4 text-primary" />
            {workflow.trigger}
          </div>
          {workflow.lastRun ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              Last run: {workflow.lastRun}
            </div>
          ) : null}
        </div>

        <div className="glass-panel p-4 rounded-2xl glass-border">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Recent Runs</div>
          {selectedWorkflowRuns.length === 0 ? (
            <p className="text-xs text-muted-foreground">No runs recorded for this automation yet.</p>
          ) : (
            <div className="space-y-2">
              {selectedWorkflowRuns.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl glass-button hover:bg-[var(--surface)] transition-all text-left"
                  onClick={() => onOpenRun(run)}
                >
                  <div>
                    <div className="text-xs font-semibold text-foreground">{formatTime(run.startedAt)}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {run.trigger} · {formatDuration(run)}
                    </div>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shrink-0", runStatusClass(run.status))}>
                    {run.status}
                  </span>
                </button>
              ))}
              {runsTotalForWorkflow > 5 ? (
                <button type="button" className="text-[10px] font-bold text-primary hover:underline w-full text-left pt-1" onClick={onViewAllRuns}>
                  View all runs →
                </button>
              ) : null}
            </div>
          )}
        </div>

        <div className="glass-panel p-4 rounded-2xl glass-border">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Actions</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              onClick={() => {
                onStartRun(workflow)
                onClose()
              }}
            >
              <Play className="w-3 h-3" /> Run Now
            </button>
            {workflow.status === "active" ? (
              <button
                type="button"
                className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:text-foreground flex items-center gap-1.5"
                onClick={() => onPause(workflow.id)}
              >
                <Pause className="w-3 h-3" /> Pause
              </button>
            ) : (
              <button
                type="button"
                className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:text-foreground flex items-center gap-1.5"
                onClick={() => onEnable(workflow.id)}
              >
                <Play className="w-3 h-3" /> Enable
              </button>
            )}
            <button
              type="button"
              className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:text-foreground flex items-center gap-1.5"
              onClick={() => {
                onEdit(workflow)
                onClose()
              }}
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
