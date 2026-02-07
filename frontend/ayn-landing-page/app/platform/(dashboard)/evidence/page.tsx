"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const evidenceSteps = [
  "Drag and drop evidence files into the upload queue.",
  "Tag each file to the corresponding standard or criterion.",
  "Track review status and analyst feedback in real time.",
]

export default function EvidencePage() {
  return (
    <div className="space-y-6">
      <Card className="border-dashed border-border/70 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Evidence Upload Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Upload documentation for Horus AI to analyze against your accreditation standards.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Upload files</Button>
            <Button size="sm" variant="outline">
              Connect storage
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">How it will work</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {evidenceSteps.map((step) => (
              <li key={step} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
