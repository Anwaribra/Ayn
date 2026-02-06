"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Brain, ChevronDown, FileCheck, Lock, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShinyButton } from "./landing-utils"
import Safari_01 from "@/components/ui/safari-01"

function scrollToFeatures() {
  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
}

export function Hero() {
  return (
    <section id="main-content" className="relative min-h-[85vh] flex items-center overflow-hidden pt-24 pb-[var(--spacing-section)]">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,transparent_0%,hsl(var(--background))_70%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-[var(--spacing-content)]">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            {/* Single focal point: hero headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
              <span className="inline-block bg-gradient-to-r from-foreground via-foreground/95 to-primary/90 bg-clip-text text-transparent">
                Ayn
              </span>
            </h1>
            <h2 className="text-xl md:text-2xl font-medium mb-4 text-muted-foreground tracking-tight">
              Your Education Quality & Accreditation Platform
            </h2>
            <p className="text-sm text-muted-foreground/80 mb-8 max-w-md mx-auto lg:mx-0">
              Streamline ISO 21001 & NAQAAE compliance with AI analysis, evidence management, and automated workflows.
            </p>
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
              <ShinyButton
                href="/login"
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 px-6 py-5 text-sm font-medium w-full sm:w-auto"
              >
                View Demo
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
            </div>
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

          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-3xl scale-110" />
            <Safari_01 className="relative z-10 glass-card">
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 backdrop-blur-[2px] bg-background/5 transition-all duration-500 hover:backdrop-blur-0 group/overlay">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-background/80 backdrop-blur-xl border border-border shadow-2xl flex items-center justify-center group-hover/overlay:scale-110 transition-transform duration-500">
                    <Lock className="w-8 h-8 text-primary/80" />
                  </div>
                </div>
                <div className="absolute top-4 right-4 text-[10px] text-muted-foreground flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border border-border/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Coming Soon
                </div>
              </div>
            </Safari_01>
          </div>
          <div className="relative flex md:hidden justify-center mt-8">
            <Link
              href="/login"
              className="flex flex-col items-center justify-center gap-3 w-full max-w-xs py-8 px-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center">
                <Lock className="w-7 h-7 text-primary/80" />
              </div>
              <span className="text-sm font-medium text-foreground">View Demo</span>
              <span className="text-xs text-muted-foreground">See the platform in action</span>
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
  )
}
