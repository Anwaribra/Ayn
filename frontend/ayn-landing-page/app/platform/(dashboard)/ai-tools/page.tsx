"use client"

import { Header } from "@/components/platform/header"
import AynAIChat from "@/components/ui/ayn-ai-chat"

export default function AIToolsPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Horus AI"
        description="Chat about your certificate or documents"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform/dashboard" },
          { label: "Horus AI" },
        ]}
      />
      <div className="p-4 md:p-[var(--spacing-content)]">
        <AynAIChat />
      </div>
    </div>
  )
}
