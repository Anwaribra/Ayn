"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Compliance Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>No compliance metrics yet. Upload evidence to unlock standards coverage insights.</p>
            <Button asChild size="sm">
              <Link href="/platform/evidence">Upload evidence</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Next Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Connect your first evidence set to generate action items and reminders.</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/platform/horus-ai">Ask Horus AI</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
