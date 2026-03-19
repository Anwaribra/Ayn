"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Check, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

export type ThinkStepStatus = "pending" | "active" | "done"

const containerVariants = (reduced: boolean) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: reduced ? { duration: 0 } : { staggerChildren: 0.08, delayChildren: 0.02 },
  },
})

const stepVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
}

interface ThinkStepperProps {
  steps: { text: string; status: ThinkStepStatus }[]
  isComplete: boolean
  duration?: number | null
  /** Compact inline style */
  compact?: boolean
  className?: string
}

export function ThinkStepper({
  steps,
  isComplete,
  duration,
  compact = true,
  className,
}: ThinkStepperProps) {
  const reducedMotion = useReducedMotion()
  if (steps.length === 0) return null

  const activeStep = steps.find((s) => s.status === "active")
  const transition = reducedMotion ? { duration: 0 } : undefined

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={transition ?? { duration: 0.2 }}
      className={cn(
        "rounded-2xl border border-[var(--border-subtle)] bg-[var(--glass-panel)]/60 overflow-hidden",
        compact ? "px-3 py-2.5" : "p-4",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <motion.div
          layout
          animate={{ scale: reducedMotion ? 1 : isComplete ? 1 : [1, 1.05, 1] }}
          transition={reducedMotion ? { duration: 0 } : { duration: 1.5, repeat: isComplete ? 0 : Infinity, repeatDelay: 0.3 }}
          className={cn(
            "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center",
            isComplete
              ? "bg-emerald-500/15 text-emerald-500"
              : "bg-primary/15 text-primary"
          )}
        >
          {isComplete ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Brain className="w-3.5 h-3.5 animate-pulse" />
          )}
        </motion.div>
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-[12px] font-semibold text-foreground">
            {isComplete
              ? `Thought for ${duration?.toFixed(1) ?? "—"}s`
              : activeStep?.text ?? "Thinking…"}
          </p>
          {steps.length > 1 && (
            <motion.div
              variants={containerVariants(!!reducedMotion)}
              initial="hidden"
              animate="visible"
              className="space-y-1.5 pl-0.5 border-l-2 border-[var(--border-subtle)]"
            >
              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  layout
                  variants={stepVariants}
                  className="flex items-center gap-2 ml-2 -ml-px"
                >
                  {step.status === "done" ? (
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : step.status === "active" ? (
                    <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-[var(--border-subtle)] shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      step.status === "active"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.text}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
