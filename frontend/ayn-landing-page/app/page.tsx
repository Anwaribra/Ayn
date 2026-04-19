"use client"

import { useEffect } from "react"
import { motion }    from "framer-motion"
import { supabase }  from "@/lib/supabase"
import { api }       from "@/lib/api"
import { log }       from "@/lib/logger"

import { CursorGlow }              from "@/components/landing/landing-utils"
import { LandingNavbar }           from "@/components/landing/LandingNavbar"
import { Hero }                    from "@/components/landing/Hero"
import { StandardsStrip }          from "@/components/landing/StandardsStrip"
import { HorusIntelligenceSection} from "@/components/landing/HorusIntelligenceSection"
import { HowItWorksSection }       from "@/components/landing/HowItWorksSection"
import { AnalysisEngineFeatures }  from "@/components/landing/AnalysisEngineFeatures"
import { AboutSection }            from "@/components/landing/AboutSection"
import { PricingSection }           from "@/components/landing/PricingSection"
import { FinalCtaSection }         from "@/components/landing/FinalCtaSection"
import { LandingFooter }           from "@/components/landing/LandingFooter"
import { ScrollDrivenExpansion }   from "@/components/landing/scroll-driven-expansion"

/** Off-white page background */
const PAGE_BG = "#f5f5f3"

/**
 * Dark card colour — same as the Hero's Spline scene bg.
 * Shared by hero, core-features, and footer cards.
 */
const DARK_BG = "#050810"

/** Shared base style for every dark rounded card */
const darkCardBase: React.CSSProperties = {
  borderRadius: "1.75rem",
  overflow    : "hidden",
  backgroundColor: DARK_BG,
  boxShadow   : "0 10px 60px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.04)",
}

/**
 * Scroll-triggered reveal for dark cards.
 * Replaces the static motion.div reveal with strict scroll-driven 
 * scrubbed values using framer-motion useScroll and useTransform.
 */
function DarkCardReveal({ children }: { children: React.ReactNode }) {
  return (
    <ScrollDrivenExpansion bgMatchClass="bg-[#f5f5f3]" className="dark-card-base">
      <div style={darkCardBase}>
        {children}
      </div>
    </ScrollDrivenExpansion>
  )
}

export default function Home() {
  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) return
      log("[Home] Checking for Supabase session...")
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        try {
          await api.syncWithSupabase(session.access_token)
          await supabase.auth.signOut()
          window.location.href = "/platform/dashboard"
        } catch (err) {
          console.error("[Home] Sync failed:", err)
        }
      }
    }
    checkSession()
  }, [])

  return (
    <div style={{ backgroundColor: PAGE_BG, minHeight: "100vh" }}>

      {/* Skip-nav */}
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-lg outline-none focus:translate-y-0 focus:ring-2 focus:ring-primary transition-transform"
      >
        Skip to main content
      </a>

      <CursorGlow />
      <LandingNavbar />

      {/*
      ═══════════════════════════════════════════════════════════
        INVERSE LAYOUT
        Page bg = off-white.
        Three dark rounded cards: hero · core-features · footer.
        Everything else sits on the same off-white.
        Dark cards animate into view on scroll (scale + y + fade).
      ═══════════════════════════════════════════════════════════
      */}

      {/* ── CARD 1: Dark Hero (Spline animation inside) ── */}
      <div className="px-3 md:px-5 pt-[76px] pb-4">
        {/* Hero doesn't need the scroll reveal as it's the first thing visible */}
        <div id="main-content" style={darkCardBase} data-section-theme="dark">
          <Hero />
        </div>
      </div>

      {/* ── Standards Trust Strip (between hero and light sections) ── */}
      <div style={{ backgroundColor: PAGE_BG }}>
        <StandardsStrip />
      </div>

      {/* ── Light sections ── */}
      <div style={{ backgroundColor: PAGE_BG }} className="text-foreground">
        <HorusIntelligenceSection />
      </div>

      {/* ── CARD 2: Dark Core Features (scroll-reveal) ── */}
      <div className="px-3 md:px-5 py-4">
        <DarkCardReveal>
          <div className="dark-features-card" data-section-theme="dark">
            <HowItWorksSection />
            <AnalysisEngineFeatures />
          </div>
        </DarkCardReveal>
      </div>

      {/* ── Light sections ── */}
      <div style={{ backgroundColor: PAGE_BG }} className="text-foreground">
        <AboutSection />
      </div>

      {/* ── CARD: Dark Pricing & Testimonials (scroll-reveal) ── */}
      <div className="px-3 md:px-5 py-4">
        <DarkCardReveal>
          <div data-section-theme="dark">
            <PricingSection />
          </div>
        </DarkCardReveal>
      </div>

      {/* ── Light sections ── */}
      <div style={{ backgroundColor: PAGE_BG }} className="text-foreground">
        <FinalCtaSection />
      </div>

      {/* ── CARD 3: Dark Footer (scroll-reveal) ── */}
      <div className="px-3 md:px-5 py-4">
        <DarkCardReveal>
          <div data-section-theme="dark" style={{ borderRadius: "1.75rem", overflow: "hidden" }}>
            <LandingFooter />
          </div>
        </DarkCardReveal>
      </div>

      {/*
        Force dark styles inside .dark-features-card without requiring
        a global dark-mode class (page is always in light mode).
      */}
      <style>{`
        .dark-features-card {
          position: relative;
        }
        .dark-features-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 15% 10%, rgba(59,130,246,0.08), transparent 40%),
            radial-gradient(circle at 85% 85%, rgba(14,165,233,0.08), transparent 40%);
        }
      `}</style>
    </div>
  )
}
