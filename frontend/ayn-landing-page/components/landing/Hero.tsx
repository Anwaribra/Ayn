"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ChevronDown, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShinyButton } from "./landing-utils"
import { useState, useRef, useCallback, useEffect } from "react"

const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false })

function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [breakpoint])
  return isMobile
}

function StaticHeroBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Primary radial glow */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          top: "10%",
          right: "-10%",
          background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(37,99,235,0.05) 40%, transparent 70%)",
        }}
      />
      {/* Secondary accent glow */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          bottom: "5%",
          right: "5%",
          background: "radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 60%)",
        }}
      />
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Floating orbs */}
      <motion.div
        className="absolute w-3 h-3 rounded-full bg-primary/30"
        style={{ top: "25%", right: "20%" }}
        animate={{ y: [0, -15, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-cyan-400/25"
        style={{ top: "55%", right: "30%" }}
        animate={{ y: [0, 12, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute w-2.5 h-2.5 rounded-full bg-blue-300/20"
        style={{ top: "40%", right: "12%" }}
        animate={{ y: [0, -10, 0], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
    </div>
  )
}

/**
 * Hero background — must match the Spline scene's own bg.
 * Also injected into <html>/<body> in layout.tsx to prevent white flash.
 */
const BG = "#050810"

function scrollToFeatures() {
  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
}

const FOCUSABLE = "button,[href],input,select,textarea,[tabindex]:not([tabindex='-1'])"

function DemoModal({
  onClose,
  returnFocusRef,
}: {
  onClose: () => void
  returnFocusRef?: React.RefObject<HTMLElement | null>
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const getFocusables = useCallback(() => {
    const el = panelRef.current
    if (!el) return []
    return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (n) => !n.hasAttribute("disabled") && n.getAttribute("aria-hidden") !== "true"
    )
  }, [])
  useEffect(() => {
    const list = getFocusables()
    if (list[0]) requestAnimationFrame(() => list[0].focus())
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { returnFocusRef?.current?.focus(); onClose(); return }
      if (e.key !== "Tab") return
      const all = getFocusables()
      const idx = all.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey && idx === 0) { e.preventDefault(); all[all.length - 1].focus() }
      else if (!e.shiftKey && idx === all.length - 1) { e.preventDefault(); all[0].focus() }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose, getFocusables, returnFocusRef])
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="glass-overlay-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => { returnFocusRef?.current?.focus(); onClose() }}
    >
      <motion.div
        ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="demo-title"
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className="glass-surface-strong glass-text-primary relative w-full max-w-lg rounded-2xl p-10 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { returnFocusRef?.current?.focus(); onClose() }}
          className="glass-button absolute top-4 right-4 rounded-full p-2"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-white" />
        </button>
        <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h3 id="demo-title" className="text-xl font-bold mb-2 text-white">Demo Coming Soon</h3>
        <p className="text-white/60 mb-6 text-sm">Experience the full Ayn platform</p>
        <Link href="/signup"><Button className="gap-2">Try Now <ArrowRight className="w-4 h-4" /></Button></Link>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   HERO — dark rounded card
   Changes from previous version:
   • Removed "AYN" badge (kept "Full Agent Mode" only)
   • Discover moved into text flow (not separate at bottom)
   • Veil extended to 80% so animation reveals more on the right
   • Removed bottom fade — clean edge matches the white page gap
   • Spline offset via translateX to push scene further right
═══════════════════════════════════════════════════════ */
export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false)
  const demoRef    = useRef<HTMLDivElement>(null)
  const isMobile   = useIsMobile()

  return (
    <>
      <section
        id="main-content"
        className="relative flex min-h-screen overflow-hidden"
        style={{ backgroundColor: BG }}
      >
        {/* Subtle blue ambient glow */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 55% 55% at 5% 55%, rgba(37,99,235,0.07) 0%, transparent 70%)`,
          }}
        />

        {isMobile ? (
          <StaticHeroBackground />
        ) : (
          <>
            {/* ════ SPLINE — desktop only ════ */}
            <div
              className="absolute inset-0 z-0"
              style={{
                pointerEvents: "none",
                transform: "translateX(12%)",
              }}
            >
              <Spline
                scene="https://prod.spline.design/aysDxqUIU16cNzmO/scene.splinecode"
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </div>

            {/* ════ LEFT VEIL — desktop only ════ */}
            <div
              className="absolute inset-y-0 left-0 z-10 pointer-events-none"
              style={{
                width: "80%",
                background: `linear-gradient(to right, ${BG} 0%, ${BG} 50%, transparent 100%)`,
              }}
            />
          </>
        )}

        {/* ════ TEXT CONTENT ════ */}
        <div className="relative z-30 flex flex-col justify-center items-start w-full lg:w-1/2 px-6 sm:px-8 lg:px-16 xl:px-24 pt-24 pb-20">

          {/* Badge — only "Full Agent Mode", removed "AYN" */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Full Agent Mode
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.08] mb-6 flex flex-wrap gap-x-3"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}
          >
            <span className="text-white">Your Eye on Every</span>
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent pb-2">
              Standard.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg text-white/60 mb-8 leading-relaxed max-w-md"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}
          >
            Map evidence to ISO, NCAAA, and global frameworks, then run guided compliance actions from the same AI workflow.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 mb-10"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.28 }}
          >
            <ShinyButton
              href="/signup"
              className="bg-primary text-white px-8 py-5 text-base font-bold shadow-[0_0_24px_rgba(59,111,217,0.4)] hover:shadow-[0_0_36px_rgba(59,111,217,0.6)] hover:bg-primary/90 transition-all w-full sm:w-auto"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </ShinyButton>
            <Button
              size="lg" variant="outline" onClick={scrollToFeatures}
              className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/30 px-8 py-5 text-base font-medium bg-transparent w-full sm:w-auto transition-all"
            >
              Explore Platform
            </Button>
          </motion.div>

          {/* Discover — inline in text flow (not at very bottom) */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
          >
            <button
              onClick={scrollToFeatures}
              className="flex items-center gap-2 text-white/35 hover:text-white/60 transition-colors text-xs uppercase tracking-widest"
              aria-label="Scroll to features"
            >
              Discover <ChevronDown className="w-4 h-4 animate-bounce" />
            </button>
          </motion.div>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {demoOpen && <DemoModal key="demo" onClose={() => setDemoOpen(false)} returnFocusRef={demoRef} />}
      </AnimatePresence>
    </>
  )
}
