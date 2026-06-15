"use client"

import { useRef, useState, useEffect } from "react"
/* eslint-disable react-refresh/only-export-components */
import Link from "next/link"
import { motion, useSpring, useMotionValue } from "framer-motion"
import { Button } from "@/components/ui/button"

export function CursorGlow() {
  return null
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
  const buttonContent = (
    <>
      <span className="absolute inset-0 overflow-hidden rounded-md transition-all duration-300 group-hover:scale-[1.03] group-active:scale-[0.98]">
        <span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"
          style={{ animationDuration: "2.5s", animationIterationCount: "infinite" }}
        />
        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </span>
      <span className="relative z-10 flex items-center transition-transform duration-300 group-hover:translate-x-0.5">{children}</span>
    </>
  )
  return (
    <div className="relative inline-block group">
      {href ? (
        <Link href={href}>
          <Button size={size} className={`relative overflow-hidden transition-transform duration-300 hover:bg-[#0A0A0A] hover:text-white text-white ${className}`} {...props}>
            {buttonContent}
          </Button>
        </Link>
      ) : (
        <Button size={size} className={`relative overflow-hidden transition-transform duration-300 hover:bg-[#0A0A0A] hover:text-white text-white ${className}`} {...props}>
          {buttonContent}
        </Button>
      )}
    </div>
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
      className="relative text-sm text-white/70 hover:text-white transition-colors duration-300 py-1 group"
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
    <div className="relative h-px w-full max-w-5xl mx-auto opacity-50">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  )
}

export function SectionSkeleton() {
  return (
    <div className="w-full py-24 flex flex-col items-center justify-center space-y-6 animate-pulse">
      <div className="h-10 w-64 bg-muted/20 rounded-md"></div>
      <div className="h-4 w-96 bg-muted/20 rounded-md"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-12">
        <div className="h-64 bg-muted/10 rounded-xl"></div>
        <div className="h-64 bg-muted/10 rounded-xl"></div>
        <div className="h-64 bg-muted/10 rounded-xl"></div>
      </div>
    </div>
  )
}

