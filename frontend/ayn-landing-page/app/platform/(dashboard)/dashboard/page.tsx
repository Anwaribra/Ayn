"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        "Evidence intake",
        "Gap analysis status",
        "Review progress",
      ].map((title) => (
        <Card key={title} className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No data yet.</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
