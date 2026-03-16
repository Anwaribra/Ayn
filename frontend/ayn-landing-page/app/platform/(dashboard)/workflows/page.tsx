"use client"

import { useEffect, useMemo, useState } from "react"
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
  Sparkles,
  Layers,
  Shield,
  BarChart3,
  FileText,
  Timer,
  BadgeCheck,
  ArrowUpRight,
  SlidersHorizontal,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { api } from "@/lib/api"
import useSWR from "swr"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, any> = {
  Zap,
  Activity,
  Workflow,
  Clock,
}


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
}

export default function WorkflowsPage() {
  const [tab, setTab] = useState<"workflows" | "templates" | "runs">("workflows")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "draft">("all")
  const [templateFilter, setTemplateFilter] = useState<"all" | "Evidence" | "Reporting" | "Gaps">("all")
  const [builderOpen, setBuilderOpen] = useState(false)
  const [builderTemplate, setBuilderTemplate] = useState<string | null>(null)
  const [templatePreview, setTemplatePreview] = useState<WorkflowTemplate | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowData | null>(null)
  const [localWorkflows, setLocalWorkflows] = useState<WorkflowData[] | null>(null)
  const { data: workflows, isLoading, error, mutate } = useSWR<WorkflowData[]>(
    "workflows",
    () => api.getWorkflows()
  )

  useEffect(() => {
    if (workflows) {
      setLocalWorkflows(workflows)
    }
  }, [workflows])

  const workflowsList = localWorkflows ?? workflows ?? []

  const activeCount = workflowsList.filter((w: WorkflowData) => w.status === "active").length ?? 0
  const pausedCount = workflowsList.filter((w: WorkflowData) => w.status === "paused").length ?? 0
  const totalCount = workflowsList.length ?? 0

  const templates = useMemo<WorkflowTemplate[]>(
    () => [
      {
        id: "auto-tag",
        title: "Evidence Auto-Tagging",
        description: "Auto-labels new evidence uploads based on standards coverage.",
        category: "Evidence",
        icon: Shield,
        glow: "from-emerald-500/20 to-cyan-500/5",
      },
      {
        id: "weekly-summary",
        title: "Weekly Compliance Summary",
        description: "Generates a weekly digest with score deltas and alerts.",
        category: "Reporting",
        icon: BarChart3,
        glow: "from-blue-500/20 to-purple-500/10",
      },
      {
        id: "gap-watch",
        title: "Gap Watchdog",
        description: "Flags newly detected gaps and routes them to owners.",
        category: "Gaps",
        icon: FileText,
        glow: "from-amber-500/20 to-orange-500/10",
      },
    ],
    []
  )

  const runs = useMemo(
    () => [
      { id: "r1", name: "Evidence Auto-Tagging", status: "success", duration: "42s", time: "2 min ago" },
      { id: "r2", name: "Weekly Compliance Summary", status: "success", duration: "1m 12s", time: "Today 09:18" },
      { id: "r3", name: "Gap Watchdog", status: "queued", duration: "—", time: "Scheduled 18:00" },
      { id: "r4", name: "Remediation Auto-Notify", status: "failed", duration: "18s", time: "Yesterday 17:42" },
    ],
    []
  )

  const filteredWorkflows = useMemo(() => {
    const list = workflowsList
    return list.filter((w) => {
      const matchesQuery =
        !query.trim() ||
        w.name.toLowerCase().includes(query.toLowerCase()) ||
        w.description.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = statusFilter === "all" ? true : w.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [workflowsList, query, statusFilter])

  const filteredTemplates = useMemo(() => {
    if (templateFilter === "all") return templates
    return templates.filter((tpl) => tpl.category === templateFilter)
  }, [templates, templateFilter])

  const closeBuilder = () => {
    setBuilderOpen(false)
    setBuilderTemplate(null)
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

  return (
    <ProtectedRoute>
      <div className="animate-fade-in-up pb-24">
        <div className="px-4 pb-4 pt-6 md:px-6">
          <div className="glass-panel rounded-[32px] p-6 md:p-8 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/15 blur-[120px]" />
            <div className="absolute -bottom-28 -left-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-[140px]" />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                    <Sparkles className="w-3 h-3" />
                    Automation Layer
                  </div>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] text-destructive border border-destructive/30 bg-destructive/10">
                    Beta
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--text-primary)]">
                  Workflow Engine
                </h1>
                <p className="text-sm md:text-base text-muted-foreground max-w-xl">
                  Orchestrate evidence, standards, and compliance actions with auditable, AI-assisted pipelines.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-primary/10 text-primary rounded-xl font-bold text-xs border border-primary/20 hover:bg-primary/15 transition-colors"
                  title="Workflow builder (beta)"
                  onClick={() => { setBuilderTemplate(null); setBuilderOpen(true) }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Workflow
                </button>
                <button
                  className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] glass-button text-muted-foreground rounded-xl font-bold text-xs hover:text-foreground transition-colors"
                  onClick={() => setTab("templates")}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Browse Templates
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Active Pipelines", value: isLoading ? "..." : String(activeCount), icon: Play, color: "text-[var(--status-success)]" },
              { label: "Paused Workflows", value: isLoading ? "..." : String(pausedCount), icon: Pause, color: "text-[var(--status-warning)]" },
              { label: "Total Defined", value: isLoading ? "..." : String(totalCount), icon: Workflow, color: "text-primary" },
            ].map((stat, i) => (
              <div key={i} className="glass-panel p-5 rounded-2xl flex items-center gap-4 glass-border">
                <div className="w-10 h-10 rounded-xl glass-input flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="mono text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-2xl p-2 flex flex-wrap gap-2 glass-border">
            {[
              { key: "workflows", label: "My Workflows", icon: Workflow },
              { key: "templates", label: "Templates", icon: Layers },
              { key: "runs", label: "Runs", icon: Activity },
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
            <div className="ml-auto flex items-center gap-2">
              <button disabled className="px-3 py-2 rounded-xl glass-button text-muted-foreground text-[11px] font-bold uppercase tracking-widest opacity-60">
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {tab === "workflows" && (
            <div className="space-y-6">
              <div className="glass-panel rounded-2xl p-4 glass-border flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
                <div className="flex-1">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search workflows..."
                    className="w-full h-11 glass-input rounded-xl px-4 text-sm text-foreground"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(["all", "active", "paused", "draft"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        statusFilter === status ? "bg-primary text-primary-foreground shadow-lg" : "glass-button text-muted-foreground"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  { title: "Automation Builder", body: "Design workflows with drag-and-drop blocks and AI-assisted recommendations.", icon: Layers },
                  { title: "Policy Gate", body: "Enforce approval gates before any compliance action is executed.", icon: Shield },
                  { title: "Run Intelligence", body: "Track performance, latency, and failures across every pipeline.", icon: BarChart3 },
                ].map((card, i) => (
                  <div key={i} className="glass-panel rounded-2xl p-5 glass-border">
                    <div className="w-10 h-10 rounded-xl glass-input flex items-center justify-center mb-4">
                      <card.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">{card.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{card.body}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">System Pipelines</h3>
                  <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                </div>

                <div className="grid gap-3">
                  {isLoading ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="glass-panel p-6 rounded-2xl h-24 animate-pulse glass-border" />
                    ))
                  ) : error ? (
                    <div className="glass-panel rounded-2xl p-10 glass-border text-center">
                      <div className="w-12 h-12 rounded-2xl glass-input flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground">Failed to load workflows</h4>
                      <p className="text-xs text-muted-foreground mt-2">
                        Try refreshing the page or check back in a moment.
                      </p>
                      <button
                        className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
                        onClick={() => mutate()}
                      >
                        Retry
                      </button>
                    </div>
                  ) : filteredWorkflows.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-10 glass-border text-center">
                      <div className="w-12 h-12 rounded-2xl glass-input flex items-center justify-center mx-auto mb-4">
                        <Workflow className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground">No workflows yet</h4>
                      <p className="text-xs text-muted-foreground mt-2">
                        Create your first automation to start orchestrating compliance tasks.
                      </p>
                    </div>
                  ) : (
                    filteredWorkflows.map((workflow: WorkflowData) => {
                      const Icon = ICON_MAP[workflow.icon] || Workflow
                      return (
                        <div
                          key={workflow.id}
                          className="glass-panel p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 group hover:bg-[var(--surface)] transition-all glass-border"
                        >
                          <div className="flex items-start gap-5">
                            <div className={`w-12 h-12 rounded-xl ${workflow.bg} flex items-center justify-center flex-shrink-0 border border-white/5`}>
                              <Icon className={`h-5 w-5 ${workflow.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-base font-bold text-[var(--text-primary)]">{workflow.name}</h4>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${workflow.status === "active" ? "status-success" : workflow.status === "paused" ? "status-warning" : "glass-button text-muted-foreground"}`}>
                                  {workflow.status}
                                </span>
                              </div>
                              <p className="text-sm text-[var(--text-secondary)] font-medium">{workflow.description}</p>
                              <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                <Timer className="w-3.5 h-3.5" />
                                Next run in 4 hours
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                            <div className="flex flex-col lg:items-end gap-1 min-w-0 lg:min-w-[120px]">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trigger</div>
                              <div className="text-xs font-bold text-[var(--text-secondary)]">{workflow.trigger}</div>
                            </div>
                            <div className="flex flex-col lg:items-end gap-1 min-w-0 lg:min-w-[120px]">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Last Run</div>
                              <div className="text-xs font-bold text-[var(--text-secondary)]">{workflow.lastRun}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                className="px-3 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                                onClick={() => handleStatusUpdate(workflow.id, "active")}
                              >
                                <Play className="w-3.5 h-3.5" />
                                Run
                              </button>
                              <button
                                className="px-3 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                                onClick={() => handleStatusUpdate(workflow.id, "paused")}
                              >
                                <Pause className="w-3.5 h-3.5" />
                                Pause
                              </button>
                              <button
                                className="px-3 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                                onClick={() => { setBuilderTemplate(workflow.name); setBuilderOpen(true) }}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => setSelectedWorkflow(workflow)}
                                className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2"
                              >
                                View Details
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-6 glass-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl glass-input flex items-center justify-center">
                    <Layers className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Workflow Builder Preview</h3>
                    <p className="text-sm text-muted-foreground">Visualize the pipeline before activation.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-5">
                  {[
                    { label: "Trigger", sub: "Evidence Intake" },
                    { label: "Analyze", sub: "Horus Match" },
                    { label: "Gate", sub: "Approval" },
                    { label: "Notify", sub: "Owner Alert" },
                    { label: "Publish", sub: "Compliance Log" },
                  ].map((node, idx) => (
                    <div key={node.label} className="relative">
                      <div className="glass-panel rounded-2xl p-4 glass-border text-center">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{node.label}</div>
                        <div className="text-sm font-semibold text-foreground mt-1">{node.sub}</div>
                      </div>
                      {idx < 4 && (
                        <div className="hidden md:block absolute right-[-14px] top-1/2 h-px w-7 bg-[var(--border-subtle)]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "templates" && (
            <div className="space-y-6">
              <div className="glass-panel rounded-2xl p-3 glass-border flex flex-wrap gap-2">
                {(["all", "Evidence", "Reporting", "Gaps"] as const).map((category) => (
                  <button
                    key={category}
                    onClick={() => setTemplateFilter(category)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                      templateFilter === category ? "bg-primary text-primary-foreground shadow-lg" : "glass-button text-muted-foreground"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {filteredTemplates.length === 0 ? (
                  <div className="glass-panel rounded-2xl p-10 glass-border text-center md:col-span-3">
                    <div className="w-12 h-12 rounded-2xl glass-input flex items-center justify-center mx-auto mb-4">
                      <Layers className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">No templates found</h4>
                    <p className="text-xs text-muted-foreground mt-2">Try another category.</p>
                  </div>
                ) : (
                  filteredTemplates.map((tpl) => (
                    <div key={tpl.id} className="glass-panel rounded-3xl p-6 glass-border relative overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${tpl.glow} opacity-60`} />
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl glass-input flex items-center justify-center mb-4">
                          <tpl.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{tpl.category}</div>
                        <h3 className="text-lg font-bold text-foreground">{tpl.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2">{tpl.description}</p>
                        <div className="mt-5 flex items-center gap-2">
                          <button
                            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest"
                            onClick={() => { setBuilderTemplate(tpl.title); setBuilderOpen(true) }}
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
                    </div>
                  ))
                )}
              </div>

              <div className="glass-panel rounded-3xl p-6 glass-border">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl glass-input flex items-center justify-center">
                    <BadgeCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Governance-Ready Templates</h3>
                    <p className="text-sm text-muted-foreground">Pre-approved blocks that match accreditation workflows.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Evidence Intake", "Gap Review", "Remediation Approval", "Audit Snapshot"].map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full glass-pill text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "runs" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "Success Rate", value: "94%", icon: BadgeCheck, color: "text-[var(--status-success)]" },
                  { label: "Avg Duration", value: "52s", icon: Timer, color: "text-primary" },
                  { label: "Failed Runs", value: "2", icon: Shield, color: "text-[var(--status-critical)]" },
                ].map((stat) => (
                  <div key={stat.label} className="glass-panel rounded-2xl p-5 glass-border flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl glass-input flex items-center justify-center">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="glass-panel rounded-2xl p-5 glass-border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Run History</h3>
                  <p className="text-sm text-muted-foreground">Audit every pipeline execution with searchable logs.</p>
                </div>
                <button disabled className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[11px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                  Export Logs
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid gap-3">
                {runs.length === 0 ? (
                  <div className="glass-panel rounded-2xl p-10 glass-border text-center">
                    <div className="w-12 h-12 rounded-2xl glass-input flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">No runs yet</h4>
                    <p className="text-xs text-muted-foreground mt-2">Runs will appear once workflows start executing.</p>
                  </div>
                ) : (
                  runs.map((run) => (
                    <div key={run.id} className="glass-panel rounded-2xl p-5 glass-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl glass-input flex items-center justify-center">
                          <Activity className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{run.name}</h4>
                          <p className="text-[11px] text-muted-foreground">{run.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            run.status === "success" && "status-success border",
                            run.status === "failed" && "status-critical border",
                            run.status === "queued" && "status-warning border"
                          )}
                        >
                          {run.status}
                        </span>
                        <div className="text-[11px] font-bold text-muted-foreground">Duration</div>
                        <div className="text-[11px] font-bold text-foreground">{run.duration}</div>
                        <button disabled className="px-3 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">
                          View Logs
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Details Drawer */}
      {selectedWorkflow && (
        <div className="fixed inset-0 z-[70] flex items-center justify-end">
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedWorkflow(null)}
            aria-label="Close workflow details"
          />
          <div className="relative w-full max-w-[520px] h-full glass-panel glass-border p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedWorkflow.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedWorkflow.description}</p>
              </div>
              <button className="p-2 rounded-lg glass-button" onClick={() => setSelectedWorkflow(null)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="glass-panel p-4 rounded-2xl glass-border">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</div>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full status-success border text-[10px] font-bold uppercase tracking-widest">
                  {selectedWorkflow.status}
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl glass-border">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Activity</div>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Run completed", time: "2 min ago", icon: CheckCircle2, color: "text-[var(--status-success)]" },
                    { label: "Evidence linked", time: "Yesterday 19:44", icon: Activity, color: "text-primary" },
                    { label: "Approval pending", time: "Yesterday 09:12", icon: AlertTriangle, color: "text-[var(--status-warning)]" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{item.label}</div>
                        <div className="text-[10px] text-muted-foreground">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl glass-border">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actions</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="px-4 py-2 rounded-xl glass-button text-foreground text-[10px] font-bold uppercase tracking-widest"
                    onClick={() => handleStatusUpdate(selectedWorkflow.id, "active")}
                  >
                    Run Now
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl glass-button text-foreground text-[10px] font-bold uppercase tracking-widest"
                    onClick={() => handleStatusUpdate(selectedWorkflow.id, "paused")}
                  >
                    Pause
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl glass-button text-foreground text-[10px] font-bold uppercase tracking-widest"
                    onClick={() => { setBuilderTemplate(selectedWorkflow.name); setBuilderOpen(true) }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {templatePreview && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-6">
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setTemplatePreview(null)}
            aria-label="Close template preview"
          />
          <div className="relative w-full max-w-xl glass-panel glass-border rounded-[28px] p-6 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${templatePreview.glow} opacity-40`} />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {templatePreview.category}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mt-1">{templatePreview.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{templatePreview.description}</p>
                </div>
                <button className="p-2 rounded-lg glass-button" onClick={() => setTemplatePreview(null)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {["Trigger", "Action", "Gate"].map((step) => (
                  <div key={step} className="glass-panel glass-border rounded-xl p-3 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{step}</div>
                    <div className="text-sm font-semibold text-foreground mt-1">Configured</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest"
                  onClick={() => { setBuilderTemplate(templatePreview.title); setBuilderOpen(true); setTemplatePreview(null) }}
                >
                  Use Template
                </button>
                <button className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest" onClick={() => setTemplatePreview(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Builder Modal */}
      {builderOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeBuilder}
            aria-label="Close workflow builder"
          />
          <div className="relative glass-panel glass-border w-full max-w-5xl h-[80vh] rounded-[32px] overflow-hidden flex">
            <div className="w-64 border-r border-[var(--border-subtle)] p-5 space-y-4">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Blocks</div>
              {["Trigger", "Action", "Gate", "Notify"].map((b) => (
                <div key={b} className="glass-panel glass-border rounded-xl p-3 text-sm font-semibold text-foreground">
                  {b}
                </div>
              ))}
            </div>
            <div className="flex-1 p-6 relative">
              <div className="absolute top-4 right-4">
                <button className="p-2 rounded-lg glass-button" onClick={closeBuilder}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="h-full rounded-2xl glass-panel glass-border flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-foreground">Workflow Builder</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {builderTemplate ? `Based on “${builderTemplate}”.` : "Drag blocks to create a pipeline."}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-64 border-l border-[var(--border-subtle)] p-5 space-y-4">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Config</div>
              <div className="glass-panel glass-border rounded-xl p-3 text-sm text-muted-foreground">
                {builderTemplate ? "Template settings loaded. Select a block to edit." : "Select a block to edit settings."}
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}
