"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/platform/protected-route"

export default function ArchivePage() {
  return (
    <ProtectedRoute>
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Archived Reports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>No archived reports yet. Generate a gap analysis export to keep a history of submissions.</p>
        <Button asChild size="sm">
          <Link href="/platform/gap-analysis">Run gap analysis</Link>
        </Button>
      </CardContent>
    </Card>
    </ProtectedRoute>
  )
}
