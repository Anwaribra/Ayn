"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
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
  ChevronRight,
  ShieldCheck,
  Layers
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { AynLogo } from "@/components/ayn-logo"

interface SidebarProps {
  open: boolean
  onToggle: () => void
  notificationCount?: number
}

// Grouped Menu Items for better visual hierarchy
const MAIN_MENU = [
  { id: "dashboard", icon: LayoutDashboard, label: "Command Center", href: "/platform/dashboard" },
  { id: "horus-ai", icon: BrainCircuit, label: "Horus Intelligence", href: "/platform/horus-ai" },
]

const COMPLIANCE_WORKFLOW = [
  { id: "evidence", icon: FileCheck, label: "Evidence Vault", href: "/platform/evidence" },
  { id: "standards", icon: Scale, label: "Standards Hub", href: "/platform/standards" },
  { id: "gap-analysis", icon: Microscope, label: "Gap Analysis", href: "/platform/gap-analysis" },
]

const INSIGHTS_TOOLS = [
  { id: "workflows", icon: GitGraph, label: "Workflow Engine", href: "/platform/workflows" },
  { id: "reports", icon: BarChart4, label: "Analytics", href: "/platform/analytics" },
]

export default function PlatformSidebar({ open, onToggle, notificationCount }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = "/"
  }

  const NavItem = ({ item, isSub = false }: { item: any; isSub?: boolean }) => {
    const isActive = pathname.includes(item.id) ||
      (item.id === "reports" && pathname.includes("analytics"))

    return (
      <Link
        href={item.href}
        onClick={() => {
          if (window.innerWidth < 768) onToggle()
        }}
        className={cn(
          "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group mb-1",
          isActive
            ? "bg-primary/10 text-primary shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-layer-2"
        )}
      >
        {isActive && (
          <motion.div
            layoutId="activePill"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}

        <div className={cn(
          "w-5 h-5 flex items-center justify-center transition-colors",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}>
          <item.icon className="w-[18px] h-[18px]" />

          {item.id === "dashboard" && (notificationCount || 0) > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
            </span>
          )}
        </div>

        <span className={cn(
          "text-sm font-medium tracking-wide truncate flex-1",
          isActive ? "font-semibold text-primary" : ""
        )}>
          {item.label}
        </span>

        {item.id === "dashboard" && (notificationCount || 0) > 0 && (
          <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow-sm">
            {(notificationCount ?? 0) > 99 ? '99+' : notificationCount}
          </span>
        )}

        {/* Hover indication */}
        {!isActive && (
          <ChevronRight className="w-3 h-3 text-muted-foreground/30 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 flex flex-col z-50 select-none glass shadow-xl md:shadow-none",
        "h-[100dvh] transition-transform md:transition-[width,opacity,transform] duration-300 ease-in-out",
        "w-72 max-w-[85vw]", // Slightly wider for enterprise feel
        "md:static md:h-screen md:translate-x-0 border-r border-white/20 dark:border-white/10",
        open ? "translate-x-0" : "-translate-x-full md:w-0 md:opacity-0 md:overflow-hidden"
      )}
    >
      {/* ─── Header ─── */}
      <div className="flex items-center px-6 py-6 flex-shrink-0">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <AynLogo size="sm" withGlow={false} heroStyle />
        </Link>
      </div>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-8 sidebar-scroll">

        {/* Main Section */}
        <div className="space-y-1">
          {MAIN_MENU.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </div>

        {/* Compliance Section */}
        <div className="space-y-1">
          <div className="px-3 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Compliance Core</span>
          </div>
          {COMPLIANCE_WORKFLOW.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </div>

        {/* Strategy Section */}
        <div className="space-y-1">
          <div className="px-3 mb-2 flex items-center gap-2">
            <Layers className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Strategy</span>
          </div>
          {INSIGHTS_TOOLS.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </div>

      </nav>

      {/* ─── Footer: User & Settings ─── */}
      <div className="flex-shrink-0 border-t border-border p-4 space-y-1 bg-layer-1/50">
        <NavItem item={{ id: "settings", icon: Settings, label: "Platform Settings", href: "/platform/settings" }} />

        <div className="pt-3 mt-2 border-t border-border">
          <Link
            href="/platform/settings/account"
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-layer-2 hover:shadow-sm border border-transparent hover:border-border transition-all group/profile"
          >
            <div className="w-10 h-10 rounded-full bg-layer-2 flex items-center justify-center ring-1 ring-border group-hover/profile:ring-primary/30 transition-all overflow-hidden">
              <UserCircle2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-foreground truncate">
                {user?.name ?? "Governance Officer"}
              </div>
              <div className="text-[10px] text-muted-foreground font-medium truncate uppercase tracking-wide">
                {user?.institutionId ? "Enterprise Admin" : "System User"}
              </div>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); handleLogout(); }}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </aside>
  )
}

