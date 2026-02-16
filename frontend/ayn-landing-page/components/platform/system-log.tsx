"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Info,
  Zap,
  Cpu,
  Database,
  Shield,
  Clock,
  XCircle,
  FileText,
  BarChart,
  MessageSquare
} from "lucide-react"
import useSWR from "swr"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

interface LogEntry {
  id: string
  timestamp: Date
  type: string
  title: string
  description?: string
  entityType?: string
}

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
}

export function SystemLog({ maxEntries = 6, className, showHeader = true }: SystemLogProps) {
  const { user } = useAuth()
  const { data: activities, isLoading } = useSWR(
    user ? ["recent-activities", user.id] : null,
    () => api.getDashboardMetrics() // Activities are now part of metrics
  )

  const logs = activities?.recentActivities?.slice(0, maxEntries) || []

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

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
    <div className={cn("glass-layer-2 rounded-[32px] p-6 border-transparent", className)}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl status-info border flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Neural Stream</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Live Platform Activity</p>
            </div>
          </div>
          <div className="w-1.5 h-1.5 rounded-full status-success animate-pulse" style={{ backgroundColor: "var(--status-success)" }} title="Live" />
        </div>
      )}

      <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground italic text-sm">No activity recorded.</p>
        ) : (
          logs.map((log: any) => {
            const Icon = logIcons[log.type] || logIcons.default
            const style = typeStyles[log.type] || typeStyles.default

            return (
              <div
                key={log.id}
                className="group flex items-start gap-4 p-3.5 rounded-2xl transition-all hover:bg-muted/50 border border-transparent hover:border-border"
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border",
                  style
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-foreground truncate">
                      {log.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                      {getRelativeTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">
                    {log.description || "Activity detected in platform core."}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Ayn Neural Core</span>
        </div>
        <span className="text-[9px] text-muted-foreground font-mono">256-BIT SECURE</span>
      </div>
    </div>
  )
}
