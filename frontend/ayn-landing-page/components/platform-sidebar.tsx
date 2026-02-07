"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "@/components/ui/theme-toggle"

import {
  Sparkles,
  LayoutDashboard,
  Bell,
  Settings,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Globe,
} from "lucide-react"

const items = [
  { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/platform/overview", label: "Overview", icon: Sparkles },
  { href: "/platform/notifications", label: "Notifications", icon: Bell },
  { href: "/platform/admin", label: "Admin", icon: Settings },
  { href: "/platform/admin/users", label: "Users", icon: Users },
]

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
        "h-screen sticky top-0 flex flex-col border-r bg-background transition-all duration-200",
        open ? "w-64" : "w-16"
      )}
    >
      {/* LOGO → WEBSITE */}
      <Link
        href="/"
        className="flex items-center gap-2 px-4 py-3 font-semibold text-sm hover:bg-muted"
      >
        Ayn
      </Link>

      {/* TOGGLE */}
      <button
        onClick={() => setOpen(!open)}
        className="mx-2 mb-2 p-2 rounded-lg hover:bg-muted"
      >
        {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* NAV */}
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
                active ? "bg-muted font-medium" : "hover:bg-muted text-muted-foreground"
              )}
            >
              <Icon size={18} />
              {open && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-3 border-t space-y-3">
        <ThemeToggle variant="icon" />

        <Link
          href="/"
          className="flex items-center gap-3 text-sm hover:bg-muted rounded-lg px-3 py-2"
        >
          <Globe size={18} />
          {open && "Website"}
        </Link>

        {open && user && (
          <div className="text-xs text-muted-foreground truncate">
            {user.name}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded hover:bg-destructive/10 text-sm"
        >
          <LogOut size={18} />
          {open && "Logout"}
        </button>
      </div>
    </aside>
  )
}
