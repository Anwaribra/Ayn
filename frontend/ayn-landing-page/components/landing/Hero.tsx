"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Brain, ChevronDown, FileCheck, Lock, Shield, Sparkles, Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShinyButton } from "./landing-utils"
import { useRotatingTypewriter } from "@/hooks/use-typewriter"
import { useState } from "react"
import { cn } from "@/lib/utils"

function scrollToFeatures() {
  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
}

// Interactive Demo Modal
function DemoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-5xl aspect-video bg-card rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-[var(--brand)]/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-[var(--brand)]" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Interactive Demo Coming Soon</h3>
            <p className="text-muted-foreground mb-6">Experience the full platform with our guided tour</p>
            <Link href="/login">
              <Button className="gap-2">
                Try Platform Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Interactive Demo Preview
function InteractiveDemoPreview({ onClick }: { onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="relative hidden md:block cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[var(--brand)]/20 via-primary/10 to-[var(--brand)]/20 blur-3xl scale-110"
        animate={{
          opacity: isHovered ? 0.8 : 0.5,
          scale: isHovered ? 1.15 : 1.1,
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Browser mockup */}
      <motion.div
        className="relative z-10 rounded-xl overflow-hidden border border-border/50 bg-card shadow-2xl"
        animate={{
          y: isHovered ? -8 : 0,
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Browser header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-3 py-1 rounded-md bg-background/50 text-[10px] text-muted-foreground">
              app.aynplatform.com
            </div>
          </div>
        </div>

        {/* Demo content */}
        <div className="relative aspect-[16/10] bg-gradient-to-br from-background to-muted/30 p-6">
          {/* Mock Dashboard UI */}
          <div className="grid grid-cols-3 gap-4 h-full">
            {/* Sidebar mock */}
            <div className="col-span-1 space-y-3">
              <div className="h-8 w-8 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center">
                <span className="text-sm font-bold text-[var(--brand)]">A</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full rounded bg-muted" />
                <div className="h-2 w-3/4 rounded bg-muted" />
                <div className="h-2 w-1/2 rounded bg-muted" />
              </div>
            </div>
            {/* Main content mock */}
            <div className="col-span-2 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 h-16 rounded-lg bg-card border border-border/50 p-3">
                  <div className="h-2 w-12 rounded bg-muted mb-2" />
                  <div className="h-4 w-8 rounded bg-[var(--brand)]/20" />
                </div>
                <div className="flex-1 h-16 rounded-lg bg-card border border-border/50 p-3">
                  <div className="h-2 w-12 rounded bg-muted mb-2" />
                  <div className="h-4 w-8 rounded bg-emerald-500/20" />
                </div>
              </div>
              <div className="h-32 rounded-lg bg-card border border-border/50 p-4">
                <div className="h-2 w-24 rounded bg-muted mb-4" />
                <div className="flex items-end gap-2 h-16">
                  <div className="flex-1 h-8 rounded-t bg-[var(--brand)]/30" />
                  <div className="flex-1 h-12 rounded-t bg-[var(--brand)]/50" />
                  <div className="flex-1 h-10 rounded-t bg-[var(--brand)]/40" />
                </div>
              </div>
            </div>
          </div>

          {/* Play button overlay */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[1px]"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-[var(--brand)] flex items-center justify-center shadow-lg"
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Play className="w-6 h-6 text-[var(--brand-foreground)] ml-1" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>


    </motion.div>
  )
}

// Floating Try Horus AI Button
function FloatingTryButton() {
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-40"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1.5, duration: 0.4 }}
    >
      <Link href="/platform/horus-ai">
        <motion.div
          className="group flex items-center gap-2 px-4 py-3 rounded-full bg-[var(--brand)] text-[var(--brand-foreground)] shadow-lg shadow-[var(--brand)]/20 hover:shadow-xl hover:shadow-[var(--brand)]/30 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
          <span className="text-sm font-medium">Try Horus AI</span>
          <motion.span
            className="text-xs opacity-70 hidden sm:inline"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 0.7 }}
            transition={{ delay: 2, duration: 0.3 }}
          >
            — Ask anything
          </motion.span>
        </motion.div>
      </Link>
    </motion.div>
  )
}

export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false)
  
  const { displayedText, currentText } = useRotatingTypewriter({
    texts: [
      "Streamline ISO 21001 compliance",
      "Achieve NAQAAE compliance",
      "AI-powered quality assurance",
    ],
    typingSpeed: 60,
    deletingSpeed: 40,
    pauseAtEnd: 2000,
  })

  return (
    <>
      <section id="main-content" className="relative min-h-[85vh] flex items-center overflow-hidden pt-24 pb-[var(--spacing-section)]">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,transparent_0%,hsl(var(--background))_70%)] pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-[var(--spacing-content)]">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              {/* Main headline */}
              <motion.h1 
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-block bg-gradient-to-r from-foreground via-foreground/95 to-primary/90 bg-clip-text text-transparent">
                  Ayn
                </span>
              </motion.h1>
              
              {/* Static subtitle */}
              <motion.h2 
                className="text-xl md:text-2xl font-medium mb-2 text-muted-foreground tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Your Education Quality & Compliance Platform
              </motion.h2>
              
              {/* Animated typewriter subtitle */}
              <motion.div
                className="h-8 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <span className="text-lg text-[var(--brand)] font-medium">
                  {displayedText}
                  <span className="inline-block w-[2px] h-5 bg-[var(--brand)] ml-0.5 animate-pulse" />
                </span>
              </motion.div>
              
              <motion.p 
                className="text-sm text-muted-foreground/80 mb-8 max-w-md mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Streamline ISO 21001 & NAQAAE compliance with AI analysis, evidence management, and automated workflows.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <ShinyButton
                  href="/login"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 px-6 py-5 text-sm font-medium w-full sm:w-auto"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </ShinyButton>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={scrollToFeatures}
                  className="border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-300 px-6 py-5 text-sm bg-transparent w-full sm:w-auto"
                >
                  See Features
                </Button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-muted-foreground/70"
              >
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span>ISO 21001</span>
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-primary" />
                  <span>NAQAAE</span>
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-primary" />
                  <span>AI Analysis</span>
                </div>
              </motion.div>
            </div>

            {/* Interactive Demo Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <InteractiveDemoPreview onClick={() => setDemoOpen(true)} />
            </motion.div>

            {/* Mobile fallback */}
            <div className="relative flex md:hidden justify-center mt-8">
              <Link
                href="/login"
                className="flex flex-col items-center justify-center gap-3 w-full max-w-xs py-8 px-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center">
                  <Lock className="w-7 h-7 text-primary/80" />
                </div>
                <span className="text-sm font-medium text-foreground">Get Started</span>
                <span className="text-xs text-muted-foreground">Try the platform today</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={scrollToFeatures}
            className="text-muted-foreground hover:text-foreground transition-colors flex flex-col items-center gap-2"
            aria-label="Scroll to features"
          >
            <span className="text-[10px] uppercase tracking-widest font-medium opacity-50">Discover</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </button>
        </div>
      </section>

      {/* Floating Try Horus AI Button */}
      <FloatingTryButton />

      {/* Demo Modal */}
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  )
}
