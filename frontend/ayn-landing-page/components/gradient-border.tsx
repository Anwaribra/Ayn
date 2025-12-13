"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface GradientBorderProps {
  children: ReactNode
  className?: string
  borderWidth?: number
  animated?: boolean
}

export function GradientBorder({ children, className, borderWidth = 1, animated = true }: GradientBorderProps) {
  return (
    <div
      className={cn("relative rounded-2xl", animated && "animate-gradient-border", className)}
      style={{ padding: borderWidth }}
    >
      <div
        className={cn("absolute inset-0 rounded-2xl", animated ? "animate-spin-slow" : "")}
        style={{
          background: "linear-gradient(90deg, #3f3f46, #71717a, #52525b, #3f3f46)",
          backgroundSize: "300% 300%",
          animation: animated ? "gradient-rotate 4s linear infinite" : undefined,
        }}
      />
      <div className="relative bg-zinc-950 rounded-2xl h-full">{children}</div>
    </div>
  )
}
