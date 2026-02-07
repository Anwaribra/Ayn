"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { AynLogo } from "@/components/ayn-logo"
import {
  Sidebar as UiSidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
  type SidebarLinkItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Building2,
  FileCheck,
  ClipboardList,
  FileText,
  Bell,
  Sparkles,
  Settings,
  Users,
  LogOut,
} from "lucide-react"
import { useState } from "react"
import { ThemeToggle } from "@/components/ui/theme-toggle"

type NavItem = { href: string; label: string; icon: typeof Sparkles; roles: string[] }

const generalItems: NavItem[] = [
  { href: "/platform/dashboard", label: "Horus AI", icon: Sparkles, roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER", "AUDITOR"] },
  { href: "/platform/overview", label: "Overview", icon: LayoutDashboard, roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER", "AUDITOR"] },
]

const complianceItems: NavItem[] = [
  { href: "/platform/institutions", label: "Institutions", icon: Building2, roles: ["ADMIN", "INSTITUTION_ADMIN"] },
  { href: "/platform/standards", label: "Standards", icon: FileCheck, roles: ["ADMIN", "INSTITUTION_ADMIN"] },
  { href: "/platform/assessments", label: "Assessments", icon: ClipboardList, roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER", "AUDITOR"] },
  { href: "/platform/evidence", label: "Evidence", icon: FileText, roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER", "AUDITOR"] },
]

const accountItems: NavItem[] = [
  { href: "/platform/notifications", label: "Notifications", icon: Bell, roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER", "AUDITOR"] },
]

const adminItems: NavItem[] = [
  { href: "/platform/admin", label: "Admin Panel", icon: Settings, roles: ["ADMIN"] },
  { href: "/platform/admin/users", label: "Manage Users", icon: Users, roles: ["ADMIN"] },
]

const sections = [
  { title: "General", items: generalItems },
  { title: "Compliance", items: complianceItems },
  { title: "Account", items: accountItems },
] as const

function toLinkItem(
  item: NavItem,
  pathname: string
): SidebarLinkItem & { isActive: boolean } {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
  return {
    label: item.label,
    href: item.href,
    icon: <item.icon className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
    isActive,
  }
}

function SidebarSection({
  title,
  items,
  pathname,
  filter,
}: {
  title: string
  items: NavItem[]
  pathname: string
  filter: (item: NavItem) => boolean
}) {
  const { open, setOpen } = useSidebar()
  const filtered = items.filter(filter)
  if (filtered.length === 0) return null

  return (
    <div className="space-y-1">
      {open && (
        <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
      )}
      {filtered.map((item) => {
        const { isActive, ...link } = toLinkItem(item, pathname)
        return (
          <SidebarLink
            key={link.href}
            link={link}
            isActive={isActive}
            onClick={() => setOpen(false)}
          />
        )
      })}
    </div>
  )
}

function PlatformSidebarContent() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { open, setOpen } = useSidebar()

  const filter = (item: NavItem) => !!user && item.roles.includes(user.role)
  const filteredAdminItems = adminItems.filter(filter)

  const handleLogout = async () => {
    await logout()
    window.location.href = "/platform/login"
  }

  return (
    <>
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <div className="flex items-center gap-3 px-2 py-5 border-b border-sidebar-border shrink-0">
          <AynLogo size={open ? "md" : "sm"} heroStyle withGlow={false} />
          {open && (
            <div className="min-w-0">
              <h1 className="font-semibold text-sidebar-foreground truncate">Ayn</h1>
              <p className="text-xs text-muted-foreground">Platform</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {sections.map((section) => (
            <SidebarSection
              key={section.title}
              title={section.title}
              items={section.items}
              pathname={pathname}
              filter={filter}
            />
          ))}

          {filteredAdminItems.length > 0 && (
            <>
              <div className="border-t border-sidebar-border my-3 pt-3" />
              <SidebarSection
                title="Admin"
                items={adminItems}
                pathname={pathname}
                filter={filter}
              />
            </>
          )}
        </nav>
      </div>

      <div className="p-3 border-t border-sidebar-border space-y-3 shrink-0">
        <div className="flex items-center gap-2 px-1">
          <ThemeToggle variant="icon" className="shrink-0" />
          {open && <span className="text-xs text-muted-foreground">Theme</span>}
        </div>
        {user && open && (
          <div className="mb-2 px-2 py-2 rounded-lg bg-sidebar-accent/50">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <span className="inline-block mt-1.5 px-2 py-0.5 text-xs rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
              {user.role === "ADMIN" ? "Admin" : "User"}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex items-center justify-start gap-2 w-full py-2.5 px-3 rounded-lg transition-colors text-sm",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {open && <span>Logout</span>}
        </button>
      </div>
    </>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <UiSidebar open={open} setOpen={setOpen}>
      <SidebarBody className="flex flex-col justify-between gap-10 h-full">
        <PlatformSidebarContent />
      </SidebarBody>
    </UiSidebar>
  )
}
