"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PlatformHomePage() {
  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Welcome to Horus AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This workspace keeps your accreditation evidence, gap analysis, and audits in one unified
            place. Start by uploading evidence or reviewing your dashboard insights.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Upload evidence</Button>
            <Button size="sm" variant="outline">
              View dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Evidence Intake", detail: "Collect documents and tag them to standards." },
          { title: "Gap Analysis", detail: "Spot compliance gaps before formal review." },
          { title: "Archive", detail: "Store completed assessments and exports." },
        ].map((item) => (
          <Card key={item.title} className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{item.detail}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
