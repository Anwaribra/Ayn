"use client"

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ScrollDrivenExpansionProps {
  children: ReactNode
  className?: string
  bgMatchClass?: string
}

export function ScrollDrivenExpansion({ children, className, bgMatchClass = "bg-white" }: ScrollDrivenExpansionProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "start start"],
  })

  // Scrub values based on scroll progress
  const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1])
  const borderRadius = useTransform(scrollYProgress, [0, 1], ["48px", "0px"])

  return (
    <div className={cn("relative", bgMatchClass)}>
      {/* 
        The containerRef is attached to a wrapper so we track when this 
        section enters the viewport and reaches the top.
      */}
      <div ref={containerRef}>
        <motion.div
          style={{
            scale,
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            transformOrigin: "top center"
          }}
          className={cn("overflow-hidden shadow-2xl relative", className)}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
