"use client"

import { cn } from "@/lib/utils"

/** Background the logo sits on — drives light vs dark wordmark treatment (matches landing navbar). */
export type AynLogoVariant = "on-light" | "on-dark" | "auto"

interface AynLogoProps {
  className?: string
  /** xs/sm for platform chrome; md+ for marketing hero */
  size?: "xs" | "sm" | "nav" | "md" | "lg" | "xl"
  /** Legacy — prefer variant; glow off by default in platform */
  withGlow?: boolean
  animated?: boolean
  /** Gradient wordmark like landing hero (foreground → primary) */
  heroStyle?: boolean
  /** Single-letter mark for collapsed sidebar */
  markOnly?: boolean
  isArabic?: boolean
  /** Adaptive styling: light wordmark on dark surfaces, dark on light */
  variant?: AynLogoVariant
}

const sizeClasses = {
  xs: "text-lg leading-none",
  sm: "text-xl leading-none",
  nav: "text-[1.35rem] leading-none",
  md: "text-4xl leading-none",
  lg: "text-6xl leading-none",
  xl: "text-8xl leading-none",
} as const

function Wordmark({
  isArabic,
  markOnly,
  heroStyle,
  variant,
}: Pick<AynLogoProps, "isArabic" | "markOnly" | "heroStyle" | "variant">) {
  const colorClass = 
    variant === "on-dark" ? "text-white" : 
    variant === "on-light" ? "text-black dark:text-black" : 
    "text-foreground"

  if (markOnly) {
    return (
      <span className={cn("font-bold tracking-tight", colorClass)}>
        {isArabic ? "ع" : "A"}
      </span>
    )
  }

  return (
    <span className={cn("font-bold tracking-tighter leading-none flex items-center", colorClass)}>
      {isArabic ? "عين" : (
        <>
          Ayn<span className="text-primary">.</span>
        </>
      )}
    </span>
  )
}

export function AynLogo({
  className,
  size = "md",
  withGlow = false,
  animated = false,
  heroStyle = false,
  markOnly = false,
  isArabic = false,
  variant = "auto",
}: AynLogoProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center font-display select-none",
        className,
      )}
      aria-hidden={markOnly ? undefined : false}
    >
      {withGlow && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 scale-150 rounded-full bg-gradient-to-r from-primary/30 via-primary/15 to-primary/30 opacity-30 blur-2xl",
            animated && "animate-float",
          )}
        />
      )}

      <span
        className={cn(
          "relative z-10",
          sizeClasses[size],
          animated && "animate-float",
        )}
      >
        <Wordmark
          isArabic={isArabic}
          markOnly={markOnly}
          heroStyle={heroStyle}
          variant={variant}
        />
      </span>
    </div>
  )
}
