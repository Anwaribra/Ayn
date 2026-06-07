"use client"

import { cn } from "@/lib/utils"
import { useUiLanguage } from "@/lib/ui-language-context"
import {
  Activity,
  Cpu,
  Shield,
  FileText,
  BarChart,
  MessageSquare,
  ListChecks,
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
  const { isArabic } = useUiLanguage()
  const visibleLogs = logs.slice(0, maxEntries)

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 1) return isArabic ? "الآن" : "Just now"
    if (minutes < 60) return isArabic ? `منذ ${minutes} د` : `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return isArabic ? `منذ ${hours} س` : `${hours}h ago`
    return date.toLocaleDateString(isArabic ? "ar-EG" : undefined)
  }

  return (
    <div className={cn("glass-card glass-card-no-lift relative overflow-hidden rounded-[22px] p-5 sm:p-6", className)}>
      {showHeader && (
        <div className={cn("relative z-10 flex items-center justify-between mb-5 sm:mb-6", isArabic && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-3", isArabic && "flex-row-reverse text-right")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[var(--glass-border)] bg-[var(--glass-soft-bg)]">
              <ListChecks className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{isArabic ? "نشاط المنصة" : "Platform Activity"}</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                {isArabic ? "آخر التحديثات" : "Latest updates"}
              </p>
            </div>
          </div>
          <div className={cn("inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1", isArabic && "flex-row-reverse")}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--status-success)" }} title={isArabic ? "متصل" : "Online"} />
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--status-success)]">{isArabic ? "متصل" : "Online"}</span>
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
            <p className="text-muted-foreground text-sm">
              {isArabic ? "لا يوجد نشاط مسجّل." : "No activity recorded."}
            </p>
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
                  "w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 border",
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
                    {log.description || (isArabic ? "تم رصد نشاط في نواة المنصة." : "Activity detected in platform core.")}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 mt-3 text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            )
          })
        )}
      </div>

      <div className={cn("relative z-10 mt-5 flex items-center justify-between border-t border-[var(--glass-border-subtle)] pt-4 sm:mt-6", isArabic && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isArabic && "flex-row-reverse")}>
          <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.18em]">
            {isArabic ? "سجل المنصة" : "Platform Log"}
          </span>
        </div>
        <span className="text-[9px] text-muted-foreground font-mono">{isArabic ? "تشفير 256 بت" : "256-BIT SECURE"}</span>
      </div>
    </div>
  )
}
