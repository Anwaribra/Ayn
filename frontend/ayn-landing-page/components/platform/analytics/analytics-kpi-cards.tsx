"use client"

import { Brain, TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react"
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
  horusInsight?: string
}

interface KpiCardsProps {
  cards: KpiCardData[]
}

export function AnalyticsKpiCards({ cards }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const TrendIcon = card.trend === "up" ? TrendingUp : card.trend === "down" ? TrendingDown : Minus
        const trendColor = card.trend === "up" ? "text-emerald-500" : card.trend === "down" ? "text-red-400" : "text-foreground/60"

        return (
          <div
            key={card.id}
            className="glass-panel group relative overflow-hidden rounded-[20px] border-[var(--border-subtle)] p-5 transition-colors sm:p-6"
          >
            <div className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${card.color}, transparent)` }} />
            <div className="absolute top-0 end-0 h-24 w-24 rounded-full blur-3xl pointer-events-none opacity-20" style={{ backgroundColor: card.color }} />
            <div className="relative z-10">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border shadow-[0_18px_34px_-26px_rgba(0,0,0,0.45)]" style={{ backgroundColor: `${card.color}15`, borderColor: `${card.color}30`, color: card.color }}>
                  <card.icon className="w-4 h-4" />
                </div>
                {card.trend && (
                  <div className={cn("inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", trendColor)}>
                    <TrendIcon className="w-3 h-3" />
                    {card.trendValue}
                  </div>
                )}
              </div>
              <p className="text-3xl sm:text-[2rem] font-bold text-foreground tracking-tight leading-none">
                {card.value}{card.suffix && <span className="ms-0.5 text-lg font-medium text-foreground/55">{card.suffix}</span>}
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/55">{card.label}</p>
              {card.description && (
                <p className="mt-3 max-w-[22rem] text-[11px] text-foreground/70 leading-relaxed">{card.description}</p>
              )}
              {card.horusInsight && (
                <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/[0.04] px-3 py-2.5">
                  <div className="mb-1.5 flex items-center gap-1.5 text-primary">
                    <Brain className="h-3 w-3" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.16em]">Horus</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-foreground/72">{card.horusInsight}</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
