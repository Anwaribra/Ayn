"use client"

import Link from "next/link"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useUserPreferences } from "@/hooks/use-user-preferences"

export default function DataIntegrityPage() {
  return (
    <ProtectedRoute>
      <DataIntegrityContent />
    </ProtectedRoute>
  )
}

function DataIntegrityContent() {
  const { preferences, isLoading, error, mutate, savePreferences } = useUserPreferences()
  const euResidency = preferences.euResidency ?? false
  const bridgeEnabled = preferences.bridgeEnabled ?? true

  const update = async (key: string, value: boolean) => {
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
          Data <span className="text-[var(--text-tertiary)] font-light">Integrity</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Institutional data residency and bridge settings
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Failed to load data preferences.
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void mutate()}>
            Retry
          </Button>
        </div>
      )}

      <div className="glass-panel p-6 rounded-2xl glass-border space-y-6">
        {isLoading && (
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-3 text-xs text-muted-foreground">
            Syncing data preferences...
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[var(--text-secondary)] font-medium">EU Data Residency</Label>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Store data exclusively in EU regions</p>
          </div>
          <Switch
            checked={euResidency}
            disabled={isLoading}
            onCheckedChange={(v) => void update("euResidency", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[var(--text-secondary)] font-medium">Bridge Sync</Label>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Enable data bridge for external systems</p>
          </div>
          <Switch
            checked={bridgeEnabled}
            disabled={isLoading}
            onCheckedChange={(v) => void update("bridgeEnabled", v)}
          />
        </div>
      </div>
    </div>
  )
}
