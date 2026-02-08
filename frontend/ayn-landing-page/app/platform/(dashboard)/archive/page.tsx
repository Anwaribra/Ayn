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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Archive,
  ArchiveRestore,
  Trash2,
  Eye,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Calendar,
  Target,
  TrendingUp,
  Award,
  ClipboardCheck,
  Search,
  FileSearch,
  ArrowRight,
  Milestone,
} from "lucide-react"
import type { GapAnalysis, GapItem } from "@/types/gap-analysis"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts"

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateTime(dateStr: string): string {
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
  met: { label: "Met", icon: CheckCircle2, color: "text-emerald-500" },
  partially_met: {
    label: "Partially Met",
    icon: AlertTriangle,
    color: "text-amber-500",
  },
  not_met: { label: "Not Met", icon: XCircle, color: "text-red-500" },
  no_evidence: {
    label: "No Evidence",
    icon: HelpCircle,
    color: "text-muted-foreground",
  },
}

function getScoreColor(score: number) {
  if (score >= 70) return "text-emerald-500"
  if (score >= 40) return "text-amber-500"
  return "text-red-500"
}

function getScoreBg(score: number) {
  if (score >= 70) return "bg-emerald-500/10"
  if (score >= 40) return "bg-amber-500/10"
  return "bg-red-500/10"
}

function getScoreDotColor(score: number) {
  if (score >= 70) return "bg-emerald-500"
  if (score >= 40) return "bg-amber-500"
  return "bg-red-500"
}

// ─── PDF Export ──────────────────────────────────────────────────────────────────

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
    .map((r) => `<li style="margin:8px 0">${r}</li>`)
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
      <h1>Accreditation Gap Analysis Report</h1>
      <p class="meta">Standard: <strong>${report.standardTitle}</strong> | Generated: ${formatDateTime(report.createdAt)} | By Horus AI</p>
      <div class="score-card">
        <div class="score">${report.overallScore.toFixed(1)}%</div>
        <div style="color:#6b7280;font-size:14px">Overall Compliance Score</div>
      </div>
      <h2>Executive Summary</h2>
      <div class="summary">${report.summary}</div>
      <h2>Criteria Analysis</h2>
      <table>
        <thead><tr><th>Criterion</th><th>Status</th><th>Priority</th><th>Gap</th><th>Recommendation</th></tr></thead>
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

// ─── Accreditation Journey Tracker ──────────────────────────────────────────────

interface JourneyStep {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: "completed" | "current" | "upcoming"
}

