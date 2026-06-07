"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useUiLanguage } from "@/lib/ui-language-context"
import { cn } from "@/lib/utils"

export function SettingsPageLayout({
  title,
  titleAr,
  description,
  descriptionAr,
  children,
  maxWidth = "platform-container-narrow",
}: {
  title: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  children: ReactNode
  maxWidth?: string
}) {
  const { isArabic } = useUiLanguage()
  const heading = isArabic && titleAr ? titleAr : title
  const desc = isArabic && descriptionAr ? descriptionAr : description

  return (
    <div className={cn("mx-auto px-0 pb-12", maxWidth, isArabic && "font-arabic")}>
      <Link
        href="/platform/settings"
        className={cn(
          "mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
          isArabic && "flex-row-reverse",
        )}
      >
        <ArrowLeft className={cn("h-3.5 w-3.5", isArabic && "rotate-180")} />
        {isArabic ? "العودة للإعدادات" : "Back to Settings"}
      </Link>

      <header className="platform-page-header mb-5">
        <h1>{heading}</h1>
        {desc ? <p className="mt-1">{desc}</p> : null}
      </header>

      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}
