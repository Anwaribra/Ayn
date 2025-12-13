"use client"

import { School, GraduationCap, BookOpen, Award, Shield, FileText } from "lucide-react"
import { ScrollAnimationWrapper } from "./scroll-animation-wrapper"

const reasons = [
  { icon: School, label: "For Schools" },
  { icon: GraduationCap, label: "For Universities" },
  { icon: BookOpen, label: "For Training Centers" },
  { icon: Award, label: "ISO 21001 Ready" },
  { icon: Shield, label: "NAQAAE Compatible" },
  { icon: FileText, label: "Evidence-First Approach" },
]

export function WhyAynSection() {
  return (
    <section id="why" className="relative py-32 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950/50 to-black" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <ScrollAnimationWrapper className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-light mb-4 text-balance">
            <span className="bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Why Ayn?
            </span>
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Built for every educational institution seeking excellence in quality assurance.
          </p>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {reasons.map((reason, index) => (
            <ScrollAnimationWrapper key={index} animation="scale" delay={index * 75}>
              <div className="group relative p-6 rounded-xl bg-zinc-900/20 border border-zinc-800/30 hover:bg-zinc-900/40 hover:border-zinc-700/50 transition-all duration-500 hover:scale-105 text-center">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-zinc-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-zinc-800/30 border border-zinc-700/20 flex items-center justify-center mx-auto mb-4 group-hover:border-zinc-600/40 transition-colors duration-300">
                    <reason.icon className="w-5 h-5 text-zinc-400 group-hover:text-zinc-200 transition-colors duration-300" />
                  </div>

                  <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors duration-300">
                    {reason.label}
                  </span>
                </div>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
