"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"

import {
  Sparkles,
  LayoutDashboard,
  Upload,
  Search,
  Archive,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const items = [
  { href: "/platform", label: "Horus AI", icon: Sparkles },
  { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/platform/evidence", label: "Evidence", icon: Upload },
  { href: "/platform/gap-analysis", label: "Gap Analysis", icon: Search },
  { href: "/platform/archive", label: "Archive", icon: Archive },
  { href: "/platform/settings", label: "Settings", icon: Settings },
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
      <Link href="/" className="px-4 py-3 font-semibold text-sm hover:bg-muted">
        Ayn
      </Link>

      <button
        onClick={() => setOpen(!open)}
        className="mx-2 mb-2 p-2 rounded-lg hover:bg-muted"
      >
        {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      <nav className="flex-1 px-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                active ? "bg-muted font-medium" : "hover:bg-muted text-muted-foreground"
              )}
            >
              <Icon size={18} />
              {open && item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t space-y-3">
        <ThemeToggle variant="icon" />

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
