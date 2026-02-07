"use client"

import { Button } from "@/components/ui/button"

export default function HorusChatPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <div className="mx-auto max-w-xl space-y-4">
          <div className="text-3xl font-semibold text-foreground">Horus AI</div>
          <p className="text-sm text-muted-foreground">
            Start a new conversation to analyze accreditation evidence and uncover gaps.
          </p>
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-8 text-sm text-muted-foreground">
            No messages yet. Your chat history will appear here.
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 bg-background/95 px-4 py-4 md:px-8">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
          <input
            placeholder="Message Horus AI"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Button size="sm">Send</Button>
        </div>
      </div>
    </div>
  )
}
