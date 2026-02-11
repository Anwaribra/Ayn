"use client"

import {
  type ReactNode,
  Fragment,
  useState,
  useMemo,
} from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import useSWR from "swr"
import {
  PanelLeftOpen,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Search,
  History,
  ArrowLeft,
  ArrowRight,
  Command,
  PanelLeft,
} from "lucide-react"
import PlatformSidebar from "@/components/platform-sidebar"
import FloatingAIBar from "@/components/platform/floating-ai-bar"
import { CommandPalette, CommandPaletteTrigger } from "./command-palette"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import type { Notification } from "@/types"

// ─── Route labels for auto-breadcrumbs ───────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  platform: "Platform",
  dashboard: "Dashboard",
  "horus-ai": "Horus AI",
  evidence: "Evidence",
  "gap-analysis": "Gap Analysis",
  assessments: "Assessments",
  archive: "Reports",
  standards: "Standards",
  notifications: "Notifications",
  settings: "Settings",
  new: "New",
  edit: "Edit",
  review: "Review",
  upload: "Upload",
  calendar: "Calendar",
  analytics: "Analytics",
  "ai-tools": "AI Tools",
  overview: "Overview",
}

// ─── Shell component ─────────────────────────────────────────────────────────

export default function PlatformShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()

  // ── Notification count via SWR ──────────────────────────────────────────
  const { data: notifications } = useSWR<Notification[]>(
    isAuthenticated ? "notifications" : null,
    () => api.getNotifications(),
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    },
  )
  const notificationCount = useMemo(
    () => notifications?.filter((n) => !n.read).length ?? 0,
    [notifications],
  )

  return (
    <div className="flex min-h-screen bg-[#07090E] text-[#E8ECF4]">
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <PlatformSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        notificationCount={notificationCount}
      />

      {/* ── Main content area ──────────────────────────────────────────── */}
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* ── Top header bar (V3 TopBar) ─────────────────────────────── */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-[#07090E]/80 px-4 backdrop-blur-xl">
          {/* Left side: sidebar toggle + nav buttons */}
          <div className="flex min-w-0 items-center gap-2">
            {!sidebarOpen && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-zinc-600 hover:text-white hover:bg-white/5"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Expand sidebar
                </TooltipContent>
              </Tooltip>
            )}

            {/* Browser-style nav buttons */}
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => router.back()}
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-700 hover:text-zinc-300 hover:bg-white/5 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => router.forward()}
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-700 hover:text-zinc-300 hover:bg-white/5 transition-colors"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Center: Search bar */}
          <div className="flex-1 flex justify-center max-w-lg">
            <CommandPaletteTrigger />
          </div>

          {/* Right side: activity + notifications + menu */}
          <div className="flex items-center gap-2">
            {/* Activity */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-colors">
                  <History className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Activity</TooltipContent>
            </Tooltip>

            {/* Notification bell */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="relative flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-colors"
                  onClick={() => router.push("/platform/notifications")}
                >
                  <Bell className="h-4 w-4" />
                  {notificationCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white ring-2 ring-[#07090E]">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {notificationCount > 0
                  ? `${notificationCount} unread`
                  : "Notifications"}
              </TooltipContent>
            </Tooltip>

            {/* Sidebar toggle for mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-colors md:hidden"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Toggle sidebar</TooltipContent>
            </Tooltip>

            {/* User avatar dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative ml-0.5 h-8 w-8 rounded-full hover:bg-white/5"
                  size="icon"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-gradient-to-br from-violet-600/20 to-blue-600/20 text-xs font-semibold text-blue-400 border border-white/5">
                      {user?.name
                        ?.charAt(0)
                        ?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#0C0F16] border-white/[0.06]">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none text-zinc-200">
                      {isAuthenticated ? user?.name : "Guest"}
                    </p>
                    <p className="text-xs leading-none text-zinc-500">
                      {isAuthenticated ? user?.email : "Not signed in"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="text-zinc-400 hover:text-white focus:text-white hover:bg-white/5 focus:bg-white/5"
                    onClick={() => router.push("/platform/settings")}
                  >
                    <Settings />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-zinc-400 hover:text-white focus:text-white hover:bg-white/5 focus:bg-white/5"
                    onClick={() => router.push("/platform/notifications")}
                  >
                    <Bell />
                    Notifications
                    {notificationCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600/10 px-1.5 text-[10px] font-bold text-blue-400">
                        {notificationCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                {isAuthenticated && (
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="text-red-400 hover:text-red-300 focus:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10"
                  >
                    <LogOut />
                    Log out
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* ── Floating AI Bar (all pages except Horus AI) ────────────────── */}
      <FloatingAIBar />

      {/* ── Command Palette ───────────────────────────────────────────── */}
      <CommandPalette />
    </div>
  )
}
