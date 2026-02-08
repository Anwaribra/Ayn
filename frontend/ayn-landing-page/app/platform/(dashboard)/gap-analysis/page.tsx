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
  Download,
  Bot,
  Zap,
  Lightbulb,
} from "lucide-react"
import type { GapAnalysis, GapItem } from "@/types/gap-analysis"
import { toast } from "sonner"
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import { cn } from "@/lib/utils"

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

const STATUS_CONFIG = {
  met: {
    label: "Met",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    ringColor: "ring-emerald-500/20",
  },
  partially_met: {
    label: "Partially Met",
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    ringColor: "ring-amber-500/20",
  },
  not_met: {
    label: "Not Met",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    ringColor: "ring-red-500/20",
  },
  no_evidence: {
    label: "No Evidence",
    icon: HelpCircle,
    color: "text-muted-foreground",
    bg: "bg-muted/30",
    border: "border-border",
    ringColor: "ring-border",
  },
}

const PRIORITY_CONFIG = {
  high: { label: "High", color: "text-red-500", bg: "bg-red-500/10" },
  medium: {
    label: "Medium",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  low: {
    label: "Low",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
}

const CHART_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6b7280"]

// ─── PDF Export ─────────────────────────────────────────────────────────────────

function exportToPDF(report: GapAnalysis) {
  const statusLabels: Record<string, string> = {
    met: "Met",
    partially_met: "Partially Met",
    not_met: "Not Met",
    no_evidence: "No Evidence",
  }

  const gapRows = report.gaps
    .map(
      (g) => `
    <tr>
      <td style="padding:10px;border:1px solid #e5e7eb">${g.criterionTitle}</td>
      <td style="padding:10px;border:1px solid #e5e7eb"><span style="padding:2px 8px;border-radius:4px;font-size:12px;background:${
        g.status === "met"
          ? "#d1fae5"
          : g.status === "partially_met"
            ? "#fef3c7"
            : g.status === "not_met"
              ? "#fee2e2"
              : "#f3f4f6"
      }">${statusLabels[g.status] || g.status}</span></td>
      <td style="padding:10px;border:1px solid #e5e7eb">${g.priority}</td>
      <td style="padding:10px;border:1px solid #e5e7eb">${g.gap || "-"}</td>
      <td style="padding:10px;border:1px solid #e5e7eb">${g.recommendation || "-"}</td>
    </tr>`,
    )
    .join("")

  const recommendations = report.recommendations
    .map((r, i) => `<li style="margin:8px 0">${r}</li>`)
    .join("")

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Gap Analysis Report - ${report.standardTitle}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1f2937; line-height: 1.6; }
        h1 { color: #111827; border-bottom: 3px solid #10b981; padding-bottom: 12px; }
        h2 { color: #374151; margin-top: 32px; }
        .meta { color: #6b7280; margin-bottom: 24px; font-size: 14px; }
        .score-card { background: linear-gradient(135deg, #f0fdf4, #ecfdf5); padding: 24px; border-radius: 12px; margin: 20px 0; text-align: center; }
        .score { font-size: 56px; font-weight: 800; color: ${report.overallScore >= 70 ? "#059669" : report.overallScore >= 40 ? "#d97706" : "#dc2626"}; }
        table { border-collapse: collapse; width: 100%; margin-top: 12px; font-size: 13px; }
        th { background: #f9fafb; padding: 10px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600; }
        .summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #10b981; }
        @media print { body { margin: 20px; } }
      </style>
    </head>
    <body>
      <h1>Gap Analysis Report</h1>
      <p class="meta">Standard: <strong>${report.standardTitle}</strong> | Generated: ${formatDate(report.createdAt)} | By Horus AI</p>
      <div class="score-card">
        <div class="score">${report.overallScore.toFixed(1)}%</div>
        <div style="color:#6b7280;font-size:14px">Overall Compliance Score</div>
      </div>
      <h2>Executive Summary</h2>
      <div class="summary">${report.summary}</div>
      <h2>Criteria Analysis</h2>
      <table>
        <thead>
          <tr><th>Criterion</th><th>Status</th><th>Priority</th><th>Gap</th><th>Recommendation</th></tr>
        </thead>
        <tbody>${gapRows}</tbody>
      </table>
      <h2>Top Recommendations</h2>
      <ol>${recommendations}</ol>
      <hr style="margin-top:40px;border-color:#e5e7eb" />
      <p style="color:#9ca3af;font-size:11px;text-align:center">Generated by Horus AI - Ayn Quality Assurance Platform</p>
    </body>
    </html>
  `

  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 500)
  }
}

// ─── Score Gauge ────────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444"
  const data = [{ value: score, fill: color }]
  return (
    <div className="relative mx-auto h-40 w-40">
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
          <span className="text-4xl font-bold tracking-tight">
            {score.toFixed(0)}
          </span>
          <span className="text-lg text-muted-foreground">%</span>
        </div>
      </div>
    </div>
  )
}

// ─── Status Distribution ────────────────────────────────────────────────────────

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
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={55}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
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
              <span className="font-semibold">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Radar Chart for Section Breakdown ──────────────────────────────────────────

function ComplianceRadar({ gaps }: { gaps: GapItem[] }) {
  // Group gaps into sections (by first word or first 20 chars of criterion title)
  const sections = gaps.reduce<Record<string, { met: number; total: number }>>(
    (acc, gap) => {
      const section =
        gap.criterionTitle.split(" ").slice(0, 2).join(" ") ||
        "General"
      if (!acc[section]) acc[section] = { met: 0, total: 0 }
      acc[section].total++
      if (gap.status === "met" || gap.status === "partially_met") {
        acc[section].met += gap.status === "met" ? 1 : 0.5
      }
      return acc
    },
    {},
  )

  const radarData = Object.entries(sections)
    .slice(0, 8)
    .map(([section, data]) => ({
      section: section.length > 15 ? section.slice(0, 15) + "..." : section,
      score: data.total > 0 ? Math.round((data.met / data.total) * 100) : 0,
      fullMark: 100,
    }))

  if (radarData.length < 3) return null

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="section"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
          />
          <Radar
            dataKey="score"
            stroke="var(--brand)"
            fill="var(--brand)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Gap Card (Color-coded) ─────────────────────────────────────────────────────

function GapCard({ gap }: { gap: GapItem }) {
  const statusConfig = STATUS_CONFIG[gap.status]
  const priorityConfig = PRIORITY_CONFIG[gap.priority]
  const StatusIcon = statusConfig.icon
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "rounded-xl border transition-all",
          statusConfig.border,
          isOpen ? "shadow-sm" : "",
        )}
      >
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent/30">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                statusConfig.bg,
              )}
            >
              <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {gap.criterionTitle}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px]",
                    statusConfig.bg,
                    statusConfig.color,
                  )}
                >
                  {statusConfig.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    priorityConfig.bg,
                    priorityConfig.color,
                  )}
                >
                  {priorityConfig.label} Priority
                </Badge>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 border-t border-border/50 px-4 pb-4 pt-3">
            {gap.currentState && (
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Current State
                </p>
                <p className="text-sm leading-relaxed">{gap.currentState}</p>
              </div>
            )}
            {gap.gap && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                  Gap Identified
                </p>
                <p className="text-sm leading-relaxed">{gap.gap}</p>
              </div>
            )}
            {gap.recommendation && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="mb-1 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3 text-emerald-500" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                    Recommendation
                  </p>
                </div>
                <p className="text-sm leading-relaxed">
                  {gap.recommendation}
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

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
    () => api.getStandards(),
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
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to generate gap analysis",
      )
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
        description="AI-powered compliance gap analysis against quality standards"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform/dashboard" },
          { label: "Gap Analysis" },
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        {/* Generate Analysis Section */}
        <Card className="overflow-hidden border-border bg-card shadow-sm">
          <div className="border-b border-border bg-gradient-to-r from-[var(--brand)]/5 via-transparent to-purple-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand)]/20 to-purple-500/20">
                  <Bot className="h-5 w-5 text-[var(--brand)]" />
                </div>
                <div>
                  <CardTitle>Generate New Analysis</CardTitle>
                  <CardDescription>
                    Select a standard and let Horus AI analyze your compliance
                    gaps
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </div>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Select
                value={selectedStandardId}
                onValueChange={setSelectedStandardId}
              >
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
                    <Zap className="h-4 w-4" />
                    Generate Analysis
                  </>
                )}
              </Button>
            </div>
            {isGenerating && (
              <div className="mt-4 rounded-xl border border-[var(--brand)]/10 bg-[var(--brand)]/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--brand)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Horus AI is analyzing your data...
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Reviewing criteria, evidence, and assessments. This may
                      take a moment.
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
            {/* Score Header */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
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
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
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
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Standard</span>
                    <span className="font-medium">
                      {activeReport.standardTitle}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total Criteria
                    </span>
                    <span className="font-medium">
                      {activeReport.gaps.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Criteria Met</span>
                    <span className="font-medium text-emerald-500">
                      {
                        activeReport.gaps.filter((g) => g.status === "met")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Action Items</span>
                    <span className="font-medium text-amber-500">
                      {
                        activeReport.gaps.filter((g) => g.status !== "met")
                          .length
                      }
                    </span>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => exportToPDF(activeReport)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Radar Chart */}
            {activeReport.gaps.length >= 3 && (
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-5 w-5 text-[var(--brand)]" />
                    Section Coverage Radar
                  </CardTitle>
                  <CardDescription>
                    Visual breakdown of compliance across different criteria
                    sections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ComplianceRadar gaps={activeReport.gaps} />
                </CardContent>
              </Card>
            )}

            {/* Executive Summary */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {activeReport.summary}
                </p>
              </CardContent>
            </Card>

            {/* Criteria Cards */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Criteria Analysis</h2>
                  <p className="text-sm text-muted-foreground">
                    Click any criterion to see detailed analysis and
                    recommendations
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {activeReport.gaps.length} criteria
                </Badge>
              </div>
              <div className="space-y-3">
                {activeReport.gaps.map((gap, i) => (
                  <GapCard key={`${gap.criterionId}-${i}`} gap={gap} />
                ))}
              </div>
            </div>

            {/* Top Recommendations */}
            {activeReport.recommendations.length > 0 && (
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    Top Recommendations
                  </CardTitle>
                  <CardDescription>
                    Priority actions to improve compliance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeReport.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-xs font-semibold text-[var(--brand)]">
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
              <div className="py-8 text-center">
                <BarChart3 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  No gap analysis reports yet. Generate your first one above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                          report.overallScore >= 70
                            ? "bg-emerald-500/10 text-emerald-500"
                            : report.overallScore >= 40
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-red-500/10 text-red-500",
                        )}
                      >
                        <span className="text-sm font-bold">
                          {report.overallScore.toFixed(0)}%
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
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
