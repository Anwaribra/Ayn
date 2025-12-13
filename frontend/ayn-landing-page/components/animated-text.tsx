"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface AnimatedTextProps {
  text: string
  className?: string
  delay?: number
  type?: "typewriter" | "blur-in" | "slide-up" | "character-reveal"
}

export function AnimatedText({ text, className, delay = 0, type = "blur-in" }: AnimatedTextProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [displayedText, setDisplayedText] = useState("")
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])

  useEffect(() => {
    if (type === "typewriter" && isVisible) {
      let i = 0
      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1))
        i++
        if (i >= text.length) clearInterval(interval)
      }, 50)
      return () => clearInterval(interval)
    }
  }, [isVisible, text, type])

  if (type === "typewriter") {
    return (
      <span ref={ref} className={className}>
        {displayedText}
        {isVisible && displayedText.length < text.length && (
          <span className="inline-block w-0.5 h-[1em] bg-current animate-pulse ml-0.5" />
        )}
      </span>
    )
  }

  if (type === "character-reveal") {
    return (
      <span ref={ref} className={cn("inline-block", className)}>
        {text.split("").map((char, i) => (
          <span
            key={i}
            className={cn(
              "inline-block transition-all duration-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
            style={{ transitionDelay: `${i * 30}ms` }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>
    )
  }

  if (type === "slide-up") {
    return (
      <span ref={ref} className={cn("inline-block overflow-hidden", className)}>
        <span
          className={cn(
            "inline-block transition-transform duration-700 ease-out",
            isVisible ? "translate-y-0" : "translate-y-full",
          )}
        >
          {text}
        </span>
      </span>
    )
  }

  // blur-in default
  return (
    <span
      ref={ref}
      className={cn(
        "inline-block transition-all duration-1000",
        isVisible ? "opacity-100 blur-0" : "opacity-0 blur-sm",
        className,
      )}
    >
      {text}
    </span>
  )
}
