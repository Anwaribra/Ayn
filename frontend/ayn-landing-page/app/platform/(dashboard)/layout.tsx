"use client"

import type { ReactNode } from "react"
import { Sidebar } from "@/components/platform/sidebar"
import { ProtectedRoute } from "@/components/platform/protected-route"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </ProtectedRoute>
  )
}
