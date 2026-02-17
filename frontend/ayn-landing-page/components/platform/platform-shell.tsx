"use client"

import { type ReactNode, useState, useMemo, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Bell,
  Sun,
  Moon,
  X,
  PanelLeft,
} from "lucide-react"
import PlatformSidebar from "@/components/platform/sidebar-enhanced"
import FloatingAIBar from "@/components/platform/floating-ai-bar"
import { CommandPalette } from "./command-palette"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { useCommandPaletteContext } from "@/components/platform/command-palette-provider"
import { useCommandPalette } from "@/hooks/use-command-palette"
import type { Notification } from "@/types"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export default function PlatformShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()
  const { setOpen: setCommandPaletteOpen } = useCommandPaletteContext()

  // Enable global keyboard shortcuts (⌘K to open command palette)
  useCommandPalette()

  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-close sidebar when viewport is below lg (sidebar becomes overlay, no reserved width)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Close notification dropdown when clicking outside or pressing ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (showNotifications && !target.closest('.notification-dropdown-container')) {
        setShowNotifications(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showNotifications) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showNotifications])

  // Notification data via SWR
  const { data: notifications, mutate: mutateNotifications } = useSWR<Notification[]>(
    isAuthenticated && user ? [`notifications`, user.id] : null,
    () => api.getNotifications(),
    { refreshInterval: 10_000, revalidateOnFocus: false, dedupingInterval: 5_000 },
  )
  const notificationCount = useMemo(
    () => notifications?.filter((n: Notification) => !n.isRead).length ?? 0,
    [notifications],
  )

  // Live Toast for New Notifications
  const lastNotifId = useRef<string | null>(null)
  useEffect(() => {
    const unread = notifications?.filter((n: Notification) => !n.isRead) || []
    if (unread.length > 0) {
      const latest = unread[0]
      if (latest.id !== lastNotifId.current) {
        lastNotifId.current = latest.id
        toast(latest.title, {
          description: latest.message,
          action: {
            label: "View",
            onClick: () => {
              if (latest.relatedEntityType === 'evidence') router.push('/platform/evidence')
              else if (latest.relatedEntityType === 'gap') router.push('/platform/gap-analysis')
              else router.push('/platform/notifications')
            }
          }
        })
      }
    }
  }, [notifications])

  const handleClearNotifications = async () => {
    try {
      await api.markAllNotificationsRead()
      mutateNotifications(
        notifications?.map((n: Notification) => ({ ...n, isRead: true })) ?? [],
        { revalidate: false }
      )
    } catch {
      toast.error("Failed to mark all as read")
    }
  }

  const handleDismissNotification = async (id: string) => {
    try {
      await api.markNotificationRead(id)
      mutateNotifications(
        notifications?.map((n: Notification) => n.id === id ? { ...n, isRead: true } : n) ?? [],
        { revalidate: false }
      )
      const notification = notifications?.find((n: Notification) => n.id === id)
      if (notification?.relatedEntityId && notification.relatedEntityType === 'evidence') {
        router.push('/platform/evidence')
      } else if (notification?.relatedEntityId && notification.relatedEntityType === 'report') {
        router.push(`/platform/gap-analysis?report=${notification.relatedEntityId}`)
      }
    } catch {
      toast.error("Failed to mark as read")
    }
  }

  return (
    <div
      className={cn(
        "flex h-screen overflow-hidden selection:bg-primary/30 relative transition-colors duration-300 text-foreground"
      )}
      data-platform-theme={mounted ? resolvedTheme ?? "dark" : undefined}
    >
      {/* 🌌 Cinematic Background Layer - REMOVED (Using global body gradient) */}
      {/* <div className="cinematic-bg" /> */}

      {/* Backdrop when sidebar is overlay (below lg) */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-[45] lg:hidden backdrop-blur-sm transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <PlatformSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        notificationCount={notificationCount}
      />

      <main id="main-content" className="flex-1 flex flex-col relative transition-all duration-300 ease-in-out w-full max-w-[100vw] overflow-x-hidden min-w-0 lg:ml-0">
        <header className="h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-colors duration-300 platform-header">
          <div className="flex items-center gap-4">
            {/* Open sidebar when it's overlay (below lg) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Open sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>

            {/* Navigation / Command Palette */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-[var(--glass-border)] text-muted-foreground text-sm transition-all group"
            >
              <Search className="w-4 h-4 group-hover:text-foreground transition-colors" />
              <span className="hidden md:inline font-medium">Search...</span>
              <kbd className="hidden md:flex items-center gap-0.5 ml-2 px-1.5 py-0.5 rounded bg-layer-2 border border-[var(--glass-border)] text-[10px] font-mono text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* Notifications */}
            <div className="relative notification-dropdown-container">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-layer-1" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-[320px] glass-panel rounded-3xl p-6 z-50 animate-in slide-in-from-top-2 duration-300 shadow-2xl border border-border bg-layer-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Activity</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={handleClearNotifications} className="text-[10px] text-primary font-bold hover:underline">Mark all read</button>
                      <button onClick={() => setShowNotifications(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X className="w-3 h-3" /></button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {!notifications || notifications.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground italic text-sm">Quiet for now.</p>
                    ) : (
                      notifications.slice(0, 8).map((n: Notification) => (
                        <div
                          key={n.id}
                          className={cn(
                            "flex gap-3 group cursor-pointer hover:bg-layer-3 p-3 rounded-xl transition-all",
                            !n.isRead ? "bg-layer-1 border border-border" : "opacity-70"
                          )}
                          onClick={() => handleDismissNotification(n.id)}
                        >
                          <div className={cn(
                            "w-1 h-full min-h-[2rem] rounded-full flex-shrink-0",
                            !n.isRead
                              ? (n.type === 'error' ? 'bg-destructive' : n.type === 'success' ? 'bg-emerald-500' : 'bg-primary')
                              : 'bg-muted-foreground/30'
                          )} />
                          <div className="flex-1 min-w-0">
                            <h4 className={cn("text-xs font-bold", !n.isRead ? "text-foreground" : "text-muted-foreground")}>{n.title}</h4>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                            <span className="text-[9px] text-muted-foreground/70 mt-1.5 block font-bold uppercase tracking-wider">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!n.isRead && <div className={cn("w-2 h-2 rounded-full mt-1.5", n.type === 'error' ? 'bg-destructive' : n.type === 'success' ? 'bg-emerald-500' : 'bg-primary')} />}
                        </div>
                      ))
                    )}
                  </div>

                  {notifications && notifications.length > 0 && (
                    <button
                      onClick={() => { setShowNotifications(false); router.push('/platform/notifications'); }}
                      className="w-full mt-4 py-3 rounded-2xl bg-layer-3 hover:bg-layer-1 transition-colors text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground text-center border border-border"
                    >
                      View All Activity
                    </button>
                  )}
                </div>
              )}
            </div>



            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className={cn(
                "transition-all duration-300 p-2 rounded-lg hover:scale-110 active:scale-95",
                "text-muted-foreground hover:text-foreground hover:bg-white/5",
              )}
              title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {mounted && (resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
            </button>

            <div className="w-px h-4 bg-[var(--glass-border)]" />
          </div>
        </header>

        <div className={cn(
          "flex-1 overflow-y-auto scroll-smooth transition-colors duration-300",
          pathname?.includes("/horus-ai")
            ? "content-scroll-area min-h-0"
            : "px-6 md:px-10 pt-5 pb-24 content-scroll-area"
        )}>
          <div className={pathname?.includes("/horus-ai") ? "h-full w-full" : "max-w-[1280px] w-full mx-auto"}>
            {children}
          </div>
        </div>
      </main>

      <FloatingAIBar />
      <CommandPalette />
    </div >
  )
}
