"use client"

import { motion } from "framer-motion"

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Deep Base Background */}
      <div className="absolute inset-0 bg-[#05070A] dark:bg-[#020408]" />

      {/* Orb 1: Primary Blue/Indigo */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen"
      />

      {/* Orb 2: Teal/Emerald */}
      <motion.div
        animate={{
          x: [0, -50, 0],
          y: [0, 100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-teal-600/10 rounded-full blur-[140px] mix-blend-screen"
      />

      {/* Orb 3: Violet Accent */}
      <motion.div
        animate={{
          x: [0, 50, -50, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
        className="absolute top-[30%] left-[30%] w-[30vw] h-[30vw] bg-violet-600/15 rounded-full blur-[100px] mix-blend-screen"
      />

      {/* Noise Overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
    </div>
  )
}
