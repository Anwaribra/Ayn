"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import PlatformSidebar from "@/components/platform-sidebar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export default function PlatformShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <PlatformSidebar open={sidebarOpen} />

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 md:px-10">
            <div className="flex items-center justify-between gap-3">
              <Link href="/platform" className="text-sm font-semibold tracking-tight text-foreground">
                Ayn
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
          </div>

          <main className="px-6 pb-10 md:px-10">
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
