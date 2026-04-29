"use client"

import { useMemo, useState } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { Plus, Workflow, Activity } from "lucide-react"
import { api } from "@/lib/api"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { getDefaultWorkflowTemplates } from "@/components/platform/workflows/constants"
import type { WorkflowData, WorkflowTemplate, WorkflowRunItem } from "@/components/platform/workflows/types"
import { formatDuration, formatTime } from "@/components/platform/workflows/formatters"
import { WorkflowStatsRow } from "@/components/platform/workflows/workflow-stats-row"
import { WorkflowTemplateStrip } from "@/components/platform/workflows/workflow-template-strip"
import { WorkflowListSection } from "@/components/platform/workflows/workflow-list-section"
import { WorkflowRunsSection } from "@/components/platform/workflows/workflow-runs-section"
import { WorkflowDetailsDrawer } from "@/components/platform/workflows/workflow-details-drawer"
import { WorkflowTemplatePreviewModal } from "@/components/platform/workflows/workflow-template-preview-modal"
import { WorkflowRunDetailsModal } from "@/components/platform/workflows/workflow-run-details-modal"
import { WorkflowBuilderDialog } from "@/components/platform/workflows/workflow-builder-dialog"

export default function WorkflowsPage() {
  const [tab, setTab] = useState<"workflows" | "runs">("workflows")
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

  const templates = useMemo(() => getDefaultWorkflowTemplates(), [])

  const { data: workflows, isLoading, error, mutate } = useSWR<WorkflowData[]>(
    "workflows",
    () => api.getWorkflows(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30_000,
      shouldRetryOnError: true,
    },
  )
  const { data: workflowRuns, isLoading: runsLoading, error: runsError, mutate: mutateRuns } = useSWR<WorkflowRunItem[]>(
    "workflow-runs",
    () => api.getWorkflowRuns(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30_000,
      shouldRetryOnError: true,
    },
  )

  const workflowsList = localWorkflows ?? workflows ?? []
  const activeCount = workflowsList.filter((w: WorkflowData) => w.status === "active").length
  const pausedCount = workflowsList.filter((w: WorkflowData) => w.status === "paused").length
  const totalCount = workflowsList.length

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
      }, 0) / completed.length,
    )
    if (!avgSeconds || avgSeconds < 60) return `${avgSeconds || 1}s`
    const mins = Math.floor(avgSeconds / 60)
    const remaining = avgSeconds % 60
    return remaining ? `${mins}m ${remaining}s` : `${mins}m`
  })()

  const filteredWorkflows = useMemo(() => {
    return workflowsList.filter((w) => {
      const matchesQuery =
        !query.trim() || w.name.toLowerCase().includes(query.toLowerCase()) || w.description.toLowerCase().includes(query.toLowerCase())
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

  const selectedWorkflowRuns = useMemo(() => {
    if (!selectedWorkflow) return []
    return runsList.filter((r) => r.workflowName === selectedWorkflow.name).slice(0, 5)
  }, [selectedWorkflow, runsList])

  const runsTotalForWorkflow =
    selectedWorkflow ? runsList.filter((r) => r.workflowName === selectedWorkflow.name).length : 0

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
        template.category === "Evidence" ? "On Upload" : template.category === "Reporting" ? "On Analysis Request" : "On Evidence Update",
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
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
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
      mutateRuns()
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
        workflow.id === id ? { ...workflow, status, lastRun: status === "active" ? "Just now" : workflow.lastRun } : workflow,
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
        toast.success("Automation updated")
      } else {
        const created = await api.createWorkflowDefinition({
          name: builderName.trim(),
          description: builderDescription.trim() || "Custom workflow",
          trigger: builderTrigger,
        })
        setLocalWorkflows((prev) => [created, ...(prev ?? workflows ?? [])])
        toast.success("Automation saved as draft")
      }
      await mutate()
      closeBuilder()
    } catch {
      toast.error("Failed to save workflow")
    }
  }

  return (
    <ProtectedRoute>
      <div className="animate-fade-in-up pb-24">
        <div className="px-4 pb-4 pt-6 md:px-6">
          <div className="glass-panel rounded-[32px] p-6 md:p-8 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-28 -left-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground border border-[var(--glass-border)] bg-[var(--glass-soft-bg)]">
                    Beta
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Automation</h1>
                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                  Triggers, templates, and run history backed by your workspace—start a manual run or save a custom automation (Beta).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-primary text-primary-foreground rounded-xl font-bold text-xs shadow-[0_10px_24px_-10px_rgba(37,99,235,0.45)] hover:bg-primary/90 transition-colors"
                  onClick={() => openBuilder()}
                >
                  <Plus className="w-3.5 h-3.5" />
                  New automation
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-6">
          <WorkflowStatsRow
            activeCount={activeCount}
            pausedCount={pausedCount}
            totalCount={totalCount}
            isLoading={isLoading}
          />

          <div className="glass-panel rounded-2xl p-2 flex flex-wrap gap-2 glass-border">
            {[
              { key: "workflows" as const, label: "Automations", icon: Workflow },
              { key: "runs" as const, label: "Activity", icon: Activity },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                  tab === item.key ? "bg-primary text-primary-foreground shadow-lg" : "glass-button text-muted-foreground",
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          {tab === "workflows" && (
            <div className="space-y-8">
              <WorkflowTemplateStrip
                filteredTemplates={filteredTemplates}
                templateFilter={templateFilter}
                onFilterChange={setTemplateFilter}
                onUseTemplate={(tpl) => {
                  openBuilder(tpl)
                }}
                onPreview={setTemplatePreview}
              />
              <WorkflowListSection
                query={query}
                onQueryChange={setQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                triggerFilter={triggerFilter}
                onTriggerFilterChange={setTriggerFilter}
                availableTriggers={availableTriggers}
                isLoading={isLoading}
                error={error}
                errorDetail={error instanceof Error ? error.message : error ? String(error) : undefined}
                onRetry={() => mutate()}
                filteredWorkflows={filteredWorkflows}
                runBusyId={runBusyId}
                onSelectWorkflow={setSelectedWorkflow}
                onStartRun={handleStartRun}
                onEditWorkflow={openBuilderForWorkflow}
                onNewWorkflow={() => openBuilder()}
              />
            </div>
          )}

          {tab === "runs" && (
            <WorkflowRunsSection
              workflowRuns={workflowRuns}
              runsLoading={runsLoading}
              runsError={runsError}
              runsErrorDetail={runsError instanceof Error ? runsError.message : runsError ? String(runsError) : undefined}
              onRetryRuns={() => mutateRuns()}
              runsList={runsList}
              successRate={successRate}
              avgDuration={avgDuration}
              failedCount={failedCount}
              onExportCsv={handleExportLogs}
              onSelectRun={setSelectedRun}
            />
          )}
        </div>
      </div>

      {selectedWorkflow ? (
        <WorkflowDetailsDrawer
          workflow={selectedWorkflow}
          selectedWorkflowRuns={selectedWorkflowRuns}
          runsTotalForWorkflow={runsTotalForWorkflow}
          onClose={() => setSelectedWorkflow(null)}
          onViewAllRuns={() => {
            setSelectedWorkflow(null)
            setTab("runs")
          }}
          onStartRun={handleStartRun}
          onEdit={openBuilderForWorkflow}
          onPause={(id) => handleStatusUpdate(id, "paused")}
          onEnable={(id) => handleStatusUpdate(id, "active")}
          onOpenRun={(run) => {
            setSelectedRun(run)
            setSelectedWorkflow(null)
          }}
        />
      ) : null}

      {templatePreview ? (
        <WorkflowTemplatePreviewModal
          template={templatePreview}
          onClose={() => setTemplatePreview(null)}
          onUseTemplate={(t) => {
            openBuilder(t)
            setTemplatePreview(null)
          }}
        />
      ) : null}

      {selectedRun ? <WorkflowRunDetailsModal run={selectedRun} onClose={() => setSelectedRun(null)} /> : null}

      <WorkflowBuilderDialog
        open={builderOpen}
        builderWorkflowId={builderWorkflowId}
        builderTemplate={builderTemplate}
        builderName={builderName}
        builderDescription={builderDescription}
        builderTrigger={builderTrigger}
        onBuilderNameChange={setBuilderName}
        onBuilderDescriptionChange={setBuilderDescription}
        onBuilderTriggerChange={setBuilderTrigger}
        onClose={closeBuilder}
        onSave={handleSaveWorkflow}
      />
    </ProtectedRoute>
  )
}
