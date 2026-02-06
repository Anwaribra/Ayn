"use client"

import { motion } from "framer-motion"
import { audienceItems, trustBadges } from "./landing-data"
import { fadeInUp, staggerContainer } from "./landing-utils"

export function AboutSection() {
  return (
    <section id="about" className="relative py-[var(--spacing-section-lg)] px-[var(--spacing-content)] overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Excellence for Every Institution
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto">
            Built for every educational institution seeking excellence in quality assurance.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {audienceItems.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group relative p-8 rounded-3xl bg-card/40 backdrop-blur-sm border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 flex flex-col text-left"
            >
              <div className="mb-5 w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                <item.icon className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-4">{item.title}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {item.benefits.map((benefit, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {trustBadges.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (idx + 3) * 0.1 }}
              className="group relative p-6 rounded-3xl bg-card/40 backdrop-blur-sm border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 flex flex-col items-center text-center"
            >
              <div className="mb-4 w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                <item.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-base font-semibold tracking-tight">{item.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
