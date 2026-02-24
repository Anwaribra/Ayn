"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { HorusAssistant } from "@/components/platform/horus/horus-assistant"

export default function HorusAIPage() {
  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-56px)]">
        <HorusAssistant />
      </div>
    </ProtectedRoute>
  )
}
