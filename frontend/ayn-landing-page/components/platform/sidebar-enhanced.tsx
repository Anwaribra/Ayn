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

function SidebarSection({
  title,
  children,
  isCollapsed,
}: {
  title: string
  children: React.ReactNode
  isCollapsed: boolean
}) {
  return (
    <div className={cn(isCollapsed ? "space-y-3" : "space-y-2")}>
      {!isCollapsed && (
        <div className="px-2 pt-1">
          <p className="glass-text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">
            {title}
          </p>
          <div className="mt-2 h-px w-full bg-gradient-to-r from-[var(--glass-border)] via-[color:color-mix(in_srgb,var(--glass-border)_60%,transparent)] to-transparent" />
        </div>
      )}
      {children}
    </div>
  )
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
        "group relative flex min-h-[46px] items-center gap-3 rounded-[18px] px-3 py-2.5 text-sm transition-all duration-300",
        isCollapsed && "justify-center px-0 mx-auto w-11",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "glass-button glass-text-primary border-[var(--glass-border)] bg-[linear-gradient(180deg,var(--glass-soft-bg),color-mix(in_srgb,var(--glass-soft-bg)_78%,transparent))] shadow-[0_16px_32px_-24px_rgba(37,99,235,0.42)]"
          : "glass-text-secondary hover:bg-[var(--glass-soft-bg)] hover:text-[var(--glass-text-primary)]"
      )}
    >
      {active && (
        <motion.div
          layoutId="active-indicator"
          className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--brand)] shadow-[0_0_14px_rgba(56,189,248,0.8)]"
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          layoutDependency={false}
        />
      )}

      <item.icon
        className={cn(
          "h-5 w-5 min-h-5 min-w-5 shrink-0 transition-colors",
          active ? "text-primary" : "group-hover:text-[var(--glass-text-primary)]"
        )}
        strokeWidth={2.25}
      />

      {!isCollapsed && (
        <span className="truncate flex-1 font-medium tracking-wide flex justify-between items-center pr-1">
          <span className="flex items-center gap-2 min-w-0">
            <span className="truncate">{item.label}</span>
            {item.id === "workflows" && (
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-red-400">
                Beta
              </span>
            )}
          </span>
          {item.id === "horus-ai" && (
            <span className="flex items-center shrink-0">
              <span className="relative mr-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand)]" />
              </span>
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
          {item.id === "workflows" && (
            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-red-400">
              Beta
            </span>
          )}
          {item.id === "horus-ai" && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand)]" />
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
        "glass-sidebar glass-text-primary",
        "rounded-[28px]",
        "m-3 h-[calc(100dvh-1.5rem)]",
        // Mobile / tablet: closed = zero width + off-screen + invisible so it never shows or takes space
        open ? "w-64 max-w-[85vw]" : "max-lg:w-0 max-lg:min-w-0 max-lg:overflow-hidden max-lg:invisible max-lg:-translate-x-full max-lg:shadow-none",
        open ? "translate-x-0 shadow-lg shadow-black/30" : "max-lg:pointer-events-none",
        // Desktop (lg+ only): static + collapse width so main sits beside sidebar
        "lg:translate-x-0 lg:shadow-none lg:visible",
        open ? "lg:w-64" : "lg:w-[72px]",
        "lg:static"
      )}
    >
      {/* Header: Logo when expanded, toggle always (centered when collapsed) */}
      <div
        className={cn(
          "flex items-center pb-4 pt-5 lg:py-4",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {!isCollapsed && (
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <Link href="/" className="inline-flex min-w-0 items-center gap-3" title="Go to homepage">
              <AynLogo size="sm" withGlow={false} heroStyle />
            </Link>
          </div>
        )}
        <button
          onClick={onToggle}
          type="button"
          className="glass-button glass-text-secondary inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border-subtle)] transition-all hover:bg-[var(--glass-soft-bg)] hover:text-[var(--glass-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:h-9 lg:w-9"
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
      <nav className={cn("sidebar-scroll flex-1 overflow-y-auto space-y-6", isCollapsed ? "px-2 pt-1" : "px-3 pt-1")}>
        <SidebarSection title="Overview" isCollapsed={isCollapsed}>
          {MAIN_MENU.map((item) => (
            <SidebarItem key={item.id} item={item} isCollapsed={isCollapsed} pathname={pathname} onNavClick={handleNavClick} />
          ))}
        </SidebarSection>

        <SidebarSection title="Compliance Core" isCollapsed={isCollapsed}>
          {COMPLIANCE_WORKFLOW.map((item) => (
            <SidebarItem key={item.id} item={item} isCollapsed={isCollapsed} pathname={pathname} onNavClick={handleNavClick} />
          ))}
        </SidebarSection>

        <SidebarSection title="Reporting & Automation" isCollapsed={isCollapsed}>
          {INSIGHTS_TOOLS.map((item) => (
            <SidebarItem key={item.id} item={item} isCollapsed={isCollapsed} pathname={pathname} onNavClick={handleNavClick} />
          ))}
        </SidebarSection>

      </nav>

      {/* Bottom Section */}
      <div className="space-y-3 border-t border-[var(--glass-border-subtle)] p-3">
        <div className="space-y-2">
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
        </div>

        {/* User Row */}
        <div
          className={cn(
            "glass-surface group flex items-center rounded-[22px] border border-[var(--glass-border-subtle)] p-2 transition",
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
            <UserCircle2 className="glass-text-secondary h-6 w-6 shrink-0 transition-colors" />

            {!isCollapsed && (
              <div className="flex flex-col justify-center min-w-0 leading-tight">
                <p className="glass-text-primary truncate text-sm font-semibold">
                  {user?.name ?? "User"}
                </p>
                <p className="glass-text-secondary truncate text-[11px]">
                  {user?.email ?? "No email"}
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
              className="glass-text-secondary ml-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-[var(--glass-soft-bg)] hover:text-red-400 lg:h-8 lg:w-8"
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
