"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Archive,
  BarChart3,
  Bot,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  Bell,
  Sparkles,
} from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// ─── Navigation structure ─────────────────────────────────────────────────────

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: "ai"
  notifiable?: boolean
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "AI Tools",
    items: [
      { href: "/platform/horus-ai", label: "Horus AI", icon: Bot, badge: "ai" },
    ],
  },
  {
    title: "Quality Management",
    items: [
      { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/platform/evidence", label: "Evidence", icon: FileText },
      { href: "/platform/gap-analysis", label: "Gap Analysis", icon: Search },
      { href: "/platform/assessments", label: "Assessments", icon: BarChart3 },
    ],
  },
  {
    title: "Reports",
    items: [
      { href: "/platform/archive", label: "Accreditation Archive", icon: Archive },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/platform/notifications", label: "Notifications", icon: Bell, notifiable: true },
      { href: "/platform/settings", label: "Settings", icon: Settings },
    ],
  },
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

  return (
    <aside
      className={cn(
        "group/sidebar sticky top-0 flex h-screen flex-col border-r border-border/50 bg-sidebar transition-all duration-300 ease-in-out",
        open ? "w-[260px]" : "w-[68px]",
      )}
    >
      {/* ── Brand ────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-border/50 px-4",
          open ? "justify-between" : "justify-center",
        )}
      >
        <Link href="/platform/dashboard" className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--brand)] to-[var(--brand-muted)] shadow-sm shadow-[var(--brand)]/20">
            <span className="text-xs font-bold text-[var(--brand-foreground)]">A</span>
            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
          </div>
          <div
            className={cn(
              "overflow-hidden transition-all duration-300",
              open ? "w-auto opacity-100" : "w-0 opacity-0",
            )}
          >
            <p className="whitespace-nowrap text-sm font-semibold leading-tight text-foreground">
              Ayn Platform
            </p>
            <p className="whitespace-nowrap text-[10px] leading-tight text-muted-foreground">
              Quality Assurance
            </p>
          </div>
        </Link>

        {open && (
          <button
            type="button"
            onClick={onToggle}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Navigation groups ───────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              {/* Group label */}
              {open ? (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
                  {group.title}
                </p>
              ) : (
                <div className="mx-auto mb-2 h-px w-6 bg-border/60" />
              )}

              {/* Group items */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`)
                  const hasNotification =
                    item.notifiable === true && notificationCount > 0

                  const linkElement = (
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                        active
                          ? "bg-[var(--brand)]/10 font-medium text-[var(--brand)] shadow-[0_0_20px_-5px_rgba(var(--brand-rgb,0,0,0),0.15)]"
                          : "text-muted-foreground hover:bg-accent/80 hover:text-foreground",
                      )}
                    >
                      {/* Active indicator bar */}
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--brand)]" />
                      )}
                      
                      {/* Active glow effect */}
                      {active && (
                        <span className="absolute inset-0 rounded-lg bg-[var(--brand)]/5 blur-md -z-10" />
                      )}

                      {/* Icon with optional notification dot */}
                      <span className="relative shrink-0">
                        <Icon
                          className={cn(
                            "h-4 w-4 transition-colors",
                            active && "text-[var(--brand)]",
                          )}
                        />
                        {hasNotification && !open && (
                          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--brand)] ring-2 ring-sidebar" />
                        )}
                      </span>

                      {/* Label */}
                      <span
                        className={cn(
                          "flex-1 overflow-hidden whitespace-nowrap transition-all duration-300",
                          open
                            ? "max-w-[160px] opacity-100"
                            : "max-w-0 opacity-0",
                        )}
                      >
                        {item.label}
                      </span>

                      {/* Notification count badge */}
                      {open && hasNotification && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--brand)] px-1.5 text-[10px] font-bold text-[var(--brand-foreground)]">
                          {notificationCount > 99
                            ? "99+"
                            : notificationCount}
                        </span>
                      )}

                      {/* AI badge */}
                      {open && item.badge === "ai" && (
                        <span className="flex items-center gap-1 rounded-md bg-[var(--brand)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--brand)]">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI
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
                          {hasNotification &&
                            ` (${notificationCount})`}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return (
                    <div key={item.href}>{linkElement}</div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* ── Bottom: theme toggle ────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border/50 px-3 py-3">
        <div
          className={cn(
            "flex items-center",
            open ? "justify-between px-1" : "justify-center",
          )}
        >
          {open && (
            <span className="text-[11px] text-muted-foreground">
              Theme
            </span>
          )}
          <ThemeToggle variant="icon" />
        </div>
      </div>
    </aside>
  )
}
