"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Brain, ChevronDown, FileCheck, Lock, Shield, Sparkles, Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShinyButton } from "./landing-utils"
import { useRotatingTypewriter } from "@/hooks/use-typewriter"
import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

function scrollToFeatures() {
  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
}

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"

// Interactive Demo Modal – with focus trap, Escape, exit animation, focus return
function DemoModal({ onClose, returnFocusRef }: { onClose: () => void; returnFocusRef?: React.RefObject<HTMLElement | null> }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const getFocusables = useCallback(() => {
    const el = panelRef.current
    if (!el) return []
    return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (node) => !node.hasAttribute("disabled") && node.getAttribute("aria-hidden") !== "true"
    )
  }, [])

  useEffect(() => {
    const focusables = getFocusables()
    const first = focusables[0]
    if (first) {
      requestAnimationFrame(() => first.focus())
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        returnFocusRef?.current?.focus()
        onClose()
        return
      }
      if (e.key !== "Tab") return
      const list = getFocusables()
      if (list.length === 0) return
      const current = document.activeElement as HTMLElement | null
      const idx = list.indexOf(current as HTMLElement)
      if (idx === -1) return
      if (e.shiftKey) {
        if (idx === 0) {
          e.preventDefault()
          list[list.length - 1].focus()
        }
      } else {
        if (idx === list.length - 1) {
          e.preventDefault()
          list[0].focus()
        }
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onClose, getFocusables, returnFocusRef])

  const handleClose = useCallback(() => {
    returnFocusRef?.current?.focus()
    onClose()
  }, [onClose, returnFocusRef])

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-modal-title"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/40 bg-white/60 backdrop-blur-[16px]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/50 backdrop-blur-sm border border-white/40 hover:bg-white/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/40 shadow-lg flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 id="demo-modal-title" className="text-2xl font-bold mb-2">Interactive Demo Coming Soon</h3>
            <p className="text-muted-foreground mb-6">Experience the full platform with our guided tour</p>
            <Link href="/signup">
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
      {/* Glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 blur-3xl scale-110"
        animate={{
          opacity: isHovered ? 0.6 : 0.4,
          scale: isHovered ? 1.15 : 1.1,
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Browser mockup - Liquid Glass */}
      <motion.div
        className="relative z-10 rounded-xl overflow-hidden border border-white/40 shadow-xl bg-white/60 backdrop-blur-[16px]"
        animate={{
          y: isHovered ? -8 : 0,
          scale: isHovered ? 1.01 : 1,
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Browser header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white/40 backdrop-blur-sm border-b border-white/30">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-3 py-1 rounded-md bg-white/50 backdrop-blur-sm text-[10px] text-muted-foreground border border-white/40">
              app.aynplatform.com
            </div>
          </div>
        </div>

        {/* Demo content */}
        <div className="relative aspect-[16/10] bg-white/30 backdrop-blur-sm p-6">
          <div className="grid grid-cols-3 gap-4 h-full">
            {/* Sidebar mock */}
            <div className="col-span-1 space-y-3">
              <div className="h-8 w-8 rounded-lg bg-white/60 border border-white/40 shadow-sm flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">A</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full rounded bg-muted/60" />
                <div className="h-2 w-3/4 rounded bg-muted/50" />
                <div className="h-2 w-1/2 rounded bg-muted/40" />
              </div>
            </div>
            {/* Main content mock */}
            <div className="col-span-2 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 h-16 rounded-lg bg-white/60 border border-white/40 shadow-sm p-3">
                  <div className="h-2 w-12 rounded bg-muted/60 mb-2" />
                  <div className="h-4 w-8 rounded bg-primary/20" />
                </div>
                <div className="flex-1 h-16 rounded-lg bg-white/60 border border-white/40 shadow-sm p-3">
                  <div className="h-2 w-12 rounded bg-muted/60 mb-2" />
                  <div className="h-4 w-8 rounded bg-emerald-500/20" />
                </div>
              </div>
              <div className="h-32 rounded-lg bg-white/60 border border-white/40 shadow-sm p-4">
                <div className="h-2 w-24 rounded bg-muted/50 mb-4" />
                <div className="flex items-end gap-2 h-16">
                  <div className="flex-1 h-8 rounded-t bg-primary/30" />
                  <div className="flex-1 h-12 rounded-t bg-primary/50" />
                  <div className="flex-1 h-10 rounded-t bg-primary/40" />
                </div>
              </div>
            </div>
          </div>

          {/* Play button overlay */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px]"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-white/60 border-2 border-white/40 backdrop-blur-sm flex items-center justify-center shadow-lg"
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Play className="w-6 h-6 text-primary ml-1 fill-primary" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}


export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false)
  const demoTriggerRef = useRef<HTMLDivElement>(null)

  const { displayedText } = useRotatingTypewriter({
    texts: [
      "Ask me about quality compliance",
      "Upload evidence, I'll organize it",
      "Generate reports on demand",
    ],
    typingSpeed: 60,
    deletingSpeed: 40,
    pauseAtEnd: 2000,
  })

  return (
    <>
      <section id="main-content" className="relative min-h-[85vh] flex items-center overflow-hidden pt-24 pb-[var(--spacing-section)]">
        {/* Seamless gradient fading into next section — no hard edge */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/0 pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-[var(--spacing-content)]">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">

              {/* Brand label above headline */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-3 flex items-center justify-center lg:justify-start gap-2"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-[0.15em]">
                  <Sparkles className="w-3 h-3" />
                  Ayn
                </span>
              </motion.div>

              {/* Main headline */}
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-5 tracking-tight leading-[1.1]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
              >
                Your Eye on Every
                <br />
                <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                  Quality Standard.
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-base md:text-lg text-muted-foreground mb-5 max-w-lg mx-auto lg:mx-0 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                AI-powered compliance platform that maps your evidence to ISO, NCAAA, and global frameworks — instantly.
              </motion.p>

              {/* Typewriter hint */}
              <motion.div
                className="h-7 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                <span className="text-sm text-[var(--brand)] font-medium">
                  {displayedText}
                  <span className="inline-block w-[2px] h-4 bg-[var(--brand)] ml-0.5 animate-pulse" />
                </span>
              </motion.div>

              {/* CTAs */}
              <motion.div
                className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <ShinyButton
                  href="/signup"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 px-8 py-6 text-base font-bold w-full sm:w-auto min-h-[44px] shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-glow-hover)]"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </ShinyButton>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={scrollToFeatures}
                  className="border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-300 px-8 py-6 text-base font-medium bg-transparent w-full sm:w-auto min-h-[44px]"
                >
                  Explore Platform
                </Button>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-muted-foreground/70"
              >
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-primary" />
                  <span>Conversational AI</span>
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Quality Standards Support</span>
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span>Framework Ready</span>
                </div>
              </motion.div>
            </div>

            {/* Interactive Demo Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div
                ref={demoTriggerRef}
                tabIndex={0}
                role="button"
                aria-label="Open interactive demo modal"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setDemoOpen(true)
                  }
                }}
              >
                <InteractiveDemoPreview onClick={() => setDemoOpen(true)} />
              </div>
            </motion.div>

            {/* Mobile fallback */}
            <div className="relative flex md:hidden justify-center mt-4">
              <Link
                href="/signup"
                className="flex flex-col items-center justify-center gap-3 w-full max-w-xs py-8 px-6 rounded-2xl border border-white/40 bg-white/60 backdrop-blur-[16px] shadow-lg hover:border-primary/40 transition-all min-h-[44px]"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-primary/80" />
                </div>
                <span className="text-sm font-medium text-foreground">Get Started Free</span>
                <span className="text-xs text-muted-foreground">Try the platform today</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
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

      {/* Demo Modal */}
      <AnimatePresence mode="wait">
        {demoOpen && (
          <DemoModal
            key="demo-modal"
            onClose={() => setDemoOpen(false)}
            returnFocusRef={demoTriggerRef}
          />
        )}
      </AnimatePresence>
    </>
  )
}
