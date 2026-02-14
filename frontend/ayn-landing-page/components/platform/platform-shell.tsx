"use client"

import { type ReactNode, useState, useMemo, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import {
  Expand,
  ArrowLeft,
  ArrowRight,
  Search,
  Bell,
  PanelLeft,
  Sun,
  Moon,
  X,
  History,
} from "lucide-react"
import PlatformSidebar from "@/components/platform/sidebar-enhanced"
import FloatingAIBar from "@/components/platform/floating-ai-bar"
import { CommandPalette } from "./command-palette"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { useCommandPaletteContext } from "@/components/platform/command-palette-provider"
import { useCommandPalette } from "@/hooks/use-command-palette"
import type { Notification } from "@/types"
import { cn } from "@/lib/utils"

export default function PlatformShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [platformTheme, setPlatformTheme] = useState<"dark" | "light">("dark")
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()
  const { setOpen: setCommandPaletteOpen } = useCommandPaletteContext()

  // Enable global keyboard shortcuts (⌘K to open command palette)
  useCommandPalette()

  // Load saved platform theme (light/dark) on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem("platform-theme")
    if (stored === "light" || stored === "dark") {
      setPlatformTheme(stored)
    }
  }, [])

  // Persist theme choice
  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("platform-theme", platformTheme)
  }, [platformTheme])

  // Auto-close sidebar on small screens  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false)
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
    const unread = notifications?.filter(n => !n.isRead) || []
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
    await api.markAllNotificationsRead()
    mutateNotifications(
      notifications?.map((n: Notification) => ({ ...n, isRead: true })) ?? [],
      { revalidate: false }
    )
  }

  const handleDismissNotification = async (id: string) => {
    await api.markNotificationRead(id)
    mutateNotifications(
      notifications?.map((n: Notification) => n.id === id ? { ...n, isRead: true } : n) ?? [],
      { revalidate: false }
    )
    // Optional: Navigate logic if needed
    const notification = notifications?.find((n: Notification) => n.id === id)
    if (notification?.relatedEntityId && notification.relatedEntityType === 'evidence') {
      router.push('/platform/evidence')
    } else if (notification?.relatedEntityId && notification.relatedEntityType === 'report') {
      router.push(`/platform/gap-analysis?report=${notification.relatedEntityId}`)
    }
  }

  return (
    <div
      data-platform-theme={platformTheme}
      className="flex h-screen overflow-hidden selection:bg-blue-500/30 relative transition-colors duration-300 bg-[var(--background)] text-[var(--foreground)]"
    >
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[45] md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <PlatformSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        notificationCount={notificationCount}
      />

      <main className="flex-1 flex flex-col relative transition-all duration-300 ease-in-out w-full max-w-[100vw] overflow-x-hidden">
        <header className="h-16 border-b border-[var(--border-subtle)] bg-[var(--surface)]/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <PanelLeft className="w-5 h-5" />
            </button>

            {/* Desktop Sidebar Toggle & Navigation */}
            <div className="hidden md:flex items-center gap-1.5 mr-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-zinc-500 hover:text-blue-500 hover:border-blue-500/30 transition-all active:scale-95"
                title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              >
                <PanelLeft className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-[var(--border-subtle)] mx-1" />

              <button
                onClick={() => router.back()}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-zinc-500 hover:text-blue-500 hover:border-blue-500/30 transition-all active:scale-95"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.forward()}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-zinc-500 hover:text-blue-500 hover:border-blue-500/30 transition-all active:scale-95"
                title="Go Forward"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-zinc-500 text-sm transition-all group"
            >
              <Search className="w-4 h-4 group-hover:text-white transition-colors" />
              <span className="hidden md:inline font-medium">Search...</span>
              <kbd className="hidden md:flex items-center gap-0.5 ml-2 px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-subtle)] text-[10px] font-mono text-zinc-500">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* Archive Shortcut */}
            <button
              onClick={() => router.push('/platform/archive')}
              className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-[var(--surface-hover)] transition-all"
              title="Archive"
            >
              <History className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative notification-dropdown-container">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-[var(--surface-hover)] transition-all"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[var(--surface)]" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-[320px] glass-panel rounded-3xl p-6 z-50 animate-in slide-in-from-top-2 duration-300 shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Activity</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={handleClearNotifications} className="text-[10px] text-blue-500 font-bold hover:underline">Mark all read</button>
                      <button onClick={() => setShowNotifications(false)} className="p-1 text-zinc-600 hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {!notifications || notifications.length === 0 ? (
                      <p className="text-center py-8 text-zinc-600 italic text-sm">Quiet for now.</p>
                    ) : (
                      notifications.slice(0, 8).map((n: Notification) => (
                        <div
                          key={n.id}
                          className={`flex gap-3 group cursor-pointer hover:bg-[var(--surface-hover)] p-3 rounded-xl transition-all ${!n.isRead ? 'bg-[var(--surface)] border border-[var(--border-subtle)]' : 'opacity-70'}`}
                          onClick={() => handleDismissNotification(n.id)}
                        >
                          <div className={`w-1 h-full min-h-[2rem] rounded-full flex-shrink-0 ${!n.isRead ? (n.type === 'error' ? 'bg-red-500' : n.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500') : 'bg-zinc-700'}`} />
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-xs font-bold ${!n.isRead ? 'text-zinc-100' : 'text-zinc-500'}`}>{n.title}</h4>
                            <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                            <span className="text-[9px] text-zinc-600 mt-1.5 block font-bold uppercase tracking-wider">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!n.isRead && <div className={`w-2 h-2 rounded-full ${n.type === 'error' ? 'bg-red-500' : n.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'} mt-1.5`} />}
                        </div>
                      ))
                    )}
                  </div>

                  {notifications && notifications.length > 0 && (
                    <button
                      onClick={() => { setShowNotifications(false); router.push('/platform/notifications'); }}
                      className="w-full mt-4 py-3 rounded-2xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] transition-colors text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white text-center border border-[var(--border-subtle)]"
                    >
                      View All Activity
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setPlatformTheme(prev => (prev === "dark" ? "light" : "dark"))}
              className={cn(
                "transition-all duration-300 p-2 rounded-lg hover:scale-110 active:scale-95",
                platformTheme === "light"
                  ? "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
                  : "text-zinc-500 hover:text-white hover:bg-white/5",
              )}
              title={platformTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={platformTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {platformTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="w-px h-4 bg-[var(--border-light)]" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 md:px-10 pt-6 pb-32 scroll-smooth transition-colors duration-300 bg-[var(--bg-deep)]">
          <div className="max-w-[1280px] w-full mx-auto">
            {children}
          </div>
        </div>
      </main>

      <FloatingAIBar />
      <CommandPalette />
    </div>
  )
}
