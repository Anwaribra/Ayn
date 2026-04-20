"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function FinalCtaSection() {
  return (
    <section className="relative py-40 md:py-56 px-6 overflow-hidden flex flex-col items-center justify-center bg-transparent">
      
      {/* Background Soft Glow */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 2, ease: "easeOut" }}
           className="w-[500px] h-[500px] md:w-[800px] md:h-[800px] rounded-full blur-[120px] bg-primary/5"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center"
      >
        <span className="inline-block px-4 py-1.5 rounded-full bg-slate-200/50 border border-slate-300/50 mb-8 text-xs tracking-[0.2em] text-slate-600 uppercase font-bold shadow-sm">
          Ready to operate
        </span>

        <h2 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tighter text-slate-900 leading-[1.05]">
          Deploy your compliance <br className="hidden sm:block" />
          <span className="text-slate-400">infrastructure today.</span>
        </h2>
        
        <p className="text-slate-600 mb-12 max-w-xl mx-auto text-lg md:text-xl leading-relaxed font-medium">
          No manual tagging. No messy spreadsheets. Just configure your frameworks and let Horus AI handle the heavy lifting.
        </p>

        {/* Minimalist Dark CTA Button for high contrast against light bg */}
        <div className="group relative inline-flex items-center justify-center">          
          <Link
            href="/signup"
            className="relative inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-95 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
          >
            Start for free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        {/* Subtle helper text below the button */}
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-6 text-sm text-slate-400 font-medium"
        >
          No credit card required. Cancel anytime.
        </motion.p>
      </motion.div>
    </section>
  )
}
