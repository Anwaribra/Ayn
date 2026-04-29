import { Zap, Activity, Workflow, Clock, Shield, BarChart3, FileText } from "lucide-react"
import type { WorkflowTemplate } from "./types"

export const ICON_MAP: Record<string, typeof Zap> = {
  Zap,
  Activity,
  Workflow,
  Clock,
}

export const TRIGGER_STEPS: Record<string, { label: string; detail: string }[]> = {
  "On Upload": [
    { label: "Trigger", detail: "Evidence uploaded" },
    { label: "Analyze", detail: "Horus scans content" },
    { label: "Tag", detail: "Apply standard labels" },
    { label: "Notify", detail: "Alert document owner" },
  ],
  "On Evidence Update": [
    { label: "Trigger", detail: "Evidence record changed" },
    { label: "Review", detail: "Flag for human review" },
    { label: "Link", detail: "Re-link to criteria" },
    { label: "Log", detail: "Update coverage score" },
  ],
  "On Analysis Request": [
    { label: "Trigger", detail: "Analysis requested" },
    { label: "Scan", detail: "Run gap analysis" },
    { label: "Report", detail: "Generate summary" },
    { label: "Store", detail: "Save results" },
  ],
}

export const DEFAULT_STEPS = TRIGGER_STEPS["On Upload"]

export function getDefaultWorkflowTemplates(): WorkflowTemplate[] {
  return [
    {
      id: "auto-tag",
      title: "Evidence Auto-Tagging",
      description: "Auto-labels new evidence uploads based on standards coverage.",
      category: "Evidence",
      icon: Shield,
      glow: "from-emerald-500/20 to-cyan-500/5",
      steps: [
        { label: "Trigger", detail: "New evidence uploaded" },
        { label: "Analyze", detail: "Horus scans content against standards" },
        { label: "Tag", detail: "Apply matching standard labels" },
        { label: "Notify", detail: "Alert document owner" },
      ],
    },
    {
      id: "weekly-summary",
      title: "Weekly Compliance Summary",
      description: "Generates a weekly digest with score deltas and alerts.",
      category: "Reporting",
      icon: BarChart3,
      glow: "from-blue-500/20 to-purple-500/10",
      steps: [
        { label: "Schedule", detail: "Every Monday at 09:00" },
        { label: "Collect", detail: "Aggregate scores and gaps" },
        { label: "Summarize", detail: "Generate digest report" },
        { label: "Send", detail: "Deliver to stakeholders" },
      ],
    },
    {
      id: "gap-watch",
      title: "Gap Watchdog",
      description: "Flags newly detected gaps and routes them to owners.",
      category: "Gaps",
      icon: FileText,
      glow: "from-amber-500/20 to-orange-500/10",
      steps: [
        { label: "Trigger", detail: "Gap analysis completed" },
        { label: "Detect", detail: "Identify new or worsened gaps" },
        { label: "Route", detail: "Assign gaps to owners" },
        { label: "Track", detail: "Monitor remediation progress" },
      ],
    },
  ]
}
