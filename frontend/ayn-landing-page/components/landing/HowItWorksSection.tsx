"use client"

import { motion } from "framer-motion"
import { workflowSteps } from "./landing-data"
import { fadeInUp, staggerContainer } from "./landing-utils"
import { SimpleBeam } from "@/components/ui/animated-beam"

export function HowItWorksSection() {
  return (
    <section 
      id="how-it-works" 
      className="relative py-[var(--spacing-section-lg)] md:py-32 px-[var(--spacing-content)] overflow-hidden"
    >
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
            Four steps from evidence to compliance. Simple, transparent, and built for quality teams.
          </motion.p>
        </motion.div>

        {/* Workflow Steps - Desktop with Beams */}
        <div className="hidden lg:flex items-center justify-center gap-0">
          {workflowSteps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative flex items-center"
            >
              {/* Card */}
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative w-64 rounded-2xl border border-border bg-card p-6 transition-shadow duration-500 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 group"
              >
                {/* Step Number Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 30,
                    delay: 0.5 + index * 0.15 
                  }}
                  className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/25 z-10"
                >
                  {index + 1}
                </motion.div>

                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Large background number */}
                <div className="absolute top-3 right-3 text-5xl font-bold text-foreground/5 group-hover:text-primary/10 transition-colors duration-300 select-none">
                  {String(index + 1).padStart(2, "0")}
                </div>

                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative w-14 h-14 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20"
                >
                  <step.icon className="w-7 h-7 text-primary" />
                </motion.div>

                {/* Content */}
                <h3 className="relative text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="relative text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>

              {/* Animated Beam Connector (except last) */}
              {index < workflowSteps.length - 1 && (
                <SimpleBeam 
                  duration={2.5} 
                  delay={index * 0.3}
                  className="w-8"
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Mobile/Tablet Grid - No beams */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-6">
          {workflowSteps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              {/* Step Number Badge */}
              <div className="absolute -top-3 -left-1 z-20">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 30,
                    delay: 0.3 + index * 0.1 
                  }}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/25"
                >
                  {index + 1}
                </motion.div>
              </div>

              {/* Card */}
              <div className="relative h-full rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 transition-all duration-500 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 group/card">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                
                {/* Left border accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-primary via-primary/50 to-primary opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                
                {/* Large background number */}
                <div className="absolute top-4 right-4 text-6xl font-bold text-foreground/5 group-hover/card:text-primary/10 transition-colors duration-300 select-none">
                  {String(index + 1).padStart(2, "0")}
                </div>

                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative z-10 w-16 h-16 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 shadow-inner"
                >
                  <step.icon className="w-8 h-8 text-primary" />
                </motion.div>

                {/* Content */}
                <h3 className="relative z-10 text-xl font-bold text-foreground mb-2 group-hover/card:text-primary transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="relative z-10 text-muted-foreground text-sm md:text-base leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground text-sm">
            Start your compliance journey today
          </p>
        </motion.div>
      </div>
    </section>
  )
}
