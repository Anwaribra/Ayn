import type { LucideIcon } from "lucide-react"

export interface WorkflowData {
  id: string
  name: string
  description: string
  status: "active" | "paused" | "draft"
  trigger: string
  lastRun: string
  icon: string
  color: string
  bg: string
}

export interface WorkflowTemplate {
  id: string
  title: string
  description: string
  category: "Evidence" | "Reporting" | "Gaps"
  icon: LucideIcon
  glow: string
  steps: { label: string; detail: string }[]
}

export interface WorkflowRunItem {
  id: string
  workflowName: string
  status: "queued" | "running" | "success" | "failed" | "canceled"
  trigger: string
  startedAt: string
  endedAt?: string
  startedBy: string
  message?: string
  metadata: Record<string, unknown>
}
