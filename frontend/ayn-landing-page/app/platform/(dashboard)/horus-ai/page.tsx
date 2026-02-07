"use client"

import AynAIChat from "@/components/ui/ayn-ai-chat"

export default function HorusAIPage() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 p-6 shadow-sm">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl animate-breathe" />
          <div className="absolute bottom-[-5rem] right-12 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl animate-liquid" />
          <div className="absolute top-12 right-1/3 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl animate-float" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Horus AI</p>
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
