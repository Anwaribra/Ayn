"use client"

import { useState } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useUiLanguage } from "@/lib/ui-language-context"
import { AiProviderPickerDialog } from "@/components/platform/ai-provider-picker-dialog"
import {
  User,
  Bell,
  Cloud,
  CreditCard,
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
    { icon: Bell, label: "Notifications", desc: "Choose alerts and notification preferences.", color: "text-[var(--status-warning)]", href: "/platform/settings/alerts" },
    { icon: Cloud, label: "Integrations", desc: "Connect LMS, HRIS, and other systems.", color: "text-primary", href: "/platform/settings/integrations" },
    { icon: Archive, label: "Archive", desc: "Browse historical records and previous cycles.", color: "text-primary", href: "/platform/archive" },
    { icon: CreditCard, label: "Billing", desc: "Manage plan details, usage, and invoices.", color: "text-[var(--status-critical)]", href: "/platform/settings/subscription" },
  ]

  const sectionsAr = [
    { icon: User, label: "الملف الشخصي", desc: "بيانات المؤسسة والتواصل.", color: "text-primary", href: "/platform/settings/account" },
    { icon: Bell, label: "الإشعارات", desc: "تفضيلات التنبيهات.", color: "text-amber-600", href: "/platform/settings/alerts" },
    { icon: Cloud, label: "التكاملات", desc: "ربط الأنظمة الخارجية.", color: "text-primary", href: "/platform/settings/integrations" },
    { icon: Archive, label: "الأرشيف", desc: "سجلات الدورات السابقة.", color: "text-primary", href: "/platform/archive" },
    { icon: CreditCard, label: "الفوترة", desc: "الخطة والاستخدام.", color: "text-red-600", href: "/platform/settings/subscription" },
  ]

  const items = isArabic ? sectionsAr : sections

  return (
    <div className={cn("mx-auto w-full platform-container-narrow pb-12", isArabic && "font-arabic")}>
      <header className="platform-page-header mb-4 pt-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isArabic ? "إدارة النظام" : "Workspace"}
        </p>
        <h1>{isArabic ? "الإعدادات" : "Settings"}</h1>
        <p>
          {isArabic
            ? "إعدادات الحساب والأمان والتكاملات في مكان واحد."
            : "Account, security, integrations, and workspace preferences in one calm place."}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item, i) => (
          <Link key={i} href={item.href}>
            <div className="premium-surface group flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:border-primary/20">
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-[var(--layer-3)]", item.color)}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground", isArabic && "rotate-180")} />
            </div>
          </Link>
        ))}
      </div>

      <details className="premium-surface mt-4 rounded-lg border border-border/60 px-3 py-2.5">
        <summary className="cursor-pointer select-none text-xs font-semibold tracking-wider text-muted-foreground list-none [&::-webkit-details-marker]:hidden">
          {isArabic ? "متقدم" : "Advanced"}
        </summary>
        <div className="mt-3 border-t border-border/20 pt-3">
          <button
            type="button"
            onClick={() => setAiRoutingOpen(true)}
            className="text-start text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {isArabic ? "تفضيل مسار نموذج الذكاء الاصطناعي (جيمناي / أوبن راوتر)…" : "AI model routing (Gemini / OpenRouter)…"}
          </button>
        </div>
      </details>

      <AiProviderPickerDialog open={aiRoutingOpen} onOpenChange={setAiRoutingOpen} />

      <div className="mt-6 rounded-[18px] border border-destructive/25 bg-destructive/5 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <Shield className="h-4 w-4 text-destructive" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-destructive">Need to clean up your institution data?</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
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
