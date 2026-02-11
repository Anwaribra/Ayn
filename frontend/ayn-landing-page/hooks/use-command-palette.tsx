"use client"

import { useEffect, useCallback } from "react"
import { useCommandPaletteContext } from "@/components/platform/command-palette-provider"

/**
 * Hook to enable keyboard shortcuts for the command palette.
 * 
 * Note: This hook is designed to be used at the layout level (e.g., in PlatformShell)
 * to provide global keyboard shortcuts. It should NOT be used in components that
 * also have their own keyboard handlers (like CommandPalette itself) to avoid
 * duplicate event listeners.
 * 
 * Usage: Call this hook once in your root layout or shell component.
 */
export function useCommandPalette() {
  const { open, setOpen, toggle } = useCommandPaletteContext()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        toggle()
      }
    },
    [toggle]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return { open, setOpen, toggle }
}
