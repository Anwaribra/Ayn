"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  PanelLeftClose,
  ChevronRight,
} from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"

/* ------------------ Roles ------------------ */
enum Role {
  ADMIN = "ADMIN",
  INSTITUTION_ADMIN = "INSTITUTION_ADMIN",
  TEACHER = "TEACHER",
  AUDITOR = "AUDITOR",
}

/* ------------------ Types ------------------ */
type NavItem = {
  href: string
  label: string
  icon: typeof Sparkles
  roles: Role[]
}

/* ------------------ Navigation ------------------ */
const generalItems: NavItem[] = [
  { href: "/platform/dashboard", label: "Horus AI", icon: Sparkles, roles: Object.values(Role) },
  { href: "/platform/overview", label: "Overview", icon: LayoutDashboard, roles: Object.values(Role) },
]

const complianceItems: NavItem[] = [
  { href: "/platform/institutions", label: "Institutions", icon: Building2, roles: [Role.ADMIN, Role.INSTITUTION_ADMIN] },
  { href: "/platform/standards", label: "Standards", icon: FileCheck, roles: [Role.ADMIN, Role.INSTITUTION_ADMIN] },
  { href: "/platform/assessments", label: "Assessments", icon: ClipboardList, roles: Object.values(Role) },
  { href: "/platform/evidence", label: "Evidence", icon: FileText, roles: Object.values(Role) },
]

const accountItems: NavItem[] = [
  { href: "/platform/notifications", label: "Notifications", icon: Bell, roles: Object.values(Role) },
]

const adminItems: NavItem[] = [
  { href: "/platform/admin", label: "Admin Panel", icon: Settings, roles: [Role.ADMIN] },
  { href: "/platform/admin/users", label: "Manage Users", icon: Users, roles: [Role.ADMIN] },
]

const sections = [
  { title: "General", items: generalItems },
  { title: "Compliance", items: complianceItems },
  { title: "Account", items: accountItems },
] as const

/* ------------------ Helpers ------------------ */
function toLinkItem(
  item: NavItem,
  pathname: string
): SidebarLinkItem & { isActive: boolean } {
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  return {
    label: item.label,
    href: item.href,
    icon: <item.icon className="h-5 w-5 shrink-0" />,
    isActive,
  }
}

/* ------------------ Section ------------------ */
function SidebarSection({
  title,
  items,
  pathname,
  canAccess,
}: {
  title: string
  items: NavItem[]
  pathname: string
  canAccess: (item: NavItem) => boolean
}) {
  const { setOpen } = useSidebar()

  const visible = useMemo(() => items.filter(canAccess), [items, canAccess])
  if (!visible.length) return null

  return (
    <div className="space-y-1">
      <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>

      {visible.map((item) => {
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

/* ------------------ Content ------------------ */
function PlatformSidebarContent() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { open, setOpen } = useSidebar()

  const canAccess = useCallback(
    (item: NavItem) => !!user && item.roles.includes(user.role as Role),
    [user]
  )

  const showAdmin = useMemo(
    () => adminItems.some(canAccess),
    [canAccess]
  )

  const handleLogout = async () => {
    await logout()
    router.push("/platform/login")
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-4 shrink-0
        shadow-[inset_-1px_0_0_0_hsl(var(--border))]">
        <Link href="/" onClick={() => setOpen(false)}>
          <AynLogo size={open ? "md" : "sm"} />
        </Link>

        {open && (
          <span className="text-[10px] px-1.5 py-0.5 rounded border bg-muted">
            BETA
          </span>
        )}

        <div className="ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setOpen(!open)}
                className="p-2 rounded-lg hover:bg-muted"
              >
                {open ? (
                  <PanelLeftClose size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {open ? "Collapse" : "Expand"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 px-3 py-4 space-y-4 overflow-y-auto">
        {sections.map((section) => (
          <SidebarSection
            key={section.title}
            {...section}
            pathname={pathname}
            canAccess={canAccess}
          />
        ))}

        {showAdmin && (
          <>
            <div className="my-3 border-t" />
            <SidebarSection
              title="Admin"
              items={adminItems}
              pathname={pathname}
              canAccess={canAccess}
            />
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 shrink-0 border-t space-y-3">
        <div className="flex items-center gap-2">
          <ThemeToggle variant="icon" />
          {open && <span className="text-xs">Theme</span>}
        </div>

        {user && (
          <div className="rounded-lg bg-muted px-2 py-2">
            <p className="text-sm font-medium truncate">{user.name}</p>
            {open && (
              <>
                <p className="text-xs truncate">{user.email}</p>
                <span className="inline-block mt-1 text-xs px-2 rounded-full bg-background">
                  {user.role}
                </span>
              </>
            )}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut size={18} />
          {open && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}

/* ------------------ Wrapper ------------------ */
export function Sidebar() {
  const [open, setOpen] = useState(true)

  return (
    <>
      <UiSidebar
        open={open}
        setOpen={setOpen}
        animate={false}   // 🔴 مهم: وقف animation العرض
        className="h-screen w-[280px] overflow-hidden"
      >
        <SidebarBody className="h-full">
          <PlatformSidebarContent />
        </SidebarBody>
      </UiSidebar>

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed left-2 top-4 z-50 rounded-lg p-2 shadow-md bg-background hover:bg-muted"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </>
  )
}
