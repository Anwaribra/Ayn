"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Archive,
  BarChart3,
  Bot,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Upload,
  Bell,
  Building2,
} from "lucide-react"

import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// ─── Grouped Navigation ──────────────────────────────────────────────────────

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "AI Tools",
    items: [
      { href: "/platform/horus-ai", label: "Horus AI", icon: Bot },
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
      { href: "/platform/archive", label: "Archive", icon: Archive },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/platform/settings", label: "Settings", icon: Settings },
    ],
  },
]

export default function PlatformSidebar({ open }: { open: boolean }) {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-border/60 bg-sidebar transition-[width] duration-300",
        open ? "w-64" : "w-16"
      )}
    >
      {/* Logo / Brand */}
      <div className={cn("flex items-center gap-3 px-4 py-5", open ? "justify-start" : "justify-center")}>
        <Link href="/platform/horus-ai" className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-xs font-bold text-[var(--brand-foreground)] shadow-sm">
            A
          </span>
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-all duration-300",
              open ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
            )}
          >
            Ayn Platform
          </span>
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            {open && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                      active
                        ? "bg-[var(--brand)]/10 text-[var(--brand)] font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 h-5 w-[3px] rounded-full bg-[var(--brand)]" />
                    )}
                    <Icon className={cn("h-4 w-4 shrink-0", active && "text-[var(--brand)]")} />
                    <span
                      className={cn(
                        "overflow-hidden whitespace-nowrap transition-all duration-300",
                        open ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto border-t border-border/60 px-3 py-4">
        {open && (
          <div className="mb-4 rounded-lg border border-border/60 bg-accent/30 p-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[var(--brand)]/10 flex items-center justify-center">
                <span className="text-xs font-bold text-[var(--brand)]">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {isAuthenticated ? user?.name : "Not connected"}
                </p>
                {isAuthenticated && user?.email ? (
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Sign in to sync</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={cn("flex items-center", open ? "justify-between" : "justify-center")}>
          {open && <span className="text-xs text-muted-foreground">Theme</span>}
          <ThemeToggle variant="icon" />
        </div>

        {open && isAuthenticated && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        )}
      </div>
    </aside>
  )
}
