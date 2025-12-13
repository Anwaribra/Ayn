import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { LogoCloud } from "@/components/logo-cloud"
import { InteractiveTabs } from "@/components/interactive-tabs"
import { ComparisonSection } from "@/components/comparison-section"
import { HorusEngineSection } from "@/components/horus-engine-section"
import { WhyAynSection } from "@/components/why-ayn-section"
import { CTASection } from "@/components/cta-section"
import { StickyCTA } from "@/components/sticky-cta"
import { ParticleConstellation } from "@/components/particle-constellation"

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <ParticleConstellation />
      <Navbar />
      <HeroSection />
      <WhyAynSection />
      <LogoCloud />
      <InteractiveTabs />
      <ComparisonSection />
      <HorusEngineSection />
      <CTASection />
      <StickyCTA />
    </main>
  )
}
