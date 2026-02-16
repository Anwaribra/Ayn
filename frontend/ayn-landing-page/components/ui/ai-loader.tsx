"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AILoaderProps {
  size?: number
  text?: string
  /** "fullscreen" = overlay; "inline" = no overlay, for embedding multiple on a page */
  variant?: "fullscreen" | "inline"
  className?: string
}

export const Component: React.FC<AILoaderProps> = ({
  size = 180,
  text = "Horus AI",
  variant = "fullscreen",
  className,
}) => {
  const letters = text.split("")

  const content = (
    <div
      className={cn(
        "relative flex items-center justify-center font-sans select-none ai-loader-letters",
        className
      )}
      style={{ width: size, height: size }}
    >
      {letters.map((letter, index) => (
        <span
          key={index}
          className="inline-block text-foreground dark:text-foreground opacity-40 animate-loader-letter"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {letter}
        </span>
      ))}
      <div className="absolute inset-0 rounded-full animate-loader-circle" />
    </div>
  )

  if (variant === "inline") {
    return content
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#1a3379] via-[#0f172a] to-black dark:from-gray-100 dark:via-gray-200 dark:to-gray-300">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        {content}
      </div>
    </div>
  )
}
