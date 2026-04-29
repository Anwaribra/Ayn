"use client"

import { useState } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useUiLanguage } from "@/lib/ui-language-context"
import { AiProviderPickerDialog } from "@/components/platform/ai-provider-picker-dialog"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}

function SettingsContent() {
  const { isArabic } = useUiLanguage()
  const [aiRoutingOpen, setAiRoutingOpen] = useState(false)

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

      <details className="mt-10 rounded-2xl border border-border/25 bg-muted/15 px-4 py-3">
        <summary className="cursor-pointer select-none text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/45 list-none [&::-webkit-details-marker]:hidden">
          {isArabic ? "متقدم" : "Advanced"}
        </summary>
        <div className="mt-3 border-t border-border/20 pt-3">
          <button
            type="button"
            onClick={() => setAiRoutingOpen(true)}
            className="text-left text-xs text-muted-foreground/80 transition-colors hover:text-foreground"
          >
            {isArabic ? "تفضيل مسار نموذج الذكاء الاصطناعي (جيمناي / أوبن راوتر)…" : "AI model routing (Gemini / OpenRouter)…"}
          </button>
        </div>
      </details>

      <AiProviderPickerDialog open={aiRoutingOpen} onOpenChange={setAiRoutingOpen} />

      <div className="mt-8 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <Shield className="h-4 w-4 text-destructive" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-destructive">Need to clean up your institution data?</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
              Data management is self-service in Ayn. Use Archive to permanently remove records you no longer need.
            </p>
            <Link
              href="/platform/archive"
              className="mt-3 inline-flex items-center rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              Open archive cleanup
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
