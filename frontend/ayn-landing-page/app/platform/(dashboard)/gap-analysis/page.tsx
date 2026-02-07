"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function GapAnalysisPage() {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Gap Analysis</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Gap analysis results will appear here once evidence is processed.
      </CardContent>
    </Card>
  )
}
