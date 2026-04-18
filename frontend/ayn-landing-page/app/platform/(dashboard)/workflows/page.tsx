"use client"

import { useMemo, useState } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import {
  Zap,
  Play,
  Pause,
  Pencil,
  Plus,
  Workflow,
  Clock,
  Activity,
  ArrowRight,
  Layers,
  Shield,
  BarChart3,
  FileText,
  Timer,
  BadgeCheck,
  ArrowUpRight,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react"
import { api } from "@/lib/api"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const ICON_MAP: Record<string, any> = {
  Zap,
  Activity,
  Workflow,
  Clock,
}

/* ── The trigger → default step flow displayed in the builder ── */
const TRIGGER_STEPS: Record<string, { label: string; detail: string }[]> = {
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
const DEFAULT_STEPS = TRIGGER_STEPS["On Upload"]

interface WorkflowData {
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

interface WorkflowTemplate {
  id: string
  title: string
  description: string
  category: "Evidence" | "Reporting" | "Gaps"
  icon: typeof Shield
  glow: string
  steps: { label: string; detail: string }[]
}

interface WorkflowRunItem {
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

export default function WorkflowsPage() {
  const [tab, setTab] = useState<"workflows" | "templates" | "runs">("workflows")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "draft">("all")
  const [triggerFilter, setTriggerFilter] = useState<string>("all")
  const [templateFilter, setTemplateFilter] = useState<"all" | "Evidence" | "Reporting" | "Gaps">("all")
  const [builderOpen, setBuilderOpen] = useState(false)
  const [builderTemplate, setBuilderTemplate] = useState<string | null>(null)
  const [builderWorkflowId, setBuilderWorkflowId] = useState<string | null>(null)
  const [builderName, setBuilderName] = useState("")
  const [builderDescription, setBuilderDescription] = useState("")
  const [builderTrigger, setBuilderTrigger] = useState("On Upload")
  const [templatePreview, setTemplatePreview] = useState<WorkflowTemplate | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowData | null>(null)
  const [selectedRun, setSelectedRun] = useState<WorkflowRunItem | null>(null)
  const [localWorkflows, setLocalWorkflows] = useState<WorkflowData[] | null>(null)
  const [runBusyId, setRunBusyId] = useState<string | null>(null)

  const { data: workflows, isLoading, error, mutate } = useSWR<WorkflowData[]>(
    "workflows",
    () => api.getWorkflows(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30_000,
    }
  )
  const { data: workflowRuns, isLoading: runsLoading, error: runsError, mutate: mutateRuns } = useSWR<WorkflowRunItem[]>(
    "workflow-runs",
    () => api.getWorkflowRuns(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30_000,
    }
  )

  const workflowsList = localWorkflows ?? workflows ?? []

  const activeCount = workflowsList.filter((w: WorkflowData) => w.status === "active").length
  const pausedCount = workflowsList.filter((w: WorkflowData) => w.status === "paused").length
  const totalCount = workflowsList.length

  const templates = useMemo<WorkflowTemplate[]>(
    () => [
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
    ],
    []
  )

  const formatDuration = (run: WorkflowRunItem) => {
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

  const formatTime = (iso: string) => {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const runsList = workflowRuns ?? []
  const successCount = runsList.filter((run) => run.status === "success").length
  const failedCount = runsList.filter((run) => run.status === "failed").length
  const successRate = runsList.length ? `${Math.round((successCount / runsList.length) * 100)}%` : "—"
  const avgDuration = (() => {
    const completed = runsList.filter((run) => run.endedAt)
    if (completed.length === 0) return "—"
    const avgSeconds = Math.round(
      completed.reduce((sum, run) => {
        const start = new Date(run.startedAt).getTime()
        const end = new Date(run.endedAt as string).getTime()
        if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return sum
        return sum + Math.round((end - start) / 1000)
      }, 0) / completed.length
    )
    if (!avgSeconds || avgSeconds < 60) return `${avgSeconds || 1}s`
    const mins = Math.floor(avgSeconds / 60)
    const remaining = avgSeconds % 60
    return remaining ? `${mins}m ${remaining}s` : `${mins}m`
  })()

  const filteredWorkflows = useMemo(() => {
    return workflowsList.filter((w) => {
      const matchesQuery =
        !query.trim() ||
        w.name.toLowerCase().includes(query.toLowerCase()) ||
        w.description.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = statusFilter === "all" ? true : w.status === statusFilter
      const matchesTrigger = triggerFilter === "all" ? true : w.trigger === triggerFilter
      return matchesQuery && matchesStatus && matchesTrigger
    })
  }, [workflowsList, query, statusFilter, triggerFilter])

  const filteredTemplates = useMemo(() => {
    if (templateFilter === "all") return templates
    return templates.filter((tpl) => tpl.category === templateFilter)
  }, [templates, templateFilter])

  const availableTriggers = useMemo(() => {
    const triggers = Array.from(new Set(workflowsList.map((w) => w.trigger))).filter(Boolean)
    return triggers.length ? triggers : ["On Upload", "On Evidence Update", "On Analysis Request"]
  }, [workflowsList])

  // Runs for the currently selected workflow (used in details drawer)
  const selectedWorkflowRuns = useMemo(() => {
    if (!selectedWorkflow) return []
    return runsList.filter((r) => r.workflowName === selectedWorkflow.name).slice(0, 5)
  }, [selectedWorkflow, runsList])

  const closeBuilder = () => {
    setBuilderOpen(false)
    setBuilderTemplate(null)
    setBuilderWorkflowId(null)
    setBuilderName("")
    setBuilderDescription("")
    setBuilderTrigger("On Upload")
  }

  const openBuilder = (template?: WorkflowTemplate | null) => {
    if (template) {
      setBuilderWorkflowId(null)
      setBuilderTemplate(template.title)
      setBuilderName(template.title)
      setBuilderDescription(template.description)
      setBuilderTrigger(
        template.category === "Evidence"
          ? "On Upload"
          : template.category === "Reporting"
            ? "On Analysis Request"
            : "On Evidence Update"
      )
    } else {
      setBuilderTemplate(null)
      setBuilderWorkflowId(null)
      setBuilderName("")
      setBuilderDescription("")
      setBuilderTrigger("On Upload")
    }
    setBuilderOpen(true)
  }

  const openBuilderForWorkflow = (workflow: WorkflowData) => {
    setBuilderWorkflowId(workflow.id)
    setBuilderTemplate(workflow.name)
    setBuilderName(workflow.name)
    setBuilderDescription(workflow.description)
    setBuilderTrigger(workflow.trigger)
    setBuilderOpen(true)
  }

  const handleExportLogs = () => {
    if (!workflowRuns?.length) {
      toast.info("No run history to export")
      return
    }
    // Export as CSV instead of raw JSON for usability
    const headers = ["Workflow", "Status", "Trigger", "Started", "Ended", "Duration", "Started By"]
    const rows = workflowRuns.map((run) => [
      run.workflowName,
      run.status,
      run.trigger,
      formatTime(run.startedAt),
      run.endedAt ? formatTime(run.endedAt) : "—",
      formatDuration(run),
      run.startedBy,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `workflow-runs-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Run history exported")
  }

  const handleStartRun = async (workflow: WorkflowData) => {
    setRunBusyId(workflow.id)
    try {
      const run = await api.startWorkflowRun({
        workflowName: workflow.name,
        trigger: workflow.trigger,
        message: "Manual run",
        metadata: { source: "ui" },
      })
      mutateRuns((prev) => [run, ...(prev ?? [])], { revalidate: false })
      handleStatusUpdate(workflow.id, "active")
      toast.success(`"${workflow.name}" started`)
    } catch {
      toast.error("Failed to start workflow")
    } finally {
      setRunBusyId(null)
    }
  }

  const handleStatusUpdate = (id: string, status: WorkflowData["status"]) => {
    setLocalWorkflows((prev) => {
      const base = prev ?? workflows ?? []
      return base.map((workflow) =>
        workflow.id === id ? { ...workflow, status, lastRun: status === "active" ? "Just now" : workflow.lastRun } : workflow
      )
    })
    setSelectedWorkflow((prev) => (prev?.id === id ? { ...prev, status } : prev))
  }

  const handleSaveWorkflow = async () => {
    if (!builderName.trim()) {
      toast.error("Workflow name is required")
      return
    }
    try {
      if (builderWorkflowId) {
        const updated = await api.updateWorkflowDefinition(builderWorkflowId, {
          name: builderName.trim(),
          description: builderDescription.trim() || "Custom workflow",
          trigger: builderTrigger,
        })
        setLocalWorkflows((prev) => {
          const base = prev ?? workflows ?? []
          return base.map((w) => (w.id === builderWorkflowId ? { ...w, ...updated } : w))
        })
        toast.success("Workflow updated")
      } else {
        const created = await api.createWorkflowDefinition({
          name: builderName.trim(),
          description: builderDescription.trim() || "Custom workflow",
          trigger: builderTrigger,
        })
        setLocalWorkflows((prev) => [created, ...(prev ?? workflows ?? [])])
        toast.success("Workflow saved as draft")
      }
      closeBuilder()
    } catch {
      toast.error("Failed to save workflow")
    }
  }

  const statusBadgeClass = (status: WorkflowData["status"]) => {
    if (status === "active") return "status-success border"
    if (status === "paused") return "status-warning border"
    return "glass-button text-muted-foreground border border-[var(--glass-border)]"
  }

  const statusLabel = (status: WorkflowData["status"]) =>
    status === "active" ? "Active" : status === "paused" ? "Paused" : "Draft"

  const runStatusClass = (status: WorkflowRunItem["status"]) => {
    if (status === "success") return "status-success border"
    if (status === "failed") return "status-critical border"
    if (status === "running") return "status-info border"
    if (status === "queued") return "status-warning border"
    return "glass-button text-muted-foreground"
  }

  const builderSteps = TRIGGER_STEPS[builderTrigger] ?? DEFAULT_STEPS

  return (
    <ProtectedRoute>
      <div className="animate-fade-in-up pb-24">

        {/* ─── Header ─── */}
        <div className="px-4 pb-4 pt-6 md:px-6">
          <div className="glass-panel rounded-[32px] p-6 md:p-8 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/15 blur-[120px]" />
            <div className="absolute -bottom-28 -left-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-[140px]" />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground border border-[var(--glass-border)] bg-[var(--glass-soft-bg)]">
                    Beta
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  Workflows
                </h1>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Automate evidence intake, gap detection, and compliance actions with auditable pipelines.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-primary text-primary-foreground rounded-xl font-bold text-xs shadow-[0_10px_24px_-10px_rgba(37,99,235,0.45)] hover:bg-primary/90 transition-colors"
                  onClick={() => openBuilder()}
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Workflow
                </button>
                <button
                  className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] glass-button text-muted-foreground rounded-xl font-bold text-xs hover:text-foreground transition-colors border border-[var(--glass-border)]"
                  onClick={() => setTab("templates")}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Browse Templates
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-6">

          {/* ─── Stat Cards ─── */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Active", value: isLoading ? "…" : String(activeCount), icon: Play, color: "text-[var(--status-success)]", note: "running now" },
              { label: "Paused", value: isLoading ? "…" : String(pausedCount), icon: Pause, color: "text-[var(--status-warning)]", note: "temporarily stopped" },
              { label: "Total", value: isLoading ? "…" : String(totalCount), icon: Workflow, color: "text-primary", note: "workflows defined" },
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

          {/* ─── Tab Bar ─── */}
          <div className="glass-panel rounded-2xl p-2 flex flex-wrap gap-2 glass-border">
            {[
              { key: "workflows", label: "My Workflows", icon: Workflow },
              { key: "templates", label: "Templates", icon: Layers },
              { key: "runs", label: "Run History", icon: Activity },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as typeof tab)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                  tab === item.key ? "bg-primary text-primary-foreground shadow-lg" : "glass-button text-muted-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════
              MY WORKFLOWS TAB
              ══════════════════════════════════════════════════════ */}
          {tab === "workflows" && (
            <div className="space-y-4">

              {/* Search + Status filter */}
              <div className="glass-panel rounded-2xl p-4 glass-border flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex-1">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search workflows…"
                    className="w-full h-10 glass-input rounded-xl px-4 text-sm text-foreground"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(["all", "active", "paused", "draft"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all capitalize",
                        statusFilter === s ? "bg-primary text-primary-foreground" : "glass-button text-muted-foreground"
                      )}
                    >
                      {s === "all" ? "All" : s}
                    </button>
                  ))}
                </div>
                {triggerFilter !== "all" && (
                  <button
                    className="text-[10px] font-bold text-primary hover:underline whitespace-nowrap"
                    onClick={() => setTriggerFilter("all")}
                  >
                    Clear trigger filter
                  </button>
                )}
              </div>

              {/* Trigger filter pills (visible when there are >1 trigger types) */}
              {availableTriggers.length > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trigger:</span>
                  <button
                    className={cn("px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", triggerFilter === "all" ? "bg-primary text-primary-foreground" : "glass-button text-muted-foreground")}
                    onClick={() => setTriggerFilter("all")}
                  >
                    All
                  </button>
                  {availableTriggers.map((trigger) => (
                    <button
                      key={trigger}
                      className={cn("px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", triggerFilter === trigger ? "bg-primary text-primary-foreground" : "glass-button text-muted-foreground")}
                      onClick={() => setTriggerFilter(trigger)}
                    >
                      {trigger}
                    </button>
                  ))}
                </div>
              )}

              {/* Workflow list */}
              <div className="grid gap-3">
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="glass-panel p-6 rounded-2xl h-24 animate-pulse glass-border" />
                  ))
                ) : error ? (
                  <div className="glass-panel rounded-2xl p-10 glass-border text-center">
                    <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-foreground">Failed to load workflows</h4>
                    <p className="text-xs text-muted-foreground mt-1">Try refreshing the page.</p>
                    <button
                      className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
                      onClick={() => mutate()}
                    >
                      Retry
                    </button>
                  </div>
                ) : filteredWorkflows.length === 0 ? (
                  <div className="glass-panel rounded-2xl p-10 glass-border text-center">
                    <Workflow className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-foreground">No workflows yet</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                      Create your first workflow or start from a template.
                    </p>
                    <button
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest"
                      onClick={() => openBuilder()}
                    >
                      New Workflow
                    </button>
                  </div>
                ) : (
                  filteredWorkflows.map((workflow: WorkflowData) => {
                    const Icon = ICON_MAP[workflow.icon] || Workflow
                    const isRunning = runBusyId === workflow.id
                    return (
                      <button
                        key={workflow.id}
                        className="glass-panel p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 group hover:bg-[var(--surface)] transition-all glass-border text-left w-full"
                        onClick={() => setSelectedWorkflow(workflow)}
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
                              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {workflow.trigger}</span>
                              {workflow.lastRun && (
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {workflow.lastRun}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            className={cn(
                              "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5",
                              isRunning
                                ? "glass-button text-muted-foreground opacity-60 pointer-events-none"
                                : "glass-button text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => handleStartRun(workflow)}
                          >
                            <Play className="w-3 h-3" />
                            {isRunning ? "Running…" : "Run"}
                          </button>
                          <button
                            className="px-3 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:text-foreground transition-all flex items-center gap-1.5"
                            onClick={() => openBuilderForWorkflow(workflow)}
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
          )}

          {/* ══════════════════════════════════════════════════════
              TEMPLATES TAB
              ══════════════════════════════════════════════════════ */}
          {tab === "templates" && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {(["all", "Evidence", "Reporting", "Gaps"] as const).map((category) => (
                  <button
                    key={category}
                    onClick={() => setTemplateFilter(category)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                      templateFilter === category ? "bg-primary text-primary-foreground" : "glass-button text-muted-foreground"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {filteredTemplates.length === 0 ? (
                  <div className="glass-panel rounded-2xl p-10 glass-border text-center md:col-span-3">
                    <Layers className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-foreground">No templates in this category</h4>
                  </div>
                ) : (
                  filteredTemplates.map((tpl) => (
                    <div key={tpl.id} className="glass-panel rounded-3xl p-6 glass-border relative overflow-hidden flex flex-col">
                      <div className={`absolute inset-0 bg-gradient-to-br ${tpl.glow} opacity-60 pointer-events-none`} />
                      <div className="relative z-10 flex-1">
                        <div className="w-11 h-11 rounded-2xl glass-input flex items-center justify-center mb-4">
                          <tpl.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{tpl.category}</div>
                        <h3 className="text-base font-bold text-foreground">{tpl.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">{tpl.description}</p>
                        {/* Step summary */}
                        <div className="space-y-1.5 mb-5">
                          {tpl.steps.map((step, i) => (
                            <div key={step.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="w-4 h-4 rounded-full border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] flex items-center justify-center text-[8px] font-bold shrink-0">{i + 1}</span>
                              <span className="font-semibold text-foreground">{step.label}</span>
                              <span className="text-muted-foreground">— {step.detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="relative z-10 flex items-center gap-2">
                        <button
                          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
                          onClick={() => openBuilder(tpl)}
                        >
                          Use Template
                        </button>
                        <button
                          className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest"
                          onClick={() => setTemplatePreview(tpl)}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              RUN HISTORY TAB
              ══════════════════════════════════════════════════════ */}
          {tab === "runs" && (
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
                  <h3 className="text-base font-bold text-foreground">Run History</h3>
                  <p className="text-sm text-muted-foreground">All workflow executions, most recent first.</p>
                </div>
                <button
                  className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 hover:text-foreground transition-colors border border-[var(--glass-border)]"
                  onClick={handleExportLogs}
                >
                  Export CSV
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid gap-2">
                {runsLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="glass-panel rounded-2xl h-16 animate-pulse glass-border" />
                  ))
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
                    <p className="text-xs text-muted-foreground mt-1">Runs appear once workflows start executing.</p>
                  </div>
                ) : (
                  workflowRuns.map((run) => (
                    <button
                      key={run.id}
                      className="glass-panel rounded-2xl p-4 glass-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-[var(--surface)] transition-all w-full group"
                      onClick={() => setSelectedRun(run)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl glass-input flex items-center justify-center shrink-0">
                          <Activity className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-foreground">{run.workflowName}</div>
                          <div className="text-[10px] text-muted-foreground">{formatTime(run.startedAt)} · via {run.trigger}</div>
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
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          WORKFLOW DETAILS DRAWER
          ══════════════════════════════════════════════════════════ */}
      {selectedWorkflow && (
        <div className="fixed inset-0 z-[70] flex items-center justify-end">
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedWorkflow(null)}
            aria-label="Close workflow details"
          />
          <div className="relative w-full max-w-[520px] h-full glass-panel glass-border p-6 overflow-y-auto flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest mb-2", statusBadgeClass(selectedWorkflow.status))}>
                  {statusLabel(selectedWorkflow.status)}
                </span>
                <h3 className="text-lg font-bold text-foreground">{selectedWorkflow.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedWorkflow.description}</p>
              </div>
              <button className="p-2 rounded-lg glass-button shrink-0" onClick={() => setSelectedWorkflow(null)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Trigger info */}
            <div className="glass-panel p-4 rounded-2xl glass-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Trigger</div>
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Zap className="w-4 h-4 text-primary" />
                {selectedWorkflow.trigger}
              </div>
              {selectedWorkflow.lastRun && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Last run: {selectedWorkflow.lastRun}
                </div>
              )}
            </div>

            {/* Recent runs for this workflow */}
            <div className="glass-panel p-4 rounded-2xl glass-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Recent Runs
              </div>
              {selectedWorkflowRuns.length === 0 ? (
                <p className="text-xs text-muted-foreground">No runs recorded for this workflow yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedWorkflowRuns.map((run) => (
                    <button
                      key={run.id}
                      className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl glass-button hover:bg-[var(--surface)] transition-all text-left"
                      onClick={() => { setSelectedRun(run); setSelectedWorkflow(null) }}
                    >
                      <div>
                        <div className="text-xs font-semibold text-foreground">{formatTime(run.startedAt)}</div>
                        <div className="text-[10px] text-muted-foreground">{run.trigger} · {formatDuration(run)}</div>
                      </div>
                      <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shrink-0", runStatusClass(run.status))}>
                        {run.status}
                      </span>
                    </button>
                  ))}
                  {runsList.filter((r) => r.workflowName === selectedWorkflow.name).length > 5 && (
                    <button
                      className="text-[10px] font-bold text-primary hover:underline w-full text-left pt-1"
                      onClick={() => { setSelectedWorkflow(null); setTab("runs") }}
                    >
                      View all runs →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="glass-panel p-4 rounded-2xl glass-border">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Actions</div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                  onClick={() => { handleStartRun(selectedWorkflow); setSelectedWorkflow(null) }}
                >
                  <Play className="w-3 h-3" /> Run Now
                </button>
                {selectedWorkflow.status === "active" ? (
                  <button
                    className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:text-foreground flex items-center gap-1.5"
                    onClick={() => handleStatusUpdate(selectedWorkflow.id, "paused")}
                  >
                    <Pause className="w-3 h-3" /> Pause
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:text-foreground flex items-center gap-1.5"
                    onClick={() => handleStatusUpdate(selectedWorkflow.id, "active")}
                  >
                    <Play className="w-3 h-3" /> Enable
                  </button>
                )}
                <button
                  className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:text-foreground flex items-center gap-1.5"
                  onClick={() => { openBuilderForWorkflow(selectedWorkflow); setSelectedWorkflow(null) }}
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TEMPLATE PREVIEW MODAL
          ══════════════════════════════════════════════════════════ */}
      {templatePreview && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-6">
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setTemplatePreview(null)}
            aria-label="Close template preview"
          />
          <div className="relative w-full max-w-lg glass-panel glass-border rounded-[28px] p-6 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${templatePreview.glow} opacity-40 pointer-events-none`} />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    {templatePreview.category}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{templatePreview.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{templatePreview.description}</p>
                </div>
                <button className="p-2 rounded-lg glass-button shrink-0" onClick={() => setTemplatePreview(null)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Actual steps */}
              <div className="space-y-2 mb-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Pipeline Steps</div>
                {templatePreview.steps.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-3 glass-panel glass-border rounded-xl p-3">
                    <div className="w-7 h-7 rounded-full border border-[var(--glass-border)] bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{step.label}</div>
                      <div className="text-[10px] text-muted-foreground">{step.detail}</div>
                    </div>
                    {i < templatePreview.steps.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
                    )}
                    {i === templatePreview.steps.length - 1 && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)] ml-auto shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
                  onClick={() => { openBuilder(templatePreview); setTemplatePreview(null) }}
                >
                  Use Template
                </button>
                <button
                  className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest"
                  onClick={() => setTemplatePreview(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          RUN DETAILS MODAL
          ══════════════════════════════════════════════════════════ */}
      {selectedRun && (
        <div className="fixed inset-0 z-[78] flex items-center justify-center p-6">
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedRun(null)}
            aria-label="Close run details"
          />
          <div className="relative w-full max-w-lg glass-panel glass-border rounded-[28px] p-6 overflow-hidden">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">{selectedRun.workflowName}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Run details</p>
              </div>
              <button className="p-2 rounded-lg glass-button shrink-0" onClick={() => setSelectedRun(null)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="glass-panel glass-border rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Status</div>
                <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest", runStatusClass(selectedRun.status))}>
                  {selectedRun.status}
                </span>
              </div>
              <div className="glass-panel glass-border rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Trigger</div>
                <div className="text-sm font-semibold text-foreground">{selectedRun.trigger}</div>
              </div>
              <div className="glass-panel glass-border rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Started</div>
                <div className="text-sm font-semibold text-foreground">{formatTime(selectedRun.startedAt)}</div>
              </div>
              <div className="glass-panel glass-border rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Duration</div>
                <div className="text-sm font-semibold text-foreground">{formatDuration(selectedRun)}</div>
              </div>
              {selectedRun.startedBy && (
                <div className="glass-panel glass-border rounded-xl p-3 sm:col-span-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Started By</div>
                  <div className="text-sm font-semibold text-foreground">{selectedRun.startedBy}</div>
                </div>
              )}
            </div>

            {selectedRun.message && (
              <div className="glass-panel glass-border rounded-xl p-4 mt-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Message</div>
                <p className="text-sm text-foreground leading-relaxed">{selectedRun.message}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          WORKFLOW BUILDER MODAL
          A focused, honest form — no fake canvas.
          ══════════════════════════════════════════════════════════ */}
      {builderOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeBuilder}
            aria-label="Close workflow builder"
          />
          <div className="relative glass-panel glass-border w-full max-w-2xl rounded-[28px] overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between gap-4 p-6 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {builderWorkflowId ? "Edit Workflow" : builderTemplate ? `New from "${builderTemplate}"` : "New Workflow"}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Configure your workflow definition and trigger.
                </p>
              </div>
              <button className="p-2 rounded-lg glass-button shrink-0" onClick={closeBuilder}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Two-column layout: form + step preview */}
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)]">
              {/* Left: Config form */}
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name</label>
                  <input
                    value={builderName}
                    onChange={(e) => setBuilderName(e.target.value)}
                    placeholder="e.g. Evidence Intake Pipeline"
                    className="w-full h-10 glass-input rounded-xl px-3 text-sm text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                  <textarea
                    value={builderDescription}
                    onChange={(e) => setBuilderDescription(e.target.value)}
                    placeholder="What does this workflow do?"
                    rows={3}
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm text-foreground resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trigger</label>
                  <select
                    value={builderTrigger}
                    onChange={(e) => setBuilderTrigger(e.target.value)}
                    className="w-full h-10 glass-input rounded-xl px-3 text-sm text-foreground"
                  >
                    {["On Upload", "On Evidence Update", "On Analysis Request"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right: Step preview (updates with trigger selection) */}
              <div className="p-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Default Pipeline Steps
                </div>
                <div className="space-y-2">
                  {builderSteps.map((step, i) => (
                    <div key={step.label} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full border border-[var(--glass-border)] bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">{step.label}</div>
                        <div className="text-[10px] text-muted-foreground">{step.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
                  Steps are preconfigured for this trigger type. Full step customization is coming in a future release.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--border-subtle)]">
              <button
                className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:text-foreground"
                onClick={closeBuilder}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
                onClick={handleSaveWorkflow}
              >
                {builderWorkflowId ? "Save Changes" : "Save Workflow"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}
