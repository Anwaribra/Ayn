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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const TrendIcon = card.trend === "up" ? TrendingUp : card.trend === "down" ? TrendingDown : Minus
        const trendColor = card.trend === "up" ? "text-emerald-500" : card.trend === "down" ? "text-red-400" : "text-muted-foreground"

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="glass-panel group relative overflow-hidden rounded-2xl border-[var(--border-subtle)] p-5 transition-all hover:shadow-md"
          >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-3xl pointer-events-none opacity-20" style={{ backgroundColor: card.color }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border" style={{ backgroundColor: `${card.color}15`, borderColor: `${card.color}30`, color: card.color }}>
                  <card.icon className="w-4 h-4" />
                </div>
                {card.trend && (
                  <div className={cn("flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest", trendColor)}>
                    <TrendIcon className="w-3 h-3" />
                    {card.trendValue}
                  </div>
                )}
              </div>
              <p className="text-3xl font-black text-foreground tracking-tight">
                {card.value}{card.suffix && <span className="text-lg font-medium text-muted-foreground">{card.suffix}</span>}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{card.label}</p>
              {card.description && (
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">{card.description}</p>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
