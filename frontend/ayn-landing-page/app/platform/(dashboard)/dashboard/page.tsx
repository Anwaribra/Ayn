"use client"

import { Header } from "@/components/platform/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Dashboard"
        description="Track evidence, analysis, and reporting at a glance."
      />

      <div className="p-4 md:p-[var(--spacing-content)] max-w-6xl mx-auto space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {["Statistics", "Summary", "Status"].map((title) => (
            <Card key={title} className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">No data yet</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
