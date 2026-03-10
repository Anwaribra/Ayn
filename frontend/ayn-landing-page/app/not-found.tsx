"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AynLogo } from "@/components/ayn-logo"
import { FileQuestion, Home, Play } from "lucide-react"
import { motion } from "framer-motion"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center text-center max-w-md relative z-10 p-10 rounded-3xl glass-card backdrop-blur-xl border border-white/10 dark:border-white/5 shadow-2xl"
      >
        <AynLogo size="lg" withGlow={true} className="mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
        
        <div className="relative mb-6">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-2xl bg-destructive/10 p-4 border border-destructive/20"
          >
            <FileQuestion className="w-12 h-12 text-destructive drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" aria-hidden />
          </motion.div>
          <span className="absolute -top-2 -right-2 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-destructive"></span>
          </span>
        </div>
        
        <h1 className="text-3xl font-black text-foreground mb-3 tracking-tight">System Out of Bounds</h1>
        <p className="text-muted-foreground mb-8 text-sm font-medium leading-relaxed">
          The requested coordinate doesn't exist within the Ayn intelligence matrix. It may have been relocated or archived.
        </p>

        <div className="flex flex-wrap gap-4 justify-center w-full">
          <Button asChild variant="default" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 rounded-xl h-12">
            <Link href="/platform/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 border-border/50 bg-background/50 hover:bg-accent hover:text-foreground font-bold rounded-xl h-12 glass-panel transition-all">
            <Link href="/login">
              <Play className="w-4 h-4 mr-2" />
              View Demo
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
