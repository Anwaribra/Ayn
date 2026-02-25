"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import AynAIChatRedesigned from "@/components/platform/horus/ayn-ai-chat-redesigned"

export default function HorusAIPage() {
  return (
    <ProtectedRoute>
      <div className="h-[calc(100dvh-120px)] lg:h-[calc(100vh-80px)]">
        <AynAIChatRedesigned />
      </div>
    </ProtectedRoute>
  )
}
