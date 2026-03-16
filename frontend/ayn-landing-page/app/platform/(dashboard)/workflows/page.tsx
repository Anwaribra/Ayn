"use client"

import { useMemo, useState } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import {
  Zap,
  Play,
  Pause,
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

export default function WorkflowsPage() {
  const [tab, setTab] = useState<"workflows" | "templates" | "runs">("workflows")
  const { data: workflows, isLoading } = useSWR<WorkflowData[]>(
    "workflows",
    () => api.getWorkflows()
  )

  const activeCount = workflows?.filter((w: WorkflowData) => w.status === "active").length ?? 0
  const pausedCount = workflows?.filter((w: WorkflowData) => w.status === "paused").length ?? 0
  const totalCount = workflows?.length ?? 0

  const templates = useMemo(
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

  return (
    <ProtectedRoute>
      <div className="animate-fade-in-up pb-24">
        <div className="px-4 pb-4 pt-6 md:px-6">
          <div className="glass-panel rounded-[32px] p-6 md:p-8 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/15 blur-[120px]" />
            <div className="absolute -bottom-28 -left-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-[140px]" />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  <Sparkles className="w-3 h-3" />
                  Automation Layer
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
                  disabled
                  className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-primary/10 text-primary rounded-xl font-bold text-xs cursor-not-allowed opacity-60 border border-primary/20"
                  title="Workflow builder coming soon"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Workflow
                </button>
                <button
                  disabled
                  className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] glass-button text-muted-foreground rounded-xl font-bold text-xs cursor-not-allowed opacity-60"
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
                  ) : (
                    workflows?.map((workflow: WorkflowData) => {
                      const Icon = ICON_MAP[workflow.icon] || Workflow
                      return (
                        <div key={workflow.id} className="glass-panel p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 group hover:bg-[var(--surface)] transition-all glass-border">
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
                            <button className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2">
                              View Details
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "templates" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {templates.map((tpl) => (
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
                        <button disabled className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">
                          Use Template
                        </button>
                        <button disabled className="px-4 py-2 rounded-xl glass-button text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
                {runs.map((run) => (
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
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
