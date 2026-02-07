"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Input } from "@/components/ui/input"

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
  Building2,
  BookCheck,
  ClipboardCheck,
  FolderArchive,
  Search,
  ShieldCheck,
  LineChart,
  CalendarRange,
} from "lucide-react"

const navSections = [
  {
    title: "Core",
    items: [
      { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/platform/overview", label: "Executive Overview", icon: Sparkles },
      { href: "/platform/analytics", label: "Insights", icon: LineChart },
      { href: "/platform/notifications", label: "Alerts", icon: Bell },
      { href: "/platform/calendar", label: "Review Calendar", icon: CalendarRange },
    ],
  },
  {
    title: "Quality & Accreditation",
    items: [
      { href: "/platform/institutions", label: "Institutions", icon: Building2 },
      { href: "/platform/standards", label: "Standards Map", icon: BookCheck },
      { href: "/platform/assessments", label: "Assessments", icon: ClipboardCheck },
      { href: "/platform/evidence", label: "Evidence Hub", icon: FolderArchive },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/platform/admin", label: "Admin Center", icon: Settings },
      { href: "/platform/admin/users", label: "User Access", icon: Users },
    ],
  },
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
        "h-screen sticky top-0 flex flex-col border-r border-border/60 bg-background/95 backdrop-blur-xl transition-all duration-200",
        open ? "w-72" : "w-16"
      )}
    >
      <div className="px-4 pt-5 pb-4 space-y-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted/60 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-semibold">
            A
          </div>
          {open && (
            <div>
              <div className="text-sm font-semibold text-foreground">Ayn Platform</div>
              <div className="text-xs text-muted-foreground">Quality & Accreditation OS</div>
            </div>
          )}
        </Link>
        {open && (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Accreditation readiness
            </div>
            <p className="mt-2 text-lg font-semibold text-foreground">82%</p>
            <p className="text-xs text-muted-foreground">On track for the next review cycle</p>
          </div>
        )}
        {open && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tools & records..."
              className="h-9 rounded-lg border-border/60 bg-background/70 pl-9 text-xs"
            />
          </div>
        )}
      </div>

      {/* TOGGLE */}
      <button
        onClick={() => setOpen(!open)}
        className="mx-3 mb-3 flex items-center justify-center rounded-lg border border-border/60 p-2 text-muted-foreground hover:bg-muted"
      >
        {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* NAV */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {navSections.map((section) => (
          <div key={section.title}>
            {open && (
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                      active
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    <Icon size={18} />
                    {open && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="space-y-3 border-t border-border/60 p-4">
        {open && (
          <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
            Track accreditation readiness, reviewer workflows, and evidence health in one place.
          </div>
        )}
        <ThemeToggle variant="icon" />

        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
        >
          <Globe size={18} />
          {open && "Website"}
        </Link>

        {open && user && (
          <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{user.name}</p>
            <p className="capitalize">{user.role?.toLowerCase()}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
        >
          <LogOut size={18} />
          {open && "Logout"}
        </button>
      </div>
    </aside>
  )
}
