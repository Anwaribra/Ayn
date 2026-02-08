"use client"

import { useEffect, useCallback } from "react"
import { useCommandPaletteContext } from "@/components/platform/command-palette-provider"

export function useCommandPalette() {
  const { open, setOpen, toggle } = useCommandPaletteContext()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        toggle()
      }
      // Escape to close
      if (e.key === "Escape" && open) {
        setOpen(false)
      }
    },
    [open, toggle, setOpen]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return { open, setOpen, toggle }
}
