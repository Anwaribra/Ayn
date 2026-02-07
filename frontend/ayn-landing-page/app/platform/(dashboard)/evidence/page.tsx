"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Drag and drop evidence files into the upload queue.</p>
          <p>Tag each file to the corresponding standard or criterion.</p>
          <p>Track review status and analyst feedback in real time.</p>
        </CardContent>
      </Card>
    </div>
  )
}
