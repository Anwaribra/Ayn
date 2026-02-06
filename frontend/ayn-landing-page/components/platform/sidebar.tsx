"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { AynLogo } from "@/components/ayn-logo"
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
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

// Horus AI first; then Dashboard, Assessments, Evidence, Notifications. Only ADMIN sees Institutions and Standards.
const navItems = [
  { href: "/platform/ai-tools", label: "Horus AI", icon: Sparkles, roles: ["ADMIN", "TEACHER", "AUDITOR"] },
  { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "TEACHER", "AUDITOR"] },
  { href: "/platform/institutions", label: "Institutions", icon: Building2, roles: ["ADMIN"] },
  { href: "/platform/standards", label: "Standards", icon: FileCheck, roles: ["ADMIN"] },
  { href: "/platform/assessments", label: "Assessments", icon: ClipboardList, roles: ["ADMIN", "TEACHER", "AUDITOR"] },
  { href: "/platform/evidence", label: "Evidence", icon: FileText, roles: ["ADMIN", "TEACHER", "AUDITOR"] },
  { href: "/platform/notifications", label: "Notifications", icon: Bell, roles: ["ADMIN", "TEACHER", "AUDITOR"] },
]

const adminItems = [
  { href: "/platform/admin", label: "Admin Panel", icon: Settings, roles: ["ADMIN"] },
  { href: "/platform/admin/users", label: "Manage Users", icon: Users, roles: ["ADMIN"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const filteredNavItems = navItems.filter((item) => user && item.roles.includes(user.role))
  const filteredAdminItems = adminItems.filter((item) => user && item.roles.includes(user.role))

  const handleLogout = async () => {
    await logout()
    window.location.href = "/platform/login"
  }

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-6 border-b border-border">
        <AynLogo size={collapsed ? "sm" : "md"} heroStyle withGlow={false} />
        {!collapsed && (
          <div>
            <h1 className="font-semibold text-foreground">Ayn</h1>
            <p className="text-xs text-muted-foreground">Platform</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-primary" aria-hidden />
              )}
              <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "group-hover:text-primary/80")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}

        {filteredAdminItems.length > 0 && (
          <>
            <div className="border-t border-border my-3 pt-3" />
            <div className="pb-2">
              {!collapsed && (
                <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Admin</p>
              )}
            </div>
            {filteredAdminItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-primary" aria-hidden />
                  )}
                  <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "group-hover:text-primary/80")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        {user && !collapsed && (
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-accent text-accent-foreground">
              {user.role === "ADMIN" ? "Admin" : "User"}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-colors",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 sticky top-0",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 p-1 bg-sidebar border border-sidebar-border rounded-full text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>
    </>
  )
}
