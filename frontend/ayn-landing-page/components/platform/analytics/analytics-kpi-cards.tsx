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
            className="glass-panel rounded-2xl p-5 border-[var(--border-subtle)] group hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-3xl pointer-events-none opacity-20" style={{ backgroundColor: card.color }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center border" style={{ backgroundColor: `${card.color}15`, borderColor: `${card.color}30`, color: card.color }}>
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{card.label}</p>
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
