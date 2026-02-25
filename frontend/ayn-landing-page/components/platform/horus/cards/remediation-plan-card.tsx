"use client"

import { ClipboardList, Clock, Zap, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface RemediationRow {
  gap: string
  standard: string
  clause: string
  priority: string
  recommended_action: string
  deadline: string
}

interface RemediationPlanPayload {
  rows: RemediationRow[]
}

// Extract emoji + text from priority string like "🔴 Critical"
function parsePriority(priority: string) {
  const match = priority.match(/^([^\s]+)\s+(.+)$/)
  if (match) return { emoji: match[1], label: match[2] }
  return { emoji: "🟡", label: priority }
}

function priorityClass(label: string) {
  const l = label.toLowerCase()
  if (l === "critical") return "bg-red-500/10 text-red-400 border-red-500/20"
  if (l === "high") return "bg-orange-500/10 text-orange-400 border-orange-500/20"
  if (l === "low") return "bg-green-500/10 text-green-400 border-green-500/20"
  return "bg-amber-500/10 text-amber-400 border-amber-500/20"
}

export function RemediationPlanCard({ payload }: { payload: RemediationPlanPayload }) {
  if (payload.rows.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/60 p-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-bold text-foreground text-[14px]">Remediation Action Plan</h3>
        </div>
        <p className="text-[13px] text-muted-foreground">
          No open compliance gaps found. Your institution is fully compliant, or gaps have been closed.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/60 overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground text-[14px]">Remediation Action Plan</p>
            <p className="text-[11px] text-muted-foreground">{payload.rows.length} action{payload.rows.length !== 1 ? "s" : ""} required</p>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="p-4 space-y-3">
        {payload.rows.map((row, i) => {
          const { emoji, label } = parsePriority(row.priority)
          return (
            <div
              key={i}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--layer-0)] p-4 space-y-2.5 hover:border-primary/20 transition-colors"
            >
              {/* Top row: priority + deadline */}
              <div className="flex items-center justify-between gap-2">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold",
                  priorityClass(label)
                )}>
                  {emoji} {label}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                  <Clock className="w-3 h-3" />
                  {row.deadline}
                </span>
              </div>

              {/* Gap description */}
              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                <span className="text-muted-foreground/60 font-semibold text-[10px] uppercase tracking-wide mr-1">{row.standard} · {row.clause}</span><br />
                {row.gap}
              </p>

              {/* Recommended action */}
              <div className="flex items-start gap-2 bg-primary/5 rounded-lg px-3 py-2">
                <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-foreground font-medium leading-relaxed">{row.recommended_action}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-5 pb-4">
        <a
          href="/platform/gap-analysis"
          className="flex items-center justify-center gap-1.5 w-full py-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground border border-[var(--border-subtle)] rounded-lg hover:border-primary/30 transition-colors"
        >
          View in Gap Analysis <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )
}
