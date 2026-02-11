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
import { AynLogo } from "@/components/platform/ayn-logo"

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
      className={`
        fixed md:relative inset-y-0 left-0 bg-[#05070A] h-full flex flex-col z-30 select-none
        transition-all duration-300 ease-in-out border-r border-white/[0.06]
        ${open ? "w-[240px] translate-x-0 opacity-100" : "w-0 -translate-x-full opacity-0 pointer-events-none"}
      `}
    >
      {/* Branding & Toggle — AYN Logo */}
      <div className="p-6 pb-6 flex items-center justify-between whitespace-nowrap overflow-hidden">
        <AynLogo />

        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-all bg-[#0A0C10] rounded-xl border border-white/5 hover:border-white/10 active:scale-90 shadow-inner"
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
                  ? "bg-white/[0.08] text-white shadow-lg shadow-black/20"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
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
                    isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
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
                isActive ? "text-white" : "group-hover:text-zinc-200"
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
              ? "bg-white/[0.08] text-white"
              : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
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

        {/* System Status Widget */}
        <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Horus Active</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-zinc-600">
            <span className="mono">v2.4.1</span>
            <span>•</span>
            <span>Synced</span>
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.05] flex items-center gap-3 px-4 whitespace-nowrap">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-white/5 group-hover:ring-blue-500/30 transition-all">
            <UserCircle2 className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[12px] font-semibold text-zinc-300 truncate w-24">
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
