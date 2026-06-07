"use client"

import { motion } from "framer-motion"
import { FileCheck, ClipboardCheck, GraduationCap, Building2, ArrowUpRight } from "lucide-react"
import Link from "next/link"

const values = [
  {
    title: "Built by educators, for educators",
    description:
      "We spent years inside quality departments before writing a line of code. Every feature starts with a real accreditation problem.",
    icon: GraduationCap,
  },
  {
    title: "Standards are our language",
    description:
      "ISO 21001, NCAAA, ABET, QS, MOE — we map to the frameworks that matter in your region. No abstractions, no generic compliance.",
    icon: ClipboardCheck,
  },
  {
    title: "Privacy isn't a feature, it's a foundation",
    description:
      "Your evidence stays yours. Role-based access, per-workspace isolation, and AES-256 encryption at rest are built in from day one.",
    icon: Building2,
  },
]

const stats = [
  { label: "Frameworks mapped", value: "6+" },
  { label: "Core workflow steps", value: "4" },
  { label: "Traceable audit trail", value: "100%" },
]

export function AboutSection() {
  return (
    <section id="about" className="relative scroll-mt-28 py-16 md:py-20 px-6 overflow-hidden">
      {/* Background — subtle edge gradient, no blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* ═══ Section Header ═══ */}
        <div className="max-w-2xl mb-12 md:mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-primary uppercase tracking-[0.18em] mb-4 block"
          >
            About Ayn
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08, duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.12] mb-5"
          >
            Compliance shouldn&apos;t feel like a solo accreditation project.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16, duration: 0.6 }}
            className="text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed"
          >
            Ayn was built inside real quality departments — not in a boardroom. We know the
            spreadsheet fatigue, the late-night gap analysis, the duplicated effort across
            colleges. So we built the tool we wished existed.
          </motion.p>
        </div>

        {/* ═══ Values Grid ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12 md:mb-16">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
              className="light-card group relative border border-border/60 bg-card/50 p-7 transition-all duration-500 hover:border-border/80 hover:bg-card/80"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/[0.06] border border-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/[0.1] transition-colors">
                <v.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-3 leading-snug">
                {v.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {v.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ═══ Stats + CTA Row ═══ */}
        <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-16">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex gap-8 md:gap-12"
          >
            {stats.map((s, i) => (
              <div key={s.label}>
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="text-2xl md:text-3xl font-bold text-foreground block mb-1"
                >
                  {s.value}
                </motion.span>
                <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link
              href="/#pricing"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              Book a demo for your team
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
