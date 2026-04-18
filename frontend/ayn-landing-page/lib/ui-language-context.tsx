"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type UiLanguage = "en" | "ar"

const STORAGE_KEY = "ayn-ui-language"

type UiLanguageContextValue = {
  language: UiLanguage
  isArabic: boolean
  setLanguage: (language: UiLanguage) => void
  toggleLanguage: () => void
}

const UiLanguageContext = createContext<UiLanguageContextValue | null>(null)

function applyLanguage(language: UiLanguage) {
  document.documentElement.lang = language
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
  document.documentElement.setAttribute("data-ui-language", language)
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
  const [language, setLanguageState] = useState<UiLanguage>("en")

  useEffect(() => {
    const initial = getInitialLanguage()
    setLanguageState(initial)
    applyLanguage(initial)
  }, [])

  const setLanguage = (nextLanguage: UiLanguage) => {
    setLanguageState(nextLanguage)
    applyLanguage(nextLanguage)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage)
    }
  }

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en")
  }

  const value = useMemo(
    () => ({
      language,
      isArabic: language === "ar",
      setLanguage,
      toggleLanguage,
    }),
    [language],
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
