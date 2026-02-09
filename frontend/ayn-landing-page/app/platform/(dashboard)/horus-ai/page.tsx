"use client"

import AynAIChatRedesigned from "@/components/platform/horus/ayn-ai-chat-redesigned"
import { ProtectedRoute } from "@/components/platform/protected-route"

export default function HorusAIPage() {
  return (
    <ProtectedRoute>
      <AynAIChatRedesigned />
    </ProtectedRoute>
  )
}
