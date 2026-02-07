"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function GapAnalysisPage() {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Gap Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>No gap analysis results yet. Upload evidence to generate coverage insights.</p>
        <Button asChild size="sm">
          <Link href="/platform/evidence">Upload evidence</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
