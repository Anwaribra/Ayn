"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />

      {/* Decorative Glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 bg-zinc-800/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-light mb-6 text-balance">
          <span className="bg-gradient-to-r from-zinc-300 via-white to-zinc-300 bg-clip-text text-transparent">
            Ready to transform your educational quality system?
          </span>
        </h2>

        <p className="text-zinc-500 mb-10 max-w-xl mx-auto">
          Join leading institutions already using Ayn to achieve and maintain accreditation excellence.
        </p>

        <Button
          asChild
          size="lg"
          className="bg-zinc-100 text-black hover:bg-white hover:scale-105 transition-all duration-300 px-10 py-6 text-base font-medium group"
        >
          <Link href="/signup">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
