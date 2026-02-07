"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Archive, LayoutDashboard, MessageSquareText, Search, Settings, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/platform/horus", label: "Horus AI", icon: MessageSquareText },
  { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/platform/evidence", label: "Evidence Upload", icon: Upload },
  { href: "/platform/gap-analysis", label: "Gap Analysis", icon: Search },
  { href: "/platform/archive", label: "Archive", icon: Archive },
  { href: "/platform/settings", label: "Settings", icon: Settings },
]

export default function PlatformSidebar({ open }: { open: boolean }) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-border/60 bg-background transition-[width] duration-300",
        open ? "w-64" : "w-16"
      )}
    >
      <div className={cn("flex items-center gap-3 px-4 py-5", open ? "justify-start" : "justify-center")}
      >
        <Link href="/platform/horus" className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
            H
          </span>
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-all duration-300",
              open ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
            )}
          >
            Horus AI
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
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
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
    </aside>
  )
}
