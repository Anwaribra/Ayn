"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedBeamProps {
  className?: string
  containerRef: React.RefObject<HTMLElement>
  fromRef: React.RefObject<HTMLElement>
  toRef: React.RefObject<HTMLElement>
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
  duration = 2,
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
      if (!containerRef.current || !fromRef.current || !toRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const fromRect = fromRef.current.getBoundingClientRect()
      const toRect = toRef.current.getBoundingClientRect()

      const svgWidth = containerRect.width
      const svgHeight = containerRect.height
      setSvgDimensions({ width: svgWidth, height: svgHeight })

      const startX = fromRect.left - containerRect.left + fromRect.width / 2 + startXOffset
      const startY = fromRect.top - containerRect.top + fromRect.height / 2 + startYOffset
      const endX = toRect.left - containerRect.left + toRect.width / 2 + endXOffset
      const endY = toRect.top - containerRect.top + toRect.height / 2 + endYOffset

      // Create a quadratic bezier curve
      const controlX = (startX + endX) / 2
      const controlY = startY + curvature
      const d = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`
      setPathD(d)
    }

    updatePath()
    window.addEventListener("resize", updatePath)
    
    // Initial delay to ensure DOM is ready
    const timeout = setTimeout(updatePath, 100)
    
    return () => {
      window.removeEventListener("resize", updatePath)
      clearTimeout(timeout)
    }
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset])

  if (!pathD) return null

  return (
    <svg
      className={cn("absolute inset-0 pointer-events-none", className)}
      width={svgDimensions.width}
      height={svgDimensions.height}
      style={{ zIndex: 1, overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`beam-gradient-${delay}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={gradientStartColor} stopOpacity="0" />
          <stop offset="30%" stopColor={gradientStartColor} stopOpacity="1" />
          <stop offset="70%" stopColor={gradientStopColor} stopOpacity="1" />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </linearGradient>
        <filter id={`beam-glow-${delay}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Gradient for the traveling dot */}
        <radialGradient id={`dot-gradient-${delay}`}>
          <stop offset="0%" stopColor={gradientStopColor} stopOpacity="1" />
          <stop offset="50%" stopColor={gradientStartColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={gradientStartColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background path (subtle) */}
      <path
        d={pathD}
        fill="none"
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />

      {/* Animated gradient line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={`url(#beam-gradient-${delay})`}
        strokeWidth={pathWidth + 2}
        strokeLinecap="round"
        filter={`url(#beam-glow-${delay})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
        transition={{
          pathLength: {
            duration,
            delay,
            repeat: Infinity,
            repeatDelay: 0.5,
            ease: "easeInOut",
          },
          opacity: {
            duration: duration * 0.8,
            delay,
            repeat: Infinity,
            repeatDelay: 0.7,
            times: [0, 0.2, 0.8, 1],
            ease: "easeInOut",
          },
        }}
      />

      {/* Traveling dot */}
      <motion.circle
        r="6"
        fill={`url(#dot-gradient-${delay})`}
        filter={`url(#beam-glow-${delay})`}
        initial={{ offsetDistance: "0%", opacity: 0 }}
        animate={{ 
          offsetDistance: "100%", 
          opacity: [0, 1, 1, 0]
        }}
        transition={{
          offsetDistance: {
            duration,
            delay,
            repeat: Infinity,
            repeatDelay: 0.5,
            ease: "easeInOut",
          },
          opacity: {
            duration,
            delay,
            repeat: Infinity,
            repeatDelay: 0.5,
            times: [0, 0.1, 0.9, 1],
            ease: "easeInOut",
          },
        }}
      >
        <animateMotion
          dur={`${duration}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
          path={pathD}
          rotate="auto"
        />
      </motion.circle>
    </svg>
  )
}
