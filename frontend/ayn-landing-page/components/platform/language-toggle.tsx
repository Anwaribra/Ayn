"use client"

import { Languages } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUiLanguage } from "@/lib/ui-language-context"

export function LanguageToggle({ className }: { className?: string }) {
  const { language, toggleLanguage, isArabic } = useUiLanguage()

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}
      title={isArabic ? "English" : "العربية"}
      className={cn(
        "relative flex min-h-[44px] min-w-[52px] items-center justify-center gap-1.5 rounded-[16px] border border-transparent px-3 transition-all duration-200 hover:-translate-y-0.5",
        isArabic
          ? "bg-[linear-gradient(180deg,rgba(16,185,129,0.14),rgba(16,185,129,0.05))] text-[var(--status-success)] shadow-[0_10px_24px_-16px_rgba(16,185,129,0.45)]"
          : "hover:bg-[var(--glass-soft-bg)] text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]",
        className,
      )}
    >
      <Languages className="h-[16px] w-[16px]" strokeWidth={2.05} />
      <span className={cn("text-[10px] font-bold uppercase tracking-[0.14em]", isArabic && "font-arabic")}>
        {language.toUpperCase()}
      </span>
    </button>
  )
}
