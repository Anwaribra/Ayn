"use client"

import type { ReactNode } from "react"
import { SWRConfig } from "swr"
import { toast } from "sonner"
import { Sidebar } from "@/components/platform/sidebar"
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
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </SWRConfig>
    </ProtectedRoute>
  )
}
