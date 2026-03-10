"use client"

import { useEffect } from "react"

export function usePageTitle(title: string) {
  useEffect(() => {
    const originalTitle = document.title
    document.title = `${title} | Ayn`
    return () => {
      document.title = originalTitle
    }
  }, [title])
}
