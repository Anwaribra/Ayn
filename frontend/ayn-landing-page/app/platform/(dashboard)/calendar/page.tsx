"use client"

import { Header } from "@/components/platform/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react"

const schedule = [
  {
    title: "Evidence review sprint",
    date: "Apr 22 • 10:00 AM",
    owner: "Quality Office",
    status: "Upcoming",
  },
  {
    title: "Standards alignment workshop",
    date: "Apr 30 • 1:00 PM",
    owner: "Academic Affairs",
    status: "Planned",
  },
  {
    title: "Mock audit walkthrough",
    date: "May 06 • 9:00 AM",
    owner: "Accreditation Lead",
    status: "Needs prep",
  },
]

export default function CalendarPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Review Calendar"
        description="Coordinate accreditation milestones, evidence reviews, and committee checkpoints."
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
              {schedule.map((item) => (
                <div key={item.title} className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                    <p className="text-xs text-muted-foreground">Owner: {item.owner}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Readiness checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Evidence tagging complete for Q2 cycle
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Reviewer assignments confirmed
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                Audit briefing deck in progress
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
