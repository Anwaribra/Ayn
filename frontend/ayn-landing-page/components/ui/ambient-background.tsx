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
        opacity: 0.15,
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: [0.8, 1.1, 0.9, 1.05, 0.8],
        opacity: [0.1, 0.2, 0.15, 0.25, 0.1],
        x: ["0%", "10%", "-5%", "5%", "0%"],
        y: ["0%", "-10%", "5%", "-5%", "0%"],
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

interface GridPatternProps {
  className?: string
  spacing?: number
  opacity?: number
}

function GridPattern({
  className,
  spacing = 40,
  opacity = 0.03,
}: GridPatternProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none",
        className
      )}
      style={{
        backgroundImage: `
          linear-gradient(to right, currentColor ${opacity * 100}%, transparent ${opacity * 100}%),
          linear-gradient(to bottom, currentColor ${opacity * 100}%, transparent ${opacity * 100}%)
        `,
        backgroundSize: `${spacing}px ${spacing}px`,
        color: "currentColor",
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
  opacity: number
}

interface FloatingParticlesProps {
  count?: number
  className?: string
}

function FloatingParticles({
  count = 20,
  className,
}: FloatingParticlesProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i): Particle => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.3 + 0.1,
    }))
  }, [count])

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-current"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -30, 0, -20, 0],
            x: [0, 10, -10, 5, 0],
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
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
          600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
          color-mix(in oklch, var(--brand) 8%, transparent),
          transparent 40%
        )`,
      }}
    />
  )
}

interface AmbientBackgroundProps {
  variant?: "default" | "dashboard" | "chat" | "minimal"
  showOrbs?: boolean
  showGrid?: boolean
  showParticles?: boolean
  showSpotlight?: boolean
  className?: string
  children?: React.ReactNode
}

export function AmbientBackground({
  variant = "default",
  showOrbs = true,
  showGrid = true,
  showParticles = true,
  showSpotlight = false,
  className,
  children,
}: AmbientBackgroundProps) {
  const configs = {
    default: {
      orbs: [
        { color: "var(--brand)", size: 500, position: "-top-40 -left-40", delay: 0 },
        { color: "oklch(0.6 0.2 280)", size: 400, position: "top-1/3 -right-40", delay: 2 },
        { color: "oklch(0.7 0.15 160)", size: 350, position: "-bottom-20 left-1/4", delay: 4 },
      ],
      gridOpacity: 0.02,
      particleCount: 15,
    },
    dashboard: {
      orbs: [
        { color: "var(--brand)", size: 600, position: "-top-60 -left-60", delay: 0 },
        { color: "oklch(0.5 0.15 250)", size: 450, position: "top-1/4 right-0", delay: 3 },
        { color: "oklch(0.6 0.1 162)", size: 400, position: "bottom-0 left-1/3", delay: 5 },
      ],
      gridOpacity: 0.025,
      particleCount: 20,
    },
    chat: {
      orbs: [
        { color: "var(--brand)", size: 400, position: "top-1/4 -left-20", delay: 0 },
        { color: "oklch(0.5 0.2 280)", size: 350, position: "bottom-1/4 -right-20", delay: 2 },
      ],
      gridOpacity: 0.015,
      particleCount: 10,
    },
    minimal: {
      orbs: [
        { color: "var(--brand)", size: 300, position: "-top-40 -right-40", delay: 0 },
      ],
      gridOpacity: 0.01,
      particleCount: 5,
    },
  }

  const config = configs[variant]

  return (
    <div className={cn("relative min-h-screen overflow-hidden", className)}>
      {/* Gradient Orbs */}
      {showOrbs && (
        <div className="fixed inset-0 pointer-events-none">
          {config.orbs.map((orb, index) => (
            <GradientOrb
              key={index}
              color={orb.color}
              size={orb.size}
              delay={orb.delay}
              duration={15 + index * 2}
              blur={120}
              className={orb.position}
            />
          ))}
        </div>
      )}

      {/* Grid Pattern */}
      {showGrid && (
        <div className="fixed inset-0 pointer-events-none text-foreground">
          <GridPattern spacing={50} opacity={config.gridOpacity} />
        </div>
      )}

      {/* Floating Particles */}
      {showParticles && (
        <div className="fixed inset-0 pointer-events-none text-[var(--brand)]">
          <FloatingParticles count={config.particleCount} />
        </div>
      )}

      {/* Mouse Spotlight */}
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
      {/* Static gradient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 0% 0%, color-mix(in oklch, var(--brand) 15%, transparent) 0%, transparent 50%),
            radial-gradient(ellipse at 100% 0%, color-mix(in oklch, var(--brand) 10%, transparent) 0%, transparent 50%),
            radial-gradient(ellipse at 100% 100%, color-mix(in oklch, oklch(0.6 0.2 280) 10%, transparent) 0%, transparent 50%),
            radial-gradient(ellipse at 0% 100%, color-mix(in oklch, oklch(0.7 0.15 160) 8%, transparent) 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Subtle grid */}
      <div className="fixed inset-0 pointer-events-none text-foreground">
        <GridPattern spacing={60} opacity={0.015} />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  )
}

export { GradientOrb, GridPattern, FloatingParticles, SpotlightEffect }
