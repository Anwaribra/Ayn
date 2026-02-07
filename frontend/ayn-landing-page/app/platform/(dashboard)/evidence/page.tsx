"use client"

import { Header } from "@/components/platform/header"
import { Button } from "@/components/ui/button"

export default function EvidencePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Evidence"
        description="Upload and manage evidence files for compliance checks."
      />

      <div className="p-4 md:p-[var(--spacing-content)] max-w-5xl mx-auto space-y-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center shadow-sm">
            <div className="text-sm font-medium text-foreground">Drag & drop files here</div>
            <p className="mt-2 text-xs text-muted-foreground">
              Upload evidence to let Horus analyze it against ISO and Egyptian standards.
            </p>
            <div className="mt-4 flex justify-center">
              <Button>Upload files</Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Uploaded evidence</h2>
          <div className="mt-3 text-sm text-muted-foreground">No evidence uploaded yet</div>
        </div>
      </div>
    </div>
  )
}
