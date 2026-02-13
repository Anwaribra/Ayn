"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/platform/header"
import { Bell, Check, Loader2, AlertTriangle, CheckCircle, Info, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Notification } from "@/types"
import { useRouter } from "next/navigation"

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const { data: notifications, mutate, isLoading } = useSWR<Notification[]>(
    isAuthenticated && user ? [`notifications-page`, user.id] : null,
    () => api.getNotifications(),
    { refreshInterval: 10000 }
  )

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead()
    mutate(
      notifications?.map((n: Notification) => ({ ...n, isRead: true })) ?? [],
      { revalidate: false }
    )
  }

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    await api.markNotificationRead(id)
    mutate(
      notifications?.map((n: Notification) => n.id === id ? { ...n, isRead: true } : n) ?? [],
      { revalidate: false }
    )
  }

  const navigateToRelated = (n: Notification) => {
    // Mark read then navigate
    handleMarkRead(n.id)

    if (n.relatedEntityType === 'evidence' && n.relatedEntityId) {
      router.push(`/platform/evidence`) // Ideally filter by ID if list view supports it
    } else if (n.relatedEntityType === 'report' && n.relatedEntityId) {
      router.push(`/platform/gap-analysis?report=${n.relatedEntityId}`)
    } else if (n.relatedEntityType === 'gap' && n.relatedEntityId) {
      router.push(`/platform/gap-analysis`)
    }
  }

  const filteredNotifications = notifications?.filter((n: Notification) => {
    if (filter === "unread") return !n.isRead
    return true
  })

  // Group by date logic could be added here

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />
      default: return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Header
        title="Notifications"
        description="Stay updated with system activities and alerts."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === "all" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === "unread" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"}`}
            >
              Unread
            </button>
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-500/10 transition-colors ml-2 flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              Mark all read
            </button>
          </div>
        }
      />

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
          </div>
        ) : !filteredNotifications || filteredNotifications.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border-white/5">
            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Bell className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No notifications</h3>
            <p className="text-zinc-500 max-w-sm mx-auto text-sm">
              You're all caught up! When system events occur, they'll appear here.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n: Notification) => (
            <div
              key={n.id}
              className={`glass-panel rounded-2xl p-5 flex gap-4 transition-all hover:bg-white/[0.02] cursor-pointer group relative overflow-hidden ${!n.isRead ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/5'}`}
              onClick={() => navigateToRelated(n)}
            >
              <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/5 ${!n.isRead ? 'bg-zinc-800' : 'bg-zinc-900/50'}`}>
                {getIcon(n.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className={`text-base font-bold ${!n.isRead ? 'text-white' : 'text-zinc-400'}`}>{n.title}</h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-600">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className={`text-sm mt-1 leading-relaxed ${!n.isRead ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  {n.message}
                </p>
              </div>
              {!n.isRead && (
                <div className="w-2 h-2 rounded-full bg-blue-500 self-center" />
              )}
              <button
                onClick={(e) => handleMarkRead(n.id, e)}
                className="absolute top-2 right-2 p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                title="Mark as read"
              >
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
