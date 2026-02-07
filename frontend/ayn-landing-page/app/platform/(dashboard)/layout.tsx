"use client"

import type { ReactNode } from "react"
import { SWRConfig } from "swr"
import { toast } from "sonner"
import PlatformSidebar from "@/components/platform-sidebar"
import { ProtectedRoute } from "@/components/platform/protected-route"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <SWRConfig
        value={{
          onError: (error) => {
            const msg = error?.message ?? "Something went wrong"
            if (!msg.toLowerCase().includes("unauthorized")) {
              toast.error(msg)
            }
          },
        }}
      >
        <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
          <PlatformSidebar />
          <main className="flex-1 overflow-x-hidden">
            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.08),_transparent_45%)]">
              {children}
            </div>
          </main>
        </div>
      </SWRConfig>
    </ProtectedRoute>
  )
}
