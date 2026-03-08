"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { School, GraduationCap, Library, CheckCircle2, ArrowRight, ShieldCheck, Award, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const AUDIENCES = [
  {
    id: "schools",
    title: "Schools",
    icon: School,
    description: "Automate your self-study reports and never waste time hunting down faculty evidence. Ready for local and international audits in minutes.",
    features: [
      "Auto-tagging to basic criteria",
      "Readiness dashboard for principals",
      "Task assignment to teachers",
      "One-click audit export"
    ],
    accent: "bg-blue-500",
    textHover: "group-hover:text-blue-500",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(59,130,246,0.1), transparent 50%)"
  },
  {
    id: "universities",
    title: "Universities",
    icon: GraduationCap,
    description: "Manage cross-faculty NCAAA compliance dynamically with zero duplicated effort. Keep all colleges synced.",
    features: [
      "Multi-program tracking",
      "Deep gap analysis engine",
      "Real-time collegiate auditing",
      "Faculty evidence aggregation"
    ],
    accent: "bg-emerald-500",
    textHover: "group-hover:text-emerald-500",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(16,185,129,0.1), transparent 50%)"
  },
  {
    id: "training",
    title: "Training Centers",
    icon: Library,
    description: "Align your operational procedures with international standards effortlessly without hiring expensive consultants.",
    features: [
      "Policy generation & review",
      "Version control over time",
      "Quick evidence mapping",
      "Professional framework alignment"
    ],
    accent: "bg-amber-500",
    textHover: "group-hover:text-amber-500",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(245,158,11,0.1), transparent 50%)"
  },
]

export function AboutSection() {
  const [activeTab, setActiveTab] = useState(AUDIENCES[0].id)
  
  const currentTab = AUDIENCES.find(a => a.id === activeTab) || AUDIENCES[0]

  return (
    <section id="about" className="relative py-24 md:py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 md:mb-24"
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10 text-xs font-bold uppercase tracking-[0.15em] text-primary mb-4">
            Built for you
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Horus AI Works for Every Institution
          </h2>
          <p className="text-foreground/50 text-base md:text-lg max-w-2xl mx-auto">
            One intelligent assistant that adapts to your institution's needs.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 lg:h-[480px]">
          
          {/* Left: Interactive Tabs */}
          <div className="flex flex-col gap-3 lg:w-1/3 z-20">
            {AUDIENCES.map((item) => {
              const isActive = activeTab === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "relative flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-300 group outline-none focus-visible:ring-2 focus-visible:ring-primary overflow-hidden",
                    isActive 
                      ? "bg-white border-black/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] scale-[1.02]" 
                      : "bg-white/40 border-black/5 hover:bg-white/60 hover:scale-[1.01]"
                  )}
                >
                  {/* Indicator Line */}
                  {isActive && (
                    <motion.div 
                      layoutId="aboutTabIndicator"
                      className={cn("absolute left-0 top-0 bottom-0 w-1.5", item.accent)}
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  <div className={cn(
                    "p-3 rounded-xl flex items-center justify-center transition-colors duration-300",
                    isActive ? "bg-black/5 text-foreground" : "bg-black/5 text-foreground/40 group-hover:text-foreground/70"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className={cn(
                    "font-bold text-lg transition-colors duration-300",
                    isActive ? "text-foreground" : cn("text-foreground/50", item.textHover)
                  )}>
                    {item.title}
                  </h3>
                </button>
              )
            })}
          </div>

          {/* Right: Dynamic Display View */}
          <div className="lg:w-2/3 h-full relative rounded-3xl border border-black/10 bg-white shadow-xl overflow-hidden z-20">
            
            {/* Dynamic Background Pattern */}
            <AnimatePresence mode="popLayout">
              <motion.div 
                key={`${currentTab.id}-bg`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 pointer-events-none"
                style={{ background: currentTab.bgPattern }}
              />
            </AnimatePresence>

            {/* Content Area */}
            <div className="relative z-10 p-8 md:p-12 h-full flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col h-full"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg", currentTab.accent)}>
                      <currentTab.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                      For {currentTab.title}
                    </h3>
                  </div>
                  
                  <p className="text-lg text-foreground/60 leading-relaxed mb-8 max-w-lg">
                    {currentTab.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                    {currentTab.features.map((feature, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                        key={feature} 
                        className="flex items-center gap-3 p-3 rounded-xl bg-black/5 border border-black/5"
                      >
                        <CheckCircle2 className={cn("w-4 h-4", i % 2 === 0 ? "text-primary" : "text-emerald-500")} />
                        <span className="text-sm font-semibold text-foreground/80">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Subtle decorative dot grid overlay */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(black 1px, transparent 1px)`,
                backgroundSize: '16px 16px',
                maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
              }}
            />
          </div>
        </div>

      </div>
    </section>
  )
}
