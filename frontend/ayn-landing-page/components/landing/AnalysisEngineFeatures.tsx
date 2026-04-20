"use client"

import { motion } from "framer-motion"
import { Database, Brain, GitMerge, LineChart, ShieldCheck, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const FEATURES = [
  {
    id: "evidence",
    title: "Evidence Vault",
    description: "Auto-maps uploaded documents to the right compliance criterion using AI. Seamlessly handling thousands of files without manual tagging.",
    icon: Database,
    className: "md:col-span-2 md:row-span-1", // Wide Bento box
    graphic: (
      <div className="absolute right-0 bottom-0 w-[60%] h-[60%] pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-700 blur-[1px]">
        {/* Abstract Document Grid */}
        <div className="absolute right-4 bottom-[-20%] w-full h-full flex flex-col gap-2 transform rotate-12 translate-x-12 translate-y-8">
          {[...Array(4)].map((_, i) => (
             <motion.div key={i} className="w-[110%] h-12 bg-white/5 border border-white/10 rounded-xl overflow-hidden flex items-center px-4 gap-3 shadow-xl backdrop-blur-3xl"
               initial={{ x: 50, opacity: 0 }}
               whileInView={{ x: 0, opacity: 1 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2 + i * 0.1, duration: 0.7 }}
             >
               <div className="w-4 h-4 rounded bg-primary/20 border border-primary/30" />
               <div className="w-1/2 h-1.5 rounded-full bg-white/10" />
             </motion.div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: "analysis", 
    title: "Horus Gap Analysis",
    description: "Detect compliance gaps and risk priorities in real-time, receiving instant actionable insights.",
    icon: Brain,
    className: "md:col-span-1 md:row-span-1",
  },
  {
    id: "workflow",
    title: "Workflow Engine",
    description: "Turn recommendations into approved actions. Fully traceable audit logs.",
    icon: GitMerge,
    className: "md:col-span-1 md:row-span-1",
    graphic: (
      <div className="absolute right-0 bottom-4 pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity translate-x-1/4">
        <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 40H40L50 20L70 60L80 40H110" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="40" cy="40" r="4" fill="rgba(255,255,255,0.4)"/>
          <circle cx="80" cy="40" r="4" fill="rgba(255,255,255,0.4)"/>
        </svg>
      </div>
    )
  },
  {
    id: "analytics",
    title: "Readiness Analytics",
    description: "Track evidence coverage and action velocity from a unified, elegant panel.",
    icon: LineChart,
    className: "md:col-span-1 md:row-span-1",
    graphic: (
      <div className="absolute left-0 bottom-0 w-full h-[40%] pointer-events-none flex items-end px-6 opacity-30 group-hover:opacity-50 transition-opacity">
        <div className="w-full flex items-end gap-2 h-full">
           <div className="w-1/4 bg-white/10 rounded-t-md h-[40%]" />
           <div className="w-1/4 bg-white/10 rounded-t-md h-[70%]" />
           <div className="w-1/4 bg-primary/30 rounded-t-md h-[100%] shadow-[0_0_15px_rgba(37,99,235,0.2)]" />
           <div className="w-1/4 bg-white/10 rounded-t-md h-[60%]" />
        </div>
      </div>
    )
  },
  {
    id: "security",
    title: "Zero-Trust Security",
    description: "Every piece of evidence is isolated. Data is heavily encrypted at rest and in transit.",
    icon: ShieldCheck,
    className: "md:col-span-1 md:row-span-1", // Standard Bento box
    graphic: (
      <div className="absolute right-0 top-0 h-full w-1/2 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity overflow-hidden">
        <div className="absolute right-[-10%] top-[-20%] w-[120%] h-[140%] border-[1px] border-white/5 rounded-full" />
        <div className="absolute right-[0%] top-[0%] w-[100%] h-[100%] border-[1px] border-white/5 rounded-full" />
        <div className="absolute right-[10%] top-[20%] w-[80%] h-[60%] border-[1px] border-primary/20 rounded-full bg-primary/5 blur-[20px]" />
      </div>
    )
  }
]

export function AnalysisEngineFeatures() {
  return (
    <section id="features" className="relative py-24 px-6 max-w-6xl mx-auto z-10 scroll-mt-24">
      {/* Glow Behind the Grid */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none"
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-20 relative z-20"
      >
        <span className="inline-block py-1 pb-4 text-sm tracking-widest text-primary/80 uppercase font-semibold">
          Platform Capabilities
        </span>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
          Intelligence packed in every workflow.
        </h2>
        <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto font-light">
          Whether it's auto-tagging evidence or detecting compliance gaps, Ayn brings everything into one unified, liquid interface.
        </p>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[220px] relative z-20">
        {FEATURES.map((feature, i) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 overflow-hidden hover:bg-white/[0.04] transition-colors duration-500",
                feature.className
              )}
            >
              {/* Subtle hover gradient / glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              {/* Abstract Graphic representing the feature */}
              {feature.graphic}

              <div className="relative z-10 flex flex-col h-full">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 mb-auto text-white/70 group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed font-light">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
