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
  { id: "evidence", icon: Archive, label: "Evidence Library", href: "/platform/evidence" },
  { id: "standards", icon: BookOpen, label: "Standards", href: "/platform/standards" },
  { id: "gap-analysis", icon: AlertTriangle, label: "Gap Analysis", href: "/platform/gap-analysis" },
  { id: "reports", icon: BarChart3, label: "Reports", href: "/platform/analytics" },
]

export default function PlatformSidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <aside
      className={cn(
        "fixed md:sticky md:top-0 md:left-0 md:h-screen flex flex-col z-40 select-none flex-shrink-0",
        "transition-all duration-300 ease-in-out w-[240px] bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]",
        open
          ? "translate-x-0 opacity-100 pointer-events-auto"
          : "-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:pointer-events-none opacity-0 pointer-events-none"
      )}
    >
      {/* Branding & Toggle — AYN Logo */}
      <div className="p-6 pb-6 flex items-center justify-between whitespace-nowrap overflow-hidden">
        <AynLogo size="sm" withGlow={false} heroStyle className="text-[var(--text-primary)]" />

        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-all bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-light)] active:scale-90 shadow-inner"
          title="Close Sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pt-4 overflow-hidden">
        {menuItems.map((item) => {
          const isActive = pathname.includes(item.id) ||
            (item.id === "reports" && pathname.includes("analytics"))

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group mb-1 whitespace-nowrap",
                isActive
                  ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-foreground)] shadow-sm"
                  : "text-[color:rgba(148,163,184,1)] hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]"
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

              {/* Icon with hover animation */}
              <div className={cn(
                "relative w-5 h-5 flex items-center justify-center transition-transform duration-300",
                !isActive && "group-hover:scale-110 group-hover:-rotate-3"
              )}>
                <item.icon
                  className={cn(
                    "w-[18px] h-[18px] flex-shrink-0 transition-colors duration-300",
                    isActive
                      ? "text-[color:rgba(37,99,235,1)]"
                      : "text-[color:rgba(148,163,184,1)] group-hover:text-[var(--sidebar-foreground)]"
                  )}
                />
                {/* Subtle glow on hover */}
                {!isActive && (
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}
              </div>

              {/* Label */}
              <span className={cn(
                "text-[13px] font-medium tracking-wide transition-all duration-300",
                isActive ? "text-[var(--sidebar-foreground)]" : "group-hover:text-[var(--sidebar-foreground)]"
              )}>
                {item.label}
              </span>

              {/* Hover arrow indicator */}
              <ChevronRight
                className={cn(
                  "w-4 h-4 ml-auto opacity-0 -translate-x-2 transition-all duration-300",
                  !isActive && "group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-zinc-400"
                )}
              />
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-4 pb-10 mt-auto space-y-4 overflow-hidden">
        <Link
          href="/platform/settings"
          className={cn(
            "relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group whitespace-nowrap",
            pathname.includes("settings")
              ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-foreground)]"
              : "text-zinc-500 hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]"
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
            "w-[18px] h-[18px] flex-shrink-0 transition-all duration-300",
            pathname.includes("settings") ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300 group-hover:rotate-45"
          )} />
          <span className="text-[13px] font-medium">Settings</span>
        </Link>

        <div className="pt-6 border-t border-[var(--border-subtle)] flex items-center gap-3 px-4 whitespace-nowrap">
          <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-[var(--border-subtle)] group-hover:ring-blue-500/30 transition-all">
            <UserCircle2 className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[12px] font-semibold text-[var(--text-primary)] truncate w-24">
              {user?.name ?? "QA Director"}
            </span>
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
              Ayn OS
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ChevronRight component since it wasn't imported
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
