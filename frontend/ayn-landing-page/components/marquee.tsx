"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface MarqueeProps {
  children: ReactNode
  className?: string
  speed?: number
  direction?: "left" | "right"
  pauseOnHover?: boolean
}

export function Marquee({ children, className, speed = 40, direction = "left", pauseOnHover = true }: MarqueeProps) {
  return (
    <div
      className={cn("group flex overflow-hidden", className)}
      style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}
    >
      <div
        className={cn(
          "flex shrink-0 gap-8 animate-marquee",
          direction === "right" && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
        {children}
      </div>
      <div
        className={cn(
          "flex shrink-0 gap-8 animate-marquee",
          direction === "right" && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
        style={{ animationDuration: `${speed}s` }}
        aria-hidden
      >
        {children}
        {children}
      </div>
    </div>
  )
}
