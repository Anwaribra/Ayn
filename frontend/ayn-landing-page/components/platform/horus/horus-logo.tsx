"use client"

import { motion } from "framer-motion"

interface HorusLogoProps {
  size?: number
  animate?: boolean
  className?: string
}

export function HorusLogo({ size = 48, animate = false, className = "" }: HorusLogoProps) {
  const LogoSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Main gradient - purple to cyan */}
        <linearGradient id="horusGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        
        {/* Glow gradient */}
        <linearGradient id="glowGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
        </linearGradient>
        
        {/* Shadow */}
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#8b5cf6" floodOpacity="0.3" />
        </filter>
      </defs>
      
      {/* Background circle (optional, for contrast on light theme) */}
      <circle cx="60" cy="60" r="56" fill="white" stroke="url(#horusGradient)" strokeWidth="2" />
      
      {/* The H with arrow */}
      <g transform="translate(20, 20)" filter="url(#shadow)">
        {/* Left vertical bar of H */}
        <rect x="8" y="10" width="16" height="60" rx="4" fill="url(#horusGradient)" />
        
        {/* Right vertical bar of H (shorter) */}
        <rect x="56" y="30" width="16" height="40" rx="4" fill="url(#horusGradient)" />
        
        {/* The arrow curve connecting them */}
        <path
          d="M24 38 C24 38, 32 20, 56 20 L72 20 L72 36 L56 36 C40 36, 40 54, 56 54 L72 54"
          stroke="url(#horusGradient)"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Arrow head */}
        <path
          d="M56 42 L80 24 L80 60 Z"
          fill="url(#horusGradient)"
        />
      </g>
    </svg>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        whileHover={{ scale: 1.05 }}
        className="relative"
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl"
          style={{ 
            background: "linear-gradient(135deg, rgba(139,92,246,0.4) 0%, rgba(34,211,238,0.4) 100%)" 
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <div className="relative">{LogoSvg}</div>
      </motion.div>
    )
  }

  return LogoSvg
}

// Smaller version for inline use
export function HorusLogoSmall({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="horusGradientSmall" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <g transform="translate(20, 20)">
        <rect x="8" y="10" width="16" height="60" rx="4" fill="url(#horusGradientSmall)" />
        <rect x="56" y="30" width="16" height="40" rx="4" fill="url(#horusGradientSmall)" />
        <path
          d="M24 38 C24 38, 32 20, 56 20 L72 20 L72 36 L56 36 C40 36, 40 54, 56 54 L72 54"
          stroke="url(#horusGradientSmall)"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M56 42 L80 24 L80 60 Z" fill="url(#horusGradientSmall)" />
      </g>
    </svg>
  )
}
