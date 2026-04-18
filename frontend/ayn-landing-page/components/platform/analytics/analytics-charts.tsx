"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts"
import { cn } from "@/lib/utils"
import { useUiLanguage } from "@/lib/ui-language-context"

/* ─── Shared Tooltip Style ────────────────────────────────────── */
const tooltipStyle = {
  backgroundColor: "var(--surface-modal)",
  borderColor: "var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  fontSize: "12px",
}
const itemStyle = { color: "var(--text-primary)", fontWeight: "bold" as const }
const labelStyle = { color: "var(--text-secondary)", fontSize: "11px", marginBottom: "4px" }

const PALETTE = ["#2563eb", "#0d9668", "#7c5ce0", "#b45309", "#c9424a", "#06b6d4", "#f59e0b", "#ec4899"]

function ChartCardShell({
  children,
  title,
  subtitle,
  accentColor,
  className,
}: {
  children: React.ReactNode
  title: string
  subtitle: string
  accentColor: string
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("glass-panel relative overflow-hidden rounded-[28px] border-[var(--border-subtle)] p-5 sm:p-6 lg:p-7", className)}
    >
      <div className="absolute inset-x-0 top-0 h-px opacity-70" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
      <div className="absolute -right-10 top-0 h-28 w-28 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: accentColor }} />
      <div className="relative z-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{title}</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.16em]">{subtitle}</p>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)]" style={{ boxShadow: `0 18px 40px -28px ${accentColor}` }} />
        </div>
        {children}
      </div>
    </motion.div>
  )
}

/* ─── Trend Area Chart ────────────────────────────────────────── */
interface TrendChartProps {
  data: { date: string; score: number; standard?: string; label?: string }[]
  title: string
  subtitle: string
}

export function TrendAreaChart({ data, title, subtitle }: TrendChartProps) {
  const { isArabic } = useUiLanguage()

  const processedData = useMemo(() => {
    if (!data.length) return []
    const uniqueDates = new Set(data.map((d) => d.date))
    // Use run numbers when dates repeat (all same-day runs)
    const useRunLabels = uniqueDates.size < data.length
    return data.map((d, i) => ({
      ...d,
      xLabel: useRunLabels ? `#${i + 1}` : d.date,
      tooltip: [d.date, d.label ?? d.standard].filter(Boolean).join(" · "),
    }))
  }, [data])

  const maxVisible = 20
  const displayed = processedData.slice(-maxVisible)

  return (
    <ChartCardShell title={title} subtitle={subtitle} accentColor="#2563eb">
      {!displayed.length ? (
        <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
          {isArabic ? "لا توجد بيانات كافية بعد" : "No data yet"}
        </div>
      ) : (
        <div className="h-72 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayed} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
              <XAxis
                dataKey="xLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--text-secondary)", fontWeight: 700 }}
                dy={10}
                interval={displayed.length > 10 ? Math.floor(displayed.length / 8) : 0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--text-secondary)", fontWeight: 700 }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={itemStyle}
                labelStyle={labelStyle}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.tooltip ?? ""}
                formatter={(v) => [`${v}%`, isArabic ? "النتيجة" : "Score"]}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradientTrend)"
                dot={{ r: 3.5, fill: "#2563eb", strokeWidth: 0 }}
                activeDot={{ r: 5.5, fill: "#2563eb", stroke: "var(--surface-modal)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCardShell>
  )
}

/* ─── Distribution Bar Chart ──────────────────────────────────── */
interface DistBarProps {
  data: { name: string; value: number; fill?: string }[]
  title: string
  subtitle: string
}

export function DistributionBarChart({ data, title, subtitle }: DistBarProps) {
  const { isArabic } = useUiLanguage()
  const colored = data.map((d, i) => ({ ...d, fill: d.fill ?? PALETTE[i % PALETTE.length] }))
  return (
    <ChartCardShell title={title} subtitle={subtitle} accentColor="#7c5ce0">
      <div className="h-64 w-full -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={colored} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "var(--text-secondary)", fontWeight: 700 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--text-secondary)", fontWeight: 700 }} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} formatter={(v) => [`${v}%`, isArabic ? "النتيجة" : "Score"]} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {colored.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCardShell>
  )
}

/* ─── Donut / Pie Chart ───────────────────────────────────────── */
interface DonutProps {
  data: { name: string; value: number }[]
  title: string
  subtitle: string
}

export function DonutChart({ data, title, subtitle }: DonutProps) {
  const { isArabic } = useUiLanguage()
  const hasData = data.length > 0 && data.some((d) => d.value > 0)

  return (
    <ChartCardShell title={title} subtitle={subtitle} accentColor="#0d9668">
      {!hasData ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          {isArabic ? "لا توجد بيانات بعد" : "No data yet"}
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={data.length > 1 ? 3 : 0}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={itemStyle}
                formatter={(v, name) => [v, name]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => (
                  <span style={{ color: "var(--text-secondary)", fontSize: "11px", fontWeight: 600 }}>
                    {v}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCardShell>
  )
}

/* ─── Radar Chart ─────────────────────────────────────────────── */
interface RadarProps {
  data: { subject: string; score: number; fullMark: number }[]
  title: string
  subtitle: string
}

export function ComplianceRadar({ data, title, subtitle }: RadarProps) {
  const { isArabic } = useUiLanguage()
  return (
    <ChartCardShell title={title} subtitle={subtitle} accentColor="#06b6d4" className="flex flex-col">
      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="var(--border-subtle)" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "var(--text-secondary)", fontWeight: 700 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name={isArabic ? "النتيجة" : "Score"} dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </ChartCardShell>
  )
}

/* ─── Score Heatmap (horizontal bar breakdown) ────────────────── */
interface HeatmapItem {
  label: string
  score: number
  count: number
}

interface ScoreHeatmapProps {
  data: HeatmapItem[]
  title: string
  subtitle: string
}

export function ScoreHeatmap({ data, title, subtitle }: ScoreHeatmapProps) {
  const { isArabic } = useUiLanguage()
  const getColor = (score: number) => {
    if (score >= 80) return "#0d9668"
    if (score >= 60) return "#2563eb"
    if (score >= 40) return "#b45309"
    return "#c9424a"
  }

  return (
    <ChartCardShell title={title} subtitle={subtitle} accentColor="#f59e0b">
      <div className="space-y-5">
        {data.map((item, i) => (
          <div key={item.label} className="group rounded-2xl border border-white/8 bg-white/[0.025] px-3.5 py-3">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-foreground truncate max-w-[180px] group-hover:text-primary transition-colors">{item.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground">
                  {item.count} {isArabic ? (item.count === 1 ? "تقرير" : "تقارير") : `report${item.count !== 1 ? "s" : ""}`}
                </span>
                <span className="mono text-sm font-bold" style={{ color: getColor(item.score) }}>{item.score}%</span>
              </div>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.score}%` }}
                transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: getColor(item.score) }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCardShell>
  )
}
