"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

const DATA_KEY = "ayn-settings-data"

interface DataSettings {
  euResidency: boolean
  bridgeEnabled: boolean
}

function loadData(): DataSettings {
  if (typeof window === "undefined") return { euResidency: false, bridgeEnabled: true }
  try {
    const s = localStorage.getItem(DATA_KEY)
    return s ? JSON.parse(s) : { euResidency: false, bridgeEnabled: true }
  } catch {
    return { euResidency: false, bridgeEnabled: true }
  }
}

export default function DataIntegrityPage() {
  return (
    <ProtectedRoute>
      <DataIntegrityContent />
    </ProtectedRoute>
  )
}

function DataIntegrityContent() {
  const [euResidency, setEuResidency] = useState(false)
  const [bridgeEnabled, setBridgeEnabled] = useState(true)

  useEffect(() => {
    const s = loadData()
    setEuResidency(s.euResidency)
    setBridgeEnabled(s.bridgeEnabled)
  }, [])

  const update = (key: keyof DataSettings, value: boolean) => {
    const s = loadData()
    const next = { ...s, [key]: value }
    localStorage.setItem(DATA_KEY, JSON.stringify(next))
    if (key === "euResidency") setEuResidency(value)
    else setBridgeEnabled(value)
    toast.success("Settings saved")
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

      <div className="glass-panel p-6 rounded-2xl border-[var(--border-subtle)] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[var(--text-secondary)] font-medium">EU Data Residency</Label>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Store data exclusively in EU regions</p>
          </div>
          <Switch
            checked={euResidency}
            onCheckedChange={(v) => update("euResidency", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[var(--text-secondary)] font-medium">Bridge Sync</Label>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Enable data bridge for external systems</p>
          </div>
          <Switch
            checked={bridgeEnabled}
            onCheckedChange={(v) => update("bridgeEnabled", v)}
          />
        </div>
      </div>
    </div>
  )
}
