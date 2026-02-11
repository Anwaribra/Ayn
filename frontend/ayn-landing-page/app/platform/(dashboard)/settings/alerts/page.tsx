"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

const ALERTS_KEY = "ayn-settings-alerts"

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

function loadAlerts(): AlertSettings {
  if (typeof window === "undefined") return defaults
  try {
    const s = localStorage.getItem(ALERTS_KEY)
    return s ? { ...defaults, ...JSON.parse(s) } : defaults
  } catch {
    return defaults
  }
}

export default function NeuralAlertsPage() {
  return (
    <ProtectedRoute>
      <NeuralAlertsContent />
    </ProtectedRoute>
  )
}

function NeuralAlertsContent() {
  const [settings, setSettings] = useState<AlertSettings>(defaults)

  useEffect(() => {
    setSettings(loadAlerts())
  }, [])

  const update = (key: keyof AlertSettings, value: boolean) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    localStorage.setItem(ALERTS_KEY, JSON.stringify(next))
    toast.success("Settings saved")
  }

  return (
    <div className="animate-fade-in-up pb-20 max-w-2xl px-4">
      <Link
        href="/platform/settings"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm font-medium mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      <header className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-white">
          Neural <span className="text-zinc-600 font-light">Alerts</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Configure compliance notifications and Horus triggers
        </p>
      </header>

      <div className="glass-panel p-6 rounded-2xl border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-zinc-300 font-medium">Compliance Notifications</Label>
            <p className="text-[11px] text-zinc-500 mt-0.5">Receive alerts when compliance status changes</p>
          </div>
          <Switch
            checked={settings.complianceNotifications}
            onCheckedChange={(v) => update("complianceNotifications", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-zinc-300 font-medium">Horus Triggers</Label>
            <p className="text-[11px] text-zinc-500 mt-0.5">Allow Horus AI to send proactive recommendations</p>
          </div>
          <Switch
            checked={settings.horusTriggers}
            onCheckedChange={(v) => update("horusTriggers", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-zinc-300 font-medium">Gap Alerts</Label>
            <p className="text-[11px] text-zinc-500 mt-0.5">Notify when new compliance gaps are detected</p>
          </div>
          <Switch
            checked={settings.gapAlerts}
            onCheckedChange={(v) => update("gapAlerts", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-zinc-300 font-medium">Evidence Reminders</Label>
            <p className="text-[11px] text-zinc-500 mt-0.5">Remind to link evidence to criteria</p>
          </div>
          <Switch
            checked={settings.evidenceReminders}
            onCheckedChange={(v) => update("evidenceReminders", v)}
          />
        </div>
      </div>
    </div>
  )
}
