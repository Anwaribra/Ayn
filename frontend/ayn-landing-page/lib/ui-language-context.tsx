"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"

export type UiLanguage = "en" | "ar"

const STORAGE_KEY = "ayn-ui-language"

type UiLanguageContextValue = {
  language: UiLanguage
  isArabic: boolean
  setLanguage: (language: UiLanguage) => void
  toggleLanguage: () => void
}

const UiLanguageContext = createContext<UiLanguageContextValue | null>(null)

function applyLanguage(language: UiLanguage, pathname: string) {
  const isPlatform = pathname.startsWith("/platform")
  const effectiveLanguage = isPlatform ? language : "en"
  const isArabic = effectiveLanguage === "ar"

  document.documentElement.lang = effectiveLanguage
  document.documentElement.setAttribute("data-ui-language", effectiveLanguage)
  document.documentElement.dir = isArabic ? "rtl" : "ltr"
}

function getInitialLanguage(): UiLanguage {
  if (typeof window === "undefined") return "en"

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === "ar" || saved === "en") return saved

  const htmlLang = document.documentElement.lang
  if (htmlLang === "ar" || htmlLang === "en") return htmlLang

  return (window.navigator.language || "").toLowerCase().startsWith("ar") ? "ar" : "en"
}

export function UiLanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [language, setLanguageState] = useState<UiLanguage>("en")

  useEffect(() => {
    const initial = getInitialLanguage()
    setLanguageState(initial)
  }, [])

  useEffect(() => {
    applyLanguage(language, pathname)
  }, [language, pathname])

  const setLanguage = (nextLanguage: UiLanguage) => {
    setLanguageState(nextLanguage)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage)
    }
  }

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en")
  }

  const isPlatform = pathname.startsWith("/platform")
  const effectiveLanguage = isPlatform ? language : "en"

  const value = useMemo(
    () => ({
      language: effectiveLanguage,
      isArabic: effectiveLanguage === "ar",
      setLanguage,
      toggleLanguage,
    }),
    [effectiveLanguage, setLanguage, toggleLanguage],
  )

  return (
    <UiLanguageContext.Provider value={value}>
      {children}
    </UiLanguageContext.Provider>
  )
}

export function useUiLanguage() {
  const context = useContext(UiLanguageContext)
  if (!context) {
    throw new Error("useUiLanguage must be used within UiLanguageProvider")
  }
  return context
}
