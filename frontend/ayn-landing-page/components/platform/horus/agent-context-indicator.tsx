"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain } from "lucide-react"
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

  if (stats.messageCount === 0) return null

  const budgetColor = stats.budgetPercent < 50
    ? "text-emerald-400"
    : stats.budgetPercent < 80
      ? "text-amber-400"
      : "text-red-400"

  const budgetBarColor = stats.budgetPercent < 50
    ? "bg-emerald-500/60"
    : stats.budgetPercent < 80
      ? "bg-amber-500/60"
      : "bg-red-500/60"

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
                  "flex items-center gap-2 rounded-full border border-white/10 bg-[#0b1017]/90 px-3 py-1.5 shadow-[0_12px_32px_-26px_rgba(0,0,0,0.95)] backdrop-blur-md transition-colors",
                  "hover:border-white/15 hover:bg-[#0f1520]"
                )}
              >
                <Brain className={cn("h-3 w-3 shrink-0", budgetColor)} />
                <div className="h-1 w-14 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className={cn("h-full rounded-full", budgetBarColor)}
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.budgetPercent}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
                <span className={cn("text-[10px] font-mono font-semibold tabular-nums", budgetColor)}>
                  {stats.budgetPercent}%
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
