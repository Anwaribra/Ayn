"use client"

import { motion } from "framer-motion"
import {
  FileText,
  AlertTriangle,
  GitMerge,
  Link,
  ShieldCheck,
  ListChecks,
  BarChart2,
  ArrowRight,
  Type,
  ArrowUpRight,
  Search,
  Lightbulb,
  FileCheck,
  CheckSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentSuggestion } from "@/lib/horus-context"

const ICON_MAP: Record<string, React.ElementType> = {
  "file-text": FileText,
  "alert-triangle": AlertTriangle,
  "git-merge": GitMerge,
  "link": Link,
  "shield-check": ShieldCheck,
  "list-checks": ListChecks,
  "bar-chart-2": BarChart2,
  "arrow-right": ArrowRight,
  "type": Type,
  "arrow-up-right": ArrowUpRight,
  "search": Search,
  "lightbulb": Lightbulb,
  "file-check": FileCheck,
  "check-square": CheckSquare,
}

function SuggestionChip({
  suggestion,
  onSelect,
  index,
}: {
  suggestion: AgentSuggestion
  onSelect: (prompt: string) => void
  index: number
}) {
  const Icon = ICON_MAP[suggestion.icon] ?? ArrowRight

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onSelect(suggestion.prompt)}
      className={cn(
        "group flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.025]",
        "px-3.5 py-2.5 text-left transition-all duration-150",
        "hover:border-primary/30 hover:bg-primary/[0.06] hover:shadow-[0_8px_24px_-16px_rgba(37,99,235,0.35)]",
        "active:scale-[0.98]",
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] transition-colors group-hover:border-primary/20 group-hover:bg-primary/10">
        <Icon className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
      </span>
      <span className="text-[12.5px] font-medium leading-tight text-foreground/80 transition-colors group-hover:text-foreground">
        {suggestion.label}
      </span>
      <ArrowUpRight className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 group-hover:text-primary/60" />
    </motion.button>
  )
}

export function SuggestedActionsPanel({
  suggestions,
  onSelect,
  isArabic = false,
}: {
  suggestions: AgentSuggestion[]
  onSelect: (prompt: string) => void
  isArabic?: boolean
}) {
  if (!suggestions.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mt-3"
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">
        {isArabic ? "الخطوات المقترحة" : "Suggested next steps"}
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <SuggestionChip key={s.id} suggestion={s} onSelect={onSelect} index={i} />
        ))}
      </div>
    </motion.div>
  )
}
