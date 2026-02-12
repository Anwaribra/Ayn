"use client"

import Link from "next/link"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { ArrowLeft, FileText } from "lucide-react"

export default function SubscriptionPage() {
  return (
    <ProtectedRoute>
      <SubscriptionContent />
    </ProtectedRoute>
  )
}

function SubscriptionContent() {
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
          Subscription <span className="text-[var(--text-tertiary)] font-light">Layer</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          AYN OS tier details, usage metrics, and invoices
        </p>
      </header>

      <div className="glass-panel p-6 rounded-2xl border-[var(--border-subtle)] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Current Tier</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">AYN OS Standard</p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
            Active
          </span>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Usage this month</p>
          <div className="h-2 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
            <div className="h-full w-[35%] bg-indigo-500/60 rounded-full" />
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">35% of evidence storage used</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold text-[var(--text-secondary)] mb-4">Recent Invoices</h3>
        <div className="glass-panel p-4 rounded-2xl border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[var(--text-tertiary)]" />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">October 2025</p>
              <p className="text-[11px] text-[var(--text-tertiary)]">Standard plan — €199/mo</p>
            </div>
          </div>
          <button className="text-[11px] font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            Download
          </button>
        </div>
      </div>
    </div>
  )
}
