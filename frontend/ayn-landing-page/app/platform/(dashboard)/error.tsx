"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { useUiLanguage } from "@/lib/ui-language-context"
import { cn } from "@/lib/utils"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { isArabic } = useUiLanguage()

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error)
    }
  }, [error])

  return (
    <div className={cn("flex min-h-[60vh] flex-col items-center justify-center px-4 py-16", isArabic && "font-arabic")}>
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-10 w-10 text-destructive" aria-hidden />
        </div>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          {isArabic ? "حدث خطأ" : "Something went wrong"}
        </h2>
        <p className="mb-8 text-sm text-muted-foreground">
          {isArabic
            ? "واجهنا مشكلة في هذا القسم. جرّب مرة أخرى أو ارجع للوحة التحكم."
            : "We ran into an error in this section. Try again or return to the dashboard."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={reset} variant="default">
            {isArabic ? "إعادة المحاولة" : "Try again"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/platform/dashboard">{isArabic ? "لوحة التحكم" : "Dashboard"}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
