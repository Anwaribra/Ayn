"use client"

import { useEffect, useState, useRef } from "react"
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
} from "lucide-react"

interface LogEntry {
  id: string
  timestamp: Date
  type: "success" | "info" | "warning" | "error" | "system"
  message: string
  source: string
}

// System event generator for real-time feel
function generateSystemLogs(): LogEntry[] {
  const now = new Date()
  const logs: LogEntry[] = [
    {
      id: "1",
      timestamp: new Date(now.getTime() - 1000 * 60 * 2),
      type: "system",
      message: "Neural bridge established",
      source: "Horus AI",
    },
    {
      id: "2",
      timestamp: new Date(now.getTime() - 1000 * 60 * 15),
      type: "success",
      message: "Account authentication verified",
      source: "Auth Service",
    },
    {
      id: "3",
      timestamp: new Date(now.getTime() - 1000 * 60 * 30),
      type: "info",
      message: "Compliance framework initialized",
      source: "Standards Engine",
    },
    {
      id: "4",
      timestamp: new Date(now.getTime() - 1000 * 60 * 45),
      type: "warning",
      message: "Waiting for evidence upload...",
      source: "Evidence Vault",
    },
    {
      id: "5",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60),
      type: "success",
      message: "Dashboard metrics synchronized",
      source: "Analytics Core",
    },
  ]
  return logs
}

const logIcons = {
  success: CheckCircle2,
  info: Info,
  warning: AlertCircle,
  error: XCircle,
  system: Zap,
}

const logColors = {
  success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  error: "text-red-400 bg-red-500/10 border-red-500/20",
  system: "text-purple-400 bg-purple-500/10 border-purple-500/20",
}

const sourceIcons: Record<string, React.ElementType> = {
  "Horus AI": Cpu,
  "Auth Service": Shield,
  "Standards Engine": Database,
  "Evidence Vault": Database,
  "Analytics Core": Activity,
}

interface SystemLogProps {
  maxEntries?: number
  className?: string
  showHeader?: boolean
}

export function SystemLog({ maxEntries = 6, className, showHeader = true }: SystemLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>(generateSystemLogs())
  const [isLive, setIsLive] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Simulate real-time log updates
    intervalRef.current = setInterval(() => {
      if (!isLive) return

      setLogs(prev => {
        const now = new Date()
        // Occasionally add a new log entry
        if (Math.random() > 0.7) {
          const newLog: LogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: now,
            type: Math.random() > 0.5 ? "info" : "system",
            message: ["Polling for updates...", "Neural sync active", "Monitoring standards", "Cache refreshed"][Math.floor(Math.random() * 4)],
            source: "Horus AI",
          }
          return [newLog, ...prev].slice(0, maxEntries)
        }
        return prev
      })
    }, 8000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isLive, maxEntries])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  const getRelativeTime = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 1) return "Just now"
    if (minutes === 1) return "1m ago"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours === 1) return "1h ago"
    return `${hours}h ago`
  }

  return (
    <div className={cn("glass-panel rounded-[32px] p-6 border-[var(--border-subtle)]", className)}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">System Log</h3>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Real-time Events</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLive(!isLive)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                isLive
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-[var(--surface-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]"
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", isLive && "animate-pulse bg-emerald-400")} />
              {isLive ? "Live" : "Paused"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar">
        {logs.map((log, index) => {
          const Icon = logIcons[log.type]
          const SourceIcon = sourceIcons[log.source] || Database
          const isNew = index === 0

          return (
            <div
              key={log.id}
              className={cn(
                "group flex items-start gap-3 p-3 rounded-xl transition-all",
                "hover:bg-[var(--surface)] cursor-default",
                isNew && "bg-white/[0.01]"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border",
                logColors[log.type]
              )}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-medium text-[var(--text-secondary)] truncate">
                    {log.message}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <SourceIcon className="w-3 h-3 text-zinc-600" />
                  <span className="text-[9px] text-zinc-500 font-medium">{log.source}</span>
                  <span className="text-zinc-700">•</span>
                  <Clock className="w-3 h-3 text-zinc-600" />
                  <span className="text-[9px] text-zinc-600 mono">{formatTime(log.timestamp)}</span>
                  <span className="text-[9px] text-zinc-600 ml-auto">{getRelativeTime(log.timestamp)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Status Bar */}
      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[10px] text-zinc-500">Horus Neural Link</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active</span>
        </div>
      </div>
    </div>
  )
}

export function CompactSystemLog({ className }: { className?: string }) {
  const [logs] = useState<LogEntry[]>(generateSystemLogs().slice(0, 4))

  return (
    <div className={cn("space-y-4", className)}>
      {logs.map((log) => {
        const Icon = logIcons[log.type]
        return (
          <div key={log.id} className="flex gap-3 group">
            <div className={cn("w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5", logColors[log.type])}>
              <Icon className="w-3 h-3" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {log.message}
              </p>
              <span className="text-[9px] text-[var(--text-tertiary)]">
                {log.source} • {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
