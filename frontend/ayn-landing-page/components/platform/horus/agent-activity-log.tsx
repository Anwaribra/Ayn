"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Wrench, Clock, ChevronRight, AlertTriangle, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Message, ToolStep } from "@/lib/horus-context"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface AgentActivityEntry {
  id: string
  tool: string
  title: string
  status: "success" | "error" | "cancelled"
  resultType?: string
  timestamp: number
  messageId: string
}

interface AgentActivityLogProps {
  messages: Message[]
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: React.ReactNode
}

function extractActivityEntries(messages: Message[]): AgentActivityEntry[] {
  const entries: AgentActivityEntry[] = []

  for (const msg of messages) {
    if (msg.role !== "assistant" || !msg.toolSteps?.length) continue

    for (const step of msg.toolSteps) {
      if (step.status === "done" || step.status === "error") {
        entries.push({
          id: `${msg.id}-${step.step}-${step.tool}`,
          tool: step.tool,
          title: step.title || step.tool,
          status: step.status === "done" ? "success" : "error",
          resultType: step.result_type,
          timestamp: msg.timestamp,
          messageId: msg.id,
        })
      }
    }
  }

  return entries.reverse() // Most recent first
}

export function AgentActivityLog({ messages, open, onOpenChange, trigger }: AgentActivityLogProps) {
  const entries = useMemo(() => extractActivityEntries(messages), [messages])

  const successCount = entries.filter((e) => e.status === "success").length
  const errorCount = entries.filter((e) => e.status === "error").length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-[380px] border-l border-white/8 bg-[rgba(8,10,16,0.97)] p-0 backdrop-blur-xl sm:w-[420px]"
      >
        {/* Header */}
        <div className="border-b border-white/8 px-5 py-4">
          <h2 className="text-[14px] font-bold text-foreground">Agent Activity</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Actions performed by Horus in this session
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              <Check className="h-2.5 w-2.5" />
              {successCount} succeeded
            </span>
            {errorCount > 0 && (
              <span className="flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                <X className="h-2.5 w-2.5" />
                {errorCount} failed
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/60">
              {entries.length} total actions
            </span>
          </div>
        </div>

        {/* Activity List */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar" style={{ maxHeight: "calc(100vh - 140px)" }}>
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-white/[0.02]">
                <Wrench className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="mt-3 text-[13px] font-medium text-muted-foreground/60">No agent actions yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground/40">Use agent mode to start executing tools</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <AnimatePresence>
                {entries.map((entry, idx) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    className={cn(
                      "group flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                      entry.status === "success"
                        ? "border-white/6 bg-white/[0.02] hover:bg-white/[0.04]"
                        : "border-red-500/15 bg-red-500/[0.02] hover:bg-red-500/[0.04]"
                    )}
                  >
                    {/* Status icon */}
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                        entry.status === "success"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border-red-500/20 bg-red-500/10 text-red-400"
                      )}
                    >
                      {entry.status === "success" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-foreground truncate">
                          {entry.title}
                        </span>
                        <span className="rounded border border-white/8 bg-white/[0.03] px-1 py-0.5 text-[9px] font-mono text-muted-foreground/60 shrink-0">
                          {entry.tool}
                        </span>
                      </div>
                      {entry.resultType && entry.resultType !== "action_error" && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                          → {entry.resultType.replace(/_/g, " ")}
                        </p>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="shrink-0 text-[9px] font-mono text-muted-foreground/40">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
