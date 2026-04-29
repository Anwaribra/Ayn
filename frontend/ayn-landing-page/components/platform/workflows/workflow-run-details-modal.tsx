"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkflowRunItem } from "./types"
import { formatDuration, formatTime } from "./formatters"
import { runStatusClass } from "./status-styles"

export function WorkflowRunDetailsModal({
  run,
  onClose,
}: {
  run: WorkflowRunItem
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[78] flex items-center justify-center p-6">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Close run details" />
      <div className="relative w-full max-w-lg glass-panel glass-border rounded-[28px] p-6 overflow-hidden">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-foreground">{run.workflowName}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Run details</p>
          </div>
          <button type="button" className="p-2 rounded-lg glass-button shrink-0" onClick={onClose}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="glass-panel glass-border rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Status</div>
            <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest", runStatusClass(run.status))}>
              {run.status}
            </span>
          </div>
          <div className="glass-panel glass-border rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Trigger</div>
            <div className="text-sm font-semibold text-foreground">{run.trigger}</div>
          </div>
          <div className="glass-panel glass-border rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Started</div>
            <div className="text-sm font-semibold text-foreground">{formatTime(run.startedAt)}</div>
          </div>
          <div className="glass-panel glass-border rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Duration</div>
            <div className="text-sm font-semibold text-foreground">{formatDuration(run)}</div>
          </div>
          {run.startedBy ? (
            <div className="glass-panel glass-border rounded-xl p-3 sm:col-span-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Started By</div>
              <div className="text-sm font-semibold text-foreground">{run.startedBy}</div>
            </div>
          ) : null}
        </div>

        {run.message ? (
          <div className="glass-panel glass-border rounded-xl p-4 mt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Message</div>
            <p className="text-sm text-foreground leading-relaxed">{run.message}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
