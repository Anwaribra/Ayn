"use client"

import { useState } from "react"
import { ScrollAnimationWrapper } from "./scroll-animation-wrapper"
import { Play, FileCheck, Upload, BarChart3, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const demoFeatures = [
  {
    id: "standards",
    icon: FileCheck,
    title: "Standards Management",
    description: "Organize ISO 21001 and NAQAAE standards in a clear hierarchy.",
  },
  {
    id: "evidence",
    icon: Upload,
    title: "Evidence Upload",
    description: "Upload and categorize evidence with smart tagging.",
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track compliance progress with live dashboards.",
  },
  {
    id: "workflow",
    icon: Users,
    title: "Team Workflows",
    description: "Assign tasks and manage review processes.",
  },
]

export function DemoSection() {
  const [activeFeature, setActiveFeature] = useState(demoFeatures[0].id)
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <section id="demo" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />

      {/* Decorative Elements */}
      <div className="absolute right-0 top-1/4 w-96 h-96 bg-zinc-800/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <ScrollAnimationWrapper className="text-center mb-16">
          <span className="inline-block text-xs uppercase tracking-widest text-zinc-500 mb-4">See It In Action</span>
          <h2 className="text-3xl md:text-4xl font-light mb-4 text-balance">
            <span className="bg-gradient-to-r from-zinc-300 via-white to-zinc-300 bg-clip-text text-transparent">
              Experience Ayn
            </span>
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Explore how Ayn simplifies educational quality management and accreditation workflows.
          </p>
        </ScrollAnimationWrapper>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Feature Selector */}
          <div className="lg:col-span-2 space-y-3">
            {demoFeatures.map((feature, index) => (
              <ScrollAnimationWrapper key={feature.id} animation="fade-left" delay={index * 100}>
                <button
                  onClick={() => setActiveFeature(feature.id)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all duration-300 group",
                    activeFeature === feature.id
                      ? "bg-zinc-900/50 border-zinc-600/50"
                      : "bg-zinc-900/20 border-zinc-800/30 hover:border-zinc-700/50",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300",
                        activeFeature === feature.id
                          ? "bg-zinc-700/50 border border-zinc-600/50"
                          : "bg-zinc-800/30 border border-zinc-700/20",
                      )}
                    >
                      <feature.icon
                        className={cn(
                          "w-5 h-5 transition-colors duration-300",
                          activeFeature === feature.id ? "text-zinc-200" : "text-zinc-500",
                        )}
                      />
                    </div>
                    <div>
                      <h3
                        className={cn(
                          "font-medium transition-colors duration-300",
                          activeFeature === feature.id ? "text-zinc-200" : "text-zinc-400",
                        )}
                      >
                        {feature.title}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-1">{feature.description}</p>
                    </div>
                  </div>
                </button>
              </ScrollAnimationWrapper>
            ))}
          </div>

          {/* Demo Preview */}
          <ScrollAnimationWrapper animation="fade-right" className="lg:col-span-3">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-6 rounded-md bg-zinc-800/50 flex items-center px-3">
                    <span className="text-xs text-zinc-500">app.ayn.edu/dashboard</span>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                {/* Simulated Dashboard UI */}
                <div className="absolute inset-0 p-4">
                  {/* Sidebar */}
                  <div className="absolute left-0 top-0 bottom-0 w-48 bg-zinc-900/50 border-r border-zinc-800/50 p-4">
                    <div className="h-6 w-24 bg-zinc-800/50 rounded mb-6" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-8 rounded transition-colors duration-300",
                            i === 1 ? "bg-zinc-700/50" : "bg-zinc-800/30",
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="ml-52 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-48 bg-zinc-800/50 rounded" />
                      <div className="flex gap-2">
                        <div className="h-8 w-20 bg-zinc-800/50 rounded" />
                        <div className="h-8 w-20 bg-zinc-700/50 rounded" />
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/30">
                          <div className="h-3 w-16 bg-zinc-800/50 rounded mb-2" />
                          <div className="h-6 w-12 bg-zinc-700/50 rounded" />
                        </div>
                      ))}
                    </div>

                    {/* Chart Area */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/30 aspect-[4/3]">
                        <div className="h-3 w-24 bg-zinc-800/50 rounded mb-4" />
                        <div className="flex items-end justify-between h-24 gap-2">
                          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-zinc-700/50 rounded-t animate-pulse"
                              style={{
                                height: `${h}%`,
                                animationDelay: `${i * 100}ms`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/30">
                        <div className="h-3 w-24 bg-zinc-800/50 rounded mb-4" />
                        <div className="space-y-2">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded bg-zinc-800/50" />
                              <div className="flex-1">
                                <div className="h-3 w-full bg-zinc-800/30 rounded mb-1" />
                                <div className="h-2 w-2/3 bg-zinc-800/20 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Play Button Overlay */}
                {!isPlaying && (
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm group"
                  >
                    <div className="w-20 h-20 rounded-full bg-zinc-800/80 border border-zinc-600/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-zinc-700/80 transition-all duration-300">
                      <Play className="w-8 h-8 text-zinc-200 ml-1" fill="currentColor" />
                    </div>
                  </button>
                )}
              </div>
            </div>
          </ScrollAnimationWrapper>
        </div>
      </div>
    </section>
  )
}
