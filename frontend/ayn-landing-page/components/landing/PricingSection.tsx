"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Building2, Shield, TrendingUp, Users, CheckCircle } from "lucide-react"

const BULLETS = [
  { icon: Building2, text: "Plans shaped around education institutions and growing teams" },
  { icon: TrendingUp, text: "Scoped to evidence volume, audit cycles, and team size" },
  { icon: Shield, text: "Clear costs without hidden fees or surprise limits" },
  { icon: Users, text: "Guided onboarding for campuses and multi-campus groups" },
]

export function PricingSection({ onOpenDemo }: { onOpenDemo?: (type: "demo" | "pricing") => void }) {
  return (
    <section id="pricing" className="relative overflow-hidden bg-transparent px-6 py-20 md:py-24 scroll-mt-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-primary/8 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Early Access
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl"
          >
            Book a demo for your institution
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-2xl text-base font-light leading-relaxed text-muted-foreground md:text-lg"
          >
            Tell us how your quality team works today — we&apos;ll walk you through Ayn and align early access to your accreditation timeline.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="light-panel relative border border-border/60 bg-card/40 px-8 py-10 shadow-[0_0_80px_rgba(37,99,235,0.12)] backdrop-blur-3xl transition-shadow duration-700 hover:shadow-[0_0_100px_rgba(37,99,235,0.18)] md:px-12 md:py-12"
        >
          <div className="flex flex-col items-center text-center">
            <h3 className="mb-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              See Horus in your workflow
            </h3>
            <p className="mb-8 max-w-2xl text-[15px] font-light leading-relaxed text-muted-foreground md:text-base">
              We work with quality offices to match onboarding to real evidence volumes, review cycles, and accreditation timelines.
            </p>

            <div className="light-card w-full max-w-2xl border border-border/40 bg-card/30 px-6 py-6 text-left text-sm text-muted-foreground">
              <p className="mb-4 flex items-center gap-2 font-semibold text-foreground/80">
                <CheckCircle className="h-4 w-4 text-primary" />
                What we cover in the demo
              </p>
              <ul className="space-y-3.5">
                {BULLETS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/[0.08]">
                      <Icon className="h-3 w-3 text-primary" />
                    </span>
                    <span className="text-muted-foreground">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex w-full max-w-lg flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onOpenDemo?.("demo")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background shadow-[0_0_20px_rgba(255,255,255,0.08)] transition-all hover:scale-[1.02] hover:bg-foreground/90 active:scale-[0.98]"
              >
                Book a Demo
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onOpenDemo?.("pricing")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/50 bg-card/50 px-6 py-3 text-sm font-semibold text-foreground transition-all hover:scale-[1.02] hover:border-foreground/30 hover:bg-card/80 active:scale-[0.98]"
              >
                Request Pricing
              </button>
            </div>

            <p className="mt-6 text-xs text-muted-foreground/60">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                We respond within 24 hours
              </span>
            </p>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center text-xs text-muted-foreground/50"
        >
          Built for quality teams preparing accreditation and compliance workflows
        </motion.p>
      </div>
    </section>
  )
}
