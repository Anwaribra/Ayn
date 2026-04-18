"use client"

import { useEffect, useState } from "react"
import { Languages } from "lucide-react"
import { cn } from "@/lib/utils"

type UiLanguage = "en" | "ar"

const STORAGE_KEY = "ayn-ui-language"

function applyLanguage(language: UiLanguage) {
  document.documentElement.lang = language
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
  document.documentElement.setAttribute("data-ui-language", language)
}

function getPreferredLanguage(): UiLanguage {
  if (typeof window === "undefined") return "en"

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === "ar" || saved === "en") return saved

  const currentLang = document.documentElement.lang
  if (currentLang === "ar" || currentLang === "en") return currentLang

  return (window.navigator.language || "").toLowerCase().startsWith("ar") ? "ar" : "en"
}

export function LanguageToggle({ className }: { className?: string }) {
  const [language, setLanguage] = useState<UiLanguage>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initial = getPreferredLanguage()
    setLanguage(initial)
    applyLanguage(initial)
    setMounted(true)
  }, [])

  const toggleLanguage = () => {
    const nextLanguage: UiLanguage = language === "en" ? "ar" : "en"
    setLanguage(nextLanguage)
    applyLanguage(nextLanguage)
    window.localStorage.setItem(STORAGE_KEY, nextLanguage)
  }

  const activeLanguage = mounted ? language : "en"
  const isArabic = activeLanguage === "ar"

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
        {isArabic ? "AR" : "EN"}
      </span>
    </button>
  )
}
