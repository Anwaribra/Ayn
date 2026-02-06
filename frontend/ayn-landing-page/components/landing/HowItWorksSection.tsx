"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { workflowSteps } from "./landing-data"
import { fadeInUp, staggerContainer } from "./landing-utils"

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-[var(--spacing-section-lg)] md:py-32 px-[var(--spacing-content)] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-primary/5 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,var(--primary)_0.08,transparent_50%)] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="text-center mb-16 md:mb-20"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider mb-4"
          >
            Process
          </motion.div>
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
          >
            <span className="bg-gradient-to-r from-foreground via-foreground to-primary/90 bg-clip-text text-transparent">
              How it works
            </span>
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto"
          >
            Four steps from evidence to accreditation. Simple, transparent, and built for quality teams.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {workflowSteps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              {index < workflowSteps.length - 1 && (
                <div className="hidden lg:block absolute top-20 left-[calc(50%+5rem)] w-[calc(100%-6rem)] h-px z-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-border via-primary/40 to-border" />
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-primary/60">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              )}
              <div className="relative h-full rounded-2xl border-2 border-border bg-card/60 backdrop-blur-sm p-6 md:p-8 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 group-hover:-translate-y-1">
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-primary/50 via-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="text-5xl md:text-6xl font-bold text-foreground/10 group-hover:text-primary/20 transition-colors absolute top-4 right-4">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
                >
                  <step.icon className="w-8 h-8 md:w-9 md:h-9 text-primary" />
                </motion.div>
                <h3 className="relative z-10 text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="relative z-10 text-muted-foreground text-sm md:text-base leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
