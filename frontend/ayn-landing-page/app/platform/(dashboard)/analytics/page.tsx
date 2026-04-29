"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { useMemo, useState, useEffect } from "react"
import {
  Target, Download, RefreshCw,
  TrendingUp, Activity, FileText, AlertTriangle,
  Microscope, ArrowUpRight, ShieldCheck, Brain, ArrowRight, Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { EmptyState } from "@/components/platform/empty-state"
import { cn } from "@/lib/utils"
import { AnalyticsKpiCards, type KpiCardData } from "@/components/platform/analytics/analytics-kpi-cards"
import { AnalyticsInsights, type Insight } from "@/components/platform/analytics/analytics-insights"
import {
  TrendAreaChart, DistributionBarChart, DonutChart,
  ScoreHeatmap, ScoreDistributionPanel,
} from "@/components/platform/analytics/analytics-charts"
import { useUiLanguage } from "@/lib/ui-language-context"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

/* ─── Types & Constants ──────────────────────────────────────── */
type PeriodKey = "7d" | "30d" | "90d" | "all"
type HorusAnalyticsInsight = Awaited<ReturnType<typeof api.horusAnalyticsInsights>>
type HorusPageExplanation = Awaited<ReturnType<typeof api.horusExplainAnalyticsPage>>

const PERIOD_OPTIONS: { key: PeriodKey; days: number | null }[] = [
  { key: "7d", days: 7 },
  { key: "30d", days: 30 },
  { key: "90d", days: 90 },
  { key: "all", days: null },
]



async function exportAnalyticsReportPdf(params: {
  analytics: any
  periodLabel: string
  executiveSummary: string
  strongestStandard: any
  weakestStandard: any
  insights: Insight[]
  filename: string
}) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 16
  const topMargin = 18
  const contentWidth = pageWidth - marginX * 2
  const bottomLimit = pageHeight - 18
  let y = topMargin

  const ensureSpace = (needed = 12) => {
    if (y + needed <= bottomLimit) return
    doc.addPage()
    y = topMargin
  }

  const writeWrapped = (text: string, fontSize = 11, color: [number, number, number] = [71, 85, 105], lineHeight = 6) => {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(fontSize)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, contentWidth)
    lines.forEach((line: string) => {
      ensureSpace(lineHeight)
      doc.text(line, marginX, y)
      y += lineHeight
    })
  }

  const writeSectionTitle = (title: string) => {
    ensureSpace(12)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(title.toUpperCase(), marginX, y)
    y += 7
  }

  const writeMetricGrid = (items: { label: string; value: string; color: [number, number, number] }[]) => {
    const gap = 4
    const boxWidth = (contentWidth - gap * 3) / 4
    const boxHeight = 24
    ensureSpace(boxHeight + 4)

    items.forEach((item, index) => {
      const x = marginX + index * (boxWidth + gap)
      doc.setDrawColor(226, 232, 240)
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(x, y, boxWidth, boxHeight, 3, 3, "FD")

      doc.setFont("helvetica", "bold")
      doc.setFontSize(17)
      doc.setTextColor(...item.color)
      doc.text(item.value, x + 4, y + 10)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(item.label.toUpperCase(), x + 4, y + 18)
    })

    y += boxHeight + 6
  }

  const writeHighlightCard = (title: string, label: string, score: string, body: string, accent: [number, number, number], fill: [number, number, number], x: number, width: number) => {
    const startY = y
    const height = 34
    doc.setDrawColor(accent[0], accent[1], accent[2])
    doc.setFillColor(fill[0], fill[1], fill[2])
    doc.roundedRect(x, startY, width, height, 3, 3, "FD")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(...accent)
    doc.text(label.toUpperCase(), x + 4, startY + 6)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(15, 23, 42)
    doc.text(title, x + 4, startY + 13)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.setTextColor(...accent)
    doc.text(score, x + 4, startY + 22)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    doc.setTextColor(75, 85, 99)
    const bodyLines = doc.splitTextToSize(body, width - 8)
    doc.text(bodyLines.slice(0, 2), x + 4, startY + 28)
  }

  const writeTableHeader = () => {
    const columns = [
      { label: "Standard", x: marginX, width: 70 },
      { label: "Avg", x: marginX + 70, width: 18 },
      { label: "Min", x: marginX + 88, width: 18 },
      { label: "Max", x: marginX + 106, width: 18 },
      { label: "Reports", x: marginX + 124, width: 22 },
      { label: "Trend", x: marginX + 146, width: 48 },
    ]

    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.rect(marginX, y, contentWidth, 9, "FD")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    columns.forEach((column) => doc.text(column.label.toUpperCase(), column.x + 2, y + 5.8))
    y += 9
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(37, 99, 235)
  doc.text("AYN COMPLIANCE PLATFORM", marginX, y)
  y += 8

  doc.setFontSize(24)
  doc.setTextColor(15, 23, 42)
  doc.text("Analytics Report", marginX, y)
  y += 7

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text(
    `${params.periodLabel} · Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    marginX,
    y,
  )
  y += 10

  writeSectionTitle("Summary")
  writeWrapped(params.executiveSummary, 11, [30, 41, 59], 6)
  y += 2

  writeSectionTitle("Key Metrics")
  writeMetricGrid([
    {
      label: "Avg Score",
      value: `${Math.round(params.analytics.avgScore ?? 0)}%`,
      color: (params.analytics.avgScore ?? 0) >= 70 ? [13, 150, 104] : (params.analytics.avgScore ?? 0) >= 40 ? [180, 83, 9] : [201, 66, 74],
    },
    { label: "Reports", value: String(params.analytics.totalReports ?? 0), color: [37, 99, 235] },
    {
      label: "Growth",
      value: `${(params.analytics.growth?.growthPercent ?? 0) >= 0 ? "+" : ""}${params.analytics.growth?.growthPercent ?? 0}%`,
      color: (params.analytics.growth?.growthPercent ?? 0) >= 0 ? [13, 150, 104] : [201, 66, 74],
    },
    { label: "Evidence", value: String(params.analytics.totalEvidence ?? 0), color: [124, 92, 224] },
  ])

  if (params.strongestStandard || params.weakestStandard) {
    writeSectionTitle("Performance Highlights")
    ensureSpace(40)
    const cardGap = 6
    const cardWidth = (contentWidth - cardGap) / 2

    if (params.strongestStandard) {
      writeHighlightCard(
        params.strongestStandard.standardTitle,
        "Leading",
        `${Math.round(params.strongestStandard.avgScore)}%`,
        `${params.strongestStandard.reportCount} report${params.strongestStandard.reportCount !== 1 ? "s" : ""} this period`,
        [13, 150, 104],
        [240, 253, 244],
        marginX,
        cardWidth,
      )
    }

    if (params.weakestStandard) {
      writeHighlightCard(
        params.weakestStandard.standardTitle,
        "Needs Attention",
        `${Math.round(params.weakestStandard.avgScore)}%`,
        `${params.weakestStandard.reportCount} report${params.weakestStandard.reportCount !== 1 ? "s" : ""} this period`,
        [180, 83, 9],
        [255, 247, 237],
        marginX + cardWidth + cardGap,
        cardWidth,
      )
    }

    y += 40
  }

  const standards = params.analytics.standardPerformance ?? []
  if (standards.length > 0) {
    writeSectionTitle("Standards Overview")
    writeTableHeader()

    standards.forEach((standard: any, index: number) => {
      ensureSpace(8)
      if (index > 0 && y + 8 > bottomLimit) {
        doc.addPage()
        y = topMargin
        writeSectionTitle("Standards Overview")
        writeTableHeader()
      }

      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252)
        doc.rect(marginX, y, contentWidth, 8, "F")
      }

      const scoreColor: [number, number, number] =
        Math.round(standard.avgScore) >= 70 ? [13, 150, 104] : Math.round(standard.avgScore) >= 40 ? [180, 83, 9] : [201, 66, 74]

      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(30, 41, 59)
      doc.text(String(standard.standardTitle).slice(0, 34), marginX + 2, y + 5.3)

      doc.setTextColor(...scoreColor)
      doc.text(`${Math.round(standard.avgScore)}%`, marginX + 72, y + 5.3)

      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 116, 139)
      doc.text(`${Math.round(standard.minScore)}%`, marginX + 90, y + 5.3)
      doc.text(`${Math.round(standard.maxScore)}%`, marginX + 108, y + 5.3)
      doc.text(String(standard.reportCount), marginX + 126, y + 5.3)
      doc.text(String(standard.trend ?? "—").slice(0, 18), marginX + 148, y + 5.3)
      y += 8
    })

    y += 2
  }

  if (params.insights.length > 0) {
    writeSectionTitle("Insights & Recommendations")
    params.insights.forEach((insight) => {
      ensureSpace(20)
      const severityColor: [number, number, number] =
        insight.severity === "positive" ? [13, 150, 104]
        : insight.severity === "critical" ? [201, 66, 74]
        : insight.severity === "warning" ? [180, 83, 9]
        : [37, 99, 235]
      const fillColor: [number, number, number] =
        insight.severity === "positive" ? [240, 253, 244]
        : insight.severity === "critical" ? [255, 241, 242]
        : insight.severity === "warning" ? [255, 247, 237]
        : [239, 246, 255]

      doc.setFillColor(...fillColor)
      doc.setDrawColor(severityColor[0], severityColor[1], severityColor[2])
      doc.roundedRect(marginX, y, contentWidth, 18, 3, 3, "FD")

      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(...severityColor)
      doc.text((insight.severity || "Insight").toUpperCase(), marginX + 4, y + 5.5)

      doc.setFontSize(10)
      doc.setTextColor(30, 41, 59)
      doc.text(insight.title, marginX + 4, y + 10.5)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8.5)
      doc.setTextColor(75, 85, 99)
      const descLines = doc.splitTextToSize(insight.description, contentWidth - 8)
      doc.text(descLines.slice(0, 2), marginX + 4, y + 15)

      if (insight.action) {
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...severityColor)
        doc.text(`Action: ${insight.action}`, marginX + 105, y + 15)
      }

      y += 22
    })
  }

  doc.save(params.filename)
}

function HorusExplainSheet({
  open,
  onOpenChange,
  explanation,
  isLoading,
  onNavigate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  explanation: HorusPageExplanation | null
  isLoading: boolean
  onNavigate: (href: string) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="inset-y-4 right-4 h-auto w-[min(520px,calc(100vw-32px))] overflow-y-auto rounded-3xl border border-[var(--glass-border)] bg-background/96 p-0 text-foreground shadow-2xl backdrop-blur-xl">
        <SheetHeader className="border-b border-[var(--glass-border)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Explain This Page</SheetTitle>
              <p className="mt-1 text-xs text-muted-foreground">Read-only explanation from the analytics data already loaded in this page.</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 p-6">
          {isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Horus is explaining the current analytics state...
            </div>
          ) : explanation ? (
            <>
              <section>
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Summary</h3>
                <div className="space-y-2">
                  {explanation.summary.map((line) => (
                    <p key={line} className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Top 3 Problems</h3>
                <div className="space-y-2">
                  {explanation.topProblems.map((problem, index) => (
                    <div key={problem} className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                      <span className="mr-2 font-mono font-bold text-amber-400">{index + 1}</span>
                      {problem}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Impact</h3>
                <p className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  {explanation.impact}
                </p>
              </section>

              <section>
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Recommended Plan</h3>
                <div className="space-y-2">
                  {explanation.recommendedPlan.slice(0, 3).map((action, index) => (
                    <div key={action} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                      <span className="mr-2 font-mono font-bold text-emerald-400">{index + 1}</span>
                      {action}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Go Fix This</h3>
                  <span className="rounded-full border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {explanation.confidence} confidence
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {explanation.links.map((link) => (
                    <button
                      key={link.href}
                      type="button"
                      onClick={() => {
                        onNavigate(link.href)
                        onOpenChange(false)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-[var(--glass-strong-bg)]"
                    >
                      {link.label}
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <p className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-4 text-sm text-muted-foreground">
              Click “Explain this page” to generate a read-only analytics explanation.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ─── Main Export ────────────────────────────────────────────── */
export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  )
}

/* ─── Content — consumes backend /api/analytics endpoint ──── */
function AnalyticsContent() {
  const { user } = useAuth()
  const { isArabic } = useUiLanguage()
  const router = useRouter()
  const [period, setPeriod] = useState<PeriodKey>("30d")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [explainOpen, setExplainOpen] = useState(false)
  const [explainLoading, setExplainLoading] = useState(false)
  const [pageExplanation, setPageExplanation] = useState<HorusPageExplanation | null>(null)
  const copy = useMemo(() => ({
    title: isArabic ? "التحليلات" : "Analytics",
    refresh: isArabic ? "تحديث" : "Refresh",
    updated: isArabic ? "آخر تحديث" : "Updated",
    exportReport: isArabic ? "تصدير تقرير" : "Export Report",
    explainPage: isArabic ? "اشرح هذه الصفحة" : "Explain this page",
    csvTitle: isArabic ? "تنزيل البيانات الخام بصيغة CSV" : "Download raw data as CSV",
    noDataExport: isArabic ? "لا توجد بيانات للتصدير في هذه الفترة" : "No data to export for this period",
    exportedData: isArabic ? "تم تصدير بيانات التحليلات" : "Analytics data exported",
    preparingReport: isArabic ? "جارٍ إعداد تقرير التحليلات…" : "Preparing analytics report…",
    preparingDesc: isArabic ? "يتم إنشاء ملف PDF من أحدث بيانات التحليلات." : "Building a PDF from your latest analytics data.",
    exportedReport: isArabic ? "تم تصدير تقرير التحليلات" : "Analytics report exported",
    exportedReportDesc: isArabic ? "تم حفظ تقرير الـ PDF." : "Your PDF report has been saved.",
    failedExport: isArabic ? "فشل تصدير التقرير" : "Failed to export report",
    failedLoad: isArabic ? "فشل تحميل بيانات التحليلات." : "Failed to load analytics data.",
    retry: isArabic ? "إعادة المحاولة" : "Retry",
    totalReports: isArabic ? "إجمالي التقارير" : "Total Reports",
    hasData: isArabic ? "توجد بيانات" : "Has data",
    noDataYet: isArabic ? "لا توجد بيانات بعد" : "No data yet",
    avgCompliance: isArabic ? "متوسط الامتثال" : "Avg Compliance Score",
    healthy: isArabic ? "جيد" : "Healthy",
    needsWork: isArabic ? "يحتاج عملًا" : "Needs work",
    atRisk: isArabic ? "معرّض للخطر" : "At risk",
    periodGrowth: isArabic ? "النمو خلال الفترة" : "Period Growth",
    improving: isArabic ? "يتحسن" : "Improving",
    declining: isArabic ? "يتراجع" : "Declining",
    stable: isArabic ? "مستقر" : "Stable",
    evidenceCollected: isArabic ? "الأدلة المجمعة" : "Evidence Collected",
    aligned: isArabic ? "متوافق" : "aligned",
    readiness: isArabic ? "الجاهزية" : "Readiness",
    needsAttention: isArabic ? "يحتاج انتباهًا" : "Needs Attention",
    anomalies: isArabic ? "الشذوذ" : "Anomalies",
    flagged: isArabic ? "تم تمييزها" : "flagged",
    none: isArabic ? "لا يوجد" : "None",
    scoreTrend: isArabic ? "اتجاه النتيجة" : "Score Trend",
    thisPeriod: isArabic ? "هذه الفترة" : "this period",
    loadingSummary: isArabic ? "جارٍ تحميل بيانات الامتثال…" : "Loading your compliance data…",
    noReportsSummary: isArabic ? "شغّل تحليلات الفجوات لبدء تتبع الاتجاهات والنتائج والتغطية بمرور الوقت." : "Run gap analyses to start tracking compliance trends, scores, and coverage over time.",
    strongestStandard: isArabic ? "أقوى معيار" : "Strongest Standard",
    strongestDesc: (score: number, count: number) => isArabic ? `أفضل أداء في هذه الفترة بمتوسط ${score}٪ عبر ${count} ${count === 1 ? "تقرير" : "تقارير"}.` : `Leading performance this period with an average score of ${score}% across ${count} reports.`,
    weakestDesc: (score: number) => isArabic ? `أقل متوسط نتيجة في النافذة المحددة هو ${score}٪. هذا أفضل مكان للتركيز في دورة الأدلة أو التحليل التالية.` : `Lowest average score in the selected window at ${score}%. This is the best place to focus your next evidence or analysis cycle.`,
    runAnalysis: isArabic ? "تشغيل التحليل" : "Run Analysis",
    scoreOverTime: isArabic ? "النتيجة بمرور الوقت" : "Score Over Time",
    scoreOverTimeSub: isArabic ? "متوسط درجة الامتثال عبر جميع التقارير" : "Average compliance score across all reports",
    reportStatus: isArabic ? "حالة التقارير" : "Report Status",
    reportStatusSub: isArabic ? "نتائج التحليل حسب حالة الإكمال" : "Analysis results by completion state",
    standardsPerformance: isArabic ? "أداء المعايير" : "Standards Performance",
    standardsPerformanceSub: isArabic ? "متوسط النتيجة لكل معيار في هذه الفترة" : "Average score per standard this period",
    coverageRadar: isArabic ? "رادار التغطية" : "Coverage Radar",
    coverageRadarSub: isArabic ? "نتائج أعلى المعايير لديك بنظرة سريعة" : "Scores across your top standards at a glance",
    coverageByStandard: isArabic ? "التغطية حسب المعيار" : "Coverage by Standard",
    coverageByStandardSub: isArabic ? "أحدث نتيجة وعدد التقارير لكل معيار" : "Latest score and report count per standard",
    unusualReports: isArabic ? "تقارير غير معتادة" : "Unusual Reports",
    unusualReportsSub: isArabic ? "العناصر التي خرجت عن النمط المعتاد في هذا الإطار الزمني" : "Items that deviated from the normal pattern in this time window",
    noAnomalies: isArabic ? "لا توجد شذوذات في هذه الفترة." : "No anomalies detected in this period.",
    scoreDistribution: isArabic ? "توزيع النتائج" : "Score Distribution",
    scoreDistributionSub: isArabic ? "نسبة التقارير في كل نطاق من إجمالي الفترة" : "Each band’s share of reports this period (%)",
  }), [isArabic])
  const periodLabels: Record<PeriodKey, string> = useMemo(() => ({
    "7d": isArabic ? "7 أيام" : "7 Days",
    "30d": isArabic ? "30 يومًا" : "30 Days",
    "90d": isArabic ? "90 يومًا" : "90 Days",
    "all": isArabic ? "كل الوقت" : "All Time",
  }), [isArabic])

  const periodDays = PERIOD_OPTIONS.find((o) => o.key === period)?.days ?? null

  // Single backend call — all computation done server-side.
  // Key includes user.id so different users never share a cache entry.
  // revalidateOnFocus and revalidateOnReconnect are off because analytics
  // data changes only when users run analyses — not on every tab switch.
  // refreshInterval is 5 minutes; manual Refresh button covers urgent cases.
  const { data: analytics, isLoading, error, mutate } = useSWR(
    user ? [`analytics`, user.id, periodDays] : null,
    () => api.getAnalytics(periodDays),
    {
      refreshInterval: 300_000,        // 5-minute background refresh
      revalidateOnFocus: false,        // no refetch on window focus (primary fix for repeated requests)
      revalidateOnReconnect: false,    // no refetch on network reconnect
      dedupingInterval: 60_000,        // deduplicate within 1-minute window
      revalidateIfStale: false,        // don't auto-refetch on mount when data is cached
    }
  )
  const { data: horusAnalytics, mutate: mutateHorusAnalytics } = useSWR(
    user ? [`horus-analytics-insights`, user.id] : null,
    () => api.horusAnalyticsInsights(),
    {
      refreshInterval: 300_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,
      revalidateIfStale: false,
    }
  )

  useEffect(() => {
    if (analytics) setLastUpdated(new Date())
  }, [analytics])

  const refreshAnalytics = () => {
    mutate()
    mutateHorusAnalytics()
  }

  const handleExplainPage = async () => {
    if (!analytics) {
      toast.info("Analytics data is still loading.")
      return
    }
    setExplainOpen(true)
    setExplainLoading(true)
    try {
      const explanation = await api.horusExplainAnalyticsPage({
        analytics: {
          totalReports: analytics.totalReports ?? 0,
          avgScore: analytics.avgScore ?? 0,
          growth: analytics.growth ?? null,
          totalEvidence: analytics.totalEvidence ?? 0,
          alignmentPercentage: analytics.alignmentPercentage ?? 0,
          alignedCriteria: analytics.alignedCriteria ?? 0,
          totalCriteria: analytics.totalCriteria ?? 0,
          standardPerformance: analytics.standardPerformance ?? [],
          statusBreakdown: analytics.statusBreakdown ?? [],
          anomalies: analytics.anomalies ?? [],
        },
        horus: horusAnalytics
          ? {
              counts: horusAnalytics.counts,
              analysis: horusAnalytics.analysis,
              confidence: horusAnalytics.confidence,
            }
          : {},
      })
      setPageExplanation(explanation)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to explain analytics page")
    } finally {
      setExplainLoading(false)
    }
  }

  /* ════════════════════════════════════════════════════════════
     KPI CARDS (from backend-computed data)
     ════════════════════════════════════════════════════════════ */
  const kpiCards: KpiCardData[] = useMemo(() => {
    if (!analytics) return []
    const avg = analytics.avgScore ?? 0
    const growth = analytics.growth?.growthPercent ?? 0
    return [
      {
        id: "total-reports",
        label: copy.totalReports,
        value: analytics.totalReports ?? 0,
        icon: Microscope,
        color: "#2563eb",
        trend: (analytics.totalReports ?? 0) > 0 ? "up" as const : "neutral" as const,
        trendValue: (analytics.totalReports ?? 0) > 0 ? copy.hasData : copy.noDataYet,
        description: isArabic ? "تقارير تحليل الفجوات في هذه الفترة" : "Gap analysis reports in this period",
        horusInsight: horusAnalytics?.cardInsights?.["total-reports"],
      },
      {
        id: "avg-score",
        label: copy.avgCompliance,
        value: avg,
        suffix: "%",
        icon: Target,
        color: avg >= 70 ? "#0d9668" : avg >= 40 ? "#b45309" : "#c9424a",
        trend: avg >= 70 ? "up" as const : avg >= 40 ? "neutral" as const : "down" as const,
        trendValue: avg >= 70 ? copy.healthy : avg >= 40 ? copy.needsWork : copy.atRisk,
        description: isArabic ? `تفاوت النتائج: ±${analytics.stdDeviation ?? 0}٪ عبر التقارير` : `Score spread: ±${analytics.stdDeviation ?? 0}% across reports`,
        horusInsight: horusAnalytics?.cardInsights?.["avg-score"],
      },
      {
        id: "growth",
        label: copy.periodGrowth,
        value: `${growth >= 0 ? "+" : ""}${growth}`,
        suffix: "%",
        icon: TrendingUp,
        color: growth >= 0 ? "#0d9668" : "#c9424a",
        trend: growth >= 0 ? "up" as const : "down" as const,
        trendValue: analytics.growth?.direction === "up" ? copy.improving : analytics.growth?.direction === "down" ? copy.declining : copy.stable,
        description: `${analytics.growth?.previousPeriodAvg ?? 0}% → ${analytics.growth?.currentPeriodAvg ?? 0}%`,
        horusInsight: horusAnalytics?.cardInsights?.growth,
      },
      {
        id: "evidence",
        label: copy.evidenceCollected,
        value: analytics.totalEvidence ?? 0,
        icon: FileText,
        color: "#7c5ce0",
        trend: (analytics.totalEvidence ?? 0) > 0 ? "up" as const : "neutral" as const,
        trendValue: `${analytics.alignmentPercentage ?? 0}% ${copy.aligned}`,
        description: isArabic ? `${analytics.alignedCriteria ?? 0}/${analytics.totalCriteria ?? 0} معايير مغطاة` : `${analytics.alignedCriteria ?? 0}/${analytics.totalCriteria ?? 0} criteria covered`,
        horusInsight: horusAnalytics?.cardInsights?.evidence,
      },
    ]
  }, [analytics, copy, horusAnalytics, isArabic])

  /* ════════════════════════════════════════════════════════════
     CHART DATA (from backend — no client-side computation)
     ════════════════════════════════════════════════════════════ */

  // Trend data (already computed server-side)
  const trendData = useMemo(() => analytics?.scoreTrend ?? [], [analytics])

  // Standard performance → bar chart
  const standardDistribution = useMemo(
    () => (analytics?.standardPerformance ?? []).map((s: any) => ({
      name: s.standardTitle.length > 18 ? s.standardTitle.slice(0, 18) + "…" : s.standardTitle,
      value: Math.round(s.avgScore),
    })),
    [analytics]
  )

  // Status breakdown → donut chart
  const statusBreakdown = useMemo(
    () => (analytics?.statusBreakdown ?? []).filter((d: any) => d.value > 0),
    [analytics]
  )

  // Radar chart
  const radarData = useMemo(
    () => (analytics?.standardPerformance ?? []).slice(0, 6).map((s: any) => ({
      subject: s.standardTitle.length > 12 ? s.standardTitle.slice(0, 12) + "…" : s.standardTitle,
      score: Math.round(s.avgScore),
      fullMark: 100,
    })),
    [analytics]
  )

  // Heatmap data
  const heatmapData = useMemo(
    () => (analytics?.standardPerformance ?? []).map((s: any) => ({
      label: s.standardTitle,
      score: Math.round(s.avgScore),
      count: s.reportCount,
    })),
    [analytics]
  )

  // Insights (from backend)
  const insights: Insight[] = useMemo(
    () => (analytics?.insights ?? []).map((ins: any) => ({
      id: ins.id,
      title: ins.title,
      description: ins.description,
      severity: ins.severity,
      metric: ins.metric,
      action: ins.action,
    })),
    [analytics]
  )

  /* ════════════════════════════════════════════════════════════
     EXPORT
     ════════════════════════════════════════════════════════════ */


  const handleExportReport = async () => {
    if (!analytics || analytics.totalReports === 0) {
      toast.info(copy.noDataExport)
      return
    }
    const filename = `ayn-analytics-report-${period}-${new Date().toISOString().slice(0, 10)}.pdf`

    try {
      toast.loading(copy.preparingReport, {
        id: "analytics-export",
        description: copy.preparingDesc,
      })

      await exportAnalyticsReportPdf({
        analytics,
        periodLabel: periodLabels[period] ?? (isArabic ? "كل الوقت" : "All Time"),
        executiveSummary,
        strongestStandard,
        weakestStandard,
        insights,
        filename,
      })

      toast.success(copy.exportedReport, {
        id: "analytics-export",
        description: copy.exportedReportDesc,
      })
    } catch (error) {
      console.error(error)
      toast.error(copy.failedExport, {
        id: "analytics-export",
        description: error instanceof Error ? error.message : "Unknown export error",
      })
    }
  }

  const hasData = analytics && analytics.totalReports > 0

  const standardPerformance = useMemo(() => analytics?.standardPerformance ?? [], [analytics])

  const weakestStandard = useMemo(() => {
    if (!standardPerformance.length) return null
    return [...standardPerformance].sort((a: any, b: any) => a.avgScore - b.avgScore)[0]
  }, [standardPerformance])

  const strongestStandard = useMemo(() => {
    if (!standardPerformance.length) return null
    return [...standardPerformance].sort((a: any, b: any) => b.avgScore - a.avgScore)[0]
  }, [standardPerformance])

  const executiveNotes = useMemo(() => {
    if (!analytics) return []
    const growth = analytics.growth?.growthPercent ?? 0
    return [
      {
        label: copy.readiness,
        value: `${Math.round(analytics.avgScore ?? 0)}%`,
        tone: (analytics.avgScore ?? 0) >= 70 ? "text-[var(--status-success)]" : (analytics.avgScore ?? 0) >= 40 ? "text-[var(--status-warning)]" : "text-[var(--status-critical)]",
        icon: ShieldCheck,
      },
      {
        label: copy.needsAttention,
        value: weakestStandard?.standardTitle ?? "—",
        tone: "text-foreground",
        icon: AlertTriangle,
      },
      {
        label: copy.anomalies,
        value: (analytics.anomalies?.length ?? 0) > 0 ? `${analytics.anomalies.length} ${copy.flagged}` : copy.none,
        tone: (analytics.anomalies?.length ?? 0) > 0 ? "text-[var(--status-warning)]" : "text-[var(--status-success)]",
        icon: Activity,
      },
      {
        label: copy.scoreTrend,
        value: growth > 0 ? `+${growth}% ${copy.thisPeriod}` : growth < 0 ? `${growth}% ${copy.thisPeriod}` : copy.stable,
        tone:
          growth > 0
            ? "text-[var(--status-success)]"
            : growth < 0
              ? "text-orange-400 dark:text-orange-300"
              : "text-foreground/65",
        icon: TrendingUp,
      },
    ]
  }, [analytics, weakestStandard, copy])

  const executiveSummary = useMemo(() => {
    if (!analytics) return copy.loadingSummary

    const avg = Math.round(analytics.avgScore ?? 0)
    const reportCount = analytics.totalReports ?? 0
    const weakest = weakestStandard?.standardTitle ?? "your lowest-performing standard"
    const strongest = strongestStandard?.standardTitle ?? "your best-performing standard"

    if (reportCount === 0) {
      return copy.noReportsSummary
    }

    return isArabic
      ? `عبر ${reportCount} ${reportCount === 1 ? "تقرير" : "تقارير"}، متوسط درجة الامتثال لديك هو ${avg}٪. يتصدر ${strongest} الأداء، بينما يحتاج ${weakest} إلى أكبر قدر من الانتباه.`
      : `Across ${reportCount} reports, your average compliance score is ${avg}%. ${strongest} is leading, while ${weakest} needs the most attention.`
  }, [analytics, strongestStandard, weakestStandard, copy, isArabic])

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  return (
    <div className="animate-fade-in-up pb-20">
      <HorusExplainSheet
        open={explainOpen}
        onOpenChange={setExplainOpen}
        explanation={pageExplanation}
        isLoading={explainLoading}
        onNavigate={(href) => router.push(href)}
      />

      {/* ─── Header ─── */}
      <header className="mb-6 pt-4 px-4">
        <div className="relative overflow-hidden rounded-[24px] sm:rounded-[28px] glass-panel glass-border p-4 sm:p-5 lg:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_35%),radial-gradient(circle_at_78%_18%,rgba(16,185,129,0.10),transparent_26%)] pointer-events-none" />
          <div className="absolute -right-14 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-4 lg:gap-5">
            <div className={cn("min-w-0 max-w-3xl space-y-2", isArabic && "text-right")}>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
                {copy.title}
              </h1>
              <p className="max-w-2xl text-sm sm:text-[0.9375rem] text-foreground/78 leading-relaxed">
                {executiveSummary}
              </p>
            </div>

            {/* Toolbar: aligned row, strong contrast on period pills */}
            <div
              className={cn(
                "flex flex-col gap-3 border-t border-white/[0.08] pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-2",
              )}
            >
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-1 sm:gap-2">
                <div className="flex max-w-full flex-nowrap items-stretch gap-1 overflow-x-auto rounded-xl border border-white/12 bg-white/[0.05] p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setPeriod(option.key)}
                      className={cn(
                        "shrink-0 rounded-lg px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                        "h-10 min-h-[40px] inline-flex items-center justify-center",
                        period === option.key
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                          : "text-foreground/85 bg-white/[0.04] hover:bg-white/12 hover:text-foreground",
                      )}
                    >
                      {periodLabels[option.key]}
                    </button>
                  ))}
                </div>

                <div className="hidden h-8 w-px shrink-0 bg-white/12 sm:block" aria-hidden />

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={refreshAnalytics}
                    className={cn(
                      "group inline-flex h-10 min-h-[40px] shrink-0 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-3.5",
                      "text-[11px] font-semibold uppercase tracking-wide text-foreground/90 transition-colors hover:bg-white/12 hover:text-foreground",
                    )}
                  >
                    <RefreshCw
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform duration-500 group-hover:rotate-180",
                        isLoading && "animate-spin",
                      )}
                    />
                    {copy.refresh}
                  </button>
                  {lastUpdated && (
                    <span className="hidden text-[10px] font-medium text-foreground/62 tabular-nums sm:inline whitespace-nowrap">
                      {copy.updated} {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-stretch gap-2 sm:ms-auto sm:justify-end sm:ps-2">
                <button
                  type="button"
                  onClick={handleExplainPage}
                  disabled={!analytics || explainLoading}
                  className={cn(
                    "inline-flex h-10 min-h-[40px] items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4",
                    "text-[11px] font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/20",
                    "disabled:pointer-events-none disabled:opacity-40",
                  )}
                >
                  {explainLoading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4 shrink-0" />
                  )}
                  <span className="whitespace-nowrap">{copy.explainPage}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportReport}
                  disabled={!analytics || (analytics.totalReports ?? 0) === 0}
                  className={cn(
                    "inline-flex h-10 min-h-[40px] items-center justify-center gap-2 rounded-xl bg-primary px-4",
                    "text-[11px] font-semibold uppercase tracking-wide text-primary-foreground shadow-md shadow-primary/30",
                    "transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40",
                  )}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{copy.exportReport}</span>
                </button>
              </div>

              {lastUpdated && (
                <p className="w-full text-[10px] font-medium text-foreground/55 tabular-nums sm:hidden">
                  {copy.updated} {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>

          <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {executiveNotes.map((note, idx) => (
              <div 
                key={note.label} 
                className="group relative overflow-hidden rounded-[20px] border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-4 sm:p-5 transition-all hover:-translate-y-0.5 hover:bg-[var(--glass-strong-bg)]"
              >
                {/* Subtle background gradient based on index */}
                <div className={cn(
                  "absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity group-hover:opacity-[0.06]",
                  idx === 0 && "bg-gradient-to-br from-blue-500 to-transparent",
                  idx === 1 && "bg-gradient-to-br from-amber-500 to-transparent",
                  idx === 2 && "bg-gradient-to-br from-emerald-500 to-transparent",
                  idx === 3 && "bg-gradient-to-br from-purple-500 to-transparent"
                )} />
                
                <div className="relative z-10 flex min-h-[7.5rem] flex-col justify-between">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/55">
                      {note.label}
                    </p>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-background/50 group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors">
                      <note.icon className="h-4 w-4 text-primary group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  
                  <div className="min-w-0 space-y-1">
                    <p
                      className={cn(
                        "text-lg sm:text-xl font-bold tracking-tight leading-snug break-words",
                        idx === 1 && "line-clamp-5 sm:line-clamp-6",
                        note.tone,
                      )}
                    >
                      {note.value}
                    </p>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-primary/70">Live</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ─── Loading State ─── */}
      {isLoading ? (
        <div className="px-4 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-panel rounded-2xl p-5 glass-border animate-pulse">
                <div className="h-9 w-9 bg-[var(--surface)]/60 rounded-xl mb-3" />
                <div className="h-8 w-16 bg-[var(--surface)]/60 rounded mb-2" />
                <div className="h-3 w-24 bg-[var(--surface)]/50 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-panel glass-border h-80 rounded-3xl p-8 animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="mt-10 px-4">
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl glass-panel glass-border">
            <AlertTriangle className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">{copy.failedLoad}</p>
            <button type="button" onClick={refreshAnalytics} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">{copy.retry}</button>
          </div>
        </div>
      ) : !hasData ? (
        <div className="mt-20"><EmptyState type="reports" /></div>
      ) : (
        <div className="px-4 space-y-8">
          {/* ─── KPI Cards ─── */}
          <AnalyticsKpiCards cards={kpiCards} />

          {(weakestStandard || strongestStandard) && (
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {strongestStandard && (
                <div className="glass-panel glass-border rounded-[26px] p-5 sm:p-6 relative overflow-hidden">
                  <div className="absolute inset-y-0 right-0 w-32 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none" />
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--status-success)]">{copy.strongestStandard}</p>
                      <h3 className="mt-2 text-xl font-bold text-foreground">{strongestStandard.standardTitle}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {copy.strongestDesc(Math.round(strongestStandard.avgScore), strongestStandard.reportCount)}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                      <TrendingUp className="w-5 h-5 text-[var(--status-success)]" />
                    </div>
                  </div>
                </div>
              )}

              {weakestStandard && (
                <div className="glass-panel glass-border rounded-[26px] p-5 sm:p-6 relative overflow-hidden">
                  <div className="absolute inset-y-0 right-0 w-32 bg-[radial-gradient(circle_at_center,rgba(201,66,74,0.12),transparent_70%)] pointer-events-none" />
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--status-critical)]">{copy.needsAttention}</p>
                      <h3 className="mt-2 text-xl font-bold text-foreground">{weakestStandard.standardTitle}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {copy.weakestDesc(Math.round(weakestStandard.avgScore))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(
                        weakestStandard.standardId
                          ? `/platform/gap-analysis?standardId=${weakestStandard.standardId}`
                          : "/platform/gap-analysis"
                      )}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-[var(--glass-strong-bg)]"
                    >
                      {copy.runAnalysis}
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ─── Row 1: Trend + Donut ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TrendAreaChart data={trendData} title={copy.scoreOverTime} subtitle={copy.scoreOverTimeSub} />
            </div>
            <DonutChart data={statusBreakdown} title={copy.reportStatus} subtitle={copy.reportStatusSub} />
          </div>

          {/* ─── Row 2: Bar ─── */}
          <DistributionBarChart data={standardDistribution} title={copy.standardsPerformance} subtitle={copy.standardsPerformanceSub} />

          {/* ─── Row 3: Score Heatmap + Insights ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScoreHeatmap data={heatmapData} title={copy.coverageByStandard} subtitle={copy.coverageByStandardSub} />
            <AnalyticsInsights insights={insights} />
          </div>

          {/* ─── Anomalies Section ─── */}
          {analytics.anomalies && analytics.anomalies.length > 0 && (
            <section className="glass-panel glass-border relative overflow-hidden rounded-[28px] p-5 sm:p-6 lg:p-7">
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(180,83,9,0.85),transparent)] opacity-70" />
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl status-warning border flex items-center justify-center shadow-[0_18px_40px_-28px_rgba(180,83,9,0.45)]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{copy.unusualReports}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.16em]">{copy.unusualReportsSub}</p>
                </div>
              </div>
              <div className="relative z-10 space-y-3">
                {analytics.anomalies.map((anomaly: any) => (
                  <div key={anomaly.reportId} className="glass-button flex items-center gap-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-4 transition-all hover:-translate-y-0.5">
                    <div className="w-11 h-11 rounded-2xl status-warning border flex items-center justify-center shrink-0 shadow-[0_18px_34px_-28px_rgba(180,83,9,0.45)]">
                      <span className="mono text-[10px] font-bold">{Math.round(anomaly.score)}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-foreground">{anomaly.standardTitle}</h4>
                      <p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-[0.12em]">
                        {Math.abs(Math.round(anomaly.score) - Math.round(analytics.avgScore ?? 0))} points from average · {new Date(anomaly.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {analytics.scoreDistribution && (
            <ScoreDistributionPanel
              buckets={analytics.scoreDistribution}
              title={copy.scoreDistribution}
              subtitle={copy.scoreDistributionSub}
            />
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          OFF-SCREEN EXPORT REPORT PANEL
          Captured by html2canvas when user clicks "Export Report".
          Uses inline styles for reliable rendering outside of CSS scope.
          ───────────────────────────────────────────────────────────── */}
      <div
        id="analytics-export-report"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "1024px",
          backgroundColor: "#ffffff",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          color: "#0f172a",
        }}
      >
        {/* ── Report Header ── */}
        <div style={{ padding: "48px 56px 36px", borderBottom: "2px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#2563eb", margin: "0 0 10px" }}>
                Ayn Compliance Platform
              </p>
              <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.1 }}>
                Analytics Report
              </h1>
              <p style={{ fontSize: "14px", color: "#64748b", margin: "10px 0 0" }}>
                {periodLabels[period]} {isArabic ? "فترة" : "period"}
                {" · "}
                Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div style={{ width: "52px", height: "52px", backgroundColor: "#2563eb", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: "22px", fontWeight: 900 }}>A</span>
            </div>
          </div>
        </div>

        {/* ── Executive Summary ── */}
        <div style={{ padding: "28px 56px", backgroundColor: "#eff6ff", borderBottom: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#2563eb", margin: "0 0 10px" }}>
            Summary
          </p>
          <p style={{ fontSize: "15px", color: "#1e293b", lineHeight: 1.7, margin: 0 }}>
            {executiveSummary}
          </p>
        </div>

        {/* ── Key Metrics ── */}
        <div style={{ padding: "36px 56px", borderBottom: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 24px" }}>
            Key Metrics
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {[
              {
                label: "Avg Score",
                value: `${Math.round(analytics?.avgScore ?? 0)}%`,
                color: (analytics?.avgScore ?? 0) >= 70 ? "#0d9668" : (analytics?.avgScore ?? 0) >= 40 ? "#b45309" : "#c9424a",
              },
              { label: "Reports", value: String(analytics?.totalReports ?? 0), color: "#2563eb" },
              {
                label: "Growth",
                value: `${(analytics?.growth?.growthPercent ?? 0) >= 0 ? "+" : ""}${analytics?.growth?.growthPercent ?? 0}%`,
                color: (analytics?.growth?.growthPercent ?? 0) >= 0 ? "#0d9668" : "#c9424a",
              },
              { label: "Evidence Files", value: String(analytics?.totalEvidence ?? 0), color: "#7c5ce0" },
            ].map((m) => (
              <div key={m.label} style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "20px 16px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: "30px", fontWeight: 800, color: m.color, margin: 0, lineHeight: 1 }}>{m.value}</p>
                <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", margin: "8px 0 0" }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Performance Highlights ── */}
        {(strongestStandard || weakestStandard) && (
          <div style={{ padding: "36px 56px", borderBottom: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 20px" }}>
              Performance Highlights
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {strongestStandard && (
                <div style={{ backgroundColor: "#f0fdf4", borderRadius: "12px", padding: "22px 24px", border: "1px solid #bbf7d0" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#0d9668", margin: "0 0 10px" }}>Leading</p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px", lineHeight: 1.3 }}>{strongestStandard.standardTitle}</p>
                  <p style={{ fontSize: "28px", fontWeight: 800, color: "#0d9668", margin: 0 }}>{Math.round(strongestStandard.avgScore)}%</p>
                  <p style={{ fontSize: "12px", color: "#4b5563", margin: "6px 0 0" }}>{strongestStandard.reportCount} report{strongestStandard.reportCount !== 1 ? "s" : ""} this period</p>
                </div>
              )}
              {weakestStandard && (
                <div style={{ backgroundColor: "#fff7ed", borderRadius: "12px", padding: "22px 24px", border: "1px solid #fed7aa" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#b45309", margin: "0 0 10px" }}>Needs Attention</p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px", lineHeight: 1.3 }}>{weakestStandard.standardTitle}</p>
                  <p style={{ fontSize: "28px", fontWeight: 800, color: "#b45309", margin: 0 }}>{Math.round(weakestStandard.avgScore)}%</p>
                  <p style={{ fontSize: "12px", color: "#4b5563", margin: "6px 0 0" }}>{weakestStandard.reportCount} report{weakestStandard.reportCount !== 1 ? "s" : ""} this period</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Standards Overview Table ── */}
        {(analytics?.standardPerformance?.length ?? 0) > 0 && (
          <div style={{ padding: "36px 56px", borderBottom: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 20px" }}>
              Standards Overview
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  {["Standard", "Avg Score", "Min", "Max", "Reports", "Trend"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8", borderBottom: "2px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(analytics?.standardPerformance ?? []).map((s: any, i: number) => {
                  const scoreColor = Math.round(s.avgScore) >= 70 ? "#0d9668" : Math.round(s.avgScore) >= 40 ? "#b45309" : "#c9424a"
                  return (
                    <tr key={s.standardTitle} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                      <td style={{ padding: "11px 14px", fontSize: "13px", fontWeight: 600, color: "#1e293b", borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>{s.standardTitle}</td>
                      <td style={{ padding: "11px 14px", fontSize: "13px", fontWeight: 700, color: scoreColor, borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>{Math.round(s.avgScore)}%</td>
                      <td style={{ padding: "11px 14px", fontSize: "13px", color: "#64748b", borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>{Math.round(s.minScore)}%</td>
                      <td style={{ padding: "11px 14px", fontSize: "13px", color: "#64748b", borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>{Math.round(s.maxScore)}%</td>
                      <td style={{ padding: "11px 14px", fontSize: "13px", color: "#64748b", borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>{s.reportCount}</td>
                      <td style={{ padding: "11px 14px", fontSize: "13px", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{s.trend ?? "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Insights & Recommendations ── */}
        {insights.length > 0 && (
          <div style={{ padding: "36px 56px", borderBottom: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 20px" }}>
              Insights & Recommendations
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {insights.map((insight) => {
                const severityColor =
                  insight.severity === "positive" ? "#0d9668"
                  : insight.severity === "critical" ? "#c9424a"
                  : insight.severity === "warning" ? "#b45309"
                  : "#2563eb"
                const severityBg =
                  insight.severity === "positive" ? "#f0fdf4"
                  : insight.severity === "critical" ? "#fff1f2"
                  : insight.severity === "warning" ? "#fff7ed"
                  : "#eff6ff"
                return (
                  <div key={insight.id} style={{ backgroundColor: severityBg, borderRadius: "10px", padding: "18px 20px", border: `1px solid ${severityColor}33` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: severityColor }}>
                        {insight.severity === "positive" ? "Positive" : insight.severity === "critical" ? "Critical" : insight.severity === "warning" ? "Attention" : "Insight"}
                      </span>
                      {insight.metric && (
                        <span style={{ fontSize: "10px", color: "#94a3b8", backgroundColor: "#f1f5f9", borderRadius: "6px", padding: "2px 6px" }}>{insight.metric}</span>
                      )}
                    </div>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", margin: "0 0 5px" }}>{insight.title}</p>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: 1.6 }}>{insight.description}</p>
                    {insight.action && (
                      <p style={{ fontSize: "11px", fontWeight: 700, color: severityColor, margin: "10px 0 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        → {insight.action}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ padding: "24px 56px", backgroundColor: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Generated by Ayn Compliance Platform</p>
          <p style={{ fontSize: "11px", color: "#cbd5e1", margin: 0 }}>{new Date().toISOString().slice(0, 10)}</p>
        </div>
      </div>
    </div>
  )
}
