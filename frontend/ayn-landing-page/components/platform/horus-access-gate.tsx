"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Lock, Clock, XCircle, Send, Sparkles, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useUiLanguage } from "@/lib/ui-language-context"

type RequestStatus = "none" | "PENDING" | "APPROVED" | "REJECTED" | "loading"

export function HorusAccessGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("loading")
  const [reviewNote, setReviewNote] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    // Admin always has access
    if (user.role === "ADMIN" || user.horusAccess) {
      setRequestStatus("APPROVED")
      return
    }

    // Check if user has a pending/rejected request
    api
      .getMyAccessRequest()
      .then((req) => {
        if (req) {
          setRequestStatus(req.status as RequestStatus)
          setReviewNote(req.reviewNote)
        } else {
          setRequestStatus("none")
        }
      })
      .catch(() => {
        setRequestStatus("none")
      })
  }, [user])

  // User has access — render children
  if (requestStatus === "APPROVED") {
    return <>{children}</>
  }

  // Loading state
  if (requestStatus === "loading") {
    return (
      <div className="flex h-full min-h-[calc(100dvh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return <HorusLockedUI status={requestStatus} reviewNote={reviewNote} onStatusChange={setRequestStatus} />
}

function HorusLockedUI({
  status,
  reviewNote,
  onStatusChange,
}: {
  status: RequestStatus
  reviewNote: string | null
  onStatusChange: (s: RequestStatus) => void
}) {
  const { user } = useAuth()
  const { isArabic } = useUiLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const copy = {
    upgradeRequiredTitle: isArabic ? "الترقية إلى حورس AI" : "Upgrade to Horus AI",
    upgradeRequiredDesc: isArabic 
      ? "افتح القوة الكاملة لمساعد حورس الذكي. قم بالترقية للوصول إلى تحليلات الامتثال المتقدمة، ومحاكاة التدقيق، وخطط المعالجة التلقائية." 
      : "Unlock the full power of Horus AI. Upgrade to access advanced AI-driven compliance intelligence, virtual audits, and automated remediation plans.",
    upgradeBtn: isArabic ? "احصل على الترقية" : "Get Upgrade",
    
    pendingTitle: isArabic ? "طلب الترقية قيد المعالجة" : "Upgrade Processing",
    pendingDesc: isArabic 
      ? "طلب الترقية الخاص بك قيد المعالجة حالياً. سيتم تفعيل حسابك بمجرد انتهاء معالجة التكوين وتهيئة الميزات." 
      : "Your upgrade request is being processed. You will be granted access automatically as soon as the configuration is ready.",
    pendingBtn: isArabic ? "جاري تفعيل الميزات..." : "Activating premium features...",
    
    rejectedTitle: isArabic ? "الترقية غير متاحة حالياً" : "Upgrade Unavailable",
    rejectedDesc: isArabic 
      ? "تعذر معالجة طلب الترقية الخاص بك في الوقت الحالي. يرجى مراجعة إدارة المؤسسة أو الاتصال بالدعم للمزيد من التفاصيل." 
      : "Your upgrade request could not be processed at this time. Please contact support or your institution administrator for assistance.",
    rejectedBtn: isArabic ? "إعادة إرسال طلب الترقية" : "Re-submit Upgrade Request",
    
    features: [
      { icon: Sparkles, label: isArabic ? "ذكاء الامتثال المعتمد على الذكاء الاصطناعي" : "AI-Powered Compliance Intelligence" },
      { icon: ShieldCheck, label: isArabic ? "محاكاة عمليات التدقيق الافتراضية" : "Virtual Audit Simulations" },
      { icon: Send, label: isArabic ? "خطط معالجة وحلول تلقائية" : "Automated Remediation Plans" },
    ]
  }

  const handleRequestAccess = async () => {
    if (!user) return
    setIsSubmitting(true)
    try {
      await api.createAccessRequest({
        name: user.name,
        email: user.email,
        institution: "From Platform",
        role: user.role || "other",
        type: "demo",
        message: "Upgrade requested from Horus AI page",
      })
      onStatusChange("PENDING")
      toast.success(isArabic ? "تم تقديم طلب الترقية بنجاح!" : "Upgrade request submitted successfully!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (isArabic ? "فشل تقديم الطلب" : "Failed to submit request"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-full min-h-[calc(100dvh-64px)] items-center justify-center p-6" dir={isArabic ? "rtl" : "ltr"}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-surface-strong relative max-w-md w-full overflow-hidden rounded-3xl border border-[var(--glass-border)] p-8 shadow-[0_22px_64px_-38px_rgba(15,23,42,0.42)] bg-card"
      >
        {/* Decorative gradient */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(59,111,217,0.45),transparent)]" />
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(59,111,217,0.14),transparent_70%)] blur-2xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Icon with premium pulsing circle/sparkles */}
          <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/10 to-primary/5 shadow-[0_16px_34px_-22px_rgba(59,130,246,0.4)]">
            {status === "none" && <Sparkles className="h-8 w-8 text-primary animate-pulse" />}
            {status === "PENDING" && <Clock className="h-8 w-8 text-amber-400 animate-[spin_4s_linear_infinite]" />}
            {status === "REJECTED" && <XCircle className="h-8 w-8 text-rose-400" />}
            
            {/* Premium Badge */}
            {status === "none" && (
              <span className="absolute -top-2.5 -right-2 rounded-full bg-gradient-to-r from-primary to-purple-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
                PRO
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="glass-text-primary mb-2 text-2xl font-bold tracking-tight text-foreground">
            {status === "none" && copy.upgradeRequiredTitle}
            {status === "PENDING" && copy.pendingTitle}
            {status === "REJECTED" && copy.rejectedTitle}
          </h2>

          {/* Description */}
          <p className="glass-text-secondary mb-6 text-sm leading-relaxed text-muted-foreground">
            {status === "none" && copy.upgradeRequiredDesc}
            {status === "PENDING" && copy.pendingDesc}
            {status === "REJECTED" && (
              <>
                {copy.rejectedDesc}
                {reviewNote && (
                  <span className="mt-3 block rounded-xl bg-red-500/10 px-4 py-3 text-xs text-red-300">
                    <strong>Note:</strong> {reviewNote}
                  </span>
                )}
              </>
            )}
          </p>

          {/* Features preview */}
          <div className="mb-6 w-full space-y-3">
            {copy.features.map((feature) => (
              <div
                key={feature.label}
                className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-3 border border-border/40 bg-muted/20"
              >
                <feature.icon className="h-4 w-4 text-primary/70" />
                <span className="glass-text-secondary text-sm text-foreground/80">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* Action button */}
          {(status === "none" || status === "REJECTED") && (
            <Button
              onClick={handleRequestAccess}
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-gradient-to-r from-primary to-purple-600 py-6 text-base font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-105 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Sparkles className="me-2 h-4 w-4" />
                  {status === "REJECTED" ? copy.rejectedBtn : copy.upgradeBtn}
                </>
              )}
            </Button>
          )}

          {status === "PENDING" && (
            <div className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4 shadow-sm">
              <div className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
              <span className="text-amber-300 text-sm font-semibold">{copy.pendingBtn}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
