"use client"

import AynAIChat from "@/components/platform/horus/ayn-ai-chat"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { AmbientBackground } from "@/components/ui/ambient-background"

export default function HorusAIPage() {
  return (
    <ProtectedRoute>
      <AmbientBackground variant="chat" showParticles={false}>
        <AynAIChat />
      </AmbientBackground>
    </ProtectedRoute>
  )
}
