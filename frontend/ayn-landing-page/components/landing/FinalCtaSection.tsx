"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function FinalCtaSection({ onOpenDemo }: { onOpenDemo?: (type: "demo" | "pricing") => void }) {
  return (
    <section className="relative border-y border-border/50 px-6 py-16 md:py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-center md:justify-between md:gap-16"
      >
        <div className="max-w-xl">
          <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Ready to operate
          </span>

          <h2 className="text-3xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-4xl md:text-[2.5rem]">
            Deploy your compliance{" "}
            <span className="text-muted-foreground">infrastructure today.</span>
          </h2>

          <p className="mt-4 max-w-lg text-base font-light leading-relaxed text-muted-foreground">
            No manual tagging. No messy spreadsheets. Just configure your frameworks and let Horus AI handle the heavy lifting.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-4 md:items-end">
          <button
            type="button"
            onClick={() => onOpenDemo?.("demo")}
            className="inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all hover:scale-[1.02] hover:bg-black"
          >
            Book a Demo
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="text-sm text-muted-foreground/70 md:text-right">
            Prefer self-serve?{" "}
            <Link href="/signup" className="font-medium text-foreground/80 underline-offset-4 hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </motion.div>
    </section>
  )
}
