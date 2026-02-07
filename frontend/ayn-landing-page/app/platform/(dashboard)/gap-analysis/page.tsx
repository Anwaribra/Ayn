"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const insights = [
  { title: "Coverage by standard", detail: "Identify standards with limited evidence." },
  { title: "Top risk areas", detail: "Surface criteria requiring immediate attention." },
  { title: "Recommended actions", detail: "Generate a clear remediation checklist." },
]

export default function GapAnalysisPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {insights.map((insight) => (
        <Card key={insight.title} className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">{insight.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{insight.detail}</CardContent>
        </Card>
      ))}
    </div>
  )
}
