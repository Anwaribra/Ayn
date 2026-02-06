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
              "absolute inset-0 blur-2xl opacity-40 bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 rounded-full scale-150",
              animated && "animate-pulse",
            )}
            style={{ animationDuration: animated ? "3s" : undefined }}
          />
          {animated && (
            <>
              <div
                className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-br from-primary/20 via-primary/40 to-primary/20 rounded-full scale-125 animate-pulse"
                style={{ animationDuration: "4s", animationDelay: "0.5s" }}
              />
              <div
                className="absolute inset-0 blur-xl opacity-20 bg-primary/20 rounded-full scale-100 animate-ping"
                style={{ animationDuration: "6s" }}
              />
            </>
          )}
        </>
      )}
      <span
        className={cn(
          "relative flex font-bold text-foreground tracking-tight z-10",
          animated && "animate-float",
          sizeClasses[size],
        )}
        style={{
          textShadow: "0 0 30px rgba(var(--primary), 0.3), 0 0 60px rgba(var(--primary), 0.2)",
          filter: animated
            ? "drop-shadow(0 0 20px rgba(var(--primary),0.4))"
            : "drop-shadow(0 0 15px rgba(var(--primary),0.3))",
          opacity: 1,
        }}
      >
        Ayn
      </span>
    </div>
  )
}

