"use client"

import { useState } from "react"
import { Header } from "@/components/platform/header"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sparkles,
  Loader2,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Archive,
  Trash2,
  Eye,
  TrendingUp,
  Target,
  BarChart3,
  Clock,
} from "lucide-react"
import type { GapAnalysis, GapItem, GapAnalysisListItem } from "@/lib/types"
import { toast } from "sonner"
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const STATUS_CONFIG = {
  met: {
    label: "Met",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  partially_met: {
    label: "Partially Met",
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  not_met: {
    label: "Not Met",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  no_evidence: {
    label: "No Evidence",
    icon: HelpCircle,
    color: "text-muted-foreground",
    bg: "bg-muted/30",
    border: "border-border",
  },
}

const PRIORITY_CONFIG = {
  high: { label: "High", color: "text-red-500", bg: "bg-red-500/10" },
  medium: { label: "Medium", color: "text-amber-500", bg: "bg-amber-500/10" },
  low: { label: "Low", color: "text-emerald-500", bg: "bg-emerald-500/10" },
}

const CHART_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6b7280"]

// ─── Components ──────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const data = [{ value: score, fill: score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444" }]
  return (
    <div className="relative h-40 w-40 mx-auto">
      <ResponsiveContainer>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          startAngle={180}
          endAngle={0}
          data={data}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={10}
            background={{ fill: "hsl(var(--muted))" }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pt-2">
        <div className="text-center">
          <span className="text-3xl font-bold">{score.toFixed(0)}</span>
          <span className="text-lg text-muted-foreground">%</span>
        </div>
      </div>
    </div>
  )
}

function StatusDistribution({ gaps }: { gaps: GapItem[] }) {
  const counts = {
    met: gaps.filter((g) => g.status === "met").length,
    partially_met: gaps.filter((g) => g.status === "partially_met").length,
    not_met: gaps.filter((g) => g.status === "not_met").length,
    no_evidence: gaps.filter((g) => g.status === "no_evidence").length,
  }

  const data = [
    { name: "Met", value: counts.met },
    { name: "Partially Met", value: counts.partially_met },
    { name: "Not Met", value: counts.not_met },
    { name: "No Evidence", value: counts.no_evidence },
  ].filter((d) => d.value > 0)

  return (
    <div className="flex items-center gap-6">
      <div className="h-32 w-32">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55}>
              {data.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 text-sm">
        {Object.entries(counts).map(([status, count]) => {
          const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
          return (
            <div key={status} className="flex items-center gap-2">
              <config.icon className={`h-4 w-4 ${config.color}`} />
              <span className="text-muted-foreground">{config.label}:</span>
              <span className="font-medium">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GapRow({ gap }: { gap: GapItem }) {
  const statusConfig = STATUS_CONFIG[gap.status]
  const priorityConfig = PRIORITY_CONFIG[gap.priority]
  const StatusIcon = statusConfig.icon

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <TableRow className="cursor-pointer hover:bg-accent/50">
          <TableCell>
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 shrink-0 ${statusConfig.color}`} />
              <span className="font-medium text-sm">{gap.criterionTitle}</span>
            </div>
          </TableCell>
          <TableCell>
            <Badge className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}>
              {statusConfig.label}
            </Badge>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className={`${priorityConfig.bg} ${priorityConfig.color}`}>
              {priorityConfig.label}
            </Badge>
          </TableCell>
          <TableCell className="text-right">
            <ChevronDown className="h-4 w-4 text-muted-foreground inline-block transition-transform" />
          </TableCell>
        </TableRow>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <tr>
          <td colSpan={4} className="p-0">
            <div className="bg-muted/20 border-t border-border px-6 py-4 space-y-3">
              {gap.currentState && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Current State
                  </p>
                  <p className="text-sm">{gap.currentState}</p>
                </div>
              )}
              {gap.gap && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Gap Identified
                  </p>
                  <p className="text-sm text-amber-500">{gap.gap}</p>
                </div>
              )}
              {gap.recommendation && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Recommendation
                  </p>
                  <p className="text-sm text-emerald-500">{gap.recommendation}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function GapAnalysisPage() {
  return (
    <ProtectedRoute>
      <GapAnalysisContent />
    </ProtectedRoute>
  )
}

function GapAnalysisContent() {
  const { user } = useAuth()
  const [selectedStandardId, setSelectedStandardId] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeReport, setActiveReport] = useState<GapAnalysis | null>(null)

  const { data: standards } = useSWR(
    user ? "gap-standards" : null,
    () => api.getStandards()
  )

  const {
    data: reports,
    isLoading: reportsLoading,
    mutate: mutateReports,
  } = useSWR(user ? "gap-analyses" : null, () => api.getGapAnalyses())

  const handleGenerate = async () => {
    if (!selectedStandardId) {
      toast.error("Please select a standard first")
      return
    }

    setIsGenerating(true)
    try {
      const report = await api.generateGapAnalysis(selectedStandardId)
      setActiveReport(report)
      mutateReports()
      toast.success("Gap analysis generated successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate gap analysis")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewReport = async (id: string) => {
    try {
      const report = await api.getGapAnalysis(id)
      setActiveReport(report)
    } catch (err) {
      toast.error("Failed to load report")
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await api.archiveGapAnalysis(id)
      toast.success("Report archived")
      mutateReports()
      if (activeReport?.id === id) setActiveReport(null)
    } catch (err) {
      toast.error("Failed to archive report")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return
    try {
      await api.deleteGapAnalysis(id)
      toast.success("Report deleted")
      mutateReports()
      if (activeReport?.id === id) setActiveReport(null)
    } catch (err) {
      toast.error("Failed to delete report")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Gap Analysis"
        description="AI-powered compliance gap analysis against accreditation standards"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform/dashboard" },
          { label: "Gap Analysis" },
        ]}
      />

      <div className="p-4 md:p-[var(--spacing-content)] max-w-7xl mx-auto space-y-6">
        {/* Generate Analysis Section */}
        <Card className="border-border bg-card shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-b border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Generate New Analysis</CardTitle>
                  <CardDescription>
                    Select a standard and let Horus AI analyze your compliance gaps
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </div>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedStandardId} onValueChange={setSelectedStandardId}>
                <SelectTrigger className="sm:w-[300px]">
                  <SelectValue placeholder="Select a standard to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {standards?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleGenerate}
                disabled={!selectedStandardId || isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Analysis
                  </>
                )}
              </Button>
            </div>
            {isGenerating && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="text-sm font-medium">Horus AI is analyzing your data...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This may take a moment. Reviewing criteria, evidence, and assessments.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Report */}
        {activeReport && (
          <div className="space-y-6">
            {/* Score & Summary */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Compliance Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScoreGauge score={activeReport.overallScore} />
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusDistribution gaps={activeReport.gaps} />
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Standard</span>
                    <span className="font-medium">{activeReport.standardTitle}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Criteria</span>
                    <span className="font-medium">{activeReport.gaps.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Criteria Met</span>
                    <span className="font-medium text-emerald-500">
                      {activeReport.gaps.filter((g) => g.status === "met").length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Action Items</span>
                    <span className="font-medium text-amber-500">
                      {activeReport.gaps.filter((g) => g.status !== "met").length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Executive Summary */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{activeReport.summary}</p>
              </CardContent>
            </Card>

            {/* Criteria Table */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Criteria Analysis</CardTitle>
                <CardDescription>
                  Click on any criterion to see detailed analysis and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Criterion</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeReport.gaps.map((gap, i) => (
                        <GapRow key={`${gap.criterionId}-${i}`} gap={gap} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Top Recommendations */}
            {activeReport.recommendations.length > 0 && (
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>Top Recommendations</CardTitle>
                  <CardDescription>Priority actions to improve compliance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeReport.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {i + 1}
                        </span>
                        <p className="text-sm leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Previous Reports */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Previous Reports
            </CardTitle>
            <CardDescription>Your gap analysis history</CardDescription>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !reports || reports.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No gap analysis reports yet. Generate your first one above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          report.overallScore >= 70
                            ? "bg-emerald-500/10 text-emerald-500"
                            : report.overallScore >= 40
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        <span className="text-sm font-bold">
                          {report.overallScore.toFixed(0)}%
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {report.standardTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(report.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewReport(report.id)}
                        title="View report"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleArchive(report.id)}
                        title="Archive"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(report.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
