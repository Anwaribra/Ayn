"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { api } from "@/lib/api"
import { log } from "@/lib/logger"
import { CursorGlow } from "@/components/landing/landing-utils"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { Hero } from "@/components/landing/Hero"
import { HorusIntelligenceSection } from "@/components/landing/HorusIntelligenceSection"
import { AboutSection } from "@/components/landing/AboutSection"
import { FinalCtaSection } from "@/components/landing/FinalCtaSection"
import { CyberneticBentoGrid } from "@/components/ui/cybernetic-bento-grid"

export default function Home() {
  useEffect(() => {
    const checkSession = async () => {
      log("[Home] Checking for Supabase session...")
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.access_token) {
        log("[Home] Found Supabase session, syncing with backend...")
        try {
          await api.syncWithSupabase(session.access_token)
          log("[Home] Sync successful, clearing Supabase session...")
          await supabase.auth.signOut()
          log("[Home] Redirecting to dashboard...")
          window.location.href = "/platform/dashboard"
        } catch (err) {
          console.error("[Home] Sync failed:", err)
        }
      } else {
        log("[Home] No Supabase session found")
      }
    }
    checkSession()
  }, [])

  return (
    <div className="bg-background text-foreground">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-lg outline-none focus:translate-y-0 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-transform"
      >
        Skip to main content
      </a>
      <CursorGlow />
      <LandingNavbar />
      <Hero />
      <HorusIntelligenceSection />
      <CyberneticBentoGrid />
      <AboutSection />
      <FinalCtaSection />
    </div>
  )
}
