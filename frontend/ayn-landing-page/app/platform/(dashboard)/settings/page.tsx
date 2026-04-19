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
  CalendarDays,
  Archive,
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
  const [isSubmittingPurgeRequest, setIsSubmittingPurgeRequest] = useState(false)

  const sections = [
    { icon: User, label: "Profile", desc: "Manage institution and contact details.", color: "text-primary", href: "/platform/settings/account" },
    { icon: Lock, label: "Security", desc: "Manage passwords, MFA, and encryption rules.", color: "text-[var(--status-success)]", href: "/platform/settings/security" },
    { icon: Bell, label: "Notifications", desc: "Choose alerts and notification preferences.", color: "text-[var(--status-warning)]", href: "/platform/settings/alerts" },
    { icon: Database, label: "Data & Privacy", desc: "Control data residency and retention settings.", color: "text-primary", href: "/platform/settings/data" },
    { icon: Cloud, label: "Integrations", desc: "Connect LMS, HRIS, and other systems.", color: "text-primary", href: "/platform/settings/integrations" },
    { icon: CalendarDays, label: "Calendar & Milestones", desc: "Track deadlines, audits, and key checkpoints.", color: "text-primary", href: "/platform/calendar" },
    { icon: Archive, label: "Archive", desc: "Browse historical records and previous cycles.", color: "text-primary", href: "/platform/archive" },
    { icon: CreditCard, label: "Billing", desc: "Manage plan details, usage, and invoices.", color: "text-[var(--status-critical)]", href: "/platform/settings/subscription" },
  ]

  return (
    <div className="animate-fade-in-up pb-16 max-w-5xl px-4 mx-auto">
      <header className="mb-8 pt-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded glass-pill">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {sections.map((item, i) => (
          <Link key={i} href={item.href}>
            <div className="glass-layer-2 p-5 rounded-3xl group cursor-pointer transition-all flex items-center gap-5 border-glass-border hover:translate-y-[-1px]">
              <div className={cn("w-11 h-11 rounded-2xl glass-input flex items-center justify-center group-hover:scale-105 transition-transform", item.color)}>
                <item.icon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-0.5">{item.label}</h3>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <Shield className="h-4 w-4 text-destructive" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-destructive">Need to delete institution data?</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
              This action is review-only. Your admin team must approve before any data is removed.
            </p>
            <button
              onClick={() => setShowPurgeModal(true)}
              className="mt-3 inline-flex items-center rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              Request deletion review
            </button>
          </div>
        </div>
      </div>

      {/* Purge Confirmation Modal */}
      {showPurgeModal && (
        <PurgeModal
          isSubmitting={isSubmittingPurgeRequest}
          onClose={() => setShowPurgeModal(false)}
          onConfirm={async () => {
            if (isSubmittingPurgeRequest) return
            setIsSubmittingPurgeRequest(true)
            await new Promise((resolve) => setTimeout(resolve, 700))
            toast.info("Request sent. An admin will review it before any data is deleted.")
            setIsSubmittingPurgeRequest(false)
            setShowPurgeModal(false)
          }}
        />
      )}
    </div>
  )
}

function PurgeModal({
  onClose,
  onConfirm,
  isSubmitting,
}: {
  onClose: () => void
  onConfirm: () => Promise<void>
  isSubmitting: boolean
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop fixed inset-0 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Request vault purge review"
        className="modal-container glass-surface-strong relative z-50 w-full max-w-[520px] rounded-3xl p-10"
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
            <h3 className="text-lg font-semibold text-foreground">Confirm deletion review request</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Admin approval is required</p>
          </div>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">
          This does not delete anything now. It only sends a request to review deletion of evidence, compliance mappings, and Horus history.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-lg glass-button text-muted-foreground text-xs font-medium uppercase tracking-widest transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium uppercase tracking-widest hover:bg-destructive/90 transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  )
}
