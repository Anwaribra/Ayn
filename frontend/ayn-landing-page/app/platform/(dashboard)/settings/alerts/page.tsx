"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useUserPreferences } from "@/hooks/use-user-preferences"

interface AlertSettings {
  complianceNotifications: boolean
  horusTriggers: boolean
  gapAlerts: boolean
  evidenceReminders: boolean
}

const defaults: AlertSettings = {
  complianceNotifications: true,
  horusTriggers: true,
  gapAlerts: true,
  evidenceReminders: false,
}

export default function NeuralAlertsPage() {
  return (
    <ProtectedRoute>
      <NeuralAlertsContent />
    </ProtectedRoute>
  )
}

function NeuralAlertsContent() {
  const { preferences, isLoading, error, mutate, savePreferences } = useUserPreferences()

  const settings = useMemo<AlertSettings>(
    () => ({
      complianceNotifications: preferences.complianceNotifications ?? defaults.complianceNotifications,
      horusTriggers: preferences.horusTriggers ?? defaults.horusTriggers,
      gapAlerts: preferences.gapAlerts ?? defaults.gapAlerts,
      evidenceReminders: preferences.evidenceReminders ?? defaults.evidenceReminders,
    }),
    [preferences]
  )

  const update = async (key: keyof AlertSettings, value: boolean) => {
    try {
      await savePreferences({ [key]: value })
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    }
  }

  return (
    <div className="animate-fade-in-up pb-20 max-w-2xl px-4">
      <Link
        href="/platform/settings"
        className="inline-flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-medium mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      <header className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
          Neural <span className="text-[var(--text-tertiary)] font-light">Alerts</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Configure compliance notifications and Horus triggers
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Failed to load your alert preferences.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void mutate()}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="glass-panel p-6 rounded-2xl glass-border space-y-6">
        {isLoading && (
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-3 text-xs text-muted-foreground">
            Syncing alert preferences...
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[var(--text-secondary)] font-medium">Compliance Notifications</Label>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Receive alerts when compliance status changes</p>
          </div>
          <Switch
            checked={settings.complianceNotifications}
            disabled={isLoading}
            onCheckedChange={(v) => void update("complianceNotifications", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[var(--text-secondary)] font-medium">Horus Triggers</Label>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Allow Horus AI to send proactive recommendations</p>
          </div>
          <Switch
            checked={settings.horusTriggers}
            disabled={isLoading}
            onCheckedChange={(v) => void update("horusTriggers", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[var(--text-secondary)] font-medium">Gap Alerts</Label>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Notify when new compliance gaps are detected</p>
          </div>
          <Switch
            checked={settings.gapAlerts}
            disabled={isLoading}
            onCheckedChange={(v) => void update("gapAlerts", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[var(--text-secondary)] font-medium">Evidence Reminders</Label>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Remind to link evidence to criteria</p>
          </div>
          <Switch
            checked={settings.evidenceReminders}
            disabled={isLoading}
            onCheckedChange={(v) => void update("evidenceReminders", v)}
          />
        </div>
      </div>
    </div>
  )
}
