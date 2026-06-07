"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Brain, Check, X, FileText, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

export type ReasoningState = {
  steps: { text: string; status: "pending" | "active" | "done" }[]
  startTime: number
  duration: number | null
  isExpanded: boolean
  isComplete: boolean
  tempUserMessage: string | null
}

function renderLinkedText(text: string) {
  if (!text) return null;

  const parts = text.split(/([a-zA-Z0-9_\-\s\.]+\.(?:pdf|docx|doc|txt|png|jpg|jpeg|csv))/gi);

  return parts.map((part, i) => {
    if (/^[a-zA-Z0-9_\-\s\.]+\.(?:pdf|docx|doc|txt|png|jpg|jpeg|csv)$/i.test(part)) {
      return (
        <HoverCard key={i}>
          <HoverCardTrigger asChild>
            <a
              href={`/platform/evidence?highlight=${encodeURIComponent(part.trim())}`}
              className="text-primary hover:text-primary/80 hover:underline font-bold transition-colors cursor-pointer"
              title={`Open ${part.trim()} in Evidence Vault`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {part}
            </a>
          </HoverCardTrigger>
          <HoverCardContent side="top" align="start" className="bg-card border-border shadow-lg z-50 w-64 p-4 data-[state=open]:animate-in data-[state=closed]:animate-out">
             <div className="flex items-start gap-3">
               <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                 <FileText className="w-4 h-4 text-primary" />
               </div>
               <div>
                  <h4 className="text-xs font-bold text-foreground line-clamp-2">{part.trim()}</h4>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">Known Evidence</p>
               </div>
             </div>
             <div className="mt-3 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Click to open this file natively inside the platform Evidence Vault Split-View.</p>
             </div>
          </HoverCardContent>
        </HoverCard>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function ThinkingOrb({ isComplete, status }: { isComplete: boolean; status?: string }) {
  if (isComplete) {
    return (
      <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 shrink-0 border border-emerald-500/20">
        <Check className="w-4.5 h-4.5 text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 shrink-0 border border-primary/20">
      <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )
}

interface ThinkingPanelProps {
  reasoning: ReasoningState | null
  status: string
  onClose: () => void
}

export function ThinkingPanel({ reasoning, status, onClose }: ThinkingPanelProps) {
  const isOpen = reasoning !== null && reasoning.steps.length > 0 && reasoning.isExpanded
  const scrollRef = useRef<HTMLDivElement>(null)
  const [mobileCollapsed, setMobileCollapsed] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [reasoning?.steps?.length, reasoning?.isExpanded])

  useEffect(() => {
    if (isOpen) setMobileCollapsed(false)
  }, [isOpen])

  const stepsList = (
    <div className="space-y-5 relative z-10">
      {reasoning?.steps.map((step, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(idx * 0.1, 0.8), duration: 0.25 }}
          className="flex items-start gap-3 relative"
        >
          <div className={cn(
            "relative mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center rounded-full border-2 transition-all duration-300",
            step.status === "done" ? "border-emerald-500 bg-emerald-500/10" :
            step.status === "active" ? "border-primary bg-primary/10 shadow-[0_0_8px_rgba(59,130,246,0.4)]" :
            "border-border bg-muted"
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
              step.status === "active" ? "text-[var(--text-primary)]" :
              step.status === "done" ? "text-[var(--text-secondary)]" :
              "text-muted-foreground/40"
            )}
          >
            {renderLinkedText(step.text)}
          </span>
        </motion.div>
      ))}
      <div ref={scrollRef} className="h-2" />
    </div>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Desktop: side panel (lg+) */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="solid-panel hidden fixed end-0 top-0 z-50 h-full w-80 flex-col border-s bg-card border-border shadow-lg lg:flex"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />

            <div className="relative z-10 flex items-center justify-between border-b border-border px-6 pb-5 pt-20">
              <div className="flex items-center gap-3">
                <ThinkingOrb isComplete={reasoning?.isComplete ?? false} />
                <div>
                  <h3 className="text-sm font-bold text-foreground">Agent activity</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                    {reasoning?.isComplete ? `Finished in ${reasoning.duration?.toFixed(1)}s` : "Working..."}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="horus-tool-button me-[-8px] p-2"
                aria-label="Close thinking panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 custom-scrollbar"
              style={{
                maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent 100%)',
              }}
            >
              <div className="absolute start-[33px] top-6 bottom-8 w-[2px] bg-[var(--border-subtle)]" />
              {stepsList}
            </div>
          </motion.div>

          {/* Mobile: bottom sheet (<lg) */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className={cn(
              "bg-card border-border shadow-lg fixed bottom-0 inset-x-0 z-50 flex flex-col rounded-t-[var(--radius-xl)] border-t lg:hidden",
              mobileCollapsed ? "max-h-[72px]" : "max-h-[55vh]"
            )}
          >
            {/* Drag handle + header */}
            <button
              onClick={() => setMobileCollapsed(!mobileCollapsed)}
              className="w-full flex flex-col items-center pt-2 pb-0 cursor-pointer"
              aria-label={mobileCollapsed ? "Expand thinking panel" : "Collapse thinking panel"}
            >
              <div className="w-8 h-1 rounded-full bg-muted-foreground/20 mb-2" />
            </button>

            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-2.5">
                <ThinkingOrb isComplete={reasoning?.isComplete ?? false} />
                <div>
                  <h3 className="text-sm font-bold text-foreground">Agent activity</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                    {reasoning?.isComplete ? `Finished in ${reasoning?.duration?.toFixed(1)}s` : "Working..."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMobileCollapsed(!mobileCollapsed)}
                  className="horus-tool-button p-2"
                  aria-label={mobileCollapsed ? "Expand" : "Collapse"}
                >
                  <ChevronUp className={cn("w-4 h-4 transition-transform", mobileCollapsed && "rotate-180")} />
                </button>
                <button
                  onClick={onClose}
                  className="horus-tool-button p-2"
                  aria-label="Close thinking panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!mobileCollapsed && (
              <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                <div className="relative ps-2">
                  <div className="absolute start-[17px] top-2 bottom-4 w-[2px] bg-[var(--border-subtle)]" />
                  {stepsList}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
