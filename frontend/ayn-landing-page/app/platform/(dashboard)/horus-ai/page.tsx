"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { HorusChat } from "@/components/ui/horus-chat"

export default function HorusAIPage() {
  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-56px)] bg-layer-0 flex flex-col">
        <HorusChat />
      </div>
    </ProtectedRoute>
  )
}
