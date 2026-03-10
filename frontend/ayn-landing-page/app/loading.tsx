"use client"

import { motion } from "framer-motion"
import { AynLogo } from "@/components/ayn-logo"

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="flex flex-col items-center relative"
      >
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <AynLogo size="lg" withGlow={true} />
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="mt-6 flex items-center gap-2 text-sm font-semibold tracking-widest uppercase text-muted-foreground"
        >
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
          Initializing Workspace
        </motion.div>
      </motion.div>
    </div>
  )
}
