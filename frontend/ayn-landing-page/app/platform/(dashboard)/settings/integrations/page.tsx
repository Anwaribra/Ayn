"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { ArrowLeft, ExternalLink, Plus } from "lucide-react"
import { toast } from "sonner"

const INTEGRATIONS = [
  { name: "LMS", desc: "Learning Management System", status: "not_configured", icon: "📚" },
  { name: "HRIS", desc: "Human Resources Information System", status: "not_configured", icon: "👥" },
  { name: "Core Database", desc: "Institutional core data", status: "not_configured", icon: "🗄️" },
]

export default function IntegrationsPage() {
  return (
    <ProtectedRoute>
      <IntegrationsContent />
    </ProtectedRoute>
  )
}

function IntegrationsContent() {
  const [statuses, setStatuses] = useState<Record<string, string>>(() =>
    INTEGRATIONS.reduce((acc, item) => {
      acc[item.name] = item.status
      return acc
    }, {} as Record<string, string>)
  )

  const orderedIntegrations = useMemo(
    () =>
      INTEGRATIONS.map((item) => ({
        ...item,
        status: statuses[item.name] ?? item.status,
      })),
    [statuses]
  )

  const handleToggle = (name: string) => {
    setStatuses((prev) => ({ ...prev, [name]: "requested" }))
    toast.info(`${name} setup request recorded`, {
      description: "This connector is not live yet. Use this as a setup placeholder until the backend integration is implemented.",
    })
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
          Module <span className="text-[var(--text-tertiary)] font-light">Integrations</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Review planned connectors and request setup for external LMS, HRIS, and core databases
        </p>
      </header>

      <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
          Preview Only
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          These connector cards currently represent setup requests and planning status. They do not establish live external connections yet.
        </p>
      </div>

      <div className="space-y-4">
        {orderedIntegrations.map((item) => (
          <div
            key={item.name}
            className="glass-panel p-6 rounded-2xl glass-border flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl glass-input flex items-center justify-center text-2xl">
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">{item.name}</h3>
                <p className="text-[11px] text-[var(--text-tertiary)]">{item.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={
                item.status === "requested"
                  ? "text-[10px] font-bold text-amber-300 uppercase tracking-wider"
                  : "text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider"
              }>
                {item.status}
              </span>
              <button
                onClick={() => handleToggle(item.name)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass-button text-[var(--text-secondary)] text-xs font-medium transition-colors"
              >
                {item.status === "requested" ? <ExternalLink className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {item.status === "requested" ? "Requested" : "Request Setup"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-[var(--text-tertiary)] mt-8">
        Enterprise connector rollout still requires backend implementation and admin credentials. Contact support when you are ready to wire a real integration.
      </p>
    </div>
  )
}
