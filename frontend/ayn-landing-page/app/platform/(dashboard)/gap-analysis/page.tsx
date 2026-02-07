"use client"

import { Header } from "@/components/platform/header"

export default function GapAnalysisPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Gap Analysis"
        description="Identify compliance gaps across your evidence and standards."
      />

      <div className="p-4 md:p-[var(--spacing-content)] max-w-5xl mx-auto space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="text-sm text-muted-foreground">Run analysis to see compliance gaps</div>
        </div>
      </div>
    </div>
  )
}
