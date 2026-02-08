"use client"

import { useEffect, useRef, useMemo } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GradientOrbProps {
  className?: string
  color?: string
  size?: number
  delay?: number
  duration?: number
  blur?: number
}

function GradientOrb({
  className,
  color = "var(--brand)",
  size = 400,
  delay = 0,
  duration = 15,
  blur = 100,
}: GradientOrbProps) {
  return (
    <motion.div
      className={cn("absolute pointer-events-none", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.03, 0.08, 0.05, 0.1, 0.03],
        scale: [1, 1.1, 0.95, 1.05, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

interface FloatingParticlesProps {
  count?: number
  className?: string
}

function FloatingParticles({
  count = 15,
  className,
}: FloatingParticlesProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i): Particle => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
    }))
  }, [count])

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: "var(--brand)",
            opacity: 0.08,
          }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

interface SpotlightEffectProps {
  className?: string
}

function SpotlightEffect({ className }: SpotlightEffectProps) {
  const spotlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current) return
      const rect = spotlightRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      spotlightRef.current.style.setProperty("--mouse-x", `${x}%`)
      spotlightRef.current.style.setProperty("--mouse-y", `${y}%`)
    }

    const element = spotlightRef.current
    if (element) {
      element.addEventListener("mousemove", handleMouseMove)
      return () => element.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div
      ref={spotlightRef}
      className={cn(
        "absolute inset-0 pointer-events-none",
        className
      )}
      style={{
        background: `radial-gradient(
          800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
          color-mix(in oklch, var(--brand) 4%, transparent),
          transparent 40%
        )`,
      }}
    />
  )
}

interface AmbientBackgroundProps {
  variant?: "default" | "dashboard" | "chat" | "minimal"
  showOrbs?: boolean
  showParticles?: boolean
  showSpotlight?: boolean
  className?: string
  children?: React.ReactNode
}

export function AmbientBackground({
  variant = "default",
  showOrbs = true,
  showParticles = true,
  showSpotlight = false,
  className,
  children,
}: AmbientBackgroundProps) {
  const configs = {
    default: {
      orbs: [
        { color: "var(--brand)", size: 600, position: "top-0 -left-40", delay: 0 },
        { color: "oklch(0.5 0.1 280)", size: 500, position: "top-1/3 -right-40", delay: 3 },
      ],
      particleCount: 10,
    },
    dashboard: {
      orbs: [
        { color: "var(--brand)", size: 800, position: "-top-40 -left-60", delay: 0 },
        { color: "oklch(0.45 0.08 250)", size: 600, position: "top-1/4 right-0", delay: 4 },
      ],
      particleCount: 12,
    },
    chat: {
      orbs: [
        { color: "var(--brand)", size: 500, position: "top-0 -left-20", delay: 0 },
      ],
      particleCount: 8,
    },
    minimal: {
      orbs: [
        { color: "var(--brand)", size: 400, position: "-top-20 -right-20", delay: 0 },
      ],
      particleCount: 5,
    },
  }

  const config = configs[variant]

  return (
    <div className={cn("relative min-h-screen overflow-hidden", className)}>
      {/* Base gradient - very subtle */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 0% 0%, color-mix(in oklch, var(--brand) 3%, transparent) 0%, transparent 50%),
                       radial-gradient(ellipse at 100% 100%, color-mix(in oklch, var(--brand) 2%, transparent) 0%, transparent 50%)`,
        }}
      />

      {/* Animated Gradient Orbs */}
      {showOrbs && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {config.orbs.map((orb, index) => (
            <GradientOrb
              key={index}
              color={orb.color}
              size={orb.size}
              delay={orb.delay}
              duration={20 + index * 5}
              blur={150}
              className={orb.position}
            />
          ))}
        </div>
      )}

      {/* Floating Particles - very subtle */}
      {showParticles && (
        <div className="fixed inset-0 pointer-events-none">
          <FloatingParticles count={config.particleCount} />
        </div>
      )}

      {/* Mouse Spotlight - extremely subtle */}
      {showSpotlight && (
        <SpotlightEffect className="fixed inset-0 z-0" />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

// Simple static background for performance
export function StaticAmbientBackground({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn("relative min-h-screen overflow-hidden", className)}>
      {/* Static gradient background - very subtle */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 0% 0%, color-mix(in oklch, var(--brand) 4%, transparent) 0%, transparent 60%),
                       radial-gradient(ellipse at 100% 100%, color-mix(in oklch, var(--brand) 2%, transparent) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  )
}

export { GradientOrb, FloatingParticles, SpotlightEffect }
