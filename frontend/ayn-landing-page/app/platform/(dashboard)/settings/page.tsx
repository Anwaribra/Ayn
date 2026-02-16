"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import {
  User,
  Bell,
  Lock,
  Database,
  Cloud,
  CreditCard,
  ChevronRight,
  Shield,
  AlertTriangle,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}

function SettingsContent() {
  const { user } = useAuth()
  const [showPurgeModal, setShowPurgeModal] = useState(false)

  const sections = [
    { icon: User, label: "Account Profile", desc: "Manage institutional identifiers and contact details", color: "text-primary", href: "/platform/settings/account" },
    { icon: Bell, label: "Neural Alerts", desc: "Configure compliance notifications and Horus triggers", color: "text-[var(--status-warning)]", href: "/platform/settings/alerts" },
    { icon: Lock, label: "Security & Encryption", desc: "Manage AES-256 keys and MFA requirements", color: "text-[var(--status-success)]", href: "/platform/settings/security" },
    { icon: Database, label: "Data Integrity", desc: "Institutional data residency and bridge settings", color: "text-primary", href: "/platform/settings/data" },
    { icon: Cloud, label: "Module Integrations", desc: "Connect external LMS, HRIS, and core databases", color: "text-primary", href: "/platform/settings/integrations" },
    { icon: CreditCard, label: "Subscription Layer", desc: "Ayn OS Tier details, usage metrics, and invoices", color: "text-[var(--status-critical)]", href: "/platform/settings/subscription" },
  ]

  return (
    <div className="animate-fade-in-up pb-20 max-w-5xl px-4 mx-auto">
      <header className="mb-12 pt-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-muted border border-[var(--border-subtle)]">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Admin Control</span>
            </div>
            <div className="h-px w-6 bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Institutional Command</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic text-foreground">
            System <span className="text-muted-foreground not-italic font-light">Settings</span>
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((item, i) => (
          <Link key={i} href={item.href}>
            <div className="glass-layer-2 p-6 rounded-[32px] group cursor-pointer hover:bg-layer-2/80 transition-all flex items-center gap-6 border-glass-border">
              <div className={cn("w-12 h-12 rounded-2xl bg-muted/50 border border-glass-border flex items-center justify-center group-hover:scale-105 transition-transform", item.color)}>
                <item.icon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-0.5">{item.label}</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-tight">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-16 p-8 rounded-[32px] glass-layer-2 border-glass-border relative overflow-hidden group transition-colors">
        <div className="absolute top-0 right-0 p-8 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity">
          <Shield className="w-32 h-32 text-destructive" />
        </div>
        <div className="relative z-10 max-w-xl">
          <h3 className="text-xl font-semibold text-destructive mb-2">Vault Clearance Protocol</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-8 font-medium leading-relaxed">
            Wiping institutional data will permanently remove all evidence assets, compliance mappings, and Horus neural history. This action requires administrative consensus.
          </p>
          <button
            onClick={() => setShowPurgeModal(true)}
            className="px-6 py-2.5 bg-destructive/10 text-destructive border border-destructive/25 rounded-lg text-xs font-medium uppercase tracking-widest hover:bg-destructive hover:text-destructive-foreground transition-all"
          >
            Initiate Purge Protocol
          </button>
        </div>
      </div>

      {/* Purge Confirmation Modal */}
      {showPurgeModal && (
        <PurgeModal
          onClose={() => setShowPurgeModal(false)}
          onConfirm={() => {
            toast.info("Vault purge requires additional admin consensus. Contact system administrator.")
            setShowPurgeModal(false)
          }}
        />
      )}

      <div className="mt-12 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Ayn Intelligence Hub</span>
          <div className="w-1.5 h-1.5 rounded-full bg-border" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Institutional Node 42</span>
        </div>
        <span className="mono text-[10px] text-muted-foreground font-bold">OS_V2.4.12_SYNC_OK</span>
      </div>
    </div>
  )
}

function PurgeModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[rgba(0,0,0,0.55)] modal-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Confirm vault purge"
        className="modal-container z-[70] glass-layer-3 rounded-2xl p-10 max-w-[520px] w-full border border-glass-border relative shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close purge dialog"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Confirm Data Purge</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">
          You are about to permanently delete all institutional data including evidence assets, compliance mappings, and Horus neural history. This requires administrative consensus.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground text-xs font-medium uppercase tracking-widest hover:bg-muted hover:text-foreground transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium uppercase tracking-widest hover:bg-destructive/90 transition-all"
          >
            Confirm Purge
          </button>
        </div>
      </div>
    </div>
  )
}

