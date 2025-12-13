"use client"

import { Sparkles } from "lucide-react"
import { ScrollAnimationWrapper } from "./scroll-animation-wrapper"

export function HorusEngineSection() {
  return (
    <section id="horus" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />

      {/* Decorative Elements */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-zinc-800/10 rounded-full blur-3xl" />
      <div className="absolute right-0 top-1/3 w-96 h-96 bg-zinc-800/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left: Abstract Icon */}
          <ScrollAnimationWrapper animation="fade-right">
            <div className="flex justify-center md:justify-end">
              <div className="relative w-64 h-64 md:w-80 md:h-80">
                {/* Outer Ring */}
                <div
                  className="absolute inset-0 rounded-full border border-zinc-700/30 animate-spin"
                  style={{ animationDuration: "30s" }}
                />
                <div
                  className="absolute inset-4 rounded-full border border-zinc-600/20 animate-spin"
                  style={{ animationDuration: "25s", animationDirection: "reverse" }}
                />
                <div className="absolute inset-8 rounded-full border border-zinc-500/10" />

                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 blur-xl bg-gradient-to-br from-zinc-400/20 to-zinc-600/20 rounded-full scale-150" />
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-zinc-700/50 to-zinc-900/50 border border-zinc-600/30 flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="w-10 h-10 md:w-14 md:h-14 text-zinc-300" />
                    </div>
                  </div>
                </div>

                {/* Orbiting Dots */}
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: "20s" }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-400/50" />
                </div>
                <div
                  className="absolute inset-0 animate-spin"
                  style={{ animationDuration: "15s", animationDirection: "reverse" }}
                >
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-zinc-500/50" />
                </div>
              </div>
            </div>
          </ScrollAnimationWrapper>

          {/* Right: Text Content */}
          <ScrollAnimationWrapper animation="fade-left">
            <div className="text-center md:text-left">
              <span className="inline-block text-xs uppercase tracking-widest text-zinc-500 mb-4">
                The Power Behind Ayn
              </span>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light mb-6 text-balance">
                <span className="bg-gradient-to-r from-zinc-300 via-white to-zinc-300 bg-clip-text text-transparent">
                  Horus Engine
                </span>
              </h2>

              <p className="text-zinc-400 text-lg leading-relaxed mb-6">
                Horus organizes standards, evidence, evaluations, assignments, and reviewer workflows into one unified
                system.
              </p>

              <div className="space-y-4">
                {[
                  "Unified Standards Management",
                  "Intelligent Evidence Linking",
                  "Automated Workflow Orchestration",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 text-zinc-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollAnimationWrapper>
        </div>
      </div>
    </section>
  )
}
