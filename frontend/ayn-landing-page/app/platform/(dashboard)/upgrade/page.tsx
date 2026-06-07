"use client"

import { useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { useUiLanguage } from "@/lib/ui-language-context"
import { usePageTitle } from "@/hooks/use-page-title"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Brain,
  FileCheck,
  Scale,
  Microscope,
  Shield,
  Users,
  Building2,
  CheckCircle,
  Lock,
  Unlock,
  ArrowRight,
  Activity,
  Sparkles,
  Rocket,
  CheckCheck,
  X,
  Plus,
  Loader2,
  Building,
} from "lucide-react"
import { DemoModal } from "@/components/landing/DemoModal"
import { api } from "@/lib/api"
import { toast } from "sonner"

type FeatureId =
  | "dashboard"
  | "horus-ai"
  | "evidence"
  | "standards"
  | "gap-analysis"
  | "action-center"
  | "integrations"
  | "multi-user"
  | "horus-agent"

interface Feature {
  id: FeatureId
  icon: typeof LayoutDashboard
  title: { en: string; ar: string }
  desc: { en: string; ar: string }
  accessKey: "always" | "horusAccess"
}

const ALL_FEATURES: Feature[] = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: { en: "Dashboard", ar: "لوحة التحكم" },
    desc: { en: "Readiness, risks, and live metrics", ar: "الجاهزية والمخاطر والمقاييس الحية" },
    accessKey: "always",
  },
  {
    id: "evidence",
    icon: FileCheck,
    title: { en: "Evidence Vault", ar: "مخزن الأدلة" },
    desc: { en: "Upload and link institutional proof", ar: "رفع وربط الأدلة المؤسسية" },
    accessKey: "always",
  },
  {
    id: "standards",
    icon: Scale,
    title: { en: "Standards Hub", ar: "المعايير" },
    desc: { en: "Frameworks and criteria mapping", ar: "الأطر وربط المعايير" },
    accessKey: "always",
  },
  {
    id: "gap-analysis",
    icon: Microscope,
    title: { en: "Gap Analysis", ar: "تحليل الفجوات" },
    desc: { en: "Coverage gaps and remediation", ar: "فجوات التغطية وخطط المعالجة" },
    accessKey: "always",
  },
  {
    id: "horus-ai",
    icon: Brain,
    title: { en: "Horus AI", ar: "حورس AI" },
    desc: { en: "AI audits, briefings, and mapping", ar: "تدقيقات وموجزات ورسم خرائط بالذكاء الاصطناعي" },
    accessKey: "horusAccess",
  },
  {
    id: "action-center",
    icon: Activity,
    title: { en: "Action Center", ar: "مركز الإجراءات" },
    desc: { en: "Prioritized compliance tasks", ar: "مهام امتثال ذات أولوية" },
    accessKey: "horusAccess",
  },
  {
    id: "integrations",
    icon: Building2,
    title: { en: "Integrations", ar: "التكاملات" },
    desc: { en: "API, SSO, and external tools", ar: "API وSSO والأدوات الخارجية" },
    accessKey: "horusAccess",
  },
  {
    id: "multi-user",
    icon: Users,
    title: { en: "Teams & RBAC", ar: "الفرق والصلاحيات" },
    desc: { en: "Roles and multi-campus access", ar: "الأدوار والوصول متعدد الفروع" },
    accessKey: "horusAccess",
  },
  {
    id: "horus-agent",
    icon: Shield,
    title: { en: "Horus Agent", ar: "وكيل حورس" },
    desc: { en: "Proactive monitoring and alerts", ar: "مراقبة استباقية وتنبيهات" },
    accessKey: "horusAccess",
  },
]

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-muted">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  )
}

function WorkspaceCreateModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { isArabic } = useUiLanguage()
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await api.createInstitution({ name: name.trim(), description: desc.trim() || undefined })
      toast.success(isArabic ? "تم إنشاء مساحة العمل" : "Workspace created")
      onSuccess()
      onClose()
    } catch {
      toast.error(isArabic ? "فشل في إنشاء مساحة العمل" : "Failed to create workspace")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <h2 className="text-lg font-bold text-foreground">
              {isArabic ? "إنشاء مساحة عمل جديدة" : "Create new workspace"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isArabic
                ? "أدخل اسم مؤسستك لبدء مساحة العمل"
                : "Enter your institution name to create a workspace"}
            </p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="ws-name" className="text-xs font-semibold text-foreground">
                  {isArabic ? "اسم المؤسسة" : "Institution name"}
                </label>
                <input
                  id="ws-name"
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isArabic ? "مثال: جامعة القاهرة" : "e.g. Cairo University"}
                  required
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label htmlFor="ws-desc" className="text-xs font-semibold text-foreground">
                  {isArabic ? "وصف (اختياري)" : "Description (optional)"}
                </label>
                <textarea
                  id="ws-desc"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder={isArabic ? "وصف مختصر للمؤسسة" : "Brief description of the institution"}
                  rows={3}
                  className="mt-1.5 flex w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isArabic ? "إنشاء" : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function UpgradeContent() {
  const { user, refreshUser } = useAuth()
  const { isArabic } = useUiLanguage()
  usePageTitle(isArabic ? "ترقية مساحة العمل" : "Upgrade Workspace")

  const [demoOpen, setDemoOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)

  const isAdmin = user?.role === "ADMIN"
  const hasHorus = user?.horusAccess || isAdmin
  const hasWorkspace = !!user?.institutionId

  const unlockedCount = ALL_FEATURES.filter(
    (f) => f.accessKey === "always" || (f.accessKey === "horusAccess" && hasHorus),
  ).length

  const progressPercent = (unlockedCount / ALL_FEATURES.length) * 100

  const copy = useMemo(
    () => ({
      pageTitle: isArabic ? "ترقية مساحة العمل" : "Upgrade workspace",
      pageDesc: isArabic
        ? "فعّل حورس AI والميزات المتقدمة لمؤسستك."
        : "Unlock Horus AI and advanced compliance tools for your institution.",
      requestDemo: isArabic ? "اطلب عرضاً توضيحياً" : "Request a demo",
      requestPricing: isArabic ? "اطلب عرض السعر" : "Request pricing",
      currentPlan: isArabic ? "خطتك الحالية" : "Your plan",
      starter: isArabic ? "أساسية" : "Starter",
      pro: isArabic ? "احترافية" : "Professional",
      unlocked: isArabic ? "مفعّلة" : "Active",
      locked: isArabic ? "تتطلب ترقية" : "Upgrade required",
      features: isArabic ? "الميزات" : "Features",
      included: isArabic ? "مشمولة" : "Included",
      notIncluded: isArabic ? "غير مشمولة" : "Not included",
      horusNote: isArabic
        ? "حورس AI متاح للمؤسسات المعتمدة بعد طلب العرض."
        : "Horus AI is enabled for approved institutions after a demo request.",
      free: isArabic ? "مجاني" : "Free",
      custom: isArabic ? "تجريبي" : "Custom",
      essentials: isArabic ? "الأساسيات للبدء" : "Essentials to get started",
      fullAccess: isArabic ? "كل الميزات المتقدمة" : "Full advanced feature set",
      createWorkspace: isArabic ? "إنشاء مساحة عمل" : "Create workspace",
      noWorkspace: isArabic
        ? "ليس لديك مساحة عمل بعد. أنشئ واحدة لتبدأ."
        : "You don't have a workspace yet. Create one to get started.",
    }),
    [isArabic],
  )

  return (
    <div className={cn("mx-auto platform-container-narrow space-y-6 pb-20", isArabic && "font-arabic")} dir={isArabic ? "rtl" : "ltr"}>
      {/* ── Hero + Current Plan ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.04] p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -inset-x-20 -top-20 h-64 bg-gradient-radial from-primary/8 to-transparent blur-3xl" />

        <div className={cn("relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between", isArabic && "sm:flex-row-reverse")}>
          <div className={cn("space-y-3", isArabic && "text-right")}>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              {isArabic ? "فعّل الإمكانات الكاملة" : "Unlock full capabilities"}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {copy.pageTitle}
            </h1>
            <p className="max-w-lg text-sm text-muted-foreground leading-relaxed">
              {copy.pageDesc}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98]"
            >
              {copy.requestDemo}
              <ArrowRight className={cn("h-4 w-4", isArabic && "rotate-180")} />
            </button>
            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/30"
            >
              {copy.requestPricing}
            </button>
          </div>
        </div>

        {/* Current plan + progress inline */}
        <div className="relative mt-6 rounded-xl border border-border/50 bg-card/50 p-4">
          <div className={cn("flex items-start justify-between gap-3", isArabic && "flex-row-reverse")}>
            <div className={cn(isArabic && "text-right")}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {copy.currentPlan}
              </p>
              <p className="mt-0.5 text-lg font-bold text-foreground">{hasHorus ? copy.pro : copy.starter}</p>
              {user?.email && (
                <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
              )}
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                hasHorus
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                  : "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
              )}
            >
              {hasHorus ? (
                <><Unlock className="h-3 w-3" /> {copy.unlocked}</>
              ) : (
                <><Lock className="h-3 w-3" /> {copy.locked}</>
              )}
            </span>
          </div>

          <div className="mt-3 space-y-1.5">
            <div className={cn("flex justify-between text-xs text-muted-foreground", isArabic && "flex-row-reverse")}>
              <span>{copy.features}</span>
              <span className="font-semibold text-foreground">
                {unlockedCount}/{ALL_FEATURES.length}
              </span>
            </div>
            <ProgressBar value={progressPercent} />
          </div>

          {!hasHorus && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{copy.horusNote}</p>
          )}
        </div>
      </motion.section>

      {/* ── Workspace Creation ── */}
      {!hasWorkspace && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-dashed border-primary/30 bg-primary/[0.03] p-5"
        >
          <div className={cn("flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between", isArabic && "sm:flex-row-reverse")}>
            <div className={cn("flex items-start gap-3", isArabic && "flex-row-reverse")}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div className={cn(isArabic && "text-right")}>
                <p className="text-sm font-semibold text-foreground">{copy.createWorkspace}</p>
                <p className="text-xs text-muted-foreground">{copy.noWorkspace}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWorkspaceOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              {copy.createWorkspace}
            </button>
          </div>
        </motion.section>
      )}

      {/* ── Plan Cards ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2"
      >
        {/* Starter */}
        <div
          className={cn(
            "relative rounded-2xl border p-5 transition-all",
            !hasHorus
              ? "border-primary/30 bg-card shadow-lg shadow-primary/5"
              : "border-border bg-card/60",
          )}
        >
          {!hasHorus && (
            <div className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-card px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary shadow-sm">
              <CheckCheck className="h-3 w-3" />
              {isArabic ? "خطتك الحالية" : "Your plan"}
            </div>
          )}

          <div className={cn("flex items-start justify-between gap-3", isArabic && "flex-row-reverse")}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {copy.starter}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {isArabic ? "مجاني" : "Free"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isArabic ? "الأساسيات للبدء" : "Essentials to get started"}
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2.5">
            {ALL_FEATURES.filter((f) => f.accessKey === "always").map((f) => (
              <li key={f.id} className={cn("flex items-center gap-2 text-xs", isArabic && "flex-row-reverse")}>
                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span className="text-foreground/80">{isArabic ? f.title.ar : f.title.en}</span>
              </li>
            ))}
            {ALL_FEATURES.filter((f) => f.accessKey === "horusAccess").map((f) => (
              <li key={f.id} className={cn("flex items-center gap-2 text-xs", isArabic && "flex-row-reverse")}>
                <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                <span className="text-muted-foreground/50 line-through">
                  {isArabic ? f.title.ar : f.title.en}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Professional */}
        <div
          className={cn(
            "relative rounded-2xl border-2 p-5 transition-all",
            hasHorus
              ? "border-primary/40 bg-card shadow-xl shadow-primary/10"
              : "border-border bg-card/60",
          )}
        >
          <div className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-primary/80 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg">
            <Rocket className="h-3 w-3" />
            {isArabic ? "الأفضل" : "Recommended"}
          </div>

          {hasHorus && (
            <div className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase text-emerald-500">
              <CheckCheck className="h-3 w-3" />
              {copy.unlocked}
            </div>
          )}

          <div className={cn("flex items-start justify-between gap-3", isArabic && "flex-row-reverse")}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {copy.pro}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {isArabic ? "تجريبي" : "Custom"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isArabic ? "كل الميزات المتقدمة" : "Full advanced feature set"}
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2.5">
            {ALL_FEATURES.map((f) => (
              <li key={f.id} className={cn("flex items-center gap-2 text-xs", isArabic && "flex-row-reverse")}>
                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span className="text-foreground/80">{isArabic ? f.title.ar : f.title.en}</span>
              </li>
            ))}
          </ul>

          {!hasHorus && (
            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              {copy.requestDemo}
              <ArrowRight className={cn("h-4 w-4", isArabic && "rotate-180")} />
            </button>
          )}
        </div>
      </motion.section>

      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
      <WorkspaceCreateModal
        open={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
        onSuccess={() => refreshUser()}
      />
    </div>
  )
}

export default function UpgradePage() {
  return (
    <ProtectedRoute>
      <UpgradeContent />
    </ProtectedRoute>
  )
}
