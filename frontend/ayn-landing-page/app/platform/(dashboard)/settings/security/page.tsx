"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield } from "lucide-react"
import { toast } from "sonner"
import { useUserPreferences } from "@/hooks/use-user-preferences"

export default function SecurityPage() {
  return (
    <ProtectedRoute>
      <SecurityContent />
    </ProtectedRoute>
  )
}

function SecurityContent() {
  const { preferences, isLoading, error, mutate, savePreferences } = useUserPreferences()
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null)

  const mfaEnabled = useMemo(() => preferences.mfaEnabled ?? false, [preferences.mfaEnabled])
  const resolvedSessionTimeout = sessionTimeout ?? preferences.sessionTimeout ?? 24

  const handleMfaToggle = async (v: boolean) => {
    try {
      await savePreferences({ mfaEnabled: v })
      toast.success(v ? "MFA policy enabled. Enforcement begins next login." : "MFA policy disabled")
    } catch {
      toast.error("Failed to save MFA policy")
    }
  }

  const handleSaveTimeout = async () => {
    try {
      await savePreferences({ sessionTimeout: resolvedSessionTimeout })
      toast.success("Session timeout saved")
    } catch {
      toast.error("Failed to save session timeout")
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
          Security & <span className="text-[var(--text-tertiary)] font-light">Encryption</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Manage AES-256 keys and MFA requirements
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Failed to load your security preferences.
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void mutate()}>
            Retry
          </Button>
        </div>
      )}

      <div className="glass-panel p-6 rounded-2xl glass-border space-y-6">
        {isLoading && (
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] px-4 py-3 text-xs text-muted-foreground">
            Syncing security preferences...
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[var(--text-secondary)] font-medium">Multi-Factor Authentication</Label>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Require MFA for account access</p>
          </div>
          <Switch checked={mfaEnabled} disabled={isLoading} onCheckedChange={(value) => void handleMfaToggle(value)} />
        </div>
        <div>
          <Label className="text-[var(--text-secondary)] font-medium">Session Timeout (hours)</Label>
          <div className="flex gap-2 mt-2">
            <input
              type="number"
              min={1}
              max={168}
              value={resolvedSessionTimeout}
              onChange={(e) => setSessionTimeout(Number(e.target.value))}
              className="w-20 h-9 rounded-xl glass-input px-3 text-[var(--text-primary)] text-sm"
            />
            <Button size="sm" variant="outline" disabled={isLoading} onClick={() => void handleSaveTimeout()}>
              Save
            </Button>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Auto-logout after inactivity</p>
        </div>
      </div>

      <div className="mt-8 glass-panel p-6 rounded-2xl status-success border">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4" />
          <span className="font-medium">Encryption</span>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          All data is encrypted at rest using AES-256. Keys are managed securely by the platform.
        </p>
      </div>
    </div>
  )
}
