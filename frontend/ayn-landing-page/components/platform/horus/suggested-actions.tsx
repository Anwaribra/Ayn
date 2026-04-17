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

/** Compact 2×2 grid of larger scenario cards used in the empty state */
export const STARTER_SCENARIOS = [
  {
    id: "upload_doc",
    label: "Analyze a document",
    description: "Upload evidence or policy files for compliance review",
    icon: FileText,
    prompt: null,
    fileMode: true,
    accent: "primary",
  },
  {
    id: "gap_analysis",
    label: "Run gap analysis",
    description: "Check readiness against your active accreditation standards",
    icon: BarChart2,
    prompt: "Run a full gap analysis against our active standards and give me a detailed findings report",
    fileMode: false,
    accent: "emerald",
  },
  {
    id: "compliance_status",
    label: "Compliance overview",
    description: "See your platform-wide readiness and open issues",
    icon: ShieldCheck,
    prompt: "Give me a comprehensive compliance overview of our institution — scores, gaps, and priorities",
    fileMode: false,
    accent: "sky",
  },
  {
    id: "remediation",
    label: "Remediation plan",
    description: "Get a prioritized action plan to close your open gaps",
    icon: ListChecks,
    prompt: "Create a prioritized remediation plan for our open compliance gaps. Include specific steps and timelines.",
    fileMode: false,
    accent: "amber",
  },
] as const

const ACCENT_STYLES: Record<string, { icon: string; border: string; hover: string }> = {
  primary: {
    icon: "bg-primary/10 text-primary border-primary/15",
    border: "hover:border-primary/30 hover:shadow-[0_16px_40px_-28px_rgba(37,99,235,0.35)]",
    hover: "hover:bg-primary/[0.04]",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
    border: "hover:border-emerald-500/30 hover:shadow-[0_16px_40px_-28px_rgba(16,185,129,0.3)]",
    hover: "hover:bg-emerald-500/[0.04]",
  },
  sky: {
    icon: "bg-sky-500/10 text-sky-400 border-sky-500/15",
    border: "hover:border-sky-500/30 hover:shadow-[0_16px_40px_-28px_rgba(14,165,233,0.3)]",
    hover: "hover:bg-sky-500/[0.04]",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-400 border-amber-500/15",
    border: "hover:border-amber-500/30 hover:shadow-[0_16px_40px_-28px_rgba(245,158,11,0.3)]",
    hover: "hover:bg-amber-500/[0.04]",
  },
}

export function StarterScenarioCard({
  scenario,
  onSelect,
  onFileMode,
  index,
}: {
  scenario: (typeof STARTER_SCENARIOS)[number]
  onSelect: (prompt: string) => void
  onFileMode: () => void
  index: number
}) {
  const Icon = scenario.icon
  const accent = ACCENT_STYLES[scenario.accent]

  return (
    <motion.button
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.05 + index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => (scenario.fileMode ? onFileMode() : scenario.prompt && onSelect(scenario.prompt))}
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-2xl border border-white/8 bg-white/[0.025] p-3.5 text-left",
        "transition-all duration-200 active:scale-[0.98]",
        accent.border,
        accent.hover,
      )}
    >
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl border", accent.icon)}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[13px] font-semibold leading-tight text-foreground">{scenario.label}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{scenario.description}</p>
      </div>
    </motion.button>
  )
}
