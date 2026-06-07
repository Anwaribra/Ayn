"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { HorusAccessGate } from "@/components/platform/horus-access-gate"
import AynAIChatRedesigned from "@/components/platform/horus/ayn-ai-chat-redesigned"

export default function HorusAIPage() {
  return (
    <ProtectedRoute>
      <HorusAccessGate>
        <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <AynAIChatRedesigned />
          </div>
        </div>
      </HorusAccessGate>
    </ProtectedRoute>
  )
}
