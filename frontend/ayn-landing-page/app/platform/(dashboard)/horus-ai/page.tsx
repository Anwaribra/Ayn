"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import AynAIChatRedesigned from "@/components/platform/horus/ayn-ai-chat-redesigned"

export default function HorusAIPage() {
  return (
    <ProtectedRoute>
      <div className="h-full min-h-[calc(100dvh-64px)]">
        <AynAIChatRedesigned />
      </div>
    </ProtectedRoute>
  )
}
