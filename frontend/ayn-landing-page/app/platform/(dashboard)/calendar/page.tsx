"use client"

import { useState } from "react"
import useSWR from "swr"
import { api } from "@/lib/api"
import { Header } from "@/components/platform/header"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Plus, Check, Trash2, Clock, Flag } from "lucide-react"
import { toast } from "sonner"

interface Milestone {
  id: string
  title: string
  description?: string
  dueDate: string
  category?: string
  priority?: string
  completed?: boolean
}

const CATEGORIES = ["Audit", "Evidence", "Policy", "Training", "Review", "Other"]
const PRIORITIES = ["low", "medium", "high", "critical"]

const priorityColors: Record<string, string> = {
  low: "#3b82f6",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
}

function formatMonth(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function groupByMonth(milestones: Milestone[]): Record<string, Milestone[]> {
  const sorted = [...milestones].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )
  const groups: Record<string, Milestone[]> = {}
  for (const m of sorted) {
    const key = formatMonth(m.dueDate)
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }
  return groups
}

function MilestoneSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div
            className="h-5 w-40 rounded"
            style={{ background: "var(--surface)", opacity: 0.5 }}
          />
          {[1, 2].map((j) => (
            <div
              key={j}
              className="h-20 rounded-lg"
              style={{
                background: "var(--surface)",
                opacity: 0.3,
                animation: `pulse 1.5s ease-in-out ${(i + j) * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:.15}}`}</style>
    </div>
  )
}

export default function CalendarPage() {
  const { data: milestones, isLoading, mutate } = useSWR("milestones", () => api.getMilestones())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    category: "Other",
    priority: "medium",
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate() {
    if (!form.title.trim() || !form.dueDate) {
      toast.error("Title and due date are required")
      return
    }
    setSubmitting(true)
    try {
      await api.createMilestone({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        dueDate: form.dueDate,
        category: form.category,
        priority: form.priority,
      })
      toast.success("Milestone created")
      setForm({ title: "", description: "", dueDate: "", category: "Other", priority: "medium" })
      setDialogOpen(false)
      mutate()
    } catch (err: any) {
      toast.error(err.message || "Failed to create milestone")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleComplete(m: Milestone) {
    try {
      await api.updateMilestone(m.id, { completed: !m.completed })
      toast.success(m.completed ? "Milestone reopened" : "Milestone completed")
      mutate()
    } catch (err: any) {
      toast.error(err.message || "Failed to update milestone")
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteMilestone(id)
      toast.success("Milestone deleted")
      mutate()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete milestone")
    }
  }

  const grouped = milestones ? groupByMonth(milestones) : {}
  const isEmpty = milestones && milestones.length === 0

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Header
          title="Calendar"
          description="Track compliance milestones, deadlines, and review checkpoints."
          actions={
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Milestone
            </Button>
          }
        />

        <div className="p-4 md:p-6">
          {isLoading && <MilestoneSkeleton />}

          {isEmpty && (
            <div className="flex flex-col items-center justify-center rounded-xl py-20 glass-panel glass-border">
              <Calendar className="h-12 w-12 mb-4 opacity-30 text-foreground" />
              <p className="text-lg font-medium text-foreground">
                No milestones yet
              </p>
              <p className="text-sm mt-1 text-muted-foreground">
                Create your first milestone to get started
              </p>
              <Button
                size="sm"
                className="mt-4 gap-2"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Milestone
              </Button>
            </div>
          )}

          {!isLoading && !isEmpty && (
            <div className="space-y-8">
              {Object.entries(grouped).map(([month, items]) => (
                <div key={month}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 px-1 text-muted-foreground">
                    {month}
                  </h2>
                  <div className="space-y-2">
                    {items.map((m) => (
                      <div
                        key={m.id}
                        className="group flex items-start gap-3 rounded-lg p-4 transition-colors glass-panel glass-border"
                        style={{ opacity: m.completed ? 0.6 : 1 }}
                      >
                        <button
                          onClick={() => handleToggleComplete(m)}
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors"
                          style={{
                            borderColor: m.completed ? "#10b981" : "var(--border-subtle)",
                            background: m.completed ? "#10b981" : "transparent",
                          }}
                        >
                          {m.completed && <Check className="h-3 w-3 text-white" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-medium text-foreground"
                              style={{ textDecoration: m.completed ? "line-through" : "none" }}
                            >
                              {m.title}
                            </span>
                            {m.category && (
                              <span className="rounded-full px-2 py-0.5 text-[11px] font-medium glass-pill text-foreground">
                                {m.category}
                              </span>
                            )}
                            {m.priority && m.priority !== "medium" && (
                              <Flag
                                className="h-3.5 w-3.5"
                                style={{ color: priorityColors[m.priority] || "#888" }}
                              />
                            )}
                          </div>
                          {m.description && (
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              {m.description}
                            </p>
                          )}
                          <div
                            className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"
                          >
                            <Clock className="h-3 w-3" />
                            {formatDate(m.dueDate)}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDelete(m.id)}
                          className="shrink-0 rounded p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Milestone Dialog */}
        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl p-6 shadow-2xl glass-panel glass-border">
              <h2 className="text-lg font-semibold mb-4 text-foreground">
                New Milestone
              </h2>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ms-title" className="text-foreground">
                    Title
                  </Label>
                  <Input
                    id="ms-title"
                    placeholder="e.g. Submit evidence package"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="glass-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ms-desc" className="text-foreground">
                    Description
                  </Label>
                  <Input
                    id="ms-desc"
                    placeholder="Optional details..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="glass-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ms-date" className="text-foreground">
                    Due Date
                  </Label>
                  <Input
                    id="ms-date"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="glass-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-foreground">Category</Label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full rounded-md glass-input px-3 py-2 text-sm text-foreground"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-foreground">Priority</Label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full rounded-md glass-input px-3 py-2 text-sm text-foreground"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreate} disabled={submitting} className="gap-2">
                  {submitting ? (
                    "Creating..."
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
