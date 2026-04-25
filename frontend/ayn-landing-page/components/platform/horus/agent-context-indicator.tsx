"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, MessageSquare, Wrench, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Message } from "@/lib/horus-context"

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
    const recentTools = new Set<string>()
    for (const m of messages.slice(-6)) {
      if (m.toolSteps) {
        for (const ts of m.toolSteps) {
          if (ts.tool) recentTools.add(ts.tool)
        }
      }
    }
    return { messageCount, estimatedTokens, budgetPercent, recentTools: Array.from(recentTools) }
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
          className={cn(
            "flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b1017]/88 px-2.5 py-2 shadow-[0_12px_32px_-26px_rgba(0,0,0,0.95)] backdrop-blur-md",
            className
          )}
        >
          <div className="flex items-center gap-1.5 rounded-xl border border-white/6 bg-white/[0.02] px-2 py-1 text-[10px] text-muted-foreground/85">
            <MessageSquare className="h-3 w-3" />
            <span className="font-mono font-semibold text-foreground/88">{stats.messageCount}</span>
            <span className="hidden sm:inline">msgs</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-white/6 bg-white/[0.02] px-2 py-1">
            <Brain className={cn("h-3 w-3", budgetColor)} />
            <div className="flex items-center gap-1">
              <div className="h-1 w-12 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className={cn("h-full rounded-full", budgetBarColor)}
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.budgetPercent}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              <span className={cn("text-[10px] font-mono font-semibold", budgetColor)}>
                {stats.budgetPercent}%
              </span>
            </div>
          </div>

          {stats.recentTools.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-white/6 bg-white/[0.02] px-2 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Wrench className="h-2.5 w-2.5 shrink-0 text-muted-foreground/60" />
              {stats.recentTools.slice(0, 3).map((tool) => (
                <span
                  key={tool}
                  className="whitespace-nowrap rounded-md border border-primary/15 bg-primary/8 px-1.5 py-0.5 text-[9px] font-medium text-primary/80"
                >
                  {tool.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}

          {stats.budgetPercent >= 70 && (
            <span className="rounded-xl border border-amber-500/15 bg-amber-500/8 px-2 py-1 text-[9px] font-medium text-amber-300/85">
              {stats.budgetPercent >= 90 ? "Context nearly full" : "High context usage"}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
