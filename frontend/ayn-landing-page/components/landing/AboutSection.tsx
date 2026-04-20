"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { School, GraduationCap, Library, CheckCircle2 } from "lucide-react"
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
  },
  {
    id: "universities",
    title: "Universities",
    icon: GraduationCap,
    description: "Manage cross-faculty NCAAA compliance dynamically with zero duplicated effort. Keep all colleges synced in real-time.",
    features: [
      "Multi-program tracking",
      "Deep gap analysis engine",
      "Real-time collegiate auditing",
      "Faculty evidence aggregation"
    ],
  },
  {
    id: "training",
    title: "Training Centers",
    icon: Library,
    description: "Align your operational procedures with international standards effortlessly without hiring expensive external consultants.",
    features: [
      "Policy generation & review",
      "Version control over time",
      "Quick evidence mapping",
      "Professional framework alignment"
    ],
  },
]

export function AboutSection() {
  const [activeTab, setActiveTab] = useState(AUDIENCES[0].id)
  const currentTab = AUDIENCES.find(a => a.id === activeTab) || AUDIENCES[0]

  return (
    <section id="about" className="relative py-32 px-6 overflow-hidden bg-transparent">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full translate-x-1/3" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold uppercase tracking-[0.2em] text-slate-600 mb-6 shadow-sm">
            Built for you
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter text-slate-900 mb-6">
            One intelligence. <br className="hidden sm:block" />
            <span className="text-slate-400">Infinite adaptability.</span>
          </h2>
          <p className="text-slate-600 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Whether you govern a single school or an entire university system, Horus AI adapts its compliance engine to your exact scale.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 lg:h-[480px]">
          
          {/* Left: Interactive Tabs */}
          <div className="flex flex-col gap-3 lg:w-1/3 z-20">
            {AUDIENCES.map((item, i) => {
              const isActive = activeTab === item.id
              const Icon = item.icon
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full relative flex items-center gap-4 p-5 rounded-3xl border text-left transition-all duration-300 outline-none overflow-hidden group",
                    isActive 
                      ? "bg-white border-slate-200 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] scale-[1.02]" 
                      : "bg-transparent border-transparent hover:bg-white/60 hover:border-slate-200 hover:scale-[1.01]"
                  )}
                >
                  {/* Indicator Line */}
                  {isActive && (
                    <motion.div 
                      layoutId="aboutTabIndicator"
                      className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  <div className={cn(
                    "p-3 rounded-xl flex items-center justify-center transition-all duration-300",
                    isActive ? "bg-slate-100 text-slate-900" : "bg-transparent text-slate-500 group-hover:text-slate-700 group-hover:bg-slate-100"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className={cn(
                    "font-bold text-lg transition-colors duration-300 tracking-tight",
                    isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"
                  )}>
                    {item.title}
                  </h3>
                </motion.button>
              )
            })}
          </div>

          {/* Right: Dynamic Display View */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="lg:w-2/3 h-full relative rounded-[2rem] bg-white/70 backdrop-blur-xl border border-slate-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.05)] overflow-hidden z-20 flex"
          >
            {/* Developer Grid Pattern */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)`,
                backgroundSize: '30px 30px',
                maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
              }}
            />

            {/* Content Area */}
            <div className="relative z-10 p-10 md:p-14 w-full h-full flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab.id}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex flex-col h-full"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-800">
                      <currentTab.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                      For {currentTab.title}
                    </h3>
                  </div>
                  
                  <p className="text-slate-600 text-lg leading-relaxed mb-10 max-w-xl font-medium">
                    {currentTab.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 mt-auto">
                    {currentTab.features.map((feature, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                        key={feature} 
                        className="flex items-center gap-4 group"
                      >
                        <div className="w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-[15px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  )
}
