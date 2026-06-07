"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { NeuralVortexBackground } from "@/components/ui/interactive-neural-vortex-background"

/** Adaptive neural background — subtle in light mode, richer in dark */
export function DarkCardNeuralBg() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isDark = mounted ? resolvedTheme === "dark" : true

  return (
    <NeuralVortexBackground
      opacity={1.0}
      intensity={isDark ? 1.5 : 1.2}
      textVignette={false}
      colorScheme="mono"
    />
  )
}
