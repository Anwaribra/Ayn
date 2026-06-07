"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

type AnimatedThemeToggleProps = {
  className?: string
  duration?: number
}

export function AnimatedThemeToggle({
  className,
  duration = 500,
}: AnimatedThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const runThemeTransition = async (nextTheme: "light" | "dark") => {
    const button = buttonRef.current
    if (!button || !document.startViewTransition) {
      setTheme(nextTheme)
      return
    }

    const rect = button.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    const transition = document.startViewTransition(() => {
      setTheme(nextTheme)
    })

    await transition.ready

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    )
  }

  const isDark = (mounted ? resolvedTheme : "dark") === "dark"

  return (
    <>
      <style jsx global>{`
        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation: none;
          mix-blend-mode: normal;
        }
      `}</style>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => void runThemeTransition(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Light mode" : "Dark mode"}
        className={cn(
          "relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] border border-transparent transition-colors duration-150",
          isDark
            ? "bg-[var(--status-warning-bg)] text-[var(--status-warning)]"
            : "bg-[var(--status-info-bg)] text-[var(--status-info)]",
          className,
        )}
      >
        <motion.span
          initial={false}
          animate={{
            rotate: isDark ? 0 : -40,
            scale: isDark ? 1 : 0.82,
            opacity: isDark ? 1 : 0,
          }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="absolute"
        >
          <Sun
            className="h-[18px] w-[18px] drop-shadow-[0_0_10px_rgba(245,158,11,0.35)]"
            strokeWidth={2.2}
          />
        </motion.span>

        <motion.span
          initial={false}
          animate={{
            rotate: isDark ? 40 : 0,
            scale: isDark ? 0.82 : 1,
            opacity: isDark ? 0 : 1,
          }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="absolute"
        >
          <Moon
            className="h-[18px] w-[18px] drop-shadow-[0_0_10px_rgba(37,99,235,0.28)]"
            strokeWidth={2.2}
          />
        </motion.span>
      </button>
    </>
  )
}
