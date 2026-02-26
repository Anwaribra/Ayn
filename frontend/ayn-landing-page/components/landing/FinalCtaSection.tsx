"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { fadeInUp, ShinyButton, staggerContainer } from "./landing-utils"

export function FinalCtaSection() {
  return (
    <section className="relative py-[var(--spacing-section-lg)] px-[var(--spacing-content)] overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1.5s" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-muted/30 via-background to-background" />

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
              Learn More
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}
