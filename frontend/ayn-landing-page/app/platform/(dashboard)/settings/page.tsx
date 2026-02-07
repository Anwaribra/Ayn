"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Workspace Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace">Workspace name</Label>
            <Input id="workspace" placeholder="Horus AI Compliance" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Primary contact</Label>
            <Input id="email" type="email" placeholder="compliance@horus.ai" />
          </div>
          <div className="flex justify-end">
            <Button size="sm">Save changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Notification Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Configure alert cadence and reviewer notifications once integrations are live.</p>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-xs">
            Upcoming controls: weekly digest, evidence review reminders, team mentions.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
