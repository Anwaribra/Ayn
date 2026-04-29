import type { WorkflowData, WorkflowRunItem } from "./types"

export function statusBadgeClass(status: WorkflowData["status"]): string {
  if (status === "active") return "status-success border"
  if (status === "paused") return "status-warning border"
  return "glass-button text-muted-foreground border border-[var(--glass-border)]"
}

export function statusLabel(status: WorkflowData["status"]): string {
  return status === "active" ? "Active" : status === "paused" ? "Paused" : "Draft"
}

export function runStatusClass(status: WorkflowRunItem["status"]): string {
  if (status === "success") return "status-success border"
  if (status === "failed") return "status-critical border"
  if (status === "running") return "status-info border"
  if (status === "queued") return "status-warning border"
  return "glass-button text-muted-foreground"
}
