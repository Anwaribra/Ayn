"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Database, BrainCircuit, GitMerge, LineChart, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"

const FEATURES = [
  {
    id: "evidence",
    title: "Evidence Vault",
    description: "Auto-maps uploaded documents to the right compliance criterion.",
    icon: Database,
    logs: [
       { delay: 0, text: "> Initializing secure vault...", type: "system" },
       { delay: 800, text: "> Uploading 42 pending documents...", type: "info" },
       { delay: 1500, text: "> Extracting metadata and context...", type: "process" },
       { delay: 2200, text: "✓ Successfully mapped 38 documents to ISO 21001", type: "success" },
       { delay: 2800, text: "⚠ 4 documents require human review (Ambiguous tags)", type: "warning" },
       { delay: 3500, text: "> Awaiting further evidence...", type: "system" },
    ]
  },
  {
    id: "analysis", 
    title: "Horus Gap Analysis",
    description: "Detect compliance gaps and risk priorities in real-time.",
    icon: BrainCircuit,
    logs: [
       { delay: 0, text: "> Initiating Horus Intelligence Engine...", type: "system" },
       { delay: 600, text: "> Cross-referencing NCAAA Framework...", type: "info" },
       { delay: 1400, text: "[████████░░] 85% Processed", type: "process" },
       { delay: 2000, text: "✖ Critical Gap Detected: Standard 4.2 (Missing Course Reports)", type: "error" },
       { delay: 2700, text: "> Generating remediation tasks...", type: "process" },
       { delay: 3400, text: "✓ 3 actions drafted for Standard Program heads", type: "success" },
    ]
  },
  {
    id: "workflow",
    title: "Workflow Engine",
    description: "Turn recommendations into approved actions with traceable steps.",
    icon: GitMerge,
    logs: [
       { delay: 0, text: "> Syncing pending action items...", type: "system" },
       { delay: 700, text: "> Assigning [Task-104]: Update Policy Document", type: "info" },
       { delay: 1500, text: "> Routing to Quality Assurance team for approval...", type: "process" },
       { delay: 2400, text: "✓ Approval received from Dr. Ahmed", type: "success" },
       { delay: 3100, text: "> Updating compliance status to [IN PROGRESS]", type: "info" },
       { delay: 3800, text: "> Traceable audit log secured.", type: "success" },
    ]
  },
  {
    id: "analytics",
    title: "Readiness Analytics",
    description: "Track evidence coverage and action velocity from one panel.",
    icon: LineChart,
    logs: [
       { delay: 0, text: "> Querying real-time readiness metrics...", type: "system" },
       { delay: 800, text: "> Aggregating institutional data...", type: "process" },
       { delay: 1600, text: "📊 Overall Readiness Score: 82%", type: "info" },
       { delay: 2200, text: "📈 Evidence Coverage: 91% (+4% this week)", type: "success" },
       { delay: 2900, text: "📉 Action Velocity: 12 closed / 5 open (High Activity)", type: "info" },
       { delay: 3500, text: "> Dashboard visualisations rendered.", type: "success" },
    ]
  }
]

export function AnalysisEngineFeatures() {
  const [activeFeature, setActiveFeature] = useState(FEATURES[0].id)
  
  // Terminal log typing effect state
  const [visibleLogs, setVisibleLogs] = useState<number>(0)

  useEffect(() => {
    setVisibleLogs(0)
    const activeData = FEATURES.find(f => f.id === activeFeature)
    if (!activeData) return

    const timeouts: NodeJS.Timeout[] = []
    
    activeData.logs.forEach((log, index) => {
      const timeout = setTimeout(() => {
        setVisibleLogs(prev => Math.max(prev, index + 1))
      }, log.delay)
      timeouts.push(timeout)
    })

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [activeFeature])

  const currentFeature = FEATURES.find(f => f.id === activeFeature) || FEATURES[0]

  return (
    <section id="features" className="relative py-16 px-6 max-w-6xl mx-auto z-10 scroll-mt-24 pb-32">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
          Core Engine Features
        </h2>
        <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto">
          Select a module to see how Horus handles complex compliance tasks in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Sidebar: Tabs */}
        <div className="lg:col-span-4 flex flex-col gap-3 relative z-20">
          {FEATURES.map((feature) => {
            const isActive = activeFeature === feature.id
            const Icon = feature.icon
            return (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={cn(
                  "relative text-left p-5 rounded-xl border transition-all duration-300 overflow-hidden group outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  isActive 
                    ? "bg-emerald-500/10 border-emerald-500/30" 
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                )}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-2 rounded-lg flex shrink-0 transition-colors",
                    isActive ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-white/5 text-white/40 group-hover:text-white/60 group-hover:bg-white/10"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={cn(
                      "font-semibold mb-1 transition-colors text-base",
                      isActive ? "text-emerald-400" : "text-white/80 group-hover:text-white"
                    )}>
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white/50 leading-relaxed font-medium">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Right Side: Terminal Window */}
        <div className="lg:col-span-8 flex flex-col h-[400px] shadow-2xl relative z-20">
          {/* Mac-style Window header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0c121e]/80 backdrop-blur-md border border-white/10 border-b-0 rounded-t-xl z-10">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <div className="flex items-center gap-2 text-white/40 text-[11px] uppercase tracking-wider font-mono">
              <Terminal className="w-3.5 h-3.5" />
              horus_engine
            </div>
            <div className="w-12" /> {/* Spacer for balance */}
          </div>

          {/* Terminal Body */}
          <div className="flex-1 bg-[#050810]/90 backdrop-blur-xl border border-white/10 border-t-0 rounded-b-xl p-6 font-mono text-[13px] md:text-sm overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {/* Subtle grid bg inside terminal */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.02]"
              style={{
                backgroundImage: `linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
              }}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={currentFeature.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-3 relative z-10"
              >
                {currentFeature.logs.map((log, index) => {
                  const isVisible = index < visibleLogs
                  
                  if (!isVisible) return null

                  // Color coding for terminal output
                  let colorClass = "text-white/60"
                  if (log.type === "system") colorClass = "text-blue-400"
                  if (log.type === "info") colorClass = "text-white/80"
                  if (log.type === "success") colorClass = "text-emerald-400"
                  if (log.type === "warning") colorClass = "text-amber-400"
                  if (log.type === "error") colorClass = "text-[#ff5f56]"
                  if (log.type === "process") colorClass = "text-purple-400"

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn("flex flex-wrap break-words leading-relaxed", colorClass)}
                    >
                      {log.text}
                    </motion.div>
                  )
                })}
                
                {/* Blinking cursor at the end if the last log is visible */}
                {visibleLogs > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 w-2 h-4 bg-emerald-400/80"
                    style={{ animation: "blink 1s step-end infinite" }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
