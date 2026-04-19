"use client"

import { useEffect, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { AynLogo } from "@/components/ayn-logo"
import { useUiLanguage } from "@/lib/ui-language-context"
import { cn } from "@/lib/utils"
import { DashboardPageSkeleton } from "@/components/platform/skeleton-loader"

const STALL_MS = 8000

function useStalled() {
  const [stalled, setStalled] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setStalled(true), STALL_MS)
    return () => clearTimeout(t)
  }, [])
  return stalled
}

type RetryProps = {
  onRetry?: () => Promise<void>
}

function StallActions({ onRetry, isArabic }: RetryProps & { isArabic: boolean }) {
  const [busy, setBusy] = useState(false)

  const handleRetry = async () => {
    setBusy(true)
    try {
      if (onRetry) await onRetry()
      else if (typeof window !== "undefined") window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  const handleReload = () => {
    if (typeof window !== "undefined") window.location.reload()
  }

  return (
    <div
      className={cn(
        "mt-6 flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-4 sm:flex-row sm:justify-center",
        isArabic && "sm:flex-row-reverse",
      )}
    >
      <p className="text-center text-xs text-muted-foreground sm:text-start">
        {isArabic
          ? "يستغرق التحميل وقتاً أطول من المعتاد. جرّب التحديث أو إعادة تحميل الصفحة."
          : "This is taking longer than usual. Try refreshing your session or reload the page."}
      </p>
      <div className={cn("flex shrink-0 flex-wrap items-center justify-center gap-2", isArabic && "flex-row-reverse")}>
        <button
          type="button"
          disabled={busy}
          onClick={handleRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} aria-hidden />
          {isArabic ? "إعادة المحاولة" : "Retry"}
        </button>
        <button
          type="button"
          onClick={handleReload}
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50"
        >
          {isArabic ? "إعادة تحميل الصفحة" : "Reload page"}
        </button>
      </div>
    </div>
  )
}

/** Full-screen boot while AuthGuard verifies the session. */
export function WorkspaceAuthLoader({ onRetry }: RetryProps) {
  const { isArabic } = useUiLanguage()
  const stalled = useStalled()

  return (
    <div
      className={cn(
        "flex min-h-screen w-full flex-col items-center justify-center bg-background px-6",
        isArabic && "font-arabic",
      )}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 scale-150 rounded-full bg-primary/15 blur-3xl" aria-hidden />
          <AynLogo size="md" withGlow />
        </div>
        <Loader2 className="mb-4 h-7 w-7 animate-spin text-primary" aria-hidden />
        <p className="text-base font-semibold text-foreground">
          {isArabic ? "جارٍ التحقق من جلستك" : "Verifying your session"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {isArabic ? "نجهّز مساحة العمل ونحمّل إعدادات المؤسسة." : "Preparing your workspace and institution context."}
        </p>
        {stalled && <StallActions onRetry={onRetry} isArabic={isArabic} />}
      </div>
    </div>
  )
}

/** Session/token bridge: show dashboard-shaped skeleton instead of a blank spinner. */
export function WorkspaceSessionLoader({ onRetry }: RetryProps) {
  const { isArabic } = useUiLanguage()
  const stalled = useStalled()

  return (
    <div className={cn("min-h-screen bg-background px-4 pb-16 pt-8 sm:px-6", isArabic && "font-arabic")} dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto mb-8 flex max-w-6xl flex-col items-center text-center">
        <div className="mb-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden />
          <p className="text-sm font-medium text-foreground">
            {isArabic ? "جارٍ تحميل لوحة التحكم…" : "Loading your dashboard…"}
          </p>
        </div>
        <p className="max-w-md text-xs text-muted-foreground">
          {isArabic
            ? "إذا كنت مسجّل الدخول بالفعل، ستظهر البيانات خلال لحظات."
            : "If you are already signed in, your data will appear in a moment."}
        </p>
        {stalled && <StallActions onRetry={onRetry} isArabic={isArabic} />}
      </div>
      <div className="mx-auto max-w-6xl opacity-90">
        <DashboardPageSkeleton />
      </div>
    </div>
  )
}
