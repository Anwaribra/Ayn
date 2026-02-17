"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

import PlatformSidebar from "./sidebar-enhanced"
import { Bell, Menu } from "lucide-react"

/* -------------------------------------------------------------------------- */
/* 🧠 Helpers */
/* -------------------------------------------------------------------------- */

const fetcher = (url: string) => fetch(url).then(res => res.json())

/* -------------------------------------------------------------------------- */
/* 🔔 Notification Dropdown Component (Internal) */
/* -------------------------------------------------------------------------- */

function NotificationDropdown({
  notifications,
}: {
  notifications: any[]
}) {
  return (
    <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-background/80 backdrop-blur-xl border shadow-xl z-50">
      <div className="p-4 border-b font-medium">Notifications</div>

      <div className="max-h-96 overflow-y-auto">
        {notifications?.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">
            No notifications
          </div>
        )}

        {notifications?.map((n, i) => (
          <div
            key={i}
            className="p-4 text-sm border-b hover:bg-muted/40 transition"
          >
            {n.title}
          </div>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* 🧱 Platform Shell */
/* -------------------------------------------------------------------------- */

export default function PlatformShell({
  children,
}: {
  children: React.ReactNode
}) {
  /* ---------------------------------------------------------------------- */
  /* 📱 Sidebar State */
  /* ---------------------------------------------------------------------- */

  const [sidebarOpen, setSidebarOpen] = useState(true)

  /* ---------------------------------------------------------------------- */
  /* 🔔 Notifications Logic */
  /* ---------------------------------------------------------------------- */

  const { data: notifications = [] } = useSWR(
    "/api/notifications",
    fetcher
  )

  const [showNotifications, setShowNotifications] = useState(false)

  /* ---------------------------------------------------------------------- */
  /* 🎨 Theme Logic */
  /* ---------------------------------------------------------------------- */

  const { theme, setTheme } = useTheme()

  /* ---------------------------------------------------------------------- */
  /* 📐 Responsive Fix */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  /* ---------------------------------------------------------------------- */
  /* 🖼 Layout */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ------------------------------------------------------------------ */}
      {/* Sidebar */}
      {/* ------------------------------------------------------------------ */}

      <PlatformSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        notificationCount={notifications.length}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Main Area */}
      {/* ------------------------------------------------------------------ */}

      <main
        className={cn(
          "flex flex-1 flex-col min-w-0 transition-all duration-300",
          sidebarOpen ? "md:ml-64" : "md:ml-[72px]"
        )}
      >
        {/* -------------------------------------------------------------- */}
        {/* Topbar */}
        {/* -------------------------------------------------------------- */}

        <header className="flex items-center justify-between h-16 px-6 border-b bg-background/70 backdrop-blur-md sticky top-0 z-40">

          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl hover:bg-muted transition"
            >
              <Menu size={20} />
            </button>

            <span className="font-semibold">Platform</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4 relative">

            {/* Theme Toggle */}
            <button
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              className="p-2 rounded-xl hover:bg-muted transition"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() =>
                  setShowNotifications(!showNotifications)
                }
                className="p-2 rounded-xl hover:bg-muted transition relative"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 text-xs bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationDropdown
                  notifications={notifications}
                />
              )}
            </div>
          </div>
        </header>

        {/* -------------------------------------------------------------- */}
        {/* Page Content */}
        {/* -------------------------------------------------------------- */}

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
