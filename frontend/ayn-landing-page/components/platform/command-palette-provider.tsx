"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface CommandPaletteContextType {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(
  undefined
)

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  const toggle = () => setOpen((prev) => !prev)

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPaletteContext() {
  const context = useContext(CommandPaletteContext)
  if (context === undefined) {
    throw new Error(
      "useCommandPaletteContext must be used within a CommandPaletteProvider"
    )
  }
  return context
}
