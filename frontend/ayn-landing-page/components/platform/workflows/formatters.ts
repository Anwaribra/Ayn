import type { WorkflowRunItem } from "./types"

export function formatDuration(run: WorkflowRunItem): string {
  if (!run.endedAt) return "—"
  const start = new Date(run.startedAt).getTime()
  const end = new Date(run.endedAt).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return "—"
  const seconds = Math.max(1, Math.round((end - start) / 1000))
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return remaining ? `${mins}m ${remaining}s` : `${mins}m`
}

export function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}
