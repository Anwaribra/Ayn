"use client"

import AynAIChat from "@/components/ui/ayn-ai-chat"

export default function HorusAIPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Horus AI Workspace
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Ask, analyze, and document in one place.</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Use Horus AI to interpret evidence, summarize standards guidance, and prepare compliance-ready
            narratives without leaving Ayn.
          </p>
        </div>
      </section>

      <AynAIChat />
    </div>
  )
}
