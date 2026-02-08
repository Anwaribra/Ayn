"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedBeamProps {
  className?: string
  containerRef: React.RefObject<HTMLElement | null>
  fromRef: React.RefObject<HTMLElement | null>
  toRef: React.RefObject<HTMLElement | null>
  curvature?: number
  duration?: number
  delay?: number
  pathColor?: string
  pathWidth?: number
  pathOpacity?: number
  gradientStartColor?: string
  gradientStopColor?: string
  startXOffset?: number
  startYOffset?: number
  endXOffset?: number
  endYOffset?: number
}

export function AnimatedBeam({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  duration = 3,
  delay = 0,
  pathColor = "var(--primary)",
  pathWidth = 2,
  pathOpacity = 0.3,
  gradientStartColor = "#3b82f6",
  gradientStopColor = "#8b5cf6",
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}: AnimatedBeamProps) {
  const [pathD, setPathD] = useState("")
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updatePath = () => {
      const container = containerRef.current
      const from = fromRef.current
      const to = toRef.current
      
      if (!container || !from || !to) return

      const containerRect = container.getBoundingClientRect()
      const fromRect = from.getBoundingClientRect()
      const toRect = to.getBoundingClientRect()

      setSvgDimensions({
        width: containerRect.width,
        height: containerRect.height,
      })

      const startX = fromRect.left - containerRect.left + fromRect.width / 2 + startXOffset
      const startY = fromRect.top - containerRect.top + fromRect.height / 2 + startYOffset
      const endX = toRect.left - containerRect.left + toRect.width / 2 + endXOffset
      const endY = toRect.top - containerRect.top + toRect.height / 2 + endYOffset

      // Control point for quadratic bezier
      const controlX = (startX + endX) / 2
      const controlY = Math.min(startY, endY) + curvature
      
      const d = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`
      setPathD(d)
    }

    updatePath()
    
    const handleResize = () => {
      requestAnimationFrame(updatePath)
    }
    
    window.addEventListener("resize", handleResize)
    
    // Delay initial calculation to ensure DOM is ready
    const timeout = setTimeout(updatePath, 100)
    
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(timeout)
    }
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset])

  if (!pathD) return null

  return (
    <svg
      width={svgDimensions.width}
      height={svgDimensions.height}
      className={cn("absolute inset-0 pointer-events-none", className)}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient
          id={`gradient-${delay}`}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={gradientStartColor} />
          <stop offset="100%" stopColor={gradientStopColor} />
        </linearGradient>
        
        <filter id={`glow-${delay}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Static background path */}
      <path
        d={pathD}
        fill="none"
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />

      {/* Animated gradient path */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={`url(#gradient-${delay})`}
        strokeWidth={pathWidth + 2}
        strokeLinecap="round"
        filter={`url(#glow-${delay})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ 
          pathLength: [0, 1, 1, 0],
          opacity: [0, 1, 1, 0],
          strokeDashoffset: [0, 0, 0, 0]
        }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          repeatDelay: 0.5,
          times: [0, 0.3, 0.7, 1],
          ease: "easeInOut",
        }}
      />

      {/* Glowing orb that travels along the path */}
      <motion.circle
        r="5"
        fill={gradientStopColor}
        filter={`url(#glow-${delay})`}
      >
        <animateMotion
          dur={`${duration}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
          path={pathD}
          rotate="auto"
        />
        <animate
          attributeName="opacity"
          values="0;1;1;0"
          dur={`${duration}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
          keyTimes="0;0.1;0.9;1"
        />
      </motion.circle>
    </svg>
  )
}

// Simpler horizontal beam for the workflow section
interface SimpleBeamProps {
  className?: string
  reverse?: boolean
  duration?: number
  delay?: number
}

export function SimpleBeam({ 
  className, 
  reverse = false,
  duration = 2,
  delay = 0
}: SimpleBeamProps) {
  return (
    <div className={cn("relative h-px flex-1 mx-2", className)}>
      {/* Background line */}
      <div className="absolute inset-0 bg-gradient-to-r from-border via-border to-border rounded-full" />
      
      {/* Animated gradient line */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: reverse 
            ? "linear-gradient(90deg, transparent, #8b5cf6, #3b82f6, transparent)" 
            : "linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, transparent)",
          backgroundSize: "200% 100%",
        }}
        animate={{
          backgroundPosition: reverse ? ["100% 0%", "0% 0%"] : ["0% 0%", "100% 0%"],
        }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Glowing orb */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
        style={{
          boxShadow: "0 0 10px 2px rgba(59, 130, 246, 0.5), 0 0 20px 4px rgba(139, 92, 246, 0.3)",
        }}
        animate={{
          left: reverse ? ["100%", "0%"] : ["0%", "100%"],
        }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  )
}
