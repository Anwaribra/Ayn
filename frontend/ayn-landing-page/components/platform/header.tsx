"use client"

import { useAuth } from "@/lib/auth-context"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import useSWR from "swr"
import { api } from "@/lib/api"

interface HeaderProps {
  title: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  const { user } = useAuth()
  const { data: unreadNotifications } = useSWR(user ? "unread-notifications" : null, () => api.getUnreadNotifications())

  const unreadCount = unreadNotifications?.length || 0

  return (
    <header className="flex items-center justify-between py-6 px-4 md:px-8 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="ml-12 md:ml-0">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>

      <div className="flex items-center gap-4">
        <Link href="/platform/notifications">
          <Button variant="ghost" size="icon" className="relative">
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
