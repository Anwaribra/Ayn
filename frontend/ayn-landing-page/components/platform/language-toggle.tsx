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
        "relative flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[16px] border border-transparent transition-all duration-200 hover:-translate-y-0.5",
        isArabic
          ? "bg-[linear-gradient(180deg,rgba(16,185,129,0.14),rgba(16,185,129,0.05))] text-[var(--status-success)] shadow-[0_10px_24px_-16px_rgba(16,185,129,0.45)]"
          : "hover:bg-[var(--glass-soft-bg)] text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]",
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[16px] border border-white/15 opacity-35" aria-hidden />
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
