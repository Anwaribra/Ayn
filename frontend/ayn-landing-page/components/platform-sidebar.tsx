"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Brain,
  Archive,
  BookOpen,
  TriangleAlert,
  BarChart3,
  Settings,
  UserCircle2,
  PanelLeft,
  Sparkles,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

// ─── Navigation structure ─────────────────────────────────────────────────────

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navItems: NavItem[] = [
  { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/platform/horus-ai", label: "Horus AI", icon: Brain, badge: "Active" },
  { href: "/platform/evidence", label: "Evidence", icon: Archive },
  { href: "/platform/standards", label: "Standards", icon: BookOpen },
  { href: "/platform/gap-analysis", label: "Gap Analysis", icon: TriangleAlert },
  { href: "/platform/archive", label: "Reports", icon: BarChart3 },
  { href: "/platform/settings", label: "Settings", icon: Settings },
]

// ─── Sidebar component ───────────────────────────────────────────────────────

interface PlatformSidebarProps {
  open: boolean
  onToggle: () => void
  notificationCount?: number
}

export default function PlatformSidebar({
  open,
  onToggle,
  notificationCount = 0,
}: PlatformSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <aside
      className={cn(
        "group/sidebar sticky top-0 flex h-screen flex-col transition-all duration-300 ease-in-out",
        "bg-[#05070A] border-r border-white/[0.06]",
        open ? "w-[260px]" : "w-[68px]",
      )}
    >
      {/* ── Brand ────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-white/[0.06] px-4",
          open ? "justify-between" : "justify-center",
        )}
      >
        <Link href="/platform/dashboard" className="flex items-center gap-2.5">
          {/* Logo mark */}
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20">
            <span className="text-sm font-black text-white italic">عين</span>
          </div>
          <div
            className={cn(
              "overflow-hidden transition-all duration-300",
              open ? "w-auto opacity-100" : "w-0 opacity-0",
            )}
          >
            <p className="whitespace-nowrap text-sm font-semibold leading-tight text-white">
              Ayn Intelligence
            </p>
            <p className="whitespace-nowrap text-[9px] leading-tight text-zinc-600 font-bold uppercase tracking-[0.2em]">
              Quality Hub
            </p>
          </div>
        </Link>

        {open && (
          <button
            type="button"
            onClick={onToggle}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Collapse sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)

            const linkElement = (
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-blue-600/10 text-blue-400"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200",
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-blue-500" />
                )}

                {/* Icon */}
                <span className="relative shrink-0">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      active && "text-blue-400",
                    )}
                  />
                </span>

                {/* Label */}
                <span
                  className={cn(
                    "flex-1 overflow-hidden whitespace-nowrap transition-all duration-300 font-medium",
                    open
                      ? "max-w-[160px] opacity-100"
                      : "max-w-0 opacity-0",
                  )}
                >
                  {item.label}
                </span>

                {/* Badge */}
                {open && item.badge && (
                  <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-500 uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {item.badge}
                  </span>
                )}
              </Link>
            )

            // In collapsed state, wrap each item with a tooltip
            if (!open) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {linkElement}
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="text-xs font-medium"
                  >
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <div key={item.href}>{linkElement}</div>
            )
          })}
        </div>
      </nav>

      {/* ── User Panel ──────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.06] p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
            open ? "" : "justify-center",
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-white/5">
            <UserCircle2 className="h-4 w-4 text-zinc-400" />
          </div>
          <div
            className={cn(
              "overflow-hidden transition-all duration-300",
              open ? "w-auto opacity-100" : "w-0 opacity-0",
            )}
          >
            <p className="whitespace-nowrap text-[13px] font-semibold text-zinc-200">
              {user?.name ?? "User"}
            </p>
            <p className="whitespace-nowrap text-[9px] text-zinc-600 font-bold uppercase tracking-[0.15em]">
              Quality Director
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
