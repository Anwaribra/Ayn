"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

interface NumberTickerProps {
  value: number
  direction?: "up" | "down"
  delay?: number
  className?: string
  decimalPlaces?: number
  prefix?: string
  suffix?: string
  duration?: number
}

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  prefix = "",
  suffix = "",
  duration = 2,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const [hasAnimated, setHasAnimated] = useState(false)

  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  })

  const displayValue = useTransform(springValue, (latest) => {
    const factor = direction === "down" ? -1 : 1
    const num = latest * factor
    return num.toFixed(decimalPlaces)
  })

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timeout = setTimeout(() => {
        springValue.set(value)
        setHasAnimated(true)
      }, delay * 1000)
      return () => clearTimeout(timeout)
    }
  }, [isInView, hasAnimated, delay, springValue, value])

  return (
    <span ref={ref} className={cn("inline-flex items-center", className)}>
      {prefix && <span className="mr-0.5">{prefix}</span>}
      <motion.span>{displayValue}</motion.span>
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  )
}

// Animated counter with counting effect
interface AnimatedCounterProps {
  from?: number
  to: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
  decimalPlaces?: number
}

export function AnimatedCounter({
  from = 0,
  to,
  duration = 2,
  className,
  prefix = "",
  suffix = "",
  decimalPlaces = 0,
}: AnimatedCounterProps) {
  const nodeRef = useRef<HTMLSpanElement>(null)
  const isInView = useInView(nodeRef, { once: true, margin: "-50px" })
  const [count, setCount] = useState(from)

  useEffect(() => {
    if (!isInView) return

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      
      // Easing function (ease-out-expo)
      const easeOutExpo = 1 - Math.pow(2, -10 * progress)
      const currentValue = from + (to - from) * easeOutExpo
      
      setCount(currentValue)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [isInView, from, to, duration])

  return (
    <span ref={nodeRef} className={className}>
      {prefix}
      {count.toFixed(decimalPlaces)}
      {suffix}
    </span>
  )
}

// Stat card with number ticker
interface StatCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  decimalPlaces?: number
  icon?: React.ReactNode
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({
  title,
  value,
  prefix = "",
  suffix = "",
  decimalPlaces = 0,
  icon,
  description,
  trend,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-6",
        className
      )}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-500 hover:opacity-100" />
      
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight">
              <NumberTicker
                value={value}
                prefix={prefix}
                suffix={suffix}
                decimalPlaces={decimalPlaces}
                duration={2}
              />
            </h3>
          </div>
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>

        {trend && (
          <div className="mt-4 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                trend.isPositive
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-red-500/10 text-red-600"
              )}
            >
              {trend.isPositive ? "+" : "-"}
              {trend.value}%
            </span>
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
