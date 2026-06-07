"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useUiLanguage } from "@/lib/ui-language-context"

interface ComplianceHealthBarProps {
  covered: number
  partial: number
  missing: number
  total: number
  className?: string
}

export function ComplianceHealthBar({ covered, partial, missing, total, className }: ComplianceHealthBarProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const { isArabic } = useUiLanguage()

  const hasData = total > 0
  const pct = hasData ? Math.round(((covered + partial) / total) * 100) : 0

  const barFill = useMemo(() => {
    if (!hasData) return "0%"
    return `${((covered + partial) / total) * 100}%`
  }, [hasData, covered, partial, total])

  return (
    <div
      ref={ref}
      className={cn("platform-surface premium-surface border-border/50 p-3.5 sm:p-4", className)}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground">
            {isArabic ? "صحة الامتثال" : "Compliance health"}
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {isArabic ? "تغطية المتطلبات النشطة" : "Active criteria coverage"}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-bold tabular-nums text-primary">
          {pct}% {isArabic ? "مطابق" : "met"}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50 border border-border/50">
        {hasData && (
          <motion.div
            initial={{ width: 0 }}
            animate={inView ? { width: barFill } : { width: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="h-full rounded-full bg-gradient-to-r from-amber-500/80 via-primary to-emerald-500/90"
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {covered} {isArabic ? "مغطى" : "covered"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {partial} {isArabic ? "جزئي" : "partial"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {missing} {isArabic ? "مفقود" : "missing"}
          </span>
        </div>
        <span className="font-medium text-foreground">
          {hasData ? `${covered + partial}/${total}` : "0/0"}
        </span>
      </div>
    </div>
  )
}
