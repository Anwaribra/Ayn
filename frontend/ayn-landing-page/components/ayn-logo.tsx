"use client"

import { cn } from "@/lib/utils"

interface AynLogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  withGlow?: boolean
  animated?: boolean
}

export function AynLogo({ className, size = "md", withGlow = true, animated = false }: AynLogoProps) {
  const sizeClasses = {
    sm: "text-3xl",
    md: "text-5xl",
    lg: "text-7xl",
    xl: "text-9xl",
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {withGlow && (
        <>
          <div
            className={cn(
              "absolute inset-0 blur-2xl opacity-30 bg-gradient-to-r from-zinc-400 via-zinc-300 to-zinc-400 rounded-full scale-150",
              animated && "animate-pulse",
            )}
            style={{ animationDuration: animated ? "3s" : undefined }}
          />
          {animated && (
            <>
              <div
                className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-br from-zinc-200 via-zinc-400 to-zinc-300 rounded-full scale-125 animate-pulse"
                style={{ animationDuration: "4s", animationDelay: "0.5s" }}
              />
              <div
                className="absolute inset-0 blur-xl opacity-10 bg-zinc-200 rounded-full scale-100 animate-ping"
                style={{ animationDuration: "6s" }}
              />
            </>
          )}
        </>
      )}
      <span
        className={cn(
          "relative font-arabic font-bold text-white transform -scale-x-100 z-10",
          animated && "animate-float",
          sizeClasses[size],
        )}
        style={{
          textShadow: "0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 255, 255, 0.3)",
          filter: animated
            ? "drop-shadow(0 0 20px rgba(255,255,255,0.6))"
            : "drop-shadow(0 0 15px rgba(255,255,255,0.5))",
          opacity: 1,
        }}
      >
        ع
      </span>
    </div>
  )
}
