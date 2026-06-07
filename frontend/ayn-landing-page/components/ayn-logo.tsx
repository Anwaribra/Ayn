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
  const gradientClass =
    variant === "on-dark"
      ? "bg-gradient-to-r from-white via-white/90 to-primary"
      : variant === "on-light" || heroStyle
        ? "bg-gradient-to-r from-foreground via-foreground/95 to-primary"
        : "bg-gradient-to-r from-foreground via-foreground/90 to-primary"

  const useGradient = heroStyle || variant === "on-light" || variant === "on-dark"

  if (markOnly) {
    const letter = isArabic ? "ع" : "A"
    return useGradient ? (
      <span className={cn("bg-clip-text font-bold tracking-tight text-transparent", gradientClass)}>
        {letter}
      </span>
    ) : (
      <span className="font-bold tracking-tight text-foreground">
        {isArabic ? (
          <>
            <span>ع</span>
            <span className="text-primary">ي</span>
          </>
        ) : (
          <>
            A<span className="text-primary">y</span>
          </>
        )}
      </span>
    )
  }

  if (useGradient) {
    return (
      <span className={cn("bg-clip-text font-bold tracking-tight text-transparent", gradientClass)}>
        {isArabic ? "عين" : "Ayn"}
      </span>
    )
  }

  return (
    <span className="font-bold tracking-tight text-foreground">
      {isArabic ? (
        <>
          عي<span className="text-primary">ن</span>
        </>
      ) : (
        <>
          Ay<span className="text-primary">n</span>
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
