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
            "flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.02] px-3 py-1.5 backdrop-blur-sm",
            className
          )}
        >
          {/* Message count */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            <span className="font-semibold">{stats.messageCount}</span>
            <span className="hidden sm:inline">msgs</span>
          </div>

          <div className="h-3 w-px bg-white/8" />

          {/* Token budget */}
          <div className="flex items-center gap-1.5">
            <Brain className={cn("h-3 w-3", budgetColor)} />
            <div className="flex items-center gap-1">
              <div className="h-1 w-12 rounded-full bg-white/10 overflow-hidden">
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

          {/* Recent tools */}
          {stats.recentTools.length > 0 && (
            <>
              <div className="h-3 w-px bg-white/8" />
              <div className="flex items-center gap-1">
                <Wrench className="h-2.5 w-2.5 text-muted-foreground/60" />
                {stats.recentTools.slice(0, 3).map((tool) => (
                  <span
                    key={tool}
                    className="rounded border border-primary/15 bg-primary/8 px-1 py-0.5 text-[9px] font-medium text-primary/80"
                  >
                    {tool.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Warning when context is getting full */}
          {stats.budgetPercent >= 70 && (
            <>
              <div className="h-3 w-px bg-white/8" />
              <span className="text-[9px] font-medium text-amber-400/80">
                {stats.budgetPercent >= 90 ? "Context nearly full — consider new chat" : "High context usage"}
              </span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
