"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import dynamic from "next/dynamic"

// Use dynamic import with ssr: false to prevent hydration mismatches and white space issues
const HorusAssistant = dynamic(
  () => import("@/components/platform/horus/horus-assistant").then(mod => mod.HorusAssistant),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-full w-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )}
)

export default function HorusAIPage() {
  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-56px)] bg-layer-0 flex flex-col">
        <HorusAssistant />
      </div>
    </ProtectedRoute>
  )
}
