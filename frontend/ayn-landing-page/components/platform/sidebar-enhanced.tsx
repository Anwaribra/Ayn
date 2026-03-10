"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Brain,
  FileCheck,
  Scale,
  Microscope,
  GitGraph,
  BarChart4,
  Settings,
  UserCircle2,
  LogOut,
  PanelLeft,
  ShieldCheck,
  Layers,
  History,
  ArchiveIcon,
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
  open: boolean
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
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/platform/dashboard" },
  { id: "horus-ai", icon: Brain, label: "Horus AI", href: "/platform/horus-ai" },
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

import React, { useCallback, useMemo, memo } from "react"

export const SidebarItem = memo(function SidebarItem({
  item,
  isCollapsed,
  pathname,
  onNavClick,
}: {
  item: NavItemConfig
  isCollapsed: boolean
  pathname: string
  onNavClick: () => void
}) {
  const active =
    pathname.includes(item.id) || (item.id === "reports" && pathname.includes("analytics"))

  const content = (
    <Link
      href={item.href}
      onClick={onNavClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 min-h-[44px] text-sm transition-all duration-300",
        isCollapsed && "justify-center px-0 mx-auto w-11",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "bg-white/10 text-white shadow-md shadow-black/20"
          : "text-zinc-400 hover:text-white hover:bg-white/5"
      )}
    >
      {active && (
        <>
          <motion.div
            layoutId="active-indicator"
            className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.75)]"
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            layoutDependency={false}
          />
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-white/5 pointer-events-none" />
        </>
      )}

      <item.icon
        className={cn(
          "h-5 w-5 min-h-5 min-w-5 shrink-0 transition-colors",
          active ? "text-white" : "group-hover:text-white"
        )}
        strokeWidth={2.1}
      />

      {!isCollapsed && (
        <span className="truncate flex-1 font-medium tracking-wide flex justify-between items-center pr-1">
          {item.label}
          {item.id === "horus-ai" && (
            <span className="flex items-center">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--brand)" }}></span>
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "var(--brand)" }}></span>
              </span>
              <span className="text-[9px] uppercase tracking-widest font-black text-[var(--brand)]">New</span>
            </span>
          )}
        </span>
      )}
    </Link>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10} className="text-xs font-medium flex items-center gap-2">
          {item.label}
          {item.id === "horus-ai" && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--brand)" }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "var(--brand)" }}></span>
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
})

function PlatformSidebarComponent({ open, onToggle, notificationCount }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isCollapsed = !open

  const handleLogout = async () => {
    await logout()
    window.location.href = "/"
  }

  const handleNavClick = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      onToggle()
    }
  }, [onToggle])

  return (
    <motion.aside
      layout
      initial={false}
      transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
      className={cn(
        "will-change-transform",
        "fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden",
        "bg-[#050810] text-[#f5f5f3] border-r border-white/5", // FORCED DARK STYLE
        "rounded-r-2xl",
        "h-[100dvh]",
        // Mobile / tablet: closed = zero width + off-screen + invisible so it never shows or takes space
        open ? "w-64 max-w-[85vw]" : "max-lg:w-0 max-lg:min-w-0 max-lg:overflow-hidden max-lg:invisible max-lg:-translate-x-full max-lg:shadow-none",
        open ? "translate-x-0 shadow-lg shadow-black/30" : "max-lg:pointer-events-none",
        // Desktop (lg+ only): static + collapse width so main sits beside sidebar
        "lg:translate-x-0 lg:rounded-none lg:shadow-none lg:visible",
        open ? "lg:w-64" : "lg:w-[72px]",
        "lg:static"
      )}
    >
      {/* Header: Logo when expanded, toggle always (centered when collapsed) */}
      <div
        className={cn(
          "flex items-center py-4",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {!isCollapsed && (
          <Link href="/" className="inline-flex items-center" title="Go to homepage">
            <AynLogo size="sm" withGlow={false} heroStyle />
          </Link>
        )}
        <button
          onClick={onToggle}
          type="button"
          className="inline-flex h-11 w-11 lg:h-9 lg:w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 shadow-sm transition-all hover:border-white/20 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#050810]"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          <PanelLeft
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              open ? "" : "rotate-180"
            )}
          />
        </button>
      </div>


      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto space-y-6", isCollapsed ? "px-2" : "px-3")}>
        <div className={cn(isCollapsed ? "space-y-3" : "space-y-2")}>
          {MAIN_MENU.map((item) => (
            <SidebarItem key={item.id} item={item} isCollapsed={isCollapsed} pathname={pathname} onNavClick={handleNavClick} />
          ))}
        </div>

        <div className={cn(isCollapsed ? "space-y-3" : "space-y-2")}>
          {!isCollapsed && (
            <p className="px-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Compliance Core
            </p>
          )}
          {COMPLIANCE_WORKFLOW.map((item) => (
            <SidebarItem key={item.id} item={item} isCollapsed={isCollapsed} pathname={pathname} onNavClick={handleNavClick} />
          ))}
        </div>

        <div className={cn(isCollapsed ? "space-y-3" : "space-y-2")}>
          {!isCollapsed && (
            <p className="px-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Reporting & Automation
            </p>
          )}
          {INSIGHTS_TOOLS.map((item) => (
            <SidebarItem key={item.id} item={item} isCollapsed={isCollapsed} pathname={pathname} onNavClick={handleNavClick} />
          ))}
        </div>

      </nav>

      {/* Bottom Section */}
      <div className="p-3 space-y-3">
        <SidebarItem
          item={{
            id: "archive",
            icon: ArchiveIcon,
            label: "Archive",
            href: "/platform/archive",
          }}
          isCollapsed={isCollapsed}
          pathname={pathname}
          onNavClick={handleNavClick}
        />
        <SidebarItem
          item={{
            id: "settings",
            icon: Settings,
            label: "Settings",
            href: "/platform/settings",
          }}
          isCollapsed={isCollapsed}
          pathname={pathname}
          onNavClick={handleNavClick}
        />

        {/* User Row */}
        <div
          className={cn(
            "group flex items-center rounded-2xl p-2 hover:bg-white/5 transition border border-transparent hover:border-white/5",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {/* Profile clickable area */}
          <Link
            href="/platform/settings/account/"
            className={cn(
              "flex items-center gap-3 flex-1 min-w-0",
              isCollapsed && "justify-center"
            )}
            title="Go to profile"
          >
            <UserCircle2 className="h-6 w-6 text-zinc-400 group-hover:text-white shrink-0 transition-colors" />

            {!isCollapsed && (
              <div className="flex flex-col justify-center min-w-0 leading-tight">
                <p className="text-sm font-semibold truncate text-white">
                  {user?.name ?? "System User"}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {user?.email ?? "System User"}
                </p>
              </div>
            )}
          </Link>

          {/* Logout button (isolated action) */}
          {!isCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleLogout()
              }}
              className="ml-2 shrink-0 inline-flex h-11 w-11 lg:h-8 lg:w-8 items-center justify-center rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

    </motion.aside>
  )
}

export default memo(PlatformSidebarComponent)