function AccreditationJourney({
  reportCount,
  avgScore,
}: {
  reportCount: number
  avgScore: number
}) {
  const steps: JourneyStep[] = [
    {
      id: "self-assessment",
      label: "Self-Assessment",
      description: "Initial gap analysis",
      icon: FileSearch,
      status: reportCount > 0 ? "completed" : "current",
    },
    {
      id: "evidence",
      label: "Evidence Collection",
      description: "Upload & link evidence",
      icon: ClipboardCheck,
      status:
        reportCount > 0 && avgScore >= 30
          ? avgScore >= 60
            ? "completed"
            : "current"
          : "upcoming",
    },
    {
      id: "gap-closure",
      label: "Gap Closure",
      description: "Address findings",
      icon: Target,
      status:
        avgScore >= 60
          ? avgScore >= 80
            ? "completed"
            : "current"
          : "upcoming",
    },
    {
      id: "review",
      label: "Site Review",
      description: "External audit preparation",
      icon: Search,
      status: avgScore >= 80 ? "current" : "upcoming",
    },
    {
      id: "accredited",
      label: "Accredited",
      description: "Certification achieved",
      icon: Award,
      status: avgScore >= 95 ? "completed" : "upcoming",
    },
  ]

  return (
    <div className="flex items-center justify-between gap-2">
      {steps.map((step, i) => {
        const Icon = step.icon
        return (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center text-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                  step.status === "completed"
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                    : step.status === "current"
                      ? "bg-[var(--brand)]/10 text-[var(--brand)] ring-2 ring-[var(--brand)]/20"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {step.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <p
                className={cn(
                  "mt-2 text-[11px] font-medium",
                  step.status === "completed"
                    ? "text-emerald-500"
                    : step.status === "current"
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {step.description}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 flex-1",
                  step.status === "completed"
                    ? "bg-emerald-500"
                    : "bg-border",
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Score Trend Chart ──────────────────────────────────────────────────────────

function ScoreTrendChart({
  reports,
}: {
  reports: { createdAt: string; overallScore: number }[]
}) {
  const trendData = reports
    .slice()
    .reverse()
    .map((r) => ({
      date: formatShortDate(r.createdAt),
      score: r.overallScore,
    }))

  if (trendData.length < 2) return null

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
              fontSize: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--brand)"
            strokeWidth={2}
            dot={{ fill: "var(--brand)", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Report Detail Dialog ───────────────────────────────────────────────────────

function ReportDetailDialog({
  report,
  open,
  onOpenChange,
}: {
  report: GapAnalysis | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!report) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl",
                getScoreBg(report.overallScore),
              )}
            >
              <span
                className={cn(
                  "text-sm font-bold",
                  getScoreColor(report.overallScore),
                )}
              >
                {report.overallScore.toFixed(0)}%
              </span>
            </div>
            <div>
              <div>{report.standardTitle}</div>
              <div className="text-sm font-normal text-muted-foreground">
                {formatDateTime(report.createdAt)}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Summary */}
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Executive Summary
            </h3>
            <p className="rounded-lg bg-muted/30 p-4 text-sm leading-relaxed">
              {report.summary}
            </p>
          </div>

          {/* Criteria */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Criteria Analysis ({report.gaps.length} criteria)
            </h3>
            <div className="space-y-2">
              {report.gaps.map((gap, i) => {
                const config = STATUS_CONFIG[gap.status]
                const StatusIcon = config.icon
                return (
                  <div key={i} className="rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          className={cn("h-4 w-4", config.color)}
                        />
                        <span className="text-sm font-medium">
                          {gap.criterionTitle}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {gap.priority}
                      </Badge>
                    </div>
                    {gap.gap && (
                      <p className="text-xs text-muted-foreground">
                        <strong>Gap:</strong> {gap.gap}
                      </p>
                    )}
                    {gap.recommendation && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        <strong>Action:</strong> {gap.recommendation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Top Recommendations
              </h3>
              <ol className="space-y-2">
                {report.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-xs font-semibold text-[var(--brand)]">
                      {i + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => exportToPDF(report)}
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function ArchivePage() {
  return (
    <ProtectedRoute>
      <ArchiveContent />
    </ProtectedRoute>
  )
}

function ArchiveContent() {
  const { user } = useAuth()
  const [selectedReport, setSelectedReport] = useState<GapAnalysis | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const {
    data: archived,
    isLoading,
    mutate: mutateArchived,
  } = useSWR(user ? "archived-analyses" : null, () =>
    api.getArchivedGapAnalyses(),
  )

  const handleView = async (id: string) => {
    try {
      const report = await api.getGapAnalysis(id)
      setSelectedReport(report)
      setDetailDialogOpen(true)
    } catch {
      toast.error("Failed to load report")
    }
  }

  const handleUnarchive = async (id: string) => {
    try {
      await api.archiveGapAnalysis(id, false)
      toast.success("Report restored")
      mutateArchived()
    } catch {
      toast.error("Failed to restore report")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this archived report?")) return
    try {
      await api.deleteGapAnalysis(id)
      toast.success("Report deleted")
      mutateArchived()
    } catch {
      toast.error("Failed to delete report")
    }
  }

  const handleExport = async (id: string) => {
    try {
      const report = await api.getGapAnalysis(id)
      exportToPDF(report)
    } catch {
      toast.error("Failed to export report")
    }
  }

  const avgScore =
    archived && archived.length > 0
      ? archived.reduce((s, r) => s + r.overallScore, 0) / archived.length
      : 0

  const bestScore =
    archived && archived.length > 0
      ? Math.max(...archived.map((r) => r.overallScore))
      : 0

  const hasTrend = archived && archived.length >= 2
  const trendDirection =
    hasTrend && archived
      ? archived[0].overallScore >
        archived[archived.length - 1].overallScore
        ? "improving"
        : "declining"
      : null

  // Group by month for timeline view
  const groupedArchives = (archived ?? []).reduce<
    Record<string, typeof archived>
  >((acc, report) => {
    if (!report) return acc
    const monthKey = new Date(report.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
    if (!acc[monthKey]) acc[monthKey] = []
    acc[monthKey]!.push(report)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Accreditation Archive"
        description="Your compliance history, accreditation journey, and archived gap analysis reports"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform/dashboard" },
          { label: "Accreditation Archive" },
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        {/* Accreditation Journey Tracker */}
        <Card className="overflow-hidden border-border bg-card shadow-sm">
          <div className="border-b border-border bg-gradient-to-r from-emerald-500/5 via-transparent to-purple-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-[var(--brand)]/20">
                  <Milestone className="h-5 w-5 text-[var(--brand)]" />
                </div>
                <div>
                  <CardTitle>Accreditation Journey</CardTitle>
                  <CardDescription>
                    Track your institution&apos;s path to accreditation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </div>
          <CardContent className="pt-6">
            <AccreditationJourney
              reportCount={archived?.length ?? 0}
              avgScore={avgScore}
            />
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Archived
              </CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {archived?.length ?? 0}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Score
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className={cn("text-2xl font-bold", getScoreColor(avgScore))}>
                  {avgScore > 0 ? `${avgScore.toFixed(1)}%` : "N/A"}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Best Score
              </CardTitle>
              <Award className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div
                  className={cn(
                    "text-2xl font-bold",
                    getScoreColor(bestScore),
                  )}
                >
                  {bestScore > 0 ? `${bestScore.toFixed(1)}%` : "N/A"}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trend
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div
                  className={cn(
                    "text-2xl font-bold",
                    trendDirection === "improving"
                      ? "text-emerald-500"
                      : trendDirection === "declining"
                        ? "text-red-500"
                        : "text-muted-foreground",
                  )}
                >
                  {trendDirection === "improving"
                    ? "Improving"
                    : trendDirection === "declining"
                      ? "Review"
                      : "N/A"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Score Trend Chart */}
        {archived && archived.length >= 2 && (
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-[var(--brand)]" />
                Compliance Score Trend
              </CardTitle>
              <CardDescription>
                How your scores have changed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreTrendChart reports={archived} />
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {isLoading ? (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : !archived || archived.length === 0 ? (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Archive className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  No archived reports
                </h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Run a gap analysis and archive it to keep a historical record
                  of your compliance journey.
                </p>
                <Button
                  variant="outline"
                  className="mt-6 gap-2"
                  onClick={() =>
                    (window.location.href = "/platform/gap-analysis")
                  }
                >
                  <ArrowRight className="h-4 w-4" />
                  Go to Gap Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedArchives).map(([month, reports]) => (
              <div key={month}>
                <div className="mb-4 flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">{month}</h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {reports?.length}{" "}
                    {(reports?.length ?? 0) === 1 ? "report" : "reports"}
                  </Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="ml-2 space-y-3 border-l-2 border-border pl-2">
                  {reports?.map((report) => (
                    <div key={report.id} className="relative pl-6">
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          "absolute left-[-9px] top-5 h-4 w-4 rounded-full border-2 border-background",
                          getScoreBg(report.overallScore),
                        )}
                      >
                        <div
                          className={cn(
                            "absolute inset-1 rounded-full",
                            getScoreDotColor(report.overallScore),
                          )}
                        />
                      </div>

                      <Card className="border-border bg-card shadow-sm transition-colors hover:bg-muted/20">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex min-w-0 items-center gap-4">
                              <div
                                className={cn(
                                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                                  getScoreBg(report.overallScore),
                                )}
                              >
                                <span
                                  className={cn(
                                    "text-lg font-bold",
                                    getScoreColor(report.overallScore),
                                  )}
                                >
                                  {report.overallScore.toFixed(0)}%
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {report.standardTitle}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {formatDateTime(report.createdAt)}
                                </p>
                                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                  {report.summary}
                                </p>
                              </div>
                            </div>
                            <div className="ml-4 flex shrink-0 items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleView(report.id)}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleExport(report.id)}
                                title="Export PDF"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleUnarchive(report.id)}
                                title="Restore"
                              >
                                <ArchiveRestore className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(report.id)}
                                title="Delete permanently"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ReportDetailDialog
        report={selectedReport}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  )
}
