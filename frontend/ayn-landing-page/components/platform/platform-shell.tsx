"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import PlatformSidebar from "@/components/platform-sidebar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function PlatformShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-background text-foreground">
      <PlatformSidebar open={sidebarOpen} />

      <div className="flex h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSidebarOpen((prev) => !prev)}
                  >
                    {sidebarOpen ? (
                      <PanelLeftClose className="h-4 w-4" />
                    ) : (
                      <PanelLeftOpen className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                </TooltipContent>
              </Tooltip>
              <Link href="/platform/horus" className="text-sm font-semibold tracking-tight">
                Horus AI
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                User
              </span>
              <Button variant="ghost" size="sm" className="text-xs">
                Logout
              </Button>
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link href="/">Back to Ayn</Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-y-auto px-6 py-6 md:px-10 md:py-8">
          {children}
        </main>
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
