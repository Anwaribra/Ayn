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

  // Notification count via SWR
  const { data: notifications } = useSWR<Notification[]>(
    isAuthenticated && user ? [`notifications`, user.id] : null,
    () => api.getNotifications(),
    { refreshInterval: 60_000, revalidateOnFocus: false, dedupingInterval: 30_000 },
  )
  const notificationCount = useMemo(
    () => notifications?.filter((n: Notification) => !n.read).length ?? 0,
    [notifications],
  )

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
            <button
              onClick={() => router.push("/platform/notifications")}
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
