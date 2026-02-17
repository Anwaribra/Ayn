"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  BrainCircuit,
  FileCheck,
  Scale,
  Microscope,
  GitGraph,
  BarChart4,
  Settings,
  UserCircle2,
  LogOut,
  ChevronLeft,
  ShieldCheck,
  Layers,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { AynLogo } from "@/components/ayn-logo"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarProps {
  /** true = expanded (full width), false = collapsed (icons only) */
  open: boolean
  /** Toggles expanded / collapsed, and controls mobile drawer */
  onToggle: () => void
  notificationCount?: number
}

type NavItemConfig = {
  id: string
  icon: LucideIcon
  label: string
  href: string
}

// Grouped Menu Items for better visual hierarchy
const MAIN_MENU: NavItemConfig[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Command Center", href: "/platform/dashboard" },
  { id: "horus-ai", icon: BrainCircuit, label: "Horus Intelligence", href: "/platform/horus-ai" },
]

const COMPLIANCE_WORKFLOW: NavItemConfig[] = [
  { id: "evidence", icon: FileCheck, label: "Evidence Vault", href: "/platform/evidence" },
  { id: "standards", icon: Scale, label: "Standards Hub", href: "/platform/standards" },
  { id: "gap-analysis", icon: Microscope, label: "Gap Analysis", href: "/platform/gap-analysis" },
]

const INSIGHTS_TOOLS: NavItemConfig[] = [
  { id: "workflows", icon: GitGraph, label: "Workflow Engine", href: "/platform/workflows" },
  { id: "reports", icon: BarChart4, label: "Analytics", href: "/platform/analytics" },
]

interface SidebarSectionProps {
  title?: string
  icon?: LucideIcon
  collapsed: boolean
  children: React.ReactNode
}

function SidebarSection({ title, icon: Icon, collapsed, children }: SidebarSectionProps) {
  return (
    <div className="space-y-1">
      {title && (
        <div className="px-3 mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-tertiary)]">
          {Icon && <Icon className="w-3 h-3" />}
          {/* Hide section labels when fully collapsed on desktop, keep them on mobile drawer */}
          <span
            className={cn(
              "truncate transition-opacity duration-200",
              collapsed ? "opacity-0 md:opacity-0 md:w-0" : "opacity-70",
            )}
          >
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  )
}

interface SidebarItemProps {
  item: NavItemConfig
  isActive: boolean
  collapsed: boolean
  notificationCount?: number
  onClick?: () => void
}

function SidebarItem({
  item,
  isActive,
  collapsed,
  notificationCount,
  onClick,
}: SidebarItemProps) {
  const content = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--layer-0)]",
        isActive
          ? "bg-primary/15 text-primary-foreground/90 shadow-md shadow-primary/20 border border-primary/40"
          : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--surface)] border border-transparent hover:border-[color:var(--border-subtle)]",
      )}
    >
      {isActive && (
        <motion.div
          layoutId="active-pill"
          className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-primary/80 shadow-[0_0_12px_rgba(59,111,217,0.75)]"
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
        />
      )}

      <div
        className={cn(
          "relative flex h-5 w-5 items-center justify-center text-[color:var(--text-tertiary)] transition-colors",
          isActive && "text-primary",
          !isActive && "group-hover:text-[color:var(--text-primary)]",
        )}
      >
        <item.icon className="h-[18px] w-[18px]" />

        {item.id === "dashboard" && (notificationCount || 0) > 0 && (
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
          </span>
        )}
      </div>

      {/* Label + badge: fade / collapse in width when sidebar collapsed */}
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center justify-between gap-2 overflow-hidden transition-all duration-200",
          collapsed ? "w-0 opacity-0 md:w-0" : "w-auto opacity-100",
        )}
      >
        <span
          className={cn(
            "truncate text-sm font-medium tracking-wide",
            isActive ? "text-[color:var(--text-primary)]" : "",
          )}
        >
          {item.label}
        </span>

        {item.id === "dashboard" && (notificationCount || 0) > 0 && (
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground shadow-sm">
            {(notificationCount ?? 0) > 99 ? "99+" : notificationCount}
          </span>
        )}
      </div>
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}

