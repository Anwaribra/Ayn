"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const overviewStats = [
  { label: "Active Standards", value: "12" },
  { label: "Evidence Queued", value: "48" },
  { label: "Reviews Pending", value: "6" },
]

const activity = [
  "Upcoming audit review in 2 weeks",
  "Evidence uploads waiting for tagging",
  "Gap analysis export ready for download",
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {overviewStats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">Placeholder metrics</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Compliance Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Visualize standards progress, evidence coverage, and reviewer status here. This panel will
            soon show live compliance charts.
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Next Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {activity.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
