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
  Building2,
  FileCheck,
  ClipboardList,
  FileText,
  Bell,
  Settings,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

type NavItem = { href: string; label: string; icon: typeof Sparkles; roles: string[] }

const items: NavItem[] = [
  { href: "/platform/dashboard", label: "Horus AI", icon: Sparkles, roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER", "AUDITOR"] },
  { href: "/platform/overview", label: "Overview", icon: LayoutDashboard, roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER", "AUDITOR"] },
  { href: "/platform/institutions", label: "Institutions", icon: Building2, roles: ["ADMIN", "INSTITUTION_ADMIN"] },
  { href: "/platform/standards", label: "Standards", icon: FileCheck, roles: ["ADMIN", "INSTITUTION_ADMIN"] },
  { href: "/platform/assessments", label: "Assessments", icon: ClipboardList, roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER", "AUDITOR"] },
  { href: "/platform/evidence", label: "Evidence", icon: FileText, roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER", "AUDITOR"] },
  { href: "/platform/notifications", label: "Notifications", icon: Bell, roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER", "AUDITOR"] },
  { href: "/platform/admin", label: "Admin", icon: Settings, roles: ["ADMIN"] },
  { href: "/platform/admin/users", label: "Users", icon: Users, roles: ["ADMIN"] },
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
      <div className="flex items-center justify-between p-3">
        <span className="font-semibold text-sm">Ayn</span>
        <button onClick={() => setOpen(!open)} className="p-2 rounded hover:bg-muted">
          {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {items
          .filter((item) => user && item.roles.includes(user.role))
          .map((item) => {
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
                <Icon size={18} className="shrink-0" />
                {open && <span>{item.label}</span>}
              </Link>
            )
          })}
      </nav>

      <div className="p-3 border-t space-y-3">
        <ThemeToggle variant="icon" />

        {open && user && (
          <div className="text-xs text-muted-foreground truncate">{user.name}</div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded hover:bg-destructive/10 text-sm"
        >
          <LogOut size={18} className="shrink-0" />
          {open && "Logout"}
        </button>
      </div>
    </aside>
  )
}
