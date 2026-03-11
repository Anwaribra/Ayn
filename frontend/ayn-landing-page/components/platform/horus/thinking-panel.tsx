"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Brain, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ReasoningState = {
  steps: { text: string; status: "pending" | "active" | "done" }[]
  startTime: number
  duration: number | null
  isExpanded: boolean
  isComplete: boolean
  tempUserMessage: string | null
}

interface ThinkingPanelProps {
  reasoning: ReasoningState | null
  status: string
  onClose: () => void
}

export function ThinkingPanel({ reasoning, status, onClose }: ThinkingPanelProps) {
  // Show if reasoning exists and has steps
  const isOpen = reasoning !== null && reasoning.steps.length > 0 && reasoning.isExpanded

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-80 z-50 backdrop-blur-xl bg-white/5 border-l border-[var(--border-subtle)] shadow-[0_0_40px_rgba(0,0,0,0.1)] flex flex-col"
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--surface)]/30 pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)]/30 bg-[var(--surface-modal)]/60 pt-20">
            <div className="flex items-center gap-3">
              {reasoning.isComplete ? (
                <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 shrink-0 border border-emerald-500/20">
                  <Check className="w-4.5 h-4.5 text-emerald-500" />
                </div>
              ) : (
                <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 shrink-0 border border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse">
                  <Brain className="w-4.5 h-4.5 text-primary" />
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-foreground">AI Intelligence</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                  {reasoning.isComplete ? `Done in ${reasoning.duration?.toFixed(1)}s` : "Processing..."}
                </p>
              </div>
            </div>
            {reasoning.isComplete && (
               <button 
                 onClick={onClose} 
                 className="p-2 mr-[-8px] text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/10"
               >
                 <X className="w-4 h-4" />
               </button>
            )}
          </div>

          {/* Steps */}
          <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 custom-scrollbar">
            {/* The line connecting the dots */}
            <div className="absolute left-[33px] top-8 bottom-10 w-[2px] bg-[var(--border-subtle)]" />
            
            <div className="space-y-7 relative z-10">
              {reasoning.steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.15, 1) }}
                  className="flex items-start gap-4 relative"
                >
                  <div className={cn(
                    "relative mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center rounded-full border-2 transition-colors",
                    step.status === "done" ? "border-emerald-500 bg-emerald-500/10" : 
                    step.status === "active" ? "border-primary bg-primary/10" : 
                    "border-[var(--border-subtle)] bg-[var(--surface)]/80"
                  )}>
                    {step.status === "done" ? (
                      <Check className="w-3 h-3 text-emerald-500 font-bold" />
                    ) : step.status === "active" ? (
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "text-[13px] font-semibold leading-relaxed pt-0.5 tracking-tight",
                      step.status === "active"
                        ? "text-[var(--text-primary)]"
                        : step.status === "done"
                        ? "text-[var(--text-secondary)]"
                        : "text-muted-foreground/40"
                    )}
                  >
                    {step.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
