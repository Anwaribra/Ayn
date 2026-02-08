"use client"

import { motion } from "framer-motion"
import { features } from "./landing-data"
import { fadeInUp, staggerContainer } from "./landing-utils"

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-[var(--spacing-section)] px-[var(--spacing-content)]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mb-12"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4"
          >
            Platform
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
            Powerful Features
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground max-w-xl text-base">
            Comprehensive tools for educational quality assurance and compliance management.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8"
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="flex gap-4 items-start group"
              >
                <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1 text-[15px]">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
