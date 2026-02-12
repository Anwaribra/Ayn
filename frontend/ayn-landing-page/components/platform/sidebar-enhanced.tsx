"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Brain,
  Archive,
  BookOpen,
  AlertTriangle,
  BarChart3,
  Settings,
  UserCircle2,
  PanelLeft,
  LogOut,
  History,
  ChevronRight,
  Shield,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { AynLogo } from "@/components/ayn-logo"

interface SidebarProps {
  open: boolean
  onToggle: () => void
  notificationCount?: number
}

const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/platform/dashboard" },
  { id: "horus-ai", icon: Brain, label: "Horus AI", href: "/platform/horus-ai" },
  { id: "evidence", icon: Shield, label: "Evidence Library", href: "/platform/evidence" },
  { id: "standards", icon: BookOpen, label: "Standards", href: "/platform/standards" },
  { id: "gap-analysis", icon: AlertTriangle, label: "Gap Analysis", href: "/platform/gap-analysis" },
  { id: "reports", icon: BarChart3, label: "Reports", href: "/platform/analytics" },
  { id: "archive", icon: Archive, label: "Archive", href: "/platform/archive" },
]

export default function PlatformSidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = "/"
  }

  return (
    <aside
      className={cn(
        // Base layout
        "fixed inset-y-0 left-0 flex flex-col z-40 select-none flex-shrink-0",
        // Width & background
        "w-[260px] max-w-[85vw] bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]",
        // Use dvh for mobile viewport, fallback to vh
        "h-[100dvh] h-screen",
        // Transition
        "transition-transform duration-300 ease-in-out",
        // Desktop: sticky positioning instead of fixed
        "md:sticky md:top-0 md:w-[240px] md:max-w-none",
        // Open / closed states
        open
          ? "translate-x-0"
          : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:opacity-0 md:pointer-events-none"
      )}
    >
      {/* ─── Header: Logo & Close ─── */}
      <div className="flex items-center justify-between px-4 py-4 md:px-5 md:py-5 flex-shrink-0">
        <Link href="/" className="hover:opacity-80 transition-opacity" aria-label="Back to homepage">
          <AynLogo size="sm" withGlow={false} heroStyle />
        </Link>

        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-[var(--sidebar-foreground)] transition-all bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-light)] active:scale-90"
          title="Close Sidebar"
          aria-label="Close sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>

      {/* ─── Navigation: Scrollable ─── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 md:px-4 pt-2 pb-2 sidebar-scroll">
        {menuItems.map((item) => {
          const isActive = pathname.includes(item.id) ||
            (item.id === "reports" && pathname.includes("analytics"))

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => {
                // Auto-close sidebar on mobile after navigation
                if (window.innerWidth < 768) onToggle()
              }}
              className={cn(
                "relative w-full flex items-center gap-3 px-3 py-2.5 md:px-4 rounded-xl transition-all duration-200 group mb-0.5",
                isActive
                  ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-foreground)] shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]"
              )}
            >
              {/* Active indicator pill */}
              {isActive && (
                <motion.span
                  layoutId="activePill"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              {/* Icon */}
              <div className={cn(
                "relative w-5 h-5 flex-shrink-0 flex items-center justify-center transition-transform duration-200",
                !isActive && "group-hover:scale-110"
              )}>
                <item.icon
                  className={cn(
                    "w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200",
                    isActive
                      ? "text-blue-500"
                      : "text-[var(--text-tertiary)] group-hover:text-[var(--sidebar-foreground)]"
                  )}
                />
              </div>

              {/* Label */}
              <span className={cn(
                "text-[13px] font-medium tracking-wide truncate transition-colors duration-200",
                isActive ? "text-[var(--sidebar-foreground)]" : "group-hover:text-[var(--sidebar-foreground)]"
              )}>
                {item.label}
              </span>

              {/* Hover arrow */}
              <ChevronRight
                className={cn(
                  "w-4 h-4 ml-auto flex-shrink-0 opacity-0 -translate-x-2 transition-all duration-200 hidden md:block",
                  !isActive && "group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-zinc-400"
                )}
              />
            </Link>
          )
        })}
      </nav>

      {/* ─── Bottom Section: Settings + User + Logout ─── */}
      <div className="flex-shrink-0 mt-auto border-t border-[var(--border-subtle)]">
        {/* Settings Link */}
        <div className="px-3 md:px-4 pt-3">
          <Link
            href="/platform/settings"
            onClick={() => {
              if (window.innerWidth < 768) onToggle()
            }}
            className={cn(
              "relative w-full flex items-center gap-3 px-3 py-2.5 md:px-4 rounded-xl transition-all duration-200 group",
              pathname.includes("settings")
                ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-foreground)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]"
            )}
          >
            {pathname.includes("settings") && (
              <motion.span
                layoutId="activePill"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <Settings className={cn(
              "w-[18px] h-[18px] flex-shrink-0 transition-all duration-200",
              pathname.includes("settings") ? "text-blue-400" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] group-hover:rotate-45"
            )} />
            <span className="text-[13px] font-medium">Settings</span>
          </Link>
        </div>

        {/* User Info & Account Link */}
        <div className="px-3 md:px-4 pt-3 pb-2">
          <Link
            href="/platform/settings/account"
            onClick={() => {
              if (window.innerWidth < 768) onToggle()
            }}
            className={cn(
              "flex items-center gap-3 px-3 md:px-4 py-2.5 rounded-xl transition-all duration-300 group/profile cursor-pointer shrink-0",
              pathname.includes("settings/account")
                ? "bg-[var(--sidebar-accent)]"
                : "hover:bg-[var(--sidebar-accent)]"
            )}
          >
            <div className="w-9 h-9 rounded-full bg-[var(--surface)] flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-[var(--border-subtle)] group-hover/profile:ring-blue-500/50 transition-all">
              <UserCircle2 className="w-6 h-6 text-zinc-500 group-hover/profile:text-blue-500 transition-colors" />
            </div>
            <div className="flex flex-col overflow-hidden min-w-0 flex-1">
              <span className="text-[13px] font-bold text-[var(--text-primary)] truncate group-hover/profile:text-blue-400 transition-colors leading-tight">
                {user?.name ?? "QA Director"}
              </span>
              {user?.role && (
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                  {user.role}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* ─── Logout Button ─── */}
        <div className="px-3 md:px-4 pb-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 md:px-4 rounded-xl transition-all duration-200 group",
              "text-zinc-500 hover:text-red-400 hover:bg-red-500/10",
              "border border-transparent hover:border-red-500/15"
            )}
            aria-label="Log out"
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200 group-hover:text-red-400" />
            <span className="text-[13px] font-medium transition-colors duration-200 group-hover:text-red-400">
              Log Out
            </span>
          </button>
        </div>
      </div>
    </aside>
  )
}
