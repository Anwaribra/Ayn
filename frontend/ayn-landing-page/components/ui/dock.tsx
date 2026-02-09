"use client"

import { useState, useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface DockItem {
  id: string
  icon: React.ReactNode
  label: string
  href: string
  shortcut?: string
}

interface DockProps {
  items: DockItem[]
  className?: string
  position?: "bottom" | "left" | "right"
}

function DockIcon({
  icon,
  label,
  isActive,
  mouseX,
}: {
  icon: React.ReactNode
  label: string
  isActive: boolean
  mouseX: ReturnType<typeof useMotionValue<number>>
}) {
  const ref = useRef<HTMLDivElement>(null)

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const widthSync = useTransform(distance, [-150, 0, 150], [48, 80, 48])
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 })

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className="relative flex flex-col items-center gap-2"
    >
      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
      >
        <div className="rounded-lg bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-lg border">
          {label}
        </div>
      </motion.div>

      {/* Icon Container */}
      <div
        className={cn(
          "flex h-12 w-full items-center justify-center rounded-2xl transition-all duration-300",
          "bg-card/80 backdrop-blur-xl border border-border/50",
          "hover:bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
          isActive && "bg-primary/10 border-primary/50 text-primary shadow-lg shadow-primary/20"
        )}
      >
        <div className="flex h-6 w-6 items-center justify-center">
          {icon}
        </div>
      </div>

      {/* Active indicator dot */}
      {isActive && (
        <motion.div
          layoutId="dock-dot"
          className="h-1.5 w-1.5 rounded-full bg-primary"
        />
      )}
    </motion.div>
  )
}

export function Dock({ items, className, position = "bottom" }: DockProps) {
  const mouseX = useMotionValue(0)
  const pathname = usePathname()

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
      className={cn(
        "fixed z-50",
        position === "bottom" && "bottom-6 left-1/2 -translate-x-1/2",
        className
      )}
    >
      {/* Glassmorphism container */}
      <div
        className={cn(
          "flex items-end gap-3 rounded-3xl p-3",
          "bg-background/60 backdrop-blur-2xl",
          "border border-border/30 shadow-2xl shadow-black/10"
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {items.map((item) => (
          <Link key={item.id} href={item.href} className="relative">
            <DockIcon
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
              mouseX={mouseX}
            />
          </Link>
        ))}
      </div>
    </motion.div>
  )
}

// Smaller floating dock for quick actions
interface FloatingDockProps {
  items: DockItem[]
  className?: string
}

export function FloatingDock({ items, className }: FloatingDockProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const pathname = usePathname()

  return (
    <motion.div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3",
        className
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8 }}
    >
      {/* Expandable menu items */}
      <motion.div
        className="flex flex-col gap-2"
        animate={{ 
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        initial={false}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {items.slice(0, -1).map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: isExpanded ? 1 : 0,
              opacity: isExpanded ? 1 : 0,
              y: isExpanded ? 0 : 20,
            }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={item.href}>
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  "bg-card/90 backdrop-blur-sm border border-border/50",
                  "shadow-lg hover:shadow-xl hover:border-primary/50 transition-all",
                  pathname === item.href && "bg-primary/10 border-primary text-primary"
                )}
                title={item.label}
              >
                {item.icon}
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Main toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
          "hover:shadow-xl hover:shadow-primary/40 transition-shadow"
        )}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {items[items.length - 1]?.icon}
        </motion.div>
      </motion.button>
    </motion.div>
  )
}
