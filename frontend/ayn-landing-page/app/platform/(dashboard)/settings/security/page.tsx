"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield } from "lucide-react"
import { toast } from "sonner"

const SECURITY_KEY = "ayn-settings-security"

interface SecuritySettings {
  mfaEnabled: boolean
  sessionTimeout: number
}

function loadSecurity(): SecuritySettings {
  if (typeof window === "undefined")
    return { mfaEnabled: false, sessionTimeout: 24 }
  try {
    const s = localStorage.getItem(SECURITY_KEY)
    return s ? JSON.parse(s) : { mfaEnabled: false, sessionTimeout: 24 }
  } catch {
    return { mfaEnabled: false, sessionTimeout: 24 }
  }
}

export default function SecurityPage() {
  return (
    <ProtectedRoute>
      <SecurityContent />
    </ProtectedRoute>
  )
}

function SecurityContent() {
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(24)

  useEffect(() => {
    const s = loadSecurity()
    setMfaEnabled(s.mfaEnabled)
    setSessionTimeout(s.sessionTimeout)
  }, [])

  const handleMfaToggle = (v: boolean) => {
    setMfaEnabled(v)
    const s = loadSecurity()
    localStorage.setItem(SECURITY_KEY, JSON.stringify({ ...s, mfaEnabled: v }))
    toast.info(v ? "MFA setup coming soon" : "MFA disabled")
  }

  const handleSaveTimeout = () => {
    const s = loadSecurity()
    localStorage.setItem(SECURITY_KEY, JSON.stringify({ ...s, sessionTimeout }))
    toast.success("Session timeout saved")
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

      <div className="glass-panel p-6 rounded-2xl border-[var(--border-subtle)] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[var(--text-secondary)] font-medium">Multi-Factor Authentication</Label>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Require MFA for account access</p>
          </div>
          <Switch checked={mfaEnabled} onCheckedChange={handleMfaToggle} />
        </div>
        <div>
          <Label className="text-[var(--text-secondary)] font-medium">Session Timeout (hours)</Label>
          <div className="flex gap-2 mt-2">
            <input
              type="number"
              min={1}
              max={168}
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(Number(e.target.value))}
              className="w-20 h-9 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] px-3 text-[var(--text-primary)] text-sm"
            />
            <Button size="sm" variant="outline" onClick={handleSaveTimeout}>
              Save
            </Button>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Auto-logout after inactivity</p>
        </div>
      </div>

      <div className="mt-8 glass-panel p-6 rounded-2xl border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center gap-2 text-emerald-500 mb-2">
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
