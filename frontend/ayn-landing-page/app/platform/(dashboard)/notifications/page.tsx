"use client"

import React, { useMemo, useState } from "react"
import useSWR from "swr"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/platform/header"
import { Bell, Check, Loader2, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ar as arLocale } from "date-fns/locale"
import type { Notification } from "@/types"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useUiLanguage } from "@/lib/ui-language-context"
import { usePageTitle } from "@/hooks/use-page-title"
import { cn } from "@/lib/utils"
import { notificationsSwrKey } from "@/lib/notifications-cache"

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { isArabic } = useUiLanguage()
  usePageTitle(isArabic ? "الإشعارات" : "Notifications")
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const { data: notifications, mutate, isLoading } = useSWR<Notification[]>(
    notificationsSwrKey(user?.id),
    () => api.getNotifications(),
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 15000,
    }
  )

  const handleMarkAllRead = React.useCallback(async () => {
    try {
      await api.markAllNotificationsRead()
      mutate(
        notifications?.map((n: Notification) => ({ ...n, isRead: true })) ?? [],
        { revalidate: false }
      )
    } catch {
      toast.error(isArabic ? "تعذر تعيين الكل كمقروء" : "Failed to mark all as read")
    }
  }, [mutate, notifications, isArabic])

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await api.markNotificationRead(id)
      mutate(
        notifications?.map((n: Notification) => n.id === id ? { ...n, isRead: true } : n) ?? [],
        { revalidate: false }
      )
    } catch {
      toast.error(isArabic ? "تعذر تعيين الإشعار كمقروء" : "Failed to mark as read")
    }
  }

  const navigateToRelated = async (n: Notification) => {
    await handleMarkRead(n.id)

    if (n.relatedEntityType === 'evidence' && n.relatedEntityId) {
      router.push(`/platform/evidence`) // Ideally filter by ID if list view supports it
    } else if (n.relatedEntityType === 'report' && n.relatedEntityId) {
      router.push(`/platform/gap-analysis?report=${n.relatedEntityId}`)
    } else if (n.relatedEntityType === 'gap' && n.relatedEntityId) {
      router.push(`/platform/gap-analysis`)
    }
  }

  const filteredNotifications = useMemo(
    () => notifications?.filter((n: Notification) => (filter === "unread" ? !n.isRead : true)) ?? [],
    [filter, notifications]
  )

  // Group by date logic could be added here

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-[var(--status-success)]" />
      case 'error': return <AlertTriangle className="w-5 h-5 text-destructive" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-[var(--status-warning)]" />
      default: return <Info className="w-5 h-5 text-primary" />
    }
  }

  return (
    <div className={cn("mx-auto platform-container-default space-y-5", isArabic && "font-arabic")}>
      <Header
        title={isArabic ? "الإشعارات" : "Notifications"}
        description={
          isArabic
            ? "تابع نشاط المنصة والتنبيهات."
            : "Stay updated with system activities and alerts."
        }
        actions={
          <div className={cn("flex flex-wrap gap-2", isArabic && "flex-row-reverse")}>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "min-h-[38px] rounded-[12px] px-3 text-sm font-medium transition-colors",
                filter === "all" ? "bg-primary text-primary-foreground" : "glass-button text-muted-foreground hover:text-foreground",
              )}
            >
              {isArabic ? "الكل" : "All"}
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={cn(
                "min-h-[38px] rounded-[12px] px-3 text-sm font-medium transition-colors",
                filter === "unread" ? "bg-primary text-primary-foreground" : "glass-button text-muted-foreground hover:text-foreground",
              )}
            >
              {isArabic ? "غير مقروء" : "Unread"}
            </button>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className={cn(
                "flex min-h-[38px] items-center gap-1.5 rounded-[12px] px-3 text-sm font-medium text-primary glass-button transition-colors hover:bg-primary/10",
                  "ms-2",
                  isArabic && "flex-row-reverse",
              )}
            >
              <Check className="w-4 h-4" />
              {isArabic ? "تعيين الكل كمقروء" : "Mark all read"}
            </button>
          </div>
        }
      />

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center rounded-[20px] border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-[20px] border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)]">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-foreground">
              {isArabic ? "لا توجد إشعارات" : "No notifications"}
            </h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              {isArabic
                ? "لا جديد حالياً. عند حدوث أحداث في المنصة ستظهر هنا."
                : "You're all caught up! When system events occur, they'll appear here."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((n: Notification) => (
            <div
              key={n.id}
              className={cn(
                "group relative flex cursor-pointer gap-4 overflow-hidden rounded-[18px] border p-4 transition-colors",
                !n.isRead
                  ? "border-primary/25 bg-primary/5"
                  : "border-[var(--glass-border)] bg-[var(--glass-soft-bg)] hover:bg-[var(--glass-strong-bg)]",
              )}
              onClick={() => navigateToRelated(n)}
            >
              <div className={cn("mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)]", !n.isRead ? "" : "opacity-80")}>
                {getIcon(n.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h4 className={cn("text-sm font-semibold", !n.isRead ? "text-foreground" : "text-muted-foreground")}>{n.title}</h4>
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                      locale: isArabic ? arLocale : undefined,
                    })}
                  </span>
                </div>
                <p className={cn("mt-1 text-sm leading-relaxed", !n.isRead ? "text-foreground/80" : "text-muted-foreground")}>
                  {n.message}
                </p>
              </div>
              {!n.isRead && (
                <div className="mt-4 h-2 w-2 self-start rounded-full bg-primary" />
              )}
              <button
                type="button"
                onClick={(e) => handleMarkRead(n.id, e)}
                className="absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-background/80 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:border-primary/30 hover:text-primary"
                title={isArabic ? "تعيين كمقروء" : "Mark as read"}
                aria-label={isArabic ? "تعيين كمقروء" : "Mark as read"}
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
