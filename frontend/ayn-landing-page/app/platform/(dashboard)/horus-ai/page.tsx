"use client"

import AynAIChat from "@/components/ui/ayn-ai-chat"

export default function HorusAIPage() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 p-8 shadow-sm">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-12 h-52 w-52 rounded-full bg-primary/25 blur-3xl animate-breathe" />
          <div className="absolute bottom-[-6rem] right-16 h-64 w-64 rounded-full bg-sky-500/25 blur-3xl animate-liquid" />
          <div className="absolute top-10 right-1/3 h-44 w-44 rounded-full bg-purple-500/25 blur-3xl animate-float" />
        </div>
        <div className="relative space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">Horus AI</p>
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            Ask, analyze, and document in one place.
          </h1>
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
