"use client"

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FadeUpProps {
  children: ReactNode
  delay?: number
  className?: string
  width?: "fit-content" | "100%" | "auto"
  duration?: number
  amount?: "some" | "all" | number
  yOffset?: number
}

// Fade up for a single element
export function FadeUp({
  children,
  delay = 0,
  className,
  width = "auto",
  duration = 0.5,
  amount = 0.2,
  yOffset = 30
}: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={cn(className)}
      style={{ width }}
    >
      {children}
    </motion.div>
  )
}

// Stagger container for lists or grids
interface StaggerContainerProps {
  children: ReactNode
  className?: string
  delayChildren?: number
  staggerChildren?: number
  amount?: "some" | "all" | number
}

export function StaggerContainer({
  children,
  className,
  delayChildren = 0.1,
  staggerChildren = 0.1,
  amount = 0.2
}: StaggerContainerProps) {
  const variants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren,
        delayChildren
      }
    }
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

// Stagger item
interface StaggerItemProps {
  children: ReactNode
  className?: string
  yOffset?: number
  duration?: number
}

export function StaggerItem({
  children,
  className,
  yOffset = 30,
  duration = 0.5
}: StaggerItemProps) {
  const variants: Variants = {
    hidden: { opacity: 0, y: yOffset },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration, ease: [0.25, 0.4, 0.25, 1] }
    }
  }

  return (
    <motion.div variants={variants} className={cn(className)}>
      {children}
    </motion.div>
  )
}
