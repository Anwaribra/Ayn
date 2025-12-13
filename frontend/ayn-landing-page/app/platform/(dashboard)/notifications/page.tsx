"use client"

import { Header } from "@/components/platform/header"
import { api } from "@/lib/api"
import useSWR from "swr"
import { Bell, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Notification } from "@/lib/types"

export default function NotificationsPage() {
  const { data: notifications, isLoading, mutate } = useSWR("notifications", () => api.getNotifications())

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id)
      mutate()
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!notifications) return
    try {
      for (const notification of notifications.filter((n: Notification) => !n.read)) {
        await api.markNotificationAsRead(notification.id)
      }
      mutate()
    } catch (err) {
      console.error(err)
    }
  }

  const unreadCount = notifications?.filter((n: Notification) => !n.read).length || 0

  return (
    <div className="min-h-screen">
      <Header title="Notifications" description={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`} />

      <div className="p-4 md:p-8 space-y-6">
        {/* Actions Bar */}
        {unreadCount > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          </div>
        )}

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card/50 border border-border rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : notifications?.length === 0 ? (
          <div className="text-center py-16 bg-card/50 border border-border rounded-xl">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No notifications</h3>
            <p className="text-muted-foreground">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications?.map((notification: Notification) => (
              <div
                key={notification.id}
                className={`bg-card/50 backdrop-blur-sm border rounded-xl p-6 transition-all ${
                  notification.read ? "border-border" : "border-foreground/20 bg-accent/20"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${notification.read ? "bg-muted" : "bg-foreground/10"}`}>
                      <Bell className={`w-5 h-5 ${notification.read ? "text-muted-foreground" : "text-foreground"}`} />
                    </div>
                    <div>
                      <h3 className={`font-medium ${notification.read ? "text-muted-foreground" : "text-foreground"}`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!notification.read && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
