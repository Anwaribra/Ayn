"use client"

import AynAIChat from "@/components/ui/ayn-ai-chat"
import { ProtectedRoute } from "@/components/platform/protected-route"

export default function HorusAIPage() {
  return (
    <ProtectedRoute>
      <AynAIChat />
    </ProtectedRoute>
  )
}
