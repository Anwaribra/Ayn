"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { workflowSteps } from "./landing-data"
import { fadeInUp, staggerContainer } from "./landing-utils"
import { AnimatedBeam } from "@/components/ui/animated-beam"

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  return (
    <section 
      id="how-it-works" 
      ref={containerRef}
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

        {/* Workflow Grid with Animated Beams */}
        <div className="relative">
          {/* Animated Beams - Desktop Only */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none">
            {workflowSteps.map((_, index) => {
              if (index >= workflowSteps.length - 1) return null
              return (
                <AnimatedBeam
                  key={`beam-${index}`}
                  containerRef={containerRef}
                  fromRef={{ current: stepRefs.current[index] }}
                  toRef={{ current: stepRefs.current[index + 1] }}
                  curvature={-20}
                  duration={2.5}
                  delay={index * 0.5}
                  gradientStartColor="#3b82f6"
                  gradientStopColor="#8b5cf6"
                  pathWidth={3}
                  pathOpacity={0.2}
                />
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 relative z-10">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.title}
                ref={(el) => { stepRefs.current[index] = el }}
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
                <div className="relative h-full rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 md:p-8 transition-all duration-500 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 group/card">
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
                    className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 shadow-inner"
                  >
                    <step.icon className="w-8 h-8 md:w-9 md:h-9 text-primary" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="relative z-10 text-xl font-bold text-foreground mb-2 group-hover/card:text-primary transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="relative z-10 text-muted-foreground text-sm md:text-base leading-relaxed">
                    {step.description}
                  </p>

                  {/* Arrow indicator (except last) */}
                  {index < workflowSteps.length - 1 && (
                    <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-background border border-border items-center justify-center">
                      <motion.div
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-primary border-b-[4px] border-b-transparent"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
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
