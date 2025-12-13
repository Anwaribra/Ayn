"use client"

import { useState } from "react"
import { ScrollAnimationWrapper } from "./scroll-animation-wrapper"
import { Check, X, ArrowLeftRight } from "lucide-react"

const comparisonData = {
  without: {
    title: "Without Ayn",
    items: [
      "Scattered documentation across multiple systems",
      "Manual tracking of compliance status",
      "Delayed evidence collection",
      "Disconnected review workflows",
      "Limited visibility into progress",
    ],
  },
  with: {
    title: "With Ayn",
    items: [
      "Unified platform for all standards",
      "Automated compliance monitoring",
      "Real-time evidence management",
      "Streamlined reviewer assignments",
      "Complete dashboard analytics",
    ],
  },
}

export function ComparisonSection() {
  const [sliderPosition, setSliderPosition] = useState(50)

  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <ScrollAnimationWrapper className="text-center mb-16">
          <span className="inline-block text-xs uppercase tracking-widest text-zinc-500 mb-4">The Difference</span>
          <h2 className="text-3xl md:text-4xl font-light mb-4 text-balance">
            <span className="bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Transform Your Process
            </span>
          </h2>
        </ScrollAnimationWrapper>

        {/* Slider Comparison */}
        <ScrollAnimationWrapper animation="fade-up">
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
            <div className="relative h-[400px]">
              {/* Without Side */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <div className="max-w-xs">
                  <h3 className="text-xl font-medium text-zinc-400 mb-6 flex items-center gap-2">
                    <X className="w-5 h-5 text-zinc-600" />
                    {comparisonData.without.title}
                  </h3>
                  <ul className="space-y-4">
                    {comparisonData.without.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-zinc-500 text-sm">
                        <X className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* With Side */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 to-zinc-900 p-8 flex justify-end"
                style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
              >
                <div className="max-w-xs">
                  <h3 className="text-xl font-medium text-zinc-200 mb-6 flex items-center gap-2">
                    <Check className="w-5 h-5 text-zinc-300" />
                    {comparisonData.with.title}
                  </h3>
                  <ul className="space-y-4">
                    {comparisonData.with.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-zinc-300 text-sm">
                        <Check className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Slider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-zinc-600 cursor-ew-resize"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4 text-zinc-300" />
                </div>
              </div>

              {/* Slider Input */}
              <input
                type="range"
                min="10"
                max="90"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              />
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  )
}
