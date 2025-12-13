"use client"

import { FileCheck, ClipboardList, Upload, LayoutDashboard, Sparkles, Shield } from "lucide-react"
import { ScrollAnimationWrapper } from "./scroll-animation-wrapper"
import { TiltCard } from "./tilt-card"
import { AnimatedCounter } from "./animated-counter"
import { cn } from "@/lib/utils"

const bentoItems = [
  {
    icon: FileCheck,
    title: "Standards & Criteria",
    description: "Organize ISO 21001 & NAQAAE standards with precision",
    stat: { value: 500, suffix: "+", label: "Standards Tracked" },
    className: "md:col-span-2 md:row-span-2",
    featured: true,
  },
  {
    icon: ClipboardList,
    title: "Assessments",
    description: "Seamless Draft → Submit → Review",
    stat: { value: 98, suffix: "%", label: "Accuracy Rate" },
    className: "md:col-span-1",
  },
  {
    icon: Upload,
    title: "Evidence Manager",
    description: "Smart categorization",
    className: "md:col-span-1",
  },
  {
    icon: LayoutDashboard,
    title: "Smart Dashboard",
    description: "Real-time insights at your fingertips",
    stat: { value: 24, suffix: "/7", label: "Monitoring" },
    className: "md:col-span-1",
  },
  {
    icon: Sparkles,
    title: "Horus Engine",
    description: "AI-powered workflow automation",
    className: "md:col-span-1",
  },
  {
    icon: Shield,
    title: "Compliance Ready",
    description: "Always audit-ready documentation",
    stat: { value: 100, suffix: "%", label: "Compliance" },
    className: "md:col-span-2",
  },
]

export function BentoGrid() {
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950/50 to-black" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <ScrollAnimationWrapper className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-light mb-4 text-balance">
            <span className="bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {bentoItems.map((item, index) => (
            <ScrollAnimationWrapper key={index} animation="fade-up" delay={index * 75} className={item.className}>
              <TiltCard className="h-full">
                <div
                  className={cn(
                    "group relative h-full p-6 rounded-2xl border border-zinc-800/50 backdrop-blur-sm transition-all duration-500",
                    "bg-gradient-to-br from-zinc-900/80 to-zinc-950/80",
                    "hover:border-zinc-700/50 hover:shadow-[0_0_40px_rgba(100,100,100,0.1)]",
                    item.featured && "bg-gradient-to-br from-zinc-800/50 to-zinc-900/50",
                  )}
                >
                  {/* Noise texture overlay */}
                  <div className="absolute inset-0 rounded-2xl opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

                  <div className="relative flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center group-hover:border-zinc-600/50 transition-all duration-300 group-hover:scale-110">
                        <item.icon className="w-6 h-6 text-zinc-400 group-hover:text-zinc-200 transition-colors duration-300" />
                      </div>
                      {item.stat && (
                        <div className="text-right">
                          <div className="text-2xl font-light text-zinc-200">
                            <AnimatedCounter end={item.stat.value} suffix={item.stat.suffix} />
                          </div>
                          <div className="text-xs text-zinc-500">{item.stat.label}</div>
                        </div>
                      )}
                    </div>

                    <h3
                      className={cn(
                        "font-medium text-zinc-200 mb-2 text-balance",
                        item.featured ? "text-xl" : "text-lg",
                      )}
                    >
                      {item.title}
                    </h3>

                    <p className={cn("text-zinc-500 leading-relaxed", item.featured ? "text-base" : "text-sm")}>
                      {item.description}
                    </p>

                    {item.featured && (
                      <div className="mt-auto pt-6 flex gap-2">
                        {["ISO 21001", "NAQAAE", "Quality"].map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 text-xs rounded-full bg-zinc-800/50 border border-zinc-700/30 text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TiltCard>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
