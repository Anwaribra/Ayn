"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
        fixed md:relative inset-y-0 left-0 bg-[#060810] h-full flex flex-col z-30 select-none
        transition-all duration-300 ease-in-out border-r border-white/[0.04]
        ${open ? "w-[240px] translate-x-0 opacity-100" : "w-0 -translate-x-full opacity-0 pointer-events-none"}
      `}
    >
      {/* Branding & Toggle — V3 oval AYN logo */}
      <div className="p-6 pb-6 flex items-center justify-between whitespace-nowrap overflow-hidden">
        <div className="flex items-center justify-center">
          <div className="w-14 h-9 rounded-full border-2 border-white/90 flex items-center justify-center px-2">
            <span className="font-bold text-xs tracking-tighter text-white">AYN</span>
          </div>
        </div>

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
              className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group mb-1 whitespace-nowrap ${isActive
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r" />
              )}
              <item.icon
                className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-500" : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
              />
              <span className="text-[13px] font-medium tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-4 pb-10 mt-auto space-y-4 overflow-hidden">
        <Link
          href="/platform/settings"
          className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-zinc-500 hover:text-zinc-200 transition-all whitespace-nowrap ${pathname.includes("settings") ? "bg-zinc-800 text-white" : ""
            }`}
        >
          {pathname.includes("settings") && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r" />
          )}
          <Settings className="w-4 h-4 flex-shrink-0" />
          <span className="text-[13px] font-medium">Settings</span>
        </Link>

        <div className="pt-6 border-t border-zinc-900 flex items-center gap-3 px-4 whitespace-nowrap">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-white/5">
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
