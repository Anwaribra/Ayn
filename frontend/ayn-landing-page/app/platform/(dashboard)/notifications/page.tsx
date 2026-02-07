"use client"

import { Header } from "@/components/platform/header"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { api } from "@/lib/api"
import useSWR from "swr"
import { toast } from "sonner"
import { Bell, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Notification } from "@/lib/types"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsPageContent />
    </ProtectedRoute>
  )
}

function NotificationsPageContent() {
  const { data: notifications, isLoading, mutate } = useSWR("notifications", () => api.getNotifications())

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark as read")
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!notifications) return
    try {
      for (const notification of notifications.filter((n: Notification) => !n.read)) {
        await api.markNotificationAsRead(notification.id)
      }
      mutate()
      toast.success("All marked as read")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark all as read")
    }
  }

  const unreadCount = notifications?.filter((n: Notification) => !n.read).length || 0

  return (
    <div className="min-h-screen bg-background">
      <Header title="Notifications" description={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`} />

      <div className="p-4 md:p-[var(--spacing-content)] space-y-6">
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
              <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : notifications?.length === 0 ? (
          <Empty className="bg-card border border-border rounded-xl py-16 border-solid shadow-sm">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Bell className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No notifications</EmptyTitle>
              <EmptyDescription>You're all caught up!</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-3">
            {notifications?.map((notification: Notification) => (
              <div
                key={notification.id}
                className={`bg-card border rounded-xl p-6 shadow-sm transition-all ${
                  notification.read ? "border-border" : "border-primary/30 bg-accent/30"
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
