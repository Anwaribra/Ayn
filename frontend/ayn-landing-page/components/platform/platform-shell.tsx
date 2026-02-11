"use client"

import { type ReactNode, useState, useMemo, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import useSWR from "swr"
import {
  Search,
  Bell,
  History,
  ArrowLeft,
  ArrowRight,
  Command,
  PanelLeft,
  HelpCircle,
  X,
} from "lucide-react"
import PlatformSidebar from "@/components/platform-sidebar"
import FloatingAIBar from "@/components/platform/floating-ai-bar"
import { CommandPalette } from "./command-palette"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { useCommandPaletteContext } from "@/components/platform/command-palette-provider"
import { useCommandPalette } from "@/hooks/use-command-palette"
import type { Notification } from "@/types"

export default function PlatformShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { setOpen: setCommandPaletteOpen } = useCommandPaletteContext()
  
  // Enable global keyboard shortcuts (⌘K to open command palette)
  useCommandPalette()

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

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (showNotifications && !target.closest('.notification-dropdown-container')) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  // Notification data via SWR
  const { data: notifications, mutate: mutateNotifications } = useSWR<Notification[]>(
    isAuthenticated && user ? [`notifications`, user.id] : null,
    () => api.getNotifications(),
    { refreshInterval: 60_000, revalidateOnFocus: false, dedupingInterval: 30_000 },
  )
  const notificationCount = useMemo(
    () => notifications?.filter((n: Notification) => !n.read).length ?? 0,
    [notifications],
  )

  const handleClearNotifications = () => {
    // In a real app, you'd call an API to mark all as read
    mutateNotifications(
      notifications?.map(n => ({ ...n, read: true })) ?? [],
      { revalidate: false }
    )
  }

  const handleDismissNotification = (id: string) => {
    mutateNotifications(
      notifications?.filter(n => n.id !== id) ?? [],
      { revalidate: false }
    )
  }

  return (
    <div className="flex h-screen bg-[#07090E] text-[#F1F5F9] overflow-hidden selection:bg-blue-500/30 relative">
      <div className="cinematic-bg" />

      {/* Sidebar */}
      <PlatformSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
        notificationCount={notificationCount}
      />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Notification backdrop */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden transition-all duration-300 ease-in-out">
        {/* App Title — V3 */}
        <div className="px-6 md:px-10 pt-4 pb-1">
          <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-[0.15em]">
            AYN — Education Quality & Compliance
          </p>
        </div>
        {/* TopBar — V3 */}
        <header className="h-16 px-6 md:px-10 flex items-center justify-between relative z-20 pointer-events-none">
          <div className="flex items-center gap-4 md:gap-6 pointer-events-auto">
            {/* Sidebar toggle when closed */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                title="Open sidebar"
                className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white transition-all bg-[#0A0C10] rounded-xl border border-white/5 hover:border-white/10 group active:scale-95 shadow-xl"
              >
                <PanelLeft className="w-5 h-5 transition-transform duration-300 rotate-180" />
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="p-1.5 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.forward()}
                className="p-1.5 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5"
                title="Go forward"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative group min-w-[200px] md:min-w-[320px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-blue-500 transition-colors z-10" />
              <input
                type="text"
                readOnly
                onClick={() => setCommandPaletteOpen(true)}
                placeholder="Search hub..."
                className="w-full h-9 bg-white/5 border border-white/5 rounded-lg pl-11 pr-12 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-600 cursor-pointer text-white"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 pointer-events-none">
                <Command className="w-2 h-2 text-zinc-600" />
                <span className="text-[9px] font-bold text-zinc-600">K</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 pointer-events-auto">
            <button className="hidden md:block text-zinc-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg" title="History">
              <History className="w-4 h-4" />
            </button>
            <div className="relative notification-dropdown-container">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-zinc-500 hover:text-white transition-colors relative p-2 hover:bg-white/5 rounded-lg"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 px-1 min-w-[14px] h-[14px] bg-red-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-[#07090E] shadow-sm">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-[320px] glass-panel rounded-3xl p-6 z-50 animate-in slide-in-from-top-2 duration-300 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Activity</h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleClearNotifications}
                        className="text-[10px] text-blue-500 font-bold hover:underline"
                      >
                        Mark all read
                      </button>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="p-1 text-zinc-600 hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {!notifications || notifications.length === 0 ? (
                      <p className="text-center py-8 text-zinc-600 italic text-sm">Quiet for now.</p>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div 
                          key={n.id} 
                          className="flex gap-4 group cursor-pointer hover:bg-white/[0.02] p-2 rounded-xl transition-colors"
                          onClick={() => handleDismissNotification(n.id)}
                        >
                          <div className={`w-1 h-10 rounded-full flex-shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-zinc-800'}`} />
                          <div className="flex-1">
                            <h4 className={`text-sm font-bold ${!n.read ? 'text-zinc-100' : 'text-zinc-500'}`}>{n.title}</h4>
                            <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">{n.body}</p>
                            <span className="text-[10px] text-zinc-700 mt-1.5 block font-bold uppercase tracking-tighter">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />}
                        </div>
                      ))
                    )}
                  </div>
                  {notifications && notifications.length > 0 && (
                    <button 
                      onClick={() => { setShowNotifications(false); router.push('/platform/notifications'); }}
                      className="w-full mt-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white text-center"
                    >
                      View All Activity
                    </button>
                  )}
                </div>
              )}
            </div>
            <button className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg" title="Help">
              <HelpCircle className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button className="px-3 md:px-4 py-1.5 glass-panel rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors border-none">
              <span className="hidden sm:inline">{user?.name ?? "Institution Alpha"}</span>
              <span className="sm:hidden font-mono">I-A</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 md:px-10 pt-4 pb-20 scroll-smooth">
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
