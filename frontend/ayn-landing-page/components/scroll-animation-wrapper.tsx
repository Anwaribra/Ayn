"use client"

import type { ReactNode } from "react"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { cn } from "@/lib/utils"

interface ScrollAnimationWrapperProps {
  children: ReactNode
  className?: string
  animation?: "fade-up" | "fade-in" | "fade-left" | "fade-right" | "scale"
  delay?: number
}

export function ScrollAnimationWrapper({
  children,
  className,
  animation = "fade-up",
  delay = 0,
}: ScrollAnimationWrapperProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 })

  const animationClasses = {
    "fade-up": "translate-y-8 opacity-0",
    "fade-in": "opacity-0",
    "fade-left": "translate-x-8 opacity-0",
    "fade-right": "-translate-x-8 opacity-0",
    scale: "scale-95 opacity-0",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? "translate-y-0 translate-x-0 scale-100 opacity-100" : animationClasses[animation],
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
