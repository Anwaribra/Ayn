"use client"

import { useState } from "react"
import { SessionChecker } from "@/components/landing/SessionChecker"
import dynamic from "next/dynamic"
import { LandingNavbar }           from "@/components/landing/LandingNavbar"
import { Hero }                    from "@/components/landing/Hero"
import { DarkCardReveal }          from "@/components/landing/dark-card-reveal"
import { SectionSkeleton } from "@/components/landing/landing-utils"

const HorusIntelligenceSection = dynamic(() => import("@/components/landing/HorusIntelligenceSection").then(mod => mod.HorusIntelligenceSection), { loading: () => <SectionSkeleton /> })
const AnalysisEngineFeatures = dynamic(() => import("@/components/landing/AnalysisEngineFeatures").then(mod => mod.AnalysisEngineFeatures), { loading: () => <SectionSkeleton /> })
const HowItWorksSection = dynamic(() => import("@/components/landing/HowItWorksSection").then(mod => mod.HowItWorksSection), { loading: () => <SectionSkeleton /> })
const ComparisonTable = dynamic(() => import("@/components/landing/ComparisonTable").then(mod => mod.ComparisonTable), { loading: () => <SectionSkeleton /> })
const AboutSection = dynamic(() => import("@/components/landing/AboutSection").then(mod => mod.AboutSection), { loading: () => <SectionSkeleton /> })
const SecurityStrip = dynamic(() => import("@/components/landing/SecurityStrip").then(mod => mod.SecurityStrip), { loading: () => <SectionSkeleton /> })
const PricingSection = dynamic(() => import("@/components/landing/PricingSection").then(mod => mod.PricingSection), { loading: () => <SectionSkeleton /> })
const LandingFaqAccordion = dynamic(() => import("@/components/landing/LandingFaqAccordion").then(mod => mod.LandingFaqAccordion), { loading: () => <SectionSkeleton /> })
const FinalCtaSection = dynamic(() => import("@/components/landing/FinalCtaSection").then(mod => mod.FinalCtaSection), { loading: () => <SectionSkeleton /> })
const LandingFooter = dynamic(() => import("@/components/landing/LandingFooter").then(mod => mod.LandingFooter), { loading: () => <SectionSkeleton /> })

const NeuralVortexBackground = dynamic(() => import("@/components/ui/interactive-neural-vortex-background").then(mod => mod.NeuralVortexBackground), { ssr: false })
const DemoModal = dynamic(() => import("@/components/landing/DemoModal").then(mod => mod.DemoModal), { ssr: false })
const HorusLandingAssistant = dynamic(() => import("@/components/landing/HorusLandingAssistant").then(mod => mod.HorusLandingAssistant), { ssr: false })


/** Transparent page background to let globals.css gradient shine */
const PAGE_BG = "transparent"

export default function Home() {
  const [demoOpen, setDemoOpen] = useState(false)
  const [demoType, setDemoType] = useState<"demo" | "pricing">("demo")

  const triggerDemo = (type: "demo" | "pricing" = "demo") => {
    setDemoType(type)
    setDemoOpen(true)
  }

  return (
    <div style={{ backgroundColor: PAGE_BG, minHeight: "100vh" }}>
      <SessionChecker />

      {/* Skip-nav */}
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-lg outline-none focus:translate-y-0 focus:ring-2 focus:ring-primary transition-transform"
      >
        Skip to main content
      </a>

      <LandingNavbar onOpenDemo={triggerDemo} />

      {/* ── Hero ── */}
      <div id="main-content" className="relative scroll-mt-28 pt-24 md:pt-28 text-foreground overflow-hidden">
        <NeuralVortexBackground
          opacity={0.35}
          intensity={0.48}
          textVignette={false}
          colorScheme="default"
        />
        <Hero onOpenDemo={triggerDemo} />
      </div>

      {/* ── Dark: Horus + Features ── */}
      <div className="px-3 sm:px-6 md:px-8 pt-4 pb-2 md:pt-6 md:pb-6">
        <DarkCardReveal>
          <div className="dark-features-card group transition-transform duration-500 hover:shadow-[0_20px_80px_rgba(0,0,0,0.4)]" data-section-theme="dark">
            <HorusIntelligenceSection />
            <AnalysisEngineFeatures />
          </div>
        </DarkCardReveal>
      </div>

      {/* ── How It Works ── */}
      <div style={{ backgroundColor: PAGE_BG }} className="text-foreground py-4 md:py-8">
        <HowItWorksSection />
      </div>

      {/* ── Comparison Table ── */}
      <div style={{ backgroundColor: PAGE_BG }} className="text-foreground py-4 md:py-8">
        <ComparisonTable />
      </div>

      {/* ── About ── */}
      <div style={{ backgroundColor: PAGE_BG }} className="text-foreground py-4 md:py-8">
        <AboutSection />
      </div>

      {/* ── Security strip ── */}
      <div style={{ backgroundColor: PAGE_BG }} className="text-foreground">
        <SecurityStrip />
      </div>

      {/* ── Early Access / Demo ── */}
      <div className="px-3 sm:px-6 md:px-8 py-2 md:py-6">
        <DarkCardReveal>
          <div data-section-theme="dark" className="transition-transform duration-500 hover:shadow-[0_20px_80px_rgba(0,0,0,0.4)]">
            <PricingSection onOpenDemo={triggerDemo} />
          </div>
        </DarkCardReveal>
      </div>

      {/* ── FAQ ── */}
      <div style={{ backgroundColor: PAGE_BG }} className="text-foreground py-4 md:py-8">
        <LandingFaqAccordion />
      </div>

      {/* ── Final CTA ── */}
      <div style={{ backgroundColor: PAGE_BG }} className="text-foreground">
        <FinalCtaSection onOpenDemo={triggerDemo} />
      </div>

      {/* ── Footer ── */}
      <div className="px-3 sm:px-6 md:px-8 pb-6 md:pb-8">
        <DarkCardReveal>
          <div data-section-theme="dark">
            <LandingFooter onOpenDemo={triggerDemo} />
          </div>
        </DarkCardReveal>
      </div>

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

      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} defaultType={demoType} />
      <HorusLandingAssistant />
    </div>
  )
}
