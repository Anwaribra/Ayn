"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts"
import { cn } from "@/lib/utils"

/* ─── Shared Tooltip Style ────────────────────────────────────── */
const tooltipStyle = {
  backgroundColor: "var(--surface-modal)",
  borderColor: "var(--border-subtle)",
  borderRadius: "12px",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  fontSize: "12px",
}
const itemStyle = { color: "var(--text-primary)", fontWeight: "bold" as const }
const labelStyle = { color: "var(--text-secondary)", fontSize: "11px", marginBottom: "4px" }

const PALETTE = ["#2563eb", "#0d9668", "#7c5ce0", "#b45309", "#c9424a", "#06b6d4", "#f59e0b", "#ec4899"]

/* ─── Trend Area Chart ────────────────────────────────────────── */
interface TrendChartProps {
  data: { date: string; score: number; standard?: string }[]
  title: string
  subtitle: string
}

export function TrendAreaChart({ data, title, subtitle }: TrendChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-panel p-8 rounded-[32px] border-[var(--border-subtle)] relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{title}</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
      <div className="h-72 w-full -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--text-secondary)", fontWeight: 700 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--text-secondary)", fontWeight: 700 }} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} formatter={(v) => [`${v}%`, "Score"]} />
            <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#gradientTrend)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

/* ─── Distribution Bar Chart ──────────────────────────────────── */
interface DistBarProps {
  data: { name: string; value: number; fill?: string }[]
  title: string
  subtitle: string
}

export function DistributionBarChart({ data, title, subtitle }: DistBarProps) {
  const colored = data.map((d, i) => ({ ...d, fill: d.fill ?? PALETTE[i % PALETTE.length] }))
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="glass-panel p-8 rounded-[32px] border-[var(--border-subtle)] relative overflow-hidden"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{title}</h3>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{subtitle}</p>
      </div>
      <div className="h-64 w-full -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={colored} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "var(--text-secondary)", fontWeight: 700 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--text-secondary)", fontWeight: 700 }} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} formatter={(v) => [`${v}%`, "Score"]} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {colored.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

/* ─── Donut / Pie Chart ───────────────────────────────────────── */
interface DonutProps {
  data: { name: string; value: number }[]
  title: string
  subtitle: string
}

export function DonutChart({ data, title, subtitle }: DonutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-panel p-8 rounded-[32px] border-[var(--border-subtle)] relative overflow-hidden flex flex-col"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{title}</h3>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{subtitle}</p>
      </div>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => (<Cell key={i} fill={PALETTE[i % PALETTE.length]} />))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} />
            <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: "11px", fontWeight: 600 }}>{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

/* ─── Radar Chart ─────────────────────────────────────────────── */
interface RadarProps {
  data: { subject: string; score: number; fullMark: number }[]
  title: string
  subtitle: string
}

export function ComplianceRadar({ data, title, subtitle }: RadarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="glass-panel p-8 rounded-[32px] border-[var(--border-subtle)] relative overflow-hidden flex flex-col"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{title}</h3>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{subtitle}</p>
      </div>
      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="var(--border-subtle)" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "var(--text-secondary)", fontWeight: 700 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Score" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
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
  const getColor = (score: number) => {
    if (score >= 80) return "#0d9668"
    if (score >= 60) return "#2563eb"
    if (score >= 40) return "#b45309"
    return "#c9424a"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-panel p-8 rounded-[32px] border-[var(--border-subtle)] relative overflow-hidden"
    >
      <div className="mb-8">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{title}</h3>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{subtitle}</p>
      </div>
      <div className="space-y-5">
        {data.map((item, i) => (
          <div key={item.label} className="group">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-foreground truncate max-w-[180px] group-hover:text-primary transition-colors">{item.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground">{item.count} report{item.count !== 1 ? "s" : ""}</span>
                <span className="mono text-sm font-bold" style={{ color: getColor(item.score) }}>{item.score}%</span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
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
    </motion.div>
  )
}
