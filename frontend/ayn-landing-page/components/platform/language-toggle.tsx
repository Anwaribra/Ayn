"use client"

import { cn } from "@/lib/utils"
import { useUiLanguage } from "@/lib/ui-language-context"

/** Compact square control — same footprint as `AnimatedThemeToggle` (44×44). */
export function LanguageToggle({ className }: { className?: string }) {
  const { language, toggleLanguage, isArabic } = useUiLanguage()
  const code = language.toUpperCase()

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}
      title={isArabic ? "English (EN)" : "العربية (AR)"}
      className={cn(
        "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-transparent transition-colors duration-150",
        isArabic
          ? "bg-[var(--status-success-bg)] text-[var(--status-success)]"
          : "hover:bg-[var(--glass-soft-bg)] text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]",
        className,
      )}
    >
      <span
        className={cn(
          "relative tabular-nums text-[10px] font-bold uppercase leading-none tracking-[0.12em]",
          isArabic && "font-arabic tracking-normal",
        )}
      >
        {code}
      </span>
    </button>
  )
}
