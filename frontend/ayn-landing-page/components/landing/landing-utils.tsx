"use client"

import { useRef, useState, useEffect } from "react"
/* eslint-disable react-refresh/only-export-components */
import Link from "next/link"
import { motion, useSpring, useMotionValue } from "framer-motion"
import { Button } from "@/components/ui/button"

export function CursorGlow() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
      setIsVisible(true)
    }
    const handleLeave = () => setIsVisible(false)
    window.addEventListener("mousemove", handleMouse)
    window.addEventListener("mouseleave", handleLeave)
    return () => {
      window.removeEventListener("mousemove", handleMouse)
      window.removeEventListener("mouseleave", handleLeave)
    }
  }, [])

  return (
    <motion.div
      className="fixed w-[600px] h-[600px] rounded-full pointer-events-none z-0"
      style={{
        background:
          "radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(120,120,120,0.02) 30%, transparent 70%)",
      }}
      animate={{
        x: mousePos.x - 300,
        y: mousePos.y - 300,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.5 }}
    />
  )
}

export function SplitText({
  text,
  className = "",
  delay = 0,
}: {
  text: string
  className?: string
  delay?: number
}) {
  const words = text.split(" ")
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.6,
            delay: delay + i * 0.08,
            ease: [0.25, 0.4, 0.25, 1],
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

export function MagneticButton({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof Button>) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.15)
    y.set((e.clientY - centerY) * 0.15)
  }
  const handleLeave = () => {
    x.set(0)
    y.set(0)
  }
  const springConfig = { stiffness: 150, damping: 15 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)
  return (
    <motion.div
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
    >
      <Button ref={ref} className={className} {...props}>
        {children}
      </Button>
    </motion.div>
  )
}

export function ShinyButton({
  children,
  className = "",
  href,
  size = "lg",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "asChild"> & { href?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.15)
    y.set((e.clientY - centerY) * 0.15)
  }
  const handleLeave = () => {
    x.set(0)
    y.set(0)
  }
  const springConfig = { stiffness: 150, damping: 15 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)
  const buttonContent = (
    <>
      <span className="absolute inset-0 overflow-hidden rounded-md">
        <span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"
          style={{ animationDuration: "2s", animationIterationCount: "infinite" }}
        />
      </span>
      <span className="relative z-10 flex items-center">{children}</span>
    </>
  )
  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className="relative inline-block"
    >
      {href ? (
        <Link href={href}>
          <Button size={size} className={`relative overflow-hidden ${className}`} {...props}>
            {buttonContent}
          </Button>
        </Link>
      ) : (
        <Button size={size} className={`relative overflow-hidden ${className}`} {...props}>
          {buttonContent}
        </Button>
      )}
    </motion.div>
  )
}

export function NavLink({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith("#")) {
      e.preventDefault()
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" })
    }
    onClick?.()
  }
  return (
    <Link
      href={href}
      onClick={handleClick}
      className="relative text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 py-1 group"
    >
      {children}
      <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gradient-to-r from-blue-400 to-sky-300 group-hover:w-full transition-all duration-300" />
    </Link>
  )
}

export const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] },
  },
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

export function SectionDivider() {
  return (
    <div className="relative h-px">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  )
}
