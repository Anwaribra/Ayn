"use client"

import { Header } from "@/components/platform/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, Target } from "lucide-react"

const insights = [
  {
    title: "Standards coverage",
    value: "86%",
    description: "Mapped criteria across ISO 21001 & NAQAAE frameworks.",
    icon: Target,
    progress: 86,
  },
  {
    title: "Evidence utilization",
    value: "62%",
    description: "Evidence linked to active reviews in the past 60 days.",
    icon: BarChart3,
    progress: 62,
  },
  {
    title: "Assessment velocity",
    value: "18",
    description: "Assessments completed this quarter.",
    icon: TrendingUp,
    progress: 72,
  },
]

const signals = [
  { label: "Policies needing updates", value: "12", status: "Needs attention" },
  { label: "Reviewer workload balance", value: "Healthy", status: "On track" },
  { label: "Upcoming audits", value: "3", status: "Planned" },
]

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Quality Insights"
        description="Measure accreditation readiness and spotlight gaps before the next review."
      />

      <div className="p-4 md:p-[var(--spacing-content)] space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {insights.map((item) => (
            <Card key={item.title} className="border-border/60 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-semibold text-foreground">{item.value}</div>
                <Progress value={item.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Operational signals</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {signals.map((signal) => (
              <div key={signal.label} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">{signal.label}</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{signal.value}</p>
                <Badge variant="outline" className="mt-3 text-[10px]">
                  {signal.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
