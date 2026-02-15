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
  evidence_uploaded: "text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20",
  analysis_finished: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20",
  score_updated: "text-purple-600 bg-purple-50 border-purple-100 dark:text-purple-400 dark:bg-purple-500/10 dark:border-purple-500/20",
  gap_addressed: "text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20",
  chat_message: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20",
  default: "text-zinc-600 bg-zinc-50 border-zinc-100 dark:text-zinc-400 dark:bg-zinc-500/10 dark:border-zinc-500/20",
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
    <div className={cn("glass-panel rounded-[32px] p-6 border-[var(--border-subtle)] dark:border-slate-800", className)}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center dark:bg-blue-500/10 dark:border-blue-500/20">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Neural Stream</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider dark:text-zinc-400">Live Platform Activity</p>
            </div>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live" />
        </div>
      )}

      <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-zinc-100 rounded-2xl animate-pulse dark:bg-white/5" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center py-10 text-zinc-600 italic text-sm dark:text-zinc-400">No activity recorded.</p>
        ) : (
          logs.map((log: any) => {
            const Icon = logIcons[log.type] || logIcons.default
            const style = typeStyles[log.type] || typeStyles.default

            return (
              <div
                key={log.id}
                className="group flex items-start gap-4 p-3.5 rounded-2xl transition-all hover:bg-zinc-50 border border-transparent hover:border-zinc-200 dark:hover:bg-white/[0.02] dark:hover:border-white/5"
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border",
                  style
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-zinc-900 truncate dark:text-zinc-100">
                      {log.title}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap dark:text-zinc-400">
                      {getRelativeTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 line-clamp-1 dark:text-zinc-400">
                    {log.description || "Activity detected in platform core."}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Ayn Neural Core</span>
        </div>
        <span className="text-[9px] text-zinc-700 font-mono">256-BIT SECURE</span>
      </div>
    </div>
  )
}
