"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useUiLanguage } from "@/lib/ui-language-context"

interface ReadinessRingProps {
  value: number
  standardsCount: number
  evidenceCount: number
  className?: string
  compact?: boolean
}

export function ReadinessRing({
  value,
  standardsCount,
  evidenceCount,
  className,
  compact = false,
}: ReadinessRingProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const { isArabic } = useUiLanguage()

  const size = compact ? 108 : 132
  const stroke = compact ? 8 : 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const offset = useMemo(
    () => (inView ? circumference - (Math.min(value, 100) / 100) * circumference : circumference),
    [inView, value, circumference],
  )

  const steps = useMemo(
    () => [
      {
        href: "/platform/standards",
        done: standardsCount > 0,
        label: { en: "Add a standard", ar: "أضف معيارًا" },
      },
      {
        href: "/platform/evidence",
        done: evidenceCount > 0,
        label: { en: "Upload evidence", ar: "ارفَع دليلًا" },
      },
      {
        href: "/platform/gap-analysis",
        done: false,
        label: { en: "Run gap analysis", ar: "حلّل الفجوات" },
      },
    ],
    [standardsCount, evidenceCount],
  )

  const doneCount = steps.filter((s) => s.done).length
  const gradientId = compact ? "ringGradientCompact" : "ringGradient"

  return (
    <div ref={ref} className={cn("flex flex-col items-center", className)}>
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="oklch(0.6 0.2 250)" />
            </linearGradient>
          </defs>

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-foreground/[0.06] dark:text-foreground/[0.1]"
            strokeWidth={stroke}
          />

          {value > 0 ? (
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={stroke}
              strokeDasharray={`${circumference}`}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 }}
              strokeLinecap="round"
            />
          ) : (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={stroke}
              strokeDasharray={`${circumference}`}
              strokeLinecap="round"
              className="text-muted-foreground/15"
            />
          )}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-bold tabular-nums tracking-tight text-foreground",
              compact ? "text-2xl" : "text-4xl",
            )}
          >
            {value}%
          </span>
        </div>
      </div>

      <p
        className={cn(
          "text-center font-semibold uppercase tracking-[0.12em] text-muted-foreground",
          compact ? "mt-2 text-[9px]" : "mt-4 text-[10px]",
        )}
      >
        {isArabic ? "الجاهزية" : "Readiness"}
      </p>

      {value === 0 && (
        <div className={cn("w-full space-y-1.5", compact ? "mt-2" : "mt-4 max-w-sm")}>
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isArabic ? "البدء" : "Quick start"}
            </p>
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
              {doneCount}/3
            </span>
          </div>
          {steps.map((step, i) => (
            <Link
              key={i}
              href={step.href}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] transition-colors",
                step.done
                  ? "border-emerald-500/15 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                  : "border-border/60 bg-background/50 text-muted-foreground hover:border-primary/25 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold",
                  step.done ? "bg-emerald-500 text-white" : "border border-border",
                )}
              >
                {step.done ? "✓" : i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {isArabic ? step.label.ar : step.label.en}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
