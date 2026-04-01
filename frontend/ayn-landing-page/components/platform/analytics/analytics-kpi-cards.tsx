"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface KpiCardData {
  id: string
  label: string
  value: string | number
  previousValue?: number
  currentValue?: number
  suffix?: string
  icon: LucideIcon
  color: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  description?: string
}

interface KpiCardsProps {
  cards: KpiCardData[]
}

export function AnalyticsKpiCards({ cards }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const TrendIcon = card.trend === "up" ? TrendingUp : card.trend === "down" ? TrendingDown : Minus
        const trendColor = card.trend === "up" ? "text-emerald-500" : card.trend === "down" ? "text-red-400" : "text-muted-foreground"

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="glass-panel group relative overflow-hidden rounded-[24px] border-[var(--border-subtle)] p-5 sm:p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${card.color}, transparent)` }} />
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full blur-3xl pointer-events-none opacity-20" style={{ backgroundColor: card.color }} />
            <div className="relative z-10">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border shadow-[0_18px_34px_-26px_rgba(0,0,0,0.45)]" style={{ backgroundColor: `${card.color}15`, borderColor: `${card.color}30`, color: card.color }}>
                  <card.icon className="w-4 h-4" />
                </div>
                {card.trend && (
                  <div className={cn("inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest", trendColor)}>
                    <TrendIcon className="w-3 h-3" />
                    {card.trendValue}
                  </div>
                )}
              </div>
              <p className="text-3xl sm:text-[2rem] font-black text-foreground tracking-tight leading-none">
                {card.value}{card.suffix && <span className="ml-0.5 text-lg font-medium text-muted-foreground">{card.suffix}</span>}
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{card.label}</p>
              {card.description && (
                <p className="mt-3 max-w-[22rem] text-[11px] text-muted-foreground leading-relaxed">{card.description}</p>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
