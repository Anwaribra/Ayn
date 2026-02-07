"use client"

import { Header } from "@/components/platform/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header title="Settings" description="Manage your profile and preferences." />

      <div className="p-4 md:p-[var(--spacing-content)] max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Profile</h2>
            <p className="text-xs text-muted-foreground">Update your account details.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
            <div>
              <div className="text-sm font-medium text-foreground">Theme</div>
              <div className="text-xs text-muted-foreground">Toggle light or dark mode.</div>
            </div>
            <ThemeToggle variant="icon" />
          </div>

          <div className="flex justify-end">
            <Button>Save changes</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
