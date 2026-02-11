"use client"

import { useState } from "react"
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
    { icon: User, label: "Account Profile", desc: "Manage institutional identifiers and contact details", color: "text-blue-500", href: "/platform/settings/account" },
    { icon: Bell, label: "Neural Alerts", desc: "Configure compliance notifications and Horus triggers", color: "text-amber-500", href: "/platform/settings/alerts" },
    { icon: Lock, label: "Security & Encryption", desc: "Manage AES-256 keys and MFA requirements", color: "text-emerald-500", href: "/platform/settings/security" },
    { icon: Database, label: "Data Integrity", desc: "Institutional data residency and bridge settings", color: "text-indigo-500", href: "/platform/settings/data" },
    { icon: Cloud, label: "Module Integrations", desc: "Connect external LMS, HRIS, and core databases", color: "text-purple-500", href: "/platform/settings/integrations" },
    { icon: CreditCard, label: "Subscription Layer", desc: "Ayn OS Tier details, usage metrics, and invoices", color: "text-rose-500", href: "/platform/settings/subscription" },
  ]

  return (
    <div className="animate-fade-in-up pb-20 max-w-5xl px-4 mx-auto">
      <header className="mb-12 pt-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-zinc-800 border border-white/5">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Admin Control</span>
            </div>
            <div className="h-px w-6 bg-zinc-900" />
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Institutional Command</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic text-white">
            System <span className="text-zinc-700 not-italic font-light">Settings</span>
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((item, i) => (
          <Link key={i} href={item.href} className="glass-panel p-6 rounded-[32px] group cursor-pointer hover:bg-white/[0.04] transition-all flex items-center gap-6 border-white/5">
            <div className={`w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center ${item.color} group-hover:scale-105 transition-transform`}>
              <item.icon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-[#F1F5F9] mb-0.5">{item.label}</h3>
              <p className="text-[11px] text-[#A8B3C7] font-medium uppercase tracking-tight">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      <div className="mt-16 p-8 rounded-[32px] border border-[#B94A4A]/20 bg-[#111923] relative overflow-hidden group transition-colors">
        <div className="absolute top-0 right-0 p-8 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity">
          <Shield className="w-32 h-32 text-[#B94A4A]" />
        </div>
        <div className="relative z-10 max-w-xl">
          <h3 className="text-xl font-semibold text-[#B94A4A] mb-2">Vault Clearance Protocol</h3>
          <p className="text-sm text-[#A8B3C7] mb-8 font-medium leading-relaxed">
            Wiping institutional data will permanently remove all evidence assets, compliance mappings, and Horus neural history. This action requires administrative consensus.
          </p>
          <button 
            onClick={() => setShowPurgeModal(true)}
            className="px-6 py-2.5 bg-[#B94A4A]/10 text-[#B94A4A] border border-[#B94A4A]/25 rounded-lg text-[11px] font-medium uppercase tracking-widest hover:bg-[#B94A4A] hover:text-white transition-all"
          >
            Initiate Purge Protocol
          </button>
        </div>
      </div>

      {/* Purge Confirmation Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[rgba(0,0,0,0.55)]">
          <div className="bg-[#151E29] rounded-2xl p-10 max-w-[520px] w-full border border-[rgba(255,255,255,0.08)] relative shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            <button 
              onClick={() => setShowPurgeModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#B94A4A]/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#B94A4A]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#F1F5F9]">Confirm Vault Purge</h3>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-[#A8B3C7] mb-8 leading-relaxed">
              You are about to permanently delete all institutional data including evidence assets, compliance mappings, and Horus neural history. This requires administrative consensus.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowPurgeModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-white/[0.08] text-zinc-400 text-[11px] font-medium uppercase tracking-widest hover:bg-white/[0.04] hover:text-zinc-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  toast.info("Vault purge requires additional admin consensus. Contact system administrator.")
                  setShowPurgeModal(false)
                }}
                className="flex-1 py-2.5 rounded-lg bg-[#B94A4A] text-white text-[11px] font-medium uppercase tracking-widest hover:bg-[#C25656] transition-all"
              >
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-[0.3em]">Ayn Intelligence Hub</span>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
          <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-[0.3em]">Institutional Node 42</span>
        </div>
        <span className="mono text-[10px] text-zinc-800 font-bold">OS_V2.4.12_SYNC_OK</span>
      </div>
    </div>
  )
}
