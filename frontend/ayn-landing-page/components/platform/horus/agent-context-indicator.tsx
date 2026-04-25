"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Message } from "@/lib/horus-context"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface AgentContextIndicatorProps {
  messages: Message[]
  status: "idle" | "searching" | "generating" | "error"
  className?: string
}

const MAX_TOKEN_BUDGET = 128_000 // Gemini's context window
const CHARS_PER_TOKEN = 4

function formatCompactTokens(value: number) {
  if (value >= 1000) {
    const compact = value / 1000
    return `${Number.isInteger(compact) ? compact.toFixed(0) : compact.toFixed(1)}k`
  }
  return value.toString()
}

export function AgentContextIndicator({ messages, status, className }: AgentContextIndicatorProps) {
  const stats = useMemo(() => {
    const messageCount = messages.length
    const totalChars = messages.reduce((sum, m) => sum + (m.content?.length ?? 0), 0)
    const estimatedTokens = Math.round(totalChars / CHARS_PER_TOKEN)
    const budgetPercent = Math.min(Math.round((estimatedTokens / MAX_TOKEN_BUDGET) * 100), 100)
    const remainingPercent = Math.max(100 - budgetPercent, 0)
    const remainingTokens = Math.max(MAX_TOKEN_BUDGET - estimatedTokens, 0)
    return { messageCount, estimatedTokens, budgetPercent, remainingPercent, remainingTokens }
  }, [messages])

  const budgetColor = stats.budgetPercent < 50
    ? "text-emerald-400"
    : stats.budgetPercent < 80
      ? "text-amber-400"
      : "text-red-400"

  const ringColor = stats.budgetPercent < 50
    ? "#34d399"
    : stats.budgetPercent < 80
      ? "#fbbf24"
      : "#f87171"

  const inlineValue = formatCompactTokens(stats.estimatedTokens)

  return (
    <AnimatePresence>
      {status !== "error" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={className}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`Context window ${stats.budgetPercent}% used, ${stats.estimatedTokens} of ${MAX_TOKEN_BUDGET} tokens`}
                className={cn(
                  "inline-flex h-7 items-center gap-2 rounded-md px-2 text-[11px] font-medium tabular-nums transition-colors",
                  "text-muted-foreground/70 hover:bg-white/[0.04] hover:text-foreground/90"
                )}
              >
                <span
                  aria-hidden="true"
                  className="relative h-3.5 w-3.5 shrink-0 rounded-full"
                  style={{
                    background: `conic-gradient(${ringColor} 0deg ${stats.budgetPercent * 3.6}deg, rgba(255,255,255,0.12) ${stats.budgetPercent * 3.6}deg 360deg)`,
                  }}
                >
                  <span className="absolute inset-[2px] rounded-full bg-[#0b1017]" />
                  <span className="absolute inset-[4px] rounded-full border border-white/12" />
                </span>
                <span className={cn("font-mono text-[11px] font-medium tracking-[-0.01em]", budgetColor)}>
                  {inlineValue}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={8}
              className="max-w-[220px] rounded-xl border border-white/10 bg-[#171717] px-4 py-3 text-center text-[11px] leading-relaxed text-white shadow-2xl"
            >
              <div className="text-white/50">Context window:</div>
              <div className="mt-1 font-medium text-white/95">
                {stats.budgetPercent}% used ({stats.remainingPercent}% left)
              </div>
              <div className="mt-1 text-[18px] font-medium tracking-[-0.02em] text-white">
                {stats.estimatedTokens.toLocaleString()} / {MAX_TOKEN_BUDGET.toLocaleString()} tokens used
              </div>
              <div className="mt-2 text-white/70">
                Horus automatically compacts its context
              </div>
            </TooltipContent>
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
