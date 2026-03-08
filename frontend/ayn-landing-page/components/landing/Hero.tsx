"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ChevronDown, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShinyButton } from "./landing-utils"
import { useState, useRef, useCallback, useEffect } from "react"

const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false })

/**
 * Hero background — must match the Spline scene's own bg.
 * Also injected into <html>/<body> in layout.tsx to prevent white flash.
 */
const BG = "#050810"

/** Phrases that cycle in the typewriter headline */
const HEADLINE_PHRASES = [
  "Quality Standard.",
  "Compliance Gap.",
  "ISO Criterion.",
  "NCAAA Indicator.",
]

/** Simple character-by-character typewriter hook */
function useTypewriter(phrases: string[], typingMs = 55, pauseMs = 2200, erasingMs = 30) {
  const [displayed, setDisplayed]   = useState("")
  const [phraseIdx, setPhraseIdx]   = useState(0)
  const [charIdx,   setCharIdx]     = useState(0)
  const [erasing,   setErasing]     = useState(false)

  useEffect(() => {
    const phrase = phrases[phraseIdx]
    let timer: ReturnType<typeof setTimeout>

    if (!erasing) {
      if (charIdx < phrase.length) {
        timer = setTimeout(() => setCharIdx((c) => c + 1), typingMs)
      } else {
        timer = setTimeout(() => setErasing(true), pauseMs)
      }
    } else {
      if (charIdx > 0) {
        timer = setTimeout(() => setCharIdx((c) => c - 1), erasingMs)
      } else {
        setErasing(false)
        setPhraseIdx((i) => (i + 1) % phrases.length)
      }
    }

    setDisplayed(phrase.slice(0, charIdx))
    return () => clearTimeout(timer)
  }, [charIdx, erasing, phraseIdx, phrases, typingMs, pauseMs, erasingMs])

  return displayed
}

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => { returnFocusRef?.current?.focus(); onClose() }}
    >
      <motion.div
        ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="demo-title"
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className="relative w-full max-w-lg rounded-2xl p-10 text-center shadow-2xl border border-white/10"
        style={{ background: "rgba(5,8,16,0.95)", backdropFilter: "blur(20px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { returnFocusRef?.current?.focus(); onClose() }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20"
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
  const typedText  = useTypewriter(HEADLINE_PHRASES)

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

        {/* ════ SPLINE — pushed further right via translateX ════ */}
        <div
          className="absolute inset-0 z-0"
          style={{
            pointerEvents: "none",
            transform: "translateX(12%)", /* shift scene right */
          }}
        >
          <Spline
            scene="https://prod.spline.design/aysDxqUIU16cNzmO/scene.splinecode"
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>

        {/* ════ LEFT VEIL — wider (80%) so more animation shows on right ════ */}
        <div
          className="absolute inset-y-0 left-0 z-10 pointer-events-none"
          style={{
            width: "80%",
            background: `linear-gradient(to right, ${BG} 0%, ${BG} 50%, transparent 100%)`,
          }}
        />

        {/* ════ TEXT CONTENT ════ */}
        <div className="relative z-30 flex flex-col justify-center w-full lg:w-1/2 px-8 lg:px-16 xl:px-24 pt-24 pb-20">

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
            className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.08] mb-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}
          >
            <span className="text-white">Your Eye on Every</span>
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent min-h-[1.1em]">
              {typedText}
              {/* blinking cursor */}
              <span
                className="inline-block w-[3px] h-[0.85em] bg-blue-400 ml-1 align-middle"
                style={{ animation: "blink 1s step-end infinite" }}
              />
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
