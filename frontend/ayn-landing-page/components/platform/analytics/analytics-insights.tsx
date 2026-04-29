"use client"

import { motion } from "framer-motion"
import { Lightbulb, AlertTriangle, TrendingUp, ShieldCheck, ArrowRight, Sparkles, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUiLanguage } from "@/lib/ui-language-context"

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
  const { isArabic } = useUiLanguage()
  if (insights.length === 0) return null

  return (
    <div className="glass-panel relative overflow-hidden rounded-[28px] border-[var(--border-subtle)] p-5 sm:p-6 lg:p-7">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.8),transparent)] opacity-70" />
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-3xl pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl status-info border flex items-center justify-center shadow-[0_18px_40px_-28px_rgba(37,99,235,0.45)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{isArabic ? "الرؤى" : "Insights"}</h3>
            <p className="text-[10px] font-bold text-foreground/55 uppercase tracking-[0.14em]">
              {isArabic ? "أنماط وتوصيات من بياناتك" : "Patterns and recommendations from your data"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {insights.map((insight, i) => {
            const config = SEVERITY_CONFIG[insight.severity]
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={cn(
                  "glass-surface flex cursor-default items-start gap-4 rounded-[22px] border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm",
                  config.className
                )}
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-[0_18px_34px_-28px_rgba(0,0,0,0.45)]", config.className)}>
                  <config.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h4 className="text-sm font-bold text-foreground">{insight.title}</h4>
                    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]", config.className)}>
                      {isArabic
                        ? config.label === "Positive"
                          ? "إيجابي"
                          : config.label === "Attention"
                          ? "تنبيه"
                          : config.label === "Critical"
                          ? "حرج"
                          : "رؤية"
                        : config.label}
                    </span>
                    {insight.metric && (
                      <span className="glass-pill glass-text-secondary px-2 py-0.5 text-[10px] font-bold">{insight.metric}</span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/75 leading-relaxed">{insight.description}</p>
                  {insight.action && (
                    <p className="text-[10px] font-bold text-primary mt-3 flex items-center gap-1 uppercase tracking-[0.16em]">
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
