"use client"

import { useState, useRef, MouseEvent, ReactNode } from "react"
import { motion, useSpring, useMotionTemplate } from "framer-motion"
import { cn } from "@/lib/utils"

export function SpotlightWrapper({
  children,
  className,
  spotlightColor = "rgba(16, 185, 129, 0.1)", // Subtle emerald spotlight
  size = 400,
}: {
  children: ReactNode
  className?: string
  spotlightColor?: string
  size?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [opacity, setOpacity] = useState(0)

  // Use springs for smooth following effect
  const mouseX = useSpring(0, { stiffness: 300, damping: 30 })
  const mouseY = useSpring(0, { stiffness: 300, damping: 30 })

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const backgroundStr = useMotionTemplate`radial-gradient(${size}px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 55%)`

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cn("relative h-full w-full", className)}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px z-0 rounded-[inherit] transition-opacity duration-500"
        style={{ 
          opacity,
          background: backgroundStr
        }}
      />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
}
