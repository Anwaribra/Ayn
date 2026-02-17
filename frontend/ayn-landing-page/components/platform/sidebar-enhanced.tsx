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
  { id: "horus-ai", icon: BrainCircuit, label: "Horus AI", href: "/platform/horus-ai" },
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

export default function PlatformSidebar({ open, onToggle, notificationCount }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isCollapsed = !open

  const isActive = (item: NavItemConfig) =>
    pathname.includes(item.id) ||
    (item.id === "reports" && pathname.includes("analytics"))

  const handleLogout = async () => {
    await logout()
    window.location.href = "/"
  }

  const handleNavClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onToggle()
    }
  }

  const SidebarItem = ({
    item,
  }: {
    item: NavItemConfig
  }) => {
    const active = isActive(item)

    const content = (
      <Link
        href={item.href}
        onClick={handleNavClick}
        className={cn(
          "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          active
            ? "bg-primary/15 text-primary border border-primary/40 shadow-md shadow-primary/20"
            : "text-muted-foreground hover:text-foreground hover:bg-white/5 dark:hover:bg-white/5"
        )}
      >
        {active && (
          <motion.div
            layoutId="active-indicator"
            className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-primary"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}

        <item.icon
          className={cn(
            "h-5 w-5 transition-colors",
            active ? "text-primary" : "group-hover:text-foreground"
          )}
        />

        {!isCollapsed && (
          <span className="truncate font-medium tracking-wide">
            {item.label}
          </span>
        )}
      </Link>
    )

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col",
        "border-r border-[var(--sidebar-border)]",
        "bg-[var(--sidebar-bg)]/95 backdrop-blur-md",
        "transition-all duration-200 ease-in-out",
        "h-[100dvh]",
        // Mobile drawer
        "w-64 max-w-[85vw]",
        open ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
        // Desktop collapse widths
        open ? "md:w-64" : "md:w-[72px]"
      )}
    >
      {/* Floating Toggle (desktop only) */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 hidden md:flex h-8 w-8 items-center justify-center
                   rounded-full border border-white/20 bg-[rgba(255,255,255,0.15)]
                   backdrop-blur-lg shadow-lg transition-all hover:scale-105"
      >
        <ChevronLeft
          className={cn(
            "h-4 w-4 transition-transform duration-300",
            open ? "" : "rotate-180"
          )}
        />
      </button>

      {/* Logo (links to marketing / landing homepage) */}
      <div className="flex items-center px-4 py-5">
        <Link href="/" className="inline-flex items-center">
          <AynLogo size="sm" withGlow={false} heroStyle />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-6">
        <div className="space-y-2">
          {MAIN_MENU.map((item) => (
            <SidebarItem key={item.id} item={item} />
          ))}
        </div>

        <div className="space-y-2">
          {!isCollapsed && (
            <p className="px-2 text-xs uppercase tracking-wider text-muted-foreground">
              Compliance Core
            </p>
          )}
          {COMPLIANCE_WORKFLOW.map((item) => (
            <SidebarItem key={item.id} item={item} />
          ))}
        </div>

        <div className="space-y-2">
          {!isCollapsed && (
            <p className="px-2 text-xs uppercase tracking-wider text-muted-foreground">
              Strategy
            </p>
          )}
          {INSIGHTS_TOOLS.map((item) => (
            <SidebarItem key={item.id} item={item} />
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/10 p-3 space-y-3">
        <SidebarItem
          item={{
            id: "settings",
            icon: Settings,
            label: "Platform Settings",
            href: "/platform/settings",
          }}
        />

        <div className="flex items-center gap-3 rounded-2xl p-2 hover:bg-white/5 transition">
          <UserCircle2 className="h-6 w-6 text-muted-foreground" />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {user?.name ?? "System User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Enterprise Admin
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
