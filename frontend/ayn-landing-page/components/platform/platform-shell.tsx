"use client"

import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import PlatformSidebar from "@/components/platform-sidebar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const headerContent = [
  {
    match: (pathname: string) => pathname === "/platform" || pathname.startsWith("/platform/dashboard"),
    title: "Dashboard",
    description: "Track your compliance activity, evidence uploads, and progress at a glance.",
  },
  {
    match: (pathname: string) => pathname.startsWith("/platform/evidence"),
    title: "Evidence Upload",
    description: "Collect and organize supporting documentation for every standard.",
  },
  {
    match: (pathname: string) => pathname.startsWith("/platform/gap-analysis"),
    title: "Gap Analysis",
    description: "Review coverage gaps and prioritize corrective actions.",
  },
  {
    match: (pathname: string) => pathname.startsWith("/platform/archive"),
    title: "Archive",
    description: "Browse historical reports, exports, and completed assessments.",
  },
  {
    match: (pathname: string) => pathname.startsWith("/platform/settings"),
    title: "Settings",
    description: "Manage your workspace preferences and notification settings.",
  },
]

export default function PlatformShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  const header = useMemo(() => {
    return (
      headerContent.find((item) => item.match(pathname)) ?? {
        title: "Horus AI Platform",
        description: "Welcome to your compliance workspace.",
      }
    )
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <PlatformSidebar open={sidebarOpen} />

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Link href="/platform" className="text-sm font-semibold tracking-tight">
                  Horus AI
                </Link>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSidebarOpen((prev) => !prev)}
                    >
                      {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Platform</p>
                <p className="text-sm font-medium text-foreground">Horus AI Workspace</p>
              </div>
            </div>
            <div className="px-6 pb-5">
              <h1 className="text-2xl font-semibold text-foreground">{header.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{header.description}</p>
            </div>
          </header>

          <main className="px-6 py-6 md:px-10 md:py-8">
            <div className={cn("mx-auto flex w-full flex-col gap-6", sidebarOpen ? "max-w-6xl" : "max-w-5xl")}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {!sidebarOpen && (
        <div className="fixed bottom-6 left-4 z-40">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Open sidebar
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  )
}
