"use client"

import { motion } from "framer-motion"
import { Brain, FolderLock, ShieldCheck, GitCompare, Lightbulb } from "lucide-react"

const cards = [
  { icon: FolderLock, title: "Evidence", desc: "Auto-tagged and mapped to standards" },
  { icon: ShieldCheck, title: "Standards", desc: "ISO 21001, NCAAA, ABET, and more" },
  { icon: GitCompare, title: "Gap Analysis", desc: "Flags what's missing before audits" },
  { icon: Lightbulb, title: "Insights", desc: "Prioritized reports and remediation" },
]

export function HorusIntelligenceSection() {
  return (
    <section id="horus-intelligence" className="relative scroll-mt-28 py-16 md:py-20 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          className="mb-12 text-center"
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-[0.12em] uppercase mb-4">
            Horus Engine
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-foreground">
            One intelligence across every layer.
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Evidence, standards, gaps, and insights — Horus connects them all in one live system.
          </p>
        </motion.div>

        {/* Desktop: hub + 4 cards */}
        <div className="hidden md:grid grid-cols-3 grid-rows-3 gap-5 max-w-3xl mx-auto">
          {/* Top-left */}
          <Card {...cards[0]} index={0} />
          {/* Top-center spacer */}
          <div className="flex items-center justify-center">
            <div className="w-px h-full bg-border/40" />
          </div>
          {/* Top-right */}
          <Card {...cards[2]} index={2} />

          {/* Middle-left spacer */}
          <div className="flex items-center justify-center">
            <div className="w-full h-px bg-border/40" />
          </div>
          {/* Center: Horus */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
              <div className="relative w-20 h-20 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
                <Brain className="w-9 h-9 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-3">Horus AI</p>
          </motion.div>
          {/* Middle-right spacer */}
          <div className="flex items-center justify-center">
            <div className="w-full h-px bg-border/40" />
          </div>

          {/* Bottom-left */}
          <Card {...cards[1]} index={1} />
          {/* Bottom-center spacer */}
          <div className="flex items-center justify-center">
            <div className="w-px h-full bg-border/40" />
          </div>
          {/* Bottom-right */}
          <Card {...cards[3]} index={3} />
        </div>

        {/* Mobile: stacked */}
        <div className="md:hidden space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center rounded-2xl border border-border/60 bg-card/60 py-6"
          >
            <div className="w-14 h-14 rounded-full bg-primary/[0.08] border-2 border-primary/25 flex items-center justify-center mb-3">
              <Brain className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground">Horus AI</h3>
            <p className="text-xs text-muted-foreground mt-1">Central intelligence monitoring every layer</p>
          </motion.div>
          <div className="grid grid-cols-2 gap-4">
            {cards.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-border/60 bg-card/50 p-5 text-center"
              >
                <c.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <h4 className="text-sm font-bold text-foreground mb-0.5">{c.title}</h4>
                <p className="text-[11px] text-muted-foreground">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Horus chat snippet */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mx-auto mt-10 max-w-xl md:mt-12"
        >
          <div className="mb-3 flex items-center justify-center gap-2">
            <Brain className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Ask Horus
            </span>
          </div>
          <div className="space-y-3 rounded-2xl border border-border/60 bg-card/40 p-4 text-left backdrop-blur-sm md:p-5">
            <div className="rounded-xl border border-border/50 bg-background/60 px-3.5 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Quality team
              </p>
              <p className="mt-1 text-sm text-foreground/90">
                What&apos;s missing for ISO 21001 criterion 6.3 before our review?
              </p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/[0.06] px-3.5 py-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                <Brain className="h-3 w-3" />
                Horus
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">
                3 gaps flagged. Priority: curriculum mapping document{" "}
                <span className="font-semibold text-amber-400/90">Critical</span>, assessment rubric alignment{" "}
                <span className="font-semibold text-foreground/70">High</span>. Draft remediation steps are ready.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bottom connector line + eye */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="w-px h-6 bg-border/40" />
          </div>
          <p className="text-xs text-muted-foreground/60 font-medium flex items-center justify-center gap-2">
            <Brain className="w-3.5 h-3.5 text-primary/60" />
            Everything flows through Horus
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function Card({ icon: Icon, title, desc, index }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="rounded-2xl border border-border/60 bg-card/50 p-5 text-center hover:bg-card/80 hover:-translate-y-0.5 transition-all"
    >
      <div className="w-9 h-9 rounded-xl bg-primary/[0.06] border border-primary/10 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h4 className="text-sm font-bold text-foreground mb-1">{title}</h4>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  )
}
