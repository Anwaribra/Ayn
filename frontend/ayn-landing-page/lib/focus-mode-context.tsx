"use client"

import React, { createContext, useContext, useState } from "react"

interface FocusModeContextValue {
  focusMode: boolean
  setFocusMode: (v: boolean) => void
}

const FocusModeContext = createContext<FocusModeContextValue | undefined>(undefined)

export function FocusModeProvider({ children }: { children: React.ReactNode }) {
  const [focusMode, setFocusMode] = useState(false)
  return (
    <FocusModeContext.Provider value={{ focusMode, setFocusMode }}>
      {children}
    </FocusModeContext.Provider>
  )
}

export function useFocusMode() {
  const ctx = useContext(FocusModeContext)
  return ctx ?? { focusMode: false, setFocusMode: () => {} }
}
