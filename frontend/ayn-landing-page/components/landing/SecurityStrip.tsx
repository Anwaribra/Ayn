"use client"

import { motion } from "framer-motion"
import { Lock, Shield, FileCheck, Building2 } from "lucide-react"

const TRUST_ITEMS = [
  { icon: Lock, label: "AES-256 encryption" },
  { icon: Shield, label: "Role-based access" },
  { icon: FileCheck, label: "Full audit trail" },
  { icon: Building2, label: "Workspace isolation" },
]

export function SecurityStrip() {
  return (
    <section id="security" className="relative scroll-mt-28 border-y border-border/50 px-6 py-10 md:py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-6xl"
      >
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Security & trust
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 md:gap-x-14">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 text-sm text-foreground/80">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-card/50">
                <Icon className="h-4 w-4 text-foreground/70" strokeWidth={1.5} />
              </span>
              <span className="font-medium">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
