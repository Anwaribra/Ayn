"use client"

import { cn } from "@/lib/utils"
import {
  Activity,
  Cpu,
  Shield,
  FileText,
  BarChart,
  MessageSquare,
  Sparkles,
  ChevronRight
} from "lucide-react"

const logIcons: Record<string, any> = {
  evidence_uploaded: FileText,
  analysis_finished: Cpu,
  score_updated: BarChart,
  gap_addressed: Shield,
  chat_message: MessageSquare,
  default: Activity,
}

const typeStyles: Record<string, string> = {
  evidence_uploaded: "status-info",
  analysis_finished: "status-success",
  score_updated: "status-info",
  gap_addressed: "status-warning",
  chat_message: "status-info",
  default: "bg-muted text-muted-foreground border-border",
}

interface SystemLogProps {
  maxEntries?: number
  className?: string
  showHeader?: boolean
  logs?: any[]
  isLoading?: boolean
}

export function SystemLog({
  maxEntries = 6,
  className,
  showHeader = true,
  logs = [],
  isLoading = false,
}: SystemLogProps) {
  const visibleLogs = logs.slice(0, maxEntries)

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className={cn("glass-card relative overflow-hidden rounded-[32px] p-5 sm:p-6", className)}>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
      {showHeader && (
        <div className="relative z-10 flex items-center justify-between mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] shadow-[0_18px_40px_-28px_rgba(59,130,246,0.5)]">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Neural Stream</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.18em]">Live Platform Activity</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--status-success)" }} title="Live" />
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--status-success)]">Live</span>
          </div>
        </div>
      )}

      <div className="relative z-10 space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : visibleLogs.length === 0 ? (
          <div className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-10 text-center">
            <p className="text-muted-foreground italic text-sm">No activity recorded.</p>
          </div>
        ) : (
          visibleLogs.map((log: any) => {
            const Icon = logIcons[log.type] || logIcons.default
            const style = typeStyles[log.type] || typeStyles.default

            return (
              <div
                key={log.id}
                className="group flex items-start gap-3 rounded-[24px] border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] p-3.5 transition-all hover:border-[var(--glass-border)] hover:bg-[var(--glass-soft-bg)] sm:gap-4 sm:p-4"
              >
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-[0_18px_36px_-28px_rgba(0,0,0,0.45)]",
                  style
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-xs font-bold text-foreground truncate pr-2">
                      {log.title}
                    </span>
                    <span className="whitespace-nowrap rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-soft-bg)] px-2 py-1 text-[10px] font-medium text-muted-foreground">
                      {getRelativeTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {log.description || "Activity detected in platform core."}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 mt-3 text-muted-foreground/60 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
              </div>
            )
          })
        )}
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-[var(--glass-border-subtle)] pt-4 sm:mt-6">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.18em]">Ayn Neural Core</span>
        </div>
        <span className="text-[9px] text-muted-foreground font-mono">256-BIT SECURE</span>
      </div>
    </div>
  )
}
