"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { fadeInUp, ShinyButton, staggerContainer } from "./landing-utils"

export function FinalCtaSection() {
  return (
    <section className="relative py-[var(--spacing-section-lg)] px-[var(--spacing-content)] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-muted/30 via-background to-background" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,hsl(var(--primary)/0.10),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_82%,hsl(var(--primary)/0.08),transparent_42%)]" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        animate={{ x: [0, 26, 0], y: [0, -18, 0], opacity: [0.22, 0.42, 0.22] }}
        transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-primary/8 blur-3xl"
        animate={{ x: [0, -22, 0], y: [0, 14, 0], opacity: [0.18, 0.36, 0.18] }}
        transition={{ duration: 8.1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="relative z-10 max-w-4xl mx-auto text-center"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
        >
          <span className="bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Start with Horus AI Full Agent
          </span>
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto"
        >
          Ask, analyze, and execute. Horus helps your team move from questions to approved compliance actions in one flow.
        </motion.p>
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
          <ShinyButton
            href="/signup"
            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 px-8 py-6 text-base font-medium shadow-xl shadow-primary/20"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </ShinyButton>
          <Link href="#features">
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 text-base font-medium h-auto"
            >
              View Agent Capabilities
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}
