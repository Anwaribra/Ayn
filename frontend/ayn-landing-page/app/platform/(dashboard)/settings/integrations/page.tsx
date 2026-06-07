"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { ArrowLeft, ExternalLink, Plus } from "lucide-react"
import { toast } from "sonner"
import { useUiLanguage } from "@/lib/ui-language-context"
import { cn } from "@/lib/utils"

const INTEGRATIONS = [
  { name: "LMS", nameAr: "نظام إدارة التعلم", desc: "Learning Management System", descAr: "نظام إدارة التعلم", status: "not_configured", icon: "\uD83D\uDCDA" },
  { name: "HRIS", nameAr: "نظام معلومات الموارد البشرية", desc: "Human Resources Information System", descAr: "نظام معلومات الموارد البشرية", status: "not_configured", icon: "\uD83D\uDC65" },
  { name: "Core Database", nameAr: "قاعدة البيانات الأساسية", desc: "Institutional core data", descAr: "البيانات الأساسية للمؤسسة", status: "not_configured", icon: "\uD83D\uDDFC\uFE0F" },
]

export default function IntegrationsPage() {
  return (
    <ProtectedRoute>
      <IntegrationsContent />
    </ProtectedRoute>
  )
}

function IntegrationsContent() {
  const { isArabic } = useUiLanguage()
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
    toast.info(isArabic ? `تم تسجيل طلب إعداد ${name}` : `${name} setup request recorded`, {
      description: isArabic
        ? "هذا الموصل غير نشط بعد. استخدمه كعنصر نائب حتى يتم تنفيذ تكامل الخلفية."
        : "This connector is not live yet. Use this as a setup placeholder until the backend integration is implemented.",
    })
  }

  return (
    <div className={cn("animate-fade-in-up pb-20 platform-container-narrow px-4", isArabic && "font-arabic")} dir={isArabic ? "rtl" : "ltr"}>
      <Link
        href="/platform/settings"
        className="inline-flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-medium mb-8"
      >
        <ArrowLeft className={cn("w-4 h-4", isArabic && "rotate-180")} />
        {isArabic ? "العودة إلى الإعدادات" : "Back to Settings"}
      </Link>

      <header className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
          {isArabic ? "تكاملات" : "Module"} <span className="text-[var(--text-tertiary)] font-light">{isArabic ? "الوحدات" : "Integrations"}</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          {isArabic ? "مراجعة الموصلات المخططة وطلب الإعداد لأنظمة LMS و HRIS وقواعد البيانات الأساسية" : "Review planned connectors and request setup for external LMS, HRIS, and core databases"}
        </p>
      </header>

      <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
          {isArabic ? "معاينة فقط" : "Preview Only"}
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {isArabic ? "تمثل بطاقات الموصلات هذه حالياً طلبات الإعداد وحالة التخطيط. لا تنشئ اتصالات خارجية مباشرة بعد." : "These connector cards currently represent setup requests and planning status. They do not establish live external connections yet."}
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
                <h3 className="font-bold text-[var(--text-primary)]">{isArabic ? item.nameAr : item.name}</h3>
                <p className="text-xs text-[var(--text-tertiary)]">{isArabic ? item.descAr : item.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={
                item.status === "requested"
                  ? "text-xs font-bold text-amber-300 uppercase tracking-wider"
                  : "text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider"
              }>
                {item.status === "requested"
                  ? (isArabic ? "تم الطلب" : "Requested")
                  : (isArabic ? "غير مكوّن" : item.status.replace("_", " "))}
              </span>
              <button
                onClick={() => handleToggle(item.name)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass-button text-[var(--text-secondary)] text-xs font-medium transition-colors"
              >
                {item.status === "requested" ? <ExternalLink className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {item.status === "requested"
                  ? (isArabic ? "تم الطلب" : "Requested")
                  : (isArabic ? "طلب إعداد" : "Request Setup")}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--text-tertiary)] mt-8">
        {isArabic
          ? "يتطلب طرح الموصلات المؤسسية تطبيق الخلفية وبيانات اعتماد المشرف. اتصل بالدعم عندما تكون مستعداً لربط تكامل فعلي."
          : "Enterprise connector rollout still requires backend implementation and admin credentials. Contact support when you are ready to wire a real integration."}
      </p>
    </div>
  )
}
