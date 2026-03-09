"use client"

import { motion } from "framer-motion"
import { Database, BrainCircuit } from "lucide-react"
import { FadeUp, StaggerContainer, StaggerItem } from "./reveal-on-scroll"

const STEPS = [
  {
    number: "01",
    title: "Upload Evidence",
    description:
      "Drag in your documents, policies, and records. Ayn auto-organises and tags every file to the right compliance criterion. No provisioning, no manual sorting.",
  },
  {
    number: "02",
    title: "Horus takes over",
    description:
      "It reads across all your evidence, maps gaps to ISO, NCAAA, and global frameworks, and surfaces prioritised insights. It operates across your secure internal workspace.",
  },
  {
    number: "03",
    title: "Execute Actions",
    description:
      "Turn Horus recommendations into traceable workflow steps. Assign, review, and close compliance actions from one unified view.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 md:py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <FadeUp className="text-center mb-24">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4">
            How it works
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-5xl font-bold tracking-tight text-white mb-6">
            From evidence to action <span className="text-white/40">in minutes.</span>
          </h2>
          <p className="text-white/40 text-sm md:text-base">
            Three steps. Whether it's a single policy or a full institutional audit.
          </p>
        </FadeUp>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Steps */}
          <StaggerContainer className="space-y-16" delayChildren={0.2} staggerChildren={0.15}>
            {STEPS.map((step, idx) => (
              <StaggerItem key={step.number} className="flex gap-6 md:gap-8">
                <div className="text-sm font-mono font-bold text-white/20 mt-1 select-none">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-white/40 leading-relaxed text-sm md:text-base">
                    {step.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Right Column: Node Diagram */}
          <FadeUp delay={0.3} className="relative lg:h-[500px] flex items-center justify-center">
            {/* Background grid pattern matching style */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
                maskImage: 'radial-gradient(circle at center, black 30%, transparent 70%)',
                WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 70%)',
              }}
            />
            
            {/* Radar circles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/[0.02]" />

            {/* Nodes Structure */}
            <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
              
              {/* Top Node */}
              <div className="flex flex-col items-center">
                <div className="w-full relative px-6 py-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                  <span className="text-sm font-bold text-white mb-1">Evidence Vault</span>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">Upload • Auto-Tag</span>
                  <Database className="absolute -right-3 -top-3 w-6 h-6 text-emerald-500/50" />
                </div>
                {/* Connecting Line */}
                <div className="w-px h-12 bg-gradient-to-b from-emerald-500/30 to-white/10" />
              </div>

              {/* Middle Node */}
              <div className="flex flex-col items-center w-full">
                <div className="w-full relative px-6 py-4 rounded-xl border border-white/15 bg-white/5 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                  <span className="text-sm font-bold text-white mb-1">Horus AI Agent</span>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">Analyze • Map Gaps</span>
                  <BrainCircuit className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
                </div>
                
                {/* Fork Line */}
                <div className="relative w-full h-12 flex justify-center">
                  <div className="absolute top-0 w-px h-6 bg-white/10" />
                  <div className="absolute top-6 w-[70%] h-px bg-white/10" />
                  <div className="absolute top-6 left-[15%] w-px h-6 bg-white/10" />
                  <div className="absolute top-6 right-[15%] w-px h-6 bg-white/10" />
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] text-white/20 uppercase tracking-widest font-mono bg-transparent px-2">Action Workflows</div>
                </div>
              </div>

              {/* Bottom Nodes */}
              <div className="flex justify-between w-full w-[85%] mt-2">
                <div className="px-4 py-3 rounded-xl border border-white/10 bg-black/40 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                   <span className="text-xs font-bold text-white/80 mb-1">ISO 21001</span>
                   <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono">Policy Update</span>
                </div>
                <div className="px-4 py-3 rounded-xl border border-white/10 bg-black/40 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                   <span className="text-xs font-bold text-white/80 mb-1">NCAAA</span>
                   <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono">Course Report</span>
                </div>
              </div>
              
               <div className="absolute -bottom-16 text-[10px] text-white/20 font-mono tracking-widest uppercase">
                  Traceable actions. Full compliance.
               </div>
            </div>

          </FadeUp>

        </div>
      </div>
    </section>
  )
}
