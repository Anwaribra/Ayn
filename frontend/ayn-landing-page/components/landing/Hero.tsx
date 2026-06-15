"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import dynamic from "next/dynamic"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShinyButton } from "./landing-utils"

const HeroDashboardPreview = dynamic(() => import("./HeroDashboardPreview").then(mod => mod.HeroDashboardPreview), { ssr: false })

const STANDARDS = [
  "ISO 21001", "NCAAA", "MOE Frameworks", "ABET", "QS Standards",
  "EFQM", "CBUAE", "ISO 9001", "ANAB", "WASC",
]

export function Hero({ onOpenDemo }: { onOpenDemo: (type: "demo" | "pricing") => void }) {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 md:px-10 md:py-20 lg:px-14">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent z-20" />
        
        {/* Animated Aurora Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] mix-blend-screen"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[10%] -right-[10%] h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[130px] mix-blend-screen"
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center">
        <motion.h1
          className="mb-6 max-w-4xl text-5xl font-bold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-6xl xl:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          From evidence chaos to{" "}
          <span className="bg-gradient-to-r from-primary via-blue-600 to-cyan-600 bg-clip-text text-transparent pb-2">
            audit-ready.
          </span>
        </motion.h1>

        <motion.p
          className="mb-8 max-w-xl text-lg font-light leading-relaxed text-muted-foreground"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
        >
          Map evidence to ISO, NCAAA, and global frameworks — then run guided compliance actions from the same AI workflow.
        </motion.p>

        <motion.div
          className="mb-10 flex w-full flex-col items-center justify-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
            <ShinyButton
              onClick={() => onOpenDemo("demo")}
              className="w-full rounded-full bg-[#0A0A0A] px-8 py-5 text-base font-bold text-white shadow-[0_0_40px_rgba(0,0,0,0.2)] dark:shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all sm:w-auto"
            >
              Book a Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </ShinyButton>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full rounded-full border-border/60 bg-background/50 backdrop-blur-md px-8 py-5 text-base font-medium text-foreground transition-all sm:w-auto"
            >
              <Link href="/signup">Create account</Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="relative mt-4 w-full md:mt-6"
        >
          <HeroDashboardPreview />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-10 w-full overflow-hidden md:mt-12"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}
        >
          <div className="flex group w-max">
            <div className="hero-marquee flex items-center gap-8 md:gap-12">
              {STANDARDS.map((s) => (
                <span key={s} className="inline-flex shrink-0 items-center gap-3">
                  <span className="whitespace-nowrap text-sm font-medium tracking-wide text-muted-foreground/70 md:text-base">
                    {s}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-primary/40" />
                </span>
              ))}
            </div>
            <div className="hero-marquee flex items-center gap-8 md:gap-12" aria-hidden>
              {STANDARDS.map((s) => (
                <span key={s + "_dup"} className="inline-flex shrink-0 items-center gap-3">
                  <span className="whitespace-nowrap text-sm font-medium tracking-wide text-muted-foreground/70 md:text-base">
                    {s}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-primary/40" />
                </span>
              ))}
            </div>
          </div>

          <style>{`
            @keyframes hero-marquee {
              from { transform: translateX(0); }
              to   { transform: translateX(-50%); }
            }
            .hero-marquee {
              animation: hero-marquee 32s linear infinite;
            }
            .group:hover .hero-marquee {
              animation-play-state: paused;
            }
          `}</style>
        </motion.div>
      </div>
    </section>
  )
}