export default function PlatformSidebar({ open, onToggle, notificationCount }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = "/"
  }

  const isCollapsed = !open

  const isActive = (item: NavItemConfig) =>
    pathname.includes(item.id) ||
    (item.id === "reports" && pathname.includes("analytics"))

  const handleNavClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onToggle()
    }
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-[100dvh] flex-col border-r border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)]/95 text-[color:var(--sidebar-foreground)] shadow-lg shadow-black/30 backdrop-blur-md",
        "transition-[width,transform] duration-200 ease-in-out",
        "md:static md:translate-x-0",
        open ? "md:w-64" : "md:w-[72px]",
        "w-64 max-w-[85vw]",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-center justify-between px-4 py-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 overflow-hidden transition-all duration-200",
            isCollapsed ? "md:w-0 md:opacity-0" : "md:w-auto md:opacity-100",
          )}
        >
          <AynLogo size="sm" withGlow={false} heroStyle />
        </Link>

        <button
          type="button"
          onClick={onToggle}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--surface)]/70 text-[color:var(--text-tertiary)] shadow-sm transition-all hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--layer-0)]"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              open ? "" : "rotate-180",
            )}
          />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 pt-2 space-y-5 sidebar-scroll">
        <SidebarSection collapsed={isCollapsed}>
          {MAIN_MENU.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={isActive(item)}
              collapsed={isCollapsed}
              notificationCount={notificationCount}
              onClick={handleNavClick}
            />
          ))}
        </SidebarSection>

        <SidebarSection
          title="Compliance Core"
          icon={ShieldCheck}
          collapsed={isCollapsed}
        >
          {COMPLIANCE_WORKFLOW.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={isActive(item)}
              collapsed={isCollapsed}
              onClick={handleNavClick}
            />
          ))}
        </SidebarSection>

        <SidebarSection
          title="Strategy"
          icon={Layers}
          collapsed={isCollapsed}
        >
          {INSIGHTS_TOOLS.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={isActive(item)}
              collapsed={isCollapsed}
              onClick={handleNavClick}
            />
          ))}
        </SidebarSection>
      </nav>

      <div className="flex-shrink-0 border-t border-[color:var(--sidebar-border)] bg-[color:var(--layer-1)]/60 px-3 py-3">
        <SidebarItem
          item={{ id: "settings", icon: Settings, label: "Platform Settings", href: "/platform/settings" }}
          isActive={pathname.includes("/platform/settings")}
          collapsed={isCollapsed}
          onClick={handleNavClick}
        />

        <div className="mt-3 border-t border-[color:var(--sidebar-border)] pt-3">
          <Link
            href="/platform/settings/account"
            className="group/profile flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 transition-all hover:border-[color:var(--sidebar-border)] hover:bg-[color:var(--surface)]/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--layer-0)]"
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[color:var(--surface)] ring-1 ring-[color:var(--sidebar-border)] transition-all group-hover/profile:ring-primary/40">
              <UserCircle2 className="h-6 w-6 text-[color:var(--text-tertiary)]" />
            </div>

            <div
              className={cn(
                "min-w-0 flex-1 transition-all duration-200",
                isCollapsed ? "w-0 opacity-0 md:w-0" : "w-auto opacity-100",
              )}
            >
              <div className="truncate text-sm font-semibold text-[color:var(--text-primary)]">
                {user?.name ?? "Governance Officer"}
              </div>
              <div className="truncate text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--text-tertiary)]">
                {user?.institutionId ? "Enterprise Admin" : "System User"}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                handleLogout()
              }}
              className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--text-tertiary)] transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </aside>
  )
}
