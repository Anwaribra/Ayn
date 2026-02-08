"use client"

import {
  type ReactNode,
  Fragment,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import useSWR from "swr"
import {
  PanelLeftOpen,
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  LayoutDashboard,
  Bot,
  FileText,
  BarChart3,
  Archive,
} from "lucide-react"
import PlatformSidebar from "@/components/platform-sidebar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import type { Notification } from "@/types"

// ─── Route labels for auto-breadcrumbs ───────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  platform: "Platform",
  dashboard: "Dashboard",
  "horus-ai": "Horus AI",
  evidence: "Evidence",
  "gap-analysis": "Gap Analysis",
  assessments: "Assessments",
  archive: "Accreditation Archive",
  standards: "Standards",
  notifications: "Notifications",
  settings: "Settings",
  new: "New",
  edit: "Edit",
  review: "Review",
  upload: "Upload",
  calendar: "Calendar",
  analytics: "Analytics",
  "ai-tools": "AI Tools",
  overview: "Overview",
}

// ─── Search command palette items ────────────────────────────────────────────

const searchItems = [
  { href: "/platform/horus-ai", label: "Horus AI", icon: Bot },
  { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/platform/evidence", label: "Evidence", icon: FileText },
  {
    href: "/platform/gap-analysis",
    label: "Gap Analysis",
    icon: Search,
  },
  {
    href: "/platform/assessments",
    label: "Assessments",
    icon: BarChart3,
  },
  { href: "/platform/archive", label: "Accreditation Archive", icon: Archive },
  {
    href: "/platform/notifications",
    label: "Notifications",
    icon: Bell,
  },
  { href: "/platform/settings", label: "Settings", icon: Settings },
]

// ─── Shell component ─────────────────────────────────────────────────────────

export default function PlatformShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()

  // ── Auto-breadcrumbs from current pathname ──────────────────────────────
  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)
    // Skip the leading "platform" segment, build crumbs from the rest
    return segments.slice(1).map((segment, index) => ({
      label:
        ROUTE_LABELS[segment] ??
        segment.charAt(0).toUpperCase() +
          segment.slice(1).replace(/-/g, " "),
      href: "/" + segments.slice(0, index + 2).join("/"),
      isLast: index === segments.length - 2,
    }))
  }, [pathname])

  // ── Notification count via SWR (shared cache with notifications page) ───
  const { data: notifications } = useSWR<Notification[]>(
    isAuthenticated ? "notifications" : null,
    () => api.getNotifications(),
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    },
  )
  const notificationCount = useMemo(
    () => notifications?.filter((n) => !n.read).length ?? 0,
    [notifications],
  )

  // ── Keyboard shortcut: Cmd/Ctrl + K to toggle search palette ────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSearchSelect = useCallback(
    (href: string) => {
      setSearchOpen(false)
      router.push(href)
    },
    [router],
  )

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <PlatformSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        notificationCount={notificationCount}
      />

      {/* ── Main content area ──────────────────────────────────────────── */}
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* ── Top header bar ───────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/50 bg-background/80 px-4 backdrop-blur-md">
          {/* Left side: sidebar toggle + breadcrumbs */}
          <div className="flex min-w-0 items-center gap-2">
            {!sidebarOpen && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Expand sidebar
                </TooltipContent>
              </Tooltip>
            )}

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href="/platform/dashboard"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Platform
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb) => (
                  <Fragment key={crumb.href}>
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                      {crumb.isLast ? (
                        <BreadcrumbPage className="font-medium">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href}>
                            {crumb.label}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right side: search + notifications + user menu */}
          <div className="flex items-center gap-1">
            {/* Search trigger — desktop */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden h-8 items-center gap-2 px-2.5 text-muted-foreground hover:text-foreground md:flex"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-xs">Search…</span>
              <kbd className="pointer-events-none ml-1 inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            {/* Search trigger — mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground md:hidden"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Search (⌘K)
              </TooltipContent>
            </Tooltip>

            {/* Notification bell */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "relative h-8 w-8 text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() =>
                    router.push("/platform/notifications")
                  }
                >
                  <Bell className="h-4 w-4" />
                  {notificationCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-[var(--brand-foreground)] ring-2 ring-background">
                      {notificationCount > 9
                        ? "9+"
                        : notificationCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {notificationCount > 0
                  ? `${notificationCount} unread notification${notificationCount !== 1 ? "s" : ""}`
                  : "Notifications"}
              </TooltipContent>
            </Tooltip>

            {/* User avatar dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative ml-0.5 h-8 w-8 rounded-full"
                  size="icon"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-[var(--brand)]/10 text-xs font-semibold text-[var(--brand)]">
                      {user?.name
                        ?.charAt(0)
                        ?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none">
                      {isAuthenticated
                        ? user?.name
                        : "Guest"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {isAuthenticated
                        ? user?.email
                        : "Not signed in"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() =>
                      router.push("/platform/settings")
                    }
                  >
                    <Settings />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(
                        "/platform/notifications",
                      )
                    }
                  >
                    <Bell />
                    Notifications
                    {notificationCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--brand)]/10 px-1.5 text-[10px] font-bold text-[var(--brand)]">
                        {notificationCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {isAuthenticated && (
                  <DropdownMenuItem
                    onClick={() => logout()}
                    variant="destructive"
                  >
                    <LogOut />
                    Log out
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* ── Search command palette ─────────────────────────────────────── */}
      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Search"
        description="Navigate to any page"
      >
        <CommandInput placeholder="Search pages…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {searchItems.map((item) => {
              const Icon = item.icon
              return (
                <CommandItem
                  key={item.href}
                  value={item.label}
                  onSelect={() =>
                    handleSearchSelect(item.href)
                  }
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}
