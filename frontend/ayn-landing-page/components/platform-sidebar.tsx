"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Archive, Bot, LayoutDashboard, Search, Settings, Upload } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

const navItems = [
  { href: "/platform/horus-ai", label: "Horus AI", icon: Bot },
  { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/platform/evidence", label: "Evidence Upload", icon: Upload },
  { href: "/platform/gap-analysis", label: "Gap Analysis", icon: Search },
  { href: "/platform/archive", label: "Archive", icon: Archive },
  { href: "/platform/settings", label: "Settings", icon: Settings },
]

export default function PlatformSidebar({ open }: { open: boolean }) {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-border/60 bg-background transition-[width] duration-300",
        open ? "w-64" : "w-16"
      )}
    >
      <div className={cn("flex items-center gap-3 px-4 py-5", open ? "justify-start" : "justify-center")}>
        <Link href="/platform/horus-ai" className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 via-primary/40 to-transparent text-xs font-bold text-primary-foreground shadow-sm">
            H
          </span>
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-all duration-300",
              open ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
            )}
          >
            Horus AI Platform
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                active
                  ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 h-6 w-1 rounded-full bg-transparent transition-all",
                  active ? "bg-primary" : "group-hover:bg-muted-foreground/30"
                )}
              />
              <Icon className="h-4 w-4" />
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
      </nav>

      <div className="mt-auto border-t border-border/60 px-3 py-4">
        {open && (
          <div className="mb-4 rounded-xl border border-border/60 bg-muted/30 p-3">
            <p className="text-sm font-medium text-foreground">
              {isAuthenticated ? user?.name : "Account not connected"}
            </p>
            {isAuthenticated && user?.email ? (
              <p className="text-xs text-muted-foreground">{user.email}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Sign in to sync your workspace</p>
            )}
          </div>
        )}
        <div className={cn("flex items-center", open ? "justify-between" : "justify-center")}>
          {open && <span className="text-xs text-muted-foreground">Theme</span>}
          <ThemeToggle variant="icon" />
        </div>
      </div>
    </aside>
  )
}
