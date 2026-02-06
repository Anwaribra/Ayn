"use client"

import React from "react"
import { useAuth } from "@/lib/auth-context"
import { Bell, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import useSWR from "swr"
import { api } from "@/lib/api"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

/** Left offset on mobile to clear the fixed sidebar menu button (3rem = 48px) */
const SIDEBAR_MOBILE_OFFSET = "ml-12 md:ml-0"

export interface HeaderBreadcrumbItem {
  label: string
  href?: string
}

interface HeaderProps {
  title: string
  description?: string
  breadcrumbs?: HeaderBreadcrumbItem[]
}

export function Header({ title, description, breadcrumbs }: HeaderProps) {
  const { user } = useAuth()
  const { data: unreadNotifications } = useSWR(user ? "unread-notifications" : null, () => api.getUnreadNotifications())

  const unreadCount = unreadNotifications?.length || 0
  const notificationsAriaLabel = unreadCount > 0
    ? `Notifications (${unreadCount} unread)`
    : "Notifications"

  return (
    <header className="flex items-center justify-between py-6 px-4 md:px-[var(--spacing-content)] border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-30">
      <div className={SIDEBAR_MOBILE_OFFSET + " min-w-0 flex-1"}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb className="mb-2">
            <BreadcrumbList>
              {breadcrumbs.map((item, i) => (
                <React.Fragment key={i}>
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {i < breadcrumbs.length - 1 && (
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <h1 className="text-2xl font-bold text-foreground truncate">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {user && (
          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
              {user.name?.split(" ")[0] ?? "User"}
            </span>
          </div>
        )}
        <Link href="/platform/notifications" aria-label={notificationsAriaLabel}>
          <Button variant="ghost" size="icon" className="relative" aria-label={notificationsAriaLabel}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </Link>
      </div>
    </header>
  )
}
