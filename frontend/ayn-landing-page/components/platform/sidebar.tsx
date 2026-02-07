"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { AynLogo } from "@/components/ayn-logo"

import {
  LayoutDashboard,
  Sparkles,
  Bell,
  Settings,
  Users,
  LogOut,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"

/* ---------------- TYPES ---------------- */

type Item = {
  href: string
  label: string
  icon: any
}

/* ---------------- NAV ---------------- */

const items: Item[] = [
  { href: "/platform/dashboard", label: "Horus AI", icon: Sparkles },
  { href: "/platform/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/platform/notifications", label: "Notifications", icon: Bell },
  { href: "/platform/admin", label: "Admin", icon: Settings },
  { href: "/platform/admin/users", label: "Users", icon: Users },
]

/* ---------------- COMPONENT ---------------- */

export default function PlatformSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const [open, setOpen] = useState(true)

  const handleLogout = async () => {
    await logout()
    router.push("/platform/login")
  }

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col bg-background border-r transition-all duration-200",
        open ? "w-64" : "w-16"
      )}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-3">
        <AynLogo size="sm" />

        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg hover:bg-muted"
        >
          {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* LINKS */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-muted font-medium"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={18} className="shrink-0" />

              {open && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-3 space-y-3 border-t">
        <ThemeToggle variant="icon" />

        {open && user && (
          <div className="text-xs text-muted-foreground truncate">
            {user.name}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-destructive/10 hover:text-destructive text-sm"
        >
          <LogOut size={18} />
          {open && "Logout"}
        </button>
      </div>
    </aside>
  )
}
