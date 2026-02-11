"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { Header } from "@/components/platform/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Zap, Play, Pause, Settings, Plus, Workflow } from "lucide-react"

const workflows = [
  {
    id: "wf-001",
    name: "Assessment Auto-Review",
    description: "Automatically review submitted assessments and assign reviewers",
    status: "active",
    trigger: "On Assessment Submit",
    lastRun: "2 hours ago",
  },
  {
    id: "wf-002",
    name: "Evidence Sync",
    description: "Sync evidence files to cloud storage and update indices",
    status: "active",
    trigger: "Daily at 02:00",
    lastRun: "6 hours ago",
  },
  {
    id: "wf-003",
    name: "Gap Analysis Report",
    description: "Generate weekly gap analysis summary reports",
    status: "paused",
    trigger: "Weekly on Monday",
    lastRun: "5 days ago",
  },
  {
    id: "wf-004",
    name: "Notification Digest",
    description: "Send daily notification digest to inactive users",
    status: "draft",
    trigger: "Manual",
    lastRun: "Never",
  },
]

export default function WorkflowsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Header
          title="Automation Workflows"
          description="Manage automated processes and scheduled tasks"
          actions={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Workflow
            </Button>
          }
        />

        <div className="p-4 md:p-[var(--spacing-content)] space-y-6">
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/60 bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-emerald-500/10">
                    <Play className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">2</p>
                    <p className="text-sm text-muted-foreground">Active Workflows</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-amber-500/10">
                    <Pause className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">1</p>
                    <p className="text-sm text-muted-foreground">Paused</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Workflow className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">4</p>
                    <p className="text-sm text-muted-foreground">Total Workflows</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflows List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Workflows</h3>
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="border-border/60 bg-card">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{workflow.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {workflow.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={
                          workflow.status === "active"
                            ? "default"
                            : workflow.status === "paused"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {workflow.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-6">
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">Trigger:</span> {workflow.trigger}
                        </span>
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">Last run:</span> {workflow.lastRun}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
