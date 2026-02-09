"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react"

interface TimelineItem {
  id: string
  title: string
  description?: string
  date?: string
  status: "completed" | "current" | "upcoming" | "error"
  icon?: React.ReactNode
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    className: "bg-emerald-500 text-white border-emerald-500",
    lineClassName: "bg-emerald-500",
    textClassName: "text-emerald-600",
  },
  current: {
    icon: Circle,
    className: "bg-primary text-primary-foreground border-primary ring-4 ring-primary/20",
    lineClassName: "bg-gradient-to-b from-primary to-border",
    textClassName: "text-primary",
  },
  upcoming: {
    icon: Circle,
    className: "bg-muted text-muted-foreground border-border",
    lineClassName: "bg-border",
    textClassName: "text-muted-foreground",
  },
  error: {
    icon: AlertCircle,
    className: "bg-red-500 text-white border-red-500",
    lineClassName: "bg-red-500",
    textClassName: "text-red-500",
  },
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {items.map((item, index) => {
        const config = statusConfig[item.status]
        const Icon = config.icon
        const isLast = index === items.length - 1

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-4 pb-8 last:pb-0"
          >
            {/* Line */}
            {!isLast && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                className={cn(
                  "absolute left-5 top-10 w-0.5 origin-top",
                  config.lineClassName
                )}
                style={{ height: "calc(100% - 2.5rem)" }}
              />
            )}

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                delay: index * 0.1,
              }}
              className={cn(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                config.className
              )}
            >
              {item.icon || <Icon className="h-5 w-5" />}
            </motion.div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.1 }}
              >
                <h4
                  className={cn(
                    "text-sm font-semibold",
                    item.status === "upcoming" ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {item.title}
                </h4>
                {item.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
                {item.date && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {item.date}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Horizontal timeline variant
interface HorizontalTimelineProps {
  items: TimelineItem[]
  className?: string
}

export function HorizontalTimeline({ items, className }: HorizontalTimelineProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-start justify-between">
        {items.map((item, index) => {
          const config = statusConfig[item.status]
          const Icon = config.icon
          const isLast = index === items.length - 1

          return (
            <div key={item.id} className="relative flex flex-1 flex-col items-center">
              {/* Line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-1/2 top-5 h-0.5 w-full",
                    item.status === "completed" ? "bg-emerald-500" : "bg-border"
                  )}
                />
              )}

              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  delay: index * 0.1,
                }}
                className={cn(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2",
                  config.className
                )}
              >
                {item.icon || <Icon className="h-5 w-5" />}
              </motion.div>

              {/* Content */}
              <div className="mt-3 text-center">
                <p
                  className={cn(
                    "text-xs font-medium",
                    item.status === "upcoming" ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {item.title}
                </p>
                {item.description && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Radial/Orbital Timeline (circular layout)
interface OrbitalTimelineProps {
  items: TimelineItem[]
  centerContent?: React.ReactNode
  className?: string
}

export function OrbitalTimeline({ items, centerContent, className }: OrbitalTimelineProps) {
  const radius = 120
  const center = { x: 160, y: 160 }

  return (
    <div className={cn("relative h-80 w-80", className)}>
      {/* Orbital rings */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 320">
        {/* Outer ring */}
        <circle
          cx={center.x}
          cy={center.y}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="opacity-50"
        />
        
        {/* Progress ring */}
        <motion.circle
          cx={center.x}
          cy={center.y}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: items.filter((i) => i.status === "completed").length / items.length }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: `${2 * Math.PI * radius}`,
            transform: "rotate(-90deg)",
            transformOrigin: "center",
          }}
        />
      </svg>

      {/* Center content */}
      {centerContent && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {centerContent}
        </div>
      )}

      {/* Orbital nodes */}
      {items.map((item, index) => {
        const angle = (index / items.length) * 2 * Math.PI - Math.PI / 2
        const x = center.x + radius * Math.cos(angle)
        const y = center.y + radius * Math.sin(angle)
        const config = statusConfig[item.status]
        const Icon = config.icon

        return (
          <motion.div
            key={item.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1, type: "spring" }}
            className="absolute"
            style={{
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg",
                config.className
              )}
            >
              {item.icon || <Icon className="h-5 w-5" />}
            </div>
            
            {/* Tooltip label */}
            <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-center">
              <p className="text-xs font-medium">{item.title}</p>
              <p className="text-[10px] text-muted-foreground">{item.description}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
