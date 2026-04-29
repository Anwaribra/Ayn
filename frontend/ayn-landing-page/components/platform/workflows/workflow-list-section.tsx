"use client"

import {
  Zap,
  Play,
  Pencil,
  Workflow,
  Clock,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Filter,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { ICON_MAP } from "./constants"
import type { WorkflowData } from "./types"
import { statusBadgeClass, statusLabel } from "./status-styles"

export function WorkflowListSection({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  triggerFilter,
  onTriggerFilterChange,
  availableTriggers,
  isLoading,
  error,
  onRetry,
  filteredWorkflows,
  runBusyId,
  onSelectWorkflow,
  onStartRun,
  onEditWorkflow,
  onNewWorkflow,
}: {
  query: string
  onQueryChange: (q: string) => void
  statusFilter: "all" | "active" | "paused" | "draft"
  onStatusFilterChange: (s: typeof statusFilter) => void
  triggerFilter: string
  onTriggerFilterChange: (t: string) => void
  availableTriggers: string[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
  filteredWorkflows: WorkflowData[]
  runBusyId: string | null
  onSelectWorkflow: (w: WorkflowData) => void
  onStartRun: (w: WorkflowData) => void
  onEditWorkflow: (w: WorkflowData) => void
  onNewWorkflow: () => void
}) {
  const filtersDirty =
    statusFilter !== "all" || triggerFilter !== "all"

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-2xl p-4 glass-border flex flex-col gap-3">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search automations…"
          className="w-full h-10 glass-input rounded-xl px-4 text-sm text-foreground"
        />

        <Collapsible defaultOpen={filtersDirty}>
          <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left glass-button text-muted-foreground hover:text-foreground transition-colors">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
              <Filter className="w-3.5 h-3.5" />
              Filters
              {filtersDirty ? (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold text-primary">Active</span>
              ) : null}
            </span>
            <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-full sm:w-auto">Status</span>
              {(["all", "active", "paused", "draft"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusFilterChange(s)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all capitalize",
                    statusFilter === s ? "bg-primary text-primary-foreground" : "glass-button text-muted-foreground",
                  )}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
            {availableTriggers.length > 1 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-full sm:w-auto">Trigger</span>
                <button
                  type="button"
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                    triggerFilter === "all" ? "bg-primary text-primary-foreground" : "glass-button text-muted-foreground",
                  )}
                  onClick={() => onTriggerFilterChange("all")}
                >
                  All
                </button>
                {availableTriggers.map((trigger) => (
                  <button
                    key={trigger}
                    type="button"
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                      triggerFilter === trigger ? "bg-primary text-primary-foreground" : "glass-button text-muted-foreground",
                    )}
                    onClick={() => onTriggerFilterChange(trigger)}
                  >
                    {trigger}
                  </button>
                ))}
              </div>
            ) : null}
            {filtersDirty ? (
              <button
                type="button"
                className="text-[10px] font-bold text-primary hover:underline"
                onClick={() => {
                  onStatusFilterChange("all")
                  onTriggerFilterChange("all")
                }}
              >
                Reset filters
              </button>
            ) : null}
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="grid gap-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="glass-panel p-6 rounded-2xl h-24 animate-pulse glass-border" />)
        ) : error ? (
          <div className="glass-panel rounded-2xl p-10 glass-border text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
            <h4 className="text-sm font-bold text-foreground">Failed to load automations</h4>
            <p className="text-xs text-muted-foreground mt-1">Try refreshing the page.</p>
            <button
              type="button"
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
              onClick={onRetry}
            >
              Retry
            </button>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 glass-border text-center">
            <Workflow className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h4 className="text-sm font-bold text-foreground">No automations yet</h4>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Create one from scratch or use a template above.</p>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest"
              onClick={onNewWorkflow}
            >
              New automation
            </button>
          </div>
        ) : (
          filteredWorkflows.map((workflow) => {
            const Icon = ICON_MAP[workflow.icon] || Workflow
            const isRunning = runBusyId === workflow.id
            return (
              <button
                key={workflow.id}
                type="button"
                className="glass-panel p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 group hover:bg-[var(--surface)] transition-all glass-border text-left w-full"
                onClick={() => onSelectWorkflow(workflow)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl ${workflow.bg} flex items-center justify-center shrink-0 border border-white/5`}>
                    <Icon className={`h-5 w-5 ${workflow.color}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h4 className="text-sm font-bold text-foreground">{workflow.name}</h4>
                      <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest", statusBadgeClass(workflow.status))}>
                        {statusLabel(workflow.status)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{workflow.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" /> {workflow.trigger}
                      </span>
                      {workflow.lastRun ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {workflow.lastRun}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={cn(
                      "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5",
                      isRunning ? "glass-button text-muted-foreground opacity-60 pointer-events-none" : "glass-button text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => onStartRun(workflow)}
                  >
                    <Play className="w-3 h-3" />
                    {isRunning ? "Running…" : "Run"}
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:text-foreground transition-all flex items-center gap-1.5"
                    onClick={() => onEditWorkflow(workflow)}
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
