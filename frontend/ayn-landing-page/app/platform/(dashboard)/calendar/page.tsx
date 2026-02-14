"use client"

import { Header } from "@/components/platform/header"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, CheckCircle2 } from "lucide-react"

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Header
          title="Review Calendar"
          description="Coordinate compliance milestones, evidence reviews, and committee checkpoints."
          actions={
            <Button size="sm" variant="outline">
              <CalendarDays className="mr-2 h-4 w-4" />
              Add milestone
            </Button>
          }
        />

        <div className="p-4 md:p-[var(--spacing-content)] space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/60 bg-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Upcoming checkpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No upcoming milestones scheduled.
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Readiness checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 opacity-50">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>No active checklists</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
