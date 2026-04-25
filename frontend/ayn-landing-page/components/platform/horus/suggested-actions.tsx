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
        "group inline-flex min-w-max items-center gap-2 rounded-xl border border-white/10 bg-[#0d1420]/90",
        "px-3 py-2 text-left transition-all duration-150",
        "hover:border-primary/35 hover:bg-[#121b2b] hover:shadow-[0_10px_30px_-22px_rgba(37,99,235,0.65)]",
        "active:scale-[0.98]",
      )}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] transition-colors group-hover:border-primary/20 group-hover:bg-primary/10">
        <Icon className="h-3.5 w-3.5 text-primary/80 transition-colors group-hover:text-primary" />
      </span>
      <span className="whitespace-nowrap text-[11px] font-medium leading-none text-foreground/78 transition-colors group-hover:text-foreground sm:text-[11.5px]">
        {suggestion.label}
      </span>
      <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 group-hover:text-primary/60" />
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
      <p className="mb-2 pl-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/52">
        {isArabic ? "اقتراحات سريعة" : "Quick actions"}
      </p>
      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2 pr-1">
          {suggestions.map((s, i) => (
            <SuggestionChip key={s.id} suggestion={s} onSelect={onSelect} index={i} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
