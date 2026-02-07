"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function EvidencePage() {
  return (
    <div className="space-y-6">
      <Card className="border-dashed border-border/70 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Evidence Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Upload documentation for Horus AI to analyze against accreditation standards.</p>
          <Button size="sm">Upload files</Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Upload queue</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">No files uploaded yet.</CardContent>
      </Card>
    </div>
  )
}
