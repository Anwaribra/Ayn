"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import {
  User,
  Bell,
  Shield,
  Cloud,
  CreditCard,
  ChevronRight,
  Lock,
  Database,
} from "lucide-react"

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}

function SettingsContent() {
  const { user } = useAuth()

  const sections = [
    { icon: User, label: "Account Profile", desc: "Manage institutional identifiers and contact details", color: "text-blue-500" },
    { icon: Bell, label: "Neural Alerts", desc: "Configure compliance notifications and Horus triggers", color: "text-amber-500" },
    { icon: Lock, label: "Security & Encryption", desc: "Manage AES-256 keys and MFA requirements", color: "text-emerald-500" },
    { icon: Database, label: "Data Integrity", desc: "Institutional data residency and bridge settings", color: "text-indigo-500" },
    { icon: Cloud, label: "Module Integrations", desc: "Connect external LMS, HRIS, and core databases", color: "text-purple-500" },
    { icon: CreditCard, label: "Subscription Layer", desc: "Ayn OS Tier details, usage metrics, and invoices", color: "text-rose-500" },
  ]

  return (
    <div className="animate-fade-in-up p-4 md:p-6 pb-20 max-w-5xl mx-auto">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-zinc-800 border border-white/5">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                Admin Control
              </span>
            </div>
            <div className="h-px w-6 bg-zinc-900" />
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
              Institutional Command
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic text-white">
            System <span className="text-zinc-700 not-italic font-light">Settings</span>
          </h1>
        </div>
      </header>

      {/* ── User info panel ───────────────────────────────────────── */}
      <div className="glass-panel rounded-[32px] p-6 border-white/5 mb-8 flex items-center gap-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-white/5">
          <User className="w-6 h-6 text-zinc-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-white">{user?.name ?? "User"}</p>
          <p className="text-[11px] text-zinc-600 font-bold uppercase tracking-widest">{user?.email ?? "Not signed in"}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 rounded-full border border-emerald-500/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em]">
            Active
          </span>
        </div>
      </div>

      {/* ── Settings cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((item, i) => (
          <div
            key={i}
            className="glass-panel platform-card rounded-[32px] p-6 group cursor-pointer hover:bg-white/[0.04] transition-all flex items-center gap-6 border-white/5 hover:shadow-xl"
          >
            <div className={`w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center ${item.color} group-hover:scale-105 transition-transform`}>
              <item.icon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-zinc-100 mb-0.5">{item.label}</h3>
              <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-tight">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" />
          </div>
        ))}
      </div>

      {/* ── Danger zone ───────────────────────────────────────────── */}
      <div className="mt-16 p-8 glass-panel rounded-[40px] border-red-950/20 bg-red-950/5 relative overflow-hidden group hover:bg-red-950/10 transition-colors">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Shield className="w-32 h-32 text-red-500" />
        </div>
        <div className="relative z-10 max-w-xl">
          <h3 className="text-xl font-bold text-red-500 mb-2">Vault Clearance Protocol</h3>
          <p className="text-sm text-zinc-500 mb-8 font-medium leading-relaxed">
            Wiping institutional data will permanently remove all evidence assets, compliance mappings,
            and Horus neural history. This action requires administrative consensus.
          </p>
          <button className="px-8 py-3 bg-red-600/10 text-red-500 border border-red-600/20 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
            Initiate Purge Protocol
          </button>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="mt-12 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-[0.3em]">
            Ayn Intelligence Hub
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
          <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-[0.3em]">
            Institutional Node
          </span>
        </div>
        <span className="mono text-[10px] text-zinc-800 font-bold">AYN_V2.4_SYNC_OK</span>
      </div>
    </div>
  )
}
