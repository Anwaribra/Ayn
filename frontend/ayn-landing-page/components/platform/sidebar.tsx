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
export enum Role {
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
  {
    href: "/platform/dashboard",
    label: "Horus AI",
    icon: Sparkles,
    roles: Object.values(Role),
  },
  {
    href: "/platform/overview",
    label: "Overview",
    icon: LayoutDashboard,
    roles: Object.values(Role),
  },
]

const complianceItems: NavItem[] = [
  {
    href: "/platform/institutions",
    label: "Institutions",
    icon: Building2,
    roles: [Role.ADMIN, Role.INSTITUTION_ADMIN],
  },
  {
    href: "/platform/standards",
    label: "Standards",
    icon: FileCheck,
    roles: [Role.ADMIN, Role.INSTITUTION_ADMIN],
  },
  {
    href: "/platform/assessments",
    label: "Assessments",
    icon: ClipboardList,
    roles: [Role.ADMIN, Role.INSTITUTION_ADMIN, Role.TEACHER, Role.AUDITOR],
  },
  {
    href: "/platform/evidence",
    label: "Evidence",
    icon: FileText,
    roles: [Role.ADMIN, Role.INSTITUTION_ADMIN, Role.TEACHER, Role.AUDITOR],
  },
]

const accountItems: NavItem[] = [
  {
    href: "/platform/notifications",
    label: "Notifications",
    icon: Bell,
    roles: Object.values(Role),
  },
]

const adminItems: NavItem[] = [
  {
    href: "/platform/admin",
    label: "Admin Panel",
    icon: Settings,
    roles: [Role.ADMIN],
  },
  {
    href: "/platform/admin/users",
    label: "Manage Users",
    icon: Users,
    roles: [Role.ADMIN],
  },
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
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`)

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

  const visibleItems = useMemo(
    () => items.filter(canAccess),
    [items, canAccess]
  )

  if (!visibleItems.length) return null

  return (
    <div className="space-y-1">
      <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>

      {visibleItems.map((item) => {
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
    (item: NavItem) =>
      !!user && item.roles.includes(user.role as Role),
    [user]
  )

  const adminVisible = useMemo(
    () => adminItems.some(canAccess),
    [canAccess]
  )

  const handleLogout = async () => {
    await logout()
    router.push("/platform/login")
  }

  return (
    <>
      {/* ---------- Header ---------- */}
      <div className="flex items-center gap-3 px-3 py-4 border-b border-sidebar-border">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          aria-label="Go to home"
          className="rounded-md hover:bg-sidebar-accent/30 transition-colors"
        >
          <AynLogo size={open ? "md" : "sm"} heroStyle />
        </Link>

        {open && (
          <span
            aria-hidden
            className="text-[10px] px-1.5 py-0.5 rounded border bg-sidebar-accent/50"
          >
            BETA
          </span>
        )}

        <div className="ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setOpen(!open)}
                className="p-2 rounded-lg hover:bg-sidebar-accent/50"
                aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
              >
                {open ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {open ? "Collapse" : "Expand"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ---------- Navigation ---------- */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {sections.map((section) => (
          <SidebarSection
            key={section.title}
            {...section}
            pathname={pathname}
            canAccess={canAccess}
          />
        ))}

        {adminVisible && (
          <>
            <div className="border-t my-3" />
            <SidebarSection
              title="Admin"
              items={adminItems}
              pathname={pathname}
              canAccess={canAccess}
            />
          </>
        )}
      </nav>

      {/* ---------- Footer ---------- */}
      <div className="px-3 py-4 border-t space-y-3">
        <div className="flex items-center gap-2 px-1">
          <ThemeToggle variant="icon" />
          {open && <span className="text-xs">Theme</span>}
        </div>

        {user && (
          <div className="px-2 py-2 rounded-lg bg-sidebar-accent/50">
            <p className="text-sm font-medium truncate">{user.name}</p>
            {open && (
              <>
                <p className="text-xs truncate">{user.email}</p>
                <span className="inline-block mt-1 text-xs px-2 rounded-full bg-sidebar-accent">
                  {user.role}
                </span>
              </>
            )}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-destructive/10 hover:text-destructive"
          aria-describedby="logout-desc"
        >
          <LogOut className="h-5 w-5" />
          {open && <span>Logout</span>}
        </button>
      </div>
    </>
  )
}

/* ------------------ Wrapper ------------------ */
export function Sidebar() {
  const [open, setOpen] = useState(true)

  return (
    <UiSidebar open={open} setOpen={setOpen} animate>
      <SidebarBody className="flex flex-col justify-between h-full">
        <PlatformSidebarContent />
      </SidebarBody>
    </UiSidebar>
  )
}
