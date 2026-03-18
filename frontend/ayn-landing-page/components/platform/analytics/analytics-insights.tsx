"use client"

import { motion } from "framer-motion"
import { Lightbulb, AlertTriangle, TrendingUp, ShieldCheck, ArrowRight, Sparkles, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type InsightSeverity = "positive" | "warning" | "critical" | "info"

export interface Insight {
  id: string
  title: string
  description: string
  severity: InsightSeverity
  metric?: string
  action?: string
}

interface AnalyticsInsightsProps {
  insights: Insight[]
}

const SEVERITY_CONFIG: Record<InsightSeverity, { icon: LucideIcon; className: string; label: string }> = {
  positive: { icon: TrendingUp, className: "status-success", label: "Positive" },
  warning: { icon: AlertTriangle, className: "status-warning", label: "Attention" },
  critical: { icon: AlertTriangle, className: "status-critical", label: "Critical" },
  info: { icon: Lightbulb, className: "status-info", label: "Insight" },
}

export function AnalyticsInsights({ insights }: AnalyticsInsightsProps) {
  if (insights.length === 0) return null

  return (
    <div className="glass-panel p-8 rounded-3xl border-[var(--border-subtle)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-3xl pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl status-info border flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">AI-Powered Insights</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Automated analysis of your compliance data</p>
          </div>
        </div>

        <div className="space-y-4">
          {insights.map((insight, i) => {
            const config = SEVERITY_CONFIG[insight.severity]
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-2xl glass-readable border transition-all group",
                  "hover:shadow-sm cursor-default",
                  config.className
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", config.className)}>
                  <config.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-foreground">{insight.title}</h4>
                    {insight.metric && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{insight.metric}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                  {insight.action && (
                    <p className="text-[10px] font-bold text-primary mt-2 flex items-center gap-1 uppercase tracking-widest">
                      {insight.action} <ArrowRight className="w-3 h-3" />
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
