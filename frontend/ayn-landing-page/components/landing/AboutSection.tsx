"use client"

import { motion } from "framer-motion"
import { School, GraduationCap, Library, Award, ShieldCheck, Users } from "lucide-react"
import { fadeInUp, staggerContainer } from "./landing-utils"

const audiences = [
  {
    title: "Schools",
    icon: School,
    description: "Streamline compliance preparation with organized evidence and AI guidance.",
  },
  {
    title: "Universities",
    icon: GraduationCap,
    description: "Manage program reviews and quality standards across multiple faculties.",
  },
  {
    title: "Training Centers",
    icon: Library,
    description: "Document competencies and certifications for professional bodies.",
  },
]

const values = [
  { title: "ISO 21001 Aligned", icon: Award },
  { title: "NAQAAE Compatible", icon: ShieldCheck },
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
            Built for Educational Excellence
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto">
            Quality assurance tools designed for every type of educational institution.
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
              className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg text-center"
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
