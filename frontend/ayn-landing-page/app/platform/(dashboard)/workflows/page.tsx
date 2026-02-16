"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { Header } from "@/components/platform/header"
import { Zap, Play, Pause, Settings, Plus, Workflow, Clock, CheckCircle2, Activity } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import useSWR from "swr"

const ICON_MAP: Record<string, any> = {
  Zap,
  Activity,
  Workflow,
  Clock
}

// Stats icons map
const STAT_ICONS = {
  Play,
  Pause,
  Workflow
}

// Define the Workflow interface locally since it matches backend response
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
  const { data: workflows, isLoading } = useSWR<WorkflowData[]>('workflows', () => api.getWorkflows())

  // Calculate stats
  const activeCount = workflows?.filter((w: WorkflowData) => w.status === 'active').length ?? 0
  const pausedCount = workflows?.filter((w: WorkflowData) => w.status === 'paused').length ?? 0
  const totalCount = workflows?.length ?? 0

  return (
    <ProtectedRoute>
      <div className="animate-fade-in-up pb-20">
        <div className="px-4 pb-2 pt-6 md:px-6 mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="px-2 py-0.5 rounded bg-zinc-800 border border-[var(--border-subtle)]">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Automation Layer</span>
                </div>
              </div>
              <h1 className="text-4xl font-black tracking-tighter italic text-[var(--text-primary)]">
                Active <span className="text-[var(--text-tertiary)] not-italic font-light">Workflows</span>
              </h1>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5">
              <Plus className="w-3.5 h-3.5" />
              New Workflow
            </button>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-8">
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Active Pipelines", value: isLoading ? "..." : String(activeCount), icon: Play, color: "text-[var(--status-success)]" },
              { label: "Paused Workflows", value: isLoading ? "..." : String(pausedCount), icon: Pause, color: "text-[var(--status-warning)]" },
              { label: "Total Defined", value: isLoading ? "..." : String(totalCount), icon: Workflow, color: "text-primary" }
            ].map((stat, i) => (
              <div key={i} className="glass-panel p-5 rounded-2xl flex items-center gap-4 border-[var(--border-subtle)]">
                <div className="w-10 h-10 rounded-xl bg-muted border border-[var(--border-subtle)] flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="mono text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Workflows List */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">System Pipelines</h3>
              <div className="h-px flex-1 bg-[var(--border-subtle)]" />
            </div>

            <div className="grid gap-3">
              {isLoading ? (
                // Skeleton
                [1, 2, 3].map((i) => (
                  <div key={i} className="glass-panel p-6 rounded-2xl h-24 animate-pulse border-[var(--border-subtle)]" />
                ))
              ) : (
                workflows?.map((workflow: WorkflowData) => {
                  const Icon = ICON_MAP[workflow.icon] || Workflow
                  return (
                    <div key={workflow.id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-[var(--surface)] transition-all border-[var(--border-subtle)]">
                      <div className="flex items-start gap-5">
                        <div className={`w-12 h-12 rounded-xl ${workflow.bg} flex items-center justify-center flex-shrink-0 border border-white/5`}>
                          <Icon className={`h-5 w-5 ${workflow.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-base font-bold text-[var(--text-primary)]">{workflow.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${workflow.status === 'active' ? 'status-success' :
                              workflow.status === 'paused' ? 'status-warning' :
                                'bg-muted text-muted-foreground border-border'
                              }`}>
                              {workflow.status}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)] font-medium">
                            {workflow.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 pl-16 md:pl-0">
                        <div className="flex flex-col md:items-end gap-1 min-w-[120px]">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trigger</div>
                          <div className="text-xs font-bold text-[var(--text-secondary)]">{workflow.trigger}</div>
                        </div>
                        <div className="flex flex-col md:items-end gap-1 min-w-[120px]">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Last Run</div>
                          <div className="text-xs font-bold text-[var(--text-secondary)]">{workflow.lastRun}</div>
                        </div>
                        <button
                          onClick={() => toast.info('Workflow configuration is locked by admin policy')}
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

