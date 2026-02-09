"use client"

import { motion } from "framer-motion"

interface HorusLogoProps {
  size?: number
  animate?: boolean
  className?: string
}

export function HorusLogo({ size = 80, animate = false, className = "" }: HorusLogoProps) {
  if (animate) {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        {/* Animated glow background */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{ 
            background: "linear-gradient(135deg, rgba(139,92,246,0.4) 0%, rgba(6,182,212,0.4) 100%)",
            filter: "blur(20px)"
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Logo container */}
        <motion.div 
          className="relative flex h-full w-full items-center justify-center rounded-2xl bg-white shadow-xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg
            width={size * 0.6}
            height={size * 0.6}
            viewBox="0 0 100 100"
            fill="none"
          >
            <defs>
              <linearGradient id="horusGrad" x1="0" y1="100" x2="100" y2="0">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            
            {/* H with arrow - simplified path */}
            <path
              d="M12 18 h16 v26 h28 v-26 h16 v64 h-16 v-26 h-28 v26 h-16 z"
              fill="url(#horusGrad)"
            />
            <path
              d="M56 32 l28 -14 v28 l-10 -5 v18 l-18 -10 z"
              fill="url(#horusGrad)"
            />
          </svg>
        </motion.div>
      </div>
    )
  }

  // Non-animated version
  return (
    <div 
      className={`flex items-center justify-center rounded-2xl bg-white shadow-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 100 100"
        fill="none"
      >
        <defs>
          <linearGradient id="horusGradStatic" x1="0" y1="100" x2="100" y2="0">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <path
          d="M12 18 h16 v26 h28 v-26 h16 v64 h-16 v-26 h-28 v26 h-16 z"
          fill="url(#horusGradStatic)"
        />
        <path
          d="M56 32 l28 -14 v28 l-10 -5 v18 l-18 -10 z"
          fill="url(#horusGradStatic)"
        />
      </svg>
    </div>
  )
}
