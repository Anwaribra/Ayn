"use client"

import { motion } from "framer-motion"
import { School, GraduationCap, Library, Award, ShieldCheck, Users, ArrowRight } from "lucide-react"
import { fadeInUp, staggerContainer, ShinyButton } from "./landing-utils"

const audiences = [
  {
    title: "Schools",
    icon: School,
    description: "Horus AI guides your compliance journey — from evidence uploads to gap identification and report generation.",
  },
  {
    title: "Universities",
    icon: GraduationCap,
    description: "Ask Horus AI about program standards, framework criteria, and institutional quality metrics across faculties.",
  },
  {
    title: "Training Centers",
    icon: Library,
    description: "Horus AI tracks competencies and prepares documentation for professional framework alignment.",
  },
]

const values = [
  { title: "Self-Audit Support", icon: Award },
  { title: "Framework Alignment", icon: ShieldCheck },
  { title: "Built for Teams", icon: Users },
]

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
            Horus AI Works for Every Institution
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto">
            One intelligent assistant that adapts to your institution's needs and compliance requirements.
          </motion.p>
        </motion.div>

        {/* Audience cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {audiences.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group relative p-8 rounded-2xl bg-white/60 backdrop-blur-[16px] border border-white/40 shadow-lg hover:shadow-xl hover:border-primary/30 hover:scale-[1.01] transition-all duration-300 text-center"
            >
              <div className="mb-5 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Section CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center mb-12"
        >
          <ShinyButton
            href="/signup"
            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 px-6 py-3 text-sm font-semibold shadow-lg"
          >
            Get started free
            <ArrowRight className="ml-2 w-4 h-4" />
          </ShinyButton>
        </motion.div>

        {/* Value props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-8 md:gap-12"
        >
          {values.map((item) => (
            <div key={item.title} className="flex items-center gap-2 text-sm text-muted-foreground">
              <item.icon className="w-4 h-4 text-primary" />
              <span>{item.title}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
