"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export function FinalCtaSection() {
  return (
    <section className="relative py-32 md:py-48 px-6 overflow-hidden flex flex-col items-center justify-center">
      {/* Animated Background Mesh (The "Big Bang" Glow) */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-40">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full blur-[100px] bg-gradient-to-tr from-blue-500/30 via-emerald-400/20 to-transparent"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-4xl mx-auto text-center"
      >
        <div className="glass-pill mb-8 inline-flex items-center gap-2 px-4 py-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="glass-text-primary text-sm font-semibold tracking-wide uppercase">
            Transform your compliance
          </span>
        </div>

        <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-foreground">
          Start with <br className="hidden sm:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500">
            Horus AI
          </span> Full Agent
        </h2>
        
        <p className="glass-text-secondary mb-12 max-w-2xl mx-auto text-xl md:text-2xl leading-relaxed font-medium">
          Ask, analyze, and execute. Move from questions to approved compliance actions in one intelligent flow.
        </p>

        {/* Magnetic Glow Button Wrapper */}
        <div className="group relative inline-flex items-center justify-center">
          {/* Intense animated background glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 blur-xl opacity-24 transition-all duration-500 group-hover:opacity-55 group-hover:blur-2xl" />
          
          <Link
            href="/signup"
            className="relative inline-flex items-center justify-center gap-3 rounded-full bg-foreground px-10 py-5 text-lg font-semibold text-background shadow-[0_22px_50px_-24px_rgba(0,0,0,0.42)] transition-transform duration-300 hover:scale-[1.02] active:scale-95"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
