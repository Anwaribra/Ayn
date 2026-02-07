"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ArchivePage() {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Archive</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Completed assessments and exports will be stored here.
      </CardContent>
    </Card>
  )
}
