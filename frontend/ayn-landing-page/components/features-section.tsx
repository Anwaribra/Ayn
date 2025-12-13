"use client"

import { FileCheck, ClipboardList, Upload, LayoutDashboard } from "lucide-react"
import { ScrollAnimationWrapper } from "./scroll-animation-wrapper"

const features = [
  {
    icon: FileCheck,
    title: "Standards & Criteria Management",
    description: "Organize and track educational standards with precision and clarity.",
  },
  {
    icon: ClipboardList,
    title: "Assessments Workflow",
    description: "Seamless Draft → Submit → Review process for all evaluations.",
  },
  {
    icon: Upload,
    title: "Evidence Upload Manager",
    description: "Centralized evidence collection with smart categorization.",
  },
  {
    icon: LayoutDashboard,
    title: "Smart Dashboard",
    description: "Real-time insights and analytics at your fingertips.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950/50 to-black" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <ScrollAnimationWrapper className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-light mb-4 text-balance">
            <span className="bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              What is Ayn?
            </span>
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            A comprehensive platform designed to elevate educational quality and streamline accreditation processes.
          </p>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <ScrollAnimationWrapper key={index} animation="fade-up" delay={index * 100}>
              <div className="group relative p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-sm hover:bg-zinc-900/50 hover:border-zinc-700/50 transition-all duration-500 hover:scale-105 hover:shadow-[0_0_30px_rgba(100,100,100,0.1)] h-full">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-zinc-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center mb-4 group-hover:border-zinc-600/50 transition-colors duration-300">
                    <feature.icon className="w-6 h-6 text-zinc-400 group-hover:text-zinc-200 transition-colors duration-300" />
                  </div>

                  <h3 className="text-lg font-medium text-zinc-200 mb-2 text-balance">{feature.title}</h3>

                  <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
