"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
  BrainCircuit,
  FolderLock,
  GitCompare,
  LibraryBig,
  Layers,
  CheckCircle2,
  ArrowRight,
  ScanSearch,
  Rocket,
  ShieldCheck,
  CircleDot,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

interface Feature {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  benefits: string[]
  color: string
  preview: React.ReactNode
  screenshot?: string
}

const tabItemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.06,
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
}

const panelTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 26,
}

const benefitListVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
}

const benefitItemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25 } },
}

const flowSteps = [
  { label: "Ask", icon: BrainCircuit, hint: "Intent captured" },
  { label: "Analyze", icon: ScanSearch, hint: "Context mapped" },
  { label: "Execute", icon: Rocket, hint: "Actions orchestrated" },
  { label: "Verify", icon: ShieldCheck, hint: "Audit confirmed" },
]

const executionStageByFeature: Record<string, number> = {
  ai: 1,
  evidence: 2,
  gap: 3,
  standards: 4,
}

const features: Feature[] = [
  {
    id: "ai",
    icon: BrainCircuit,
    title: "Horus AI",
    description: "Assistant and agent in one place, with context across your full quality workspace.",
    benefits: [
      "Context-aware answers tied to real institutional data",
      "Agent actions with approval and full audit trail",
      "Cross-module planning and follow-through",
    ],
    color: "from-violet-500 to-purple-600",
    preview: (
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[320px]">
        {/* Chat Header */}
        <div className="bg-muted/30 border-b border-border/50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[var(--brand)]/10 flex items-center justify-center border border-[var(--brand)]/20">
                <BrainCircuit className="w-4 h-4 text-[var(--brand)]" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">Horus AI</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Online</div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-border" />
            <div className="w-2 h-2 rounded-full bg-border" />
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 p-4 space-y-4 bg-gradient-to-b from-transparent to-muted/5 relative overflow-hidden">
          {/* User Message */}
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-tr-none text-xs max-w-[85%] shadow-md">
              What evidence do I need for standard 4.2?
            </div>
          </div>

          {/* AI Message */}
          <div className="flex gap-3 max-w-[90%]">
            <div className="w-6 h-6 rounded-full bg-[var(--brand)]/10 flex items-center justify-center border border-[var(--brand)]/20 text-[var(--brand)] shrink-0 mt-1">
              <BrainCircuit className="w-3 h-3" />
            </div>
            <div className="space-y-2">
              <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-tl-none text-xs text-foreground shadow-sm">
                <p className="mb-2">For Standard 4.2 (Stakeholder Requirements), specific evidence is required:</p>
                <ul className="space-y-1 text-muted-foreground pl-4 list-disc">
                  <li>Stakeholder identification matrix</li>
                  <li>Communication plan records</li>
                  <li>Feedback survey analysis</li>
                </ul>
              </div>
              {/* Simulated file attachment suggestion */}
              <div className="flex gap-2">
                <div className="px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50 text-[10px] text-muted-foreground flex items-center gap-1.5 hover:bg-muted transition-colors cursor-pointer">
                  <CheckCircle2 className="w-3 h-3 text-amber-500" />
                  Auto-generate Matrix
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Input Mock */}
        <div className="p-3 border-t border-border/50 bg-card">
          <div className="bg-muted/30 border border-border/50 rounded-full h-10 flex items-center px-4 justify-between">
            <span className="text-xs text-muted-foreground/50">Ask follow-up question...</span>
            <div className="w-6 h-6 rounded-full bg-[var(--brand)] flex items-center justify-center">
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "evidence",
    icon: FolderLock,
    title: "Evidence Management",
    description: "Upload once, then let Horus classify, map, and surface missing evidence instantly.",
    benefits: [
      "AI classification and structured tagging",
      "Automatic evidence-to-criteria mapping",
      "Conversation-based evidence retrieval",
    ],
    color: "from-emerald-500 to-teal-600",
    preview: (
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[320px]">
        {/* Toolbar */}
        <div className="p-3 border-b border-border/50 flex justify-between items-center bg-muted/20">
          <div className="text-xs font-bold text-foreground flex items-center gap-2">
            <div className="p-1 bg-emerald-500/10 rounded-md text-emerald-500"><FolderLock className="w-3.5 h-3.5" /></div>
            Evidence Vault
          </div>
          <div className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-md">
            + Upload
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 px-4 py-2 border-b border-border/50 bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-6">Name</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-3 text-right">Size</div>
        </div>

        {/* Rows */}
        <div className="p-2 space-y-1 bg-background/50 flex-1">
          {[
            { name: "Strategic_Plan_2024.pdf", size: "2.4 MB", status: "Analyzed", color: "text-emerald-500 bg-emerald-500/10", icon: "PDF" },
            { name: "Faculty_Handbook_v3.docx", size: "1.1 MB", status: "Processing", color: "text-amber-500 bg-amber-500/10", icon: "DOC" },
            { name: "Dept_Audit_Logs.xlsx", size: "850 KB", status: "Analyzed", color: "text-emerald-500 bg-emerald-500/10", icon: "XLS" },
            { name: "Safety_Procedures.pdf", size: "3.2 MB", status: "Review", color: "text-blue-500 bg-blue-500/10", icon: "PDF" },
          ].map((file, i) => (
            <div key={i} className="grid grid-cols-12 items-center px-3 py-2.5 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors cursor-default group">
              <div className="col-span-6 flex items-center gap-2.5 overflow-hidden">
                <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground border border-border/50 group-hover:border-border">
                  {file.icon}
                </div>
                <span className="text-xs font-medium text-foreground truncate">{file.name}</span>
              </div>
              <div className="col-span-3">
                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide", file.color)}>
                  {file.status}
                </span>
              </div>
              <div className="col-span-3 text-right text-[10px] text-muted-foreground font-mono">
                {file.size}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "gap",
    icon: GitCompare,
    title: "Gap Analysis",
    description: "Detect compliance gaps fast and move to prioritized remediation steps.",
    benefits: [
      "Conversational gap discovery",
      "Risk scoring with priority order",
      "Track remediation progress in real time",
    ],
    color: "from-amber-500 to-orange-600",
    preview: (
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[320px]">
        <div className="p-4 border-b border-border/50">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Overall Compliance</div>
              <div className="text-2xl font-black text-foreground">ISO 21001:2018</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-emerald-500">84%</div>
              <div className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded inline-block">+2.4%</div>
            </div>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 bg-muted/10 flex-1">
          {/* Metric Cards */}
          <div className="bg-card border border-border/50 p-3 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500"><GitCompare className="w-3.5 h-3.5" /></div>
              <span className="text-[10px] font-bold text-red-500 uppercase">Critical</span>
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">3</div>
              <div className="text-[10px] text-muted-foreground">Immediate action</div>
            </div>
          </div>

          <div className="bg-card border border-border/50 p-3 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500"><CheckCircle2 className="w-3.5 h-3.5" /></div>
              <span className="text-[10px] font-bold text-amber-500 uppercase">Warning</span>
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">12</div>
              <div className="text-[10px] text-muted-foreground">Review needed</div>
            </div>
          </div>

          {/* Progress list */}
          <div className="col-span-2 space-y-2 mt-2">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Category Breakdown</div>
            {[
              { label: "Leadership", val: 92, color: "bg-emerald-500" },
              { label: "Planning", val: 65, color: "bg-amber-500" },
              { label: "Support", val: 78, color: "bg-blue-500" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <div className="w-16 font-medium text-muted-foreground">{item.label}</div>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.val}%` }} />
                </div>
                <div className="w-6 text-right font-mono text-[10px]">{item.val}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "standards",
    icon: LibraryBig,
    title: "Standards Hub",
    description: "Query standards in plain language and get practical implementation guidance.",
    benefits: [
      "Natural language standard queries",
      "Implementation roadmaps on demand",
      "Multi-framework alignment support",
    ],
    color: "from-blue-500 to-cyan-600",
    preview: (
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[320px]">
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-background to-muted/20">
          <h4 className="text-sm font-bold text-foreground">Standard Frameworks</h4>
          <p className="text-[10px] text-muted-foreground mt-0.5">Active Standards Library</p>
        </div>

        <div className="p-3 space-y-2 max-h-full overflow-hidden">
          {[
            { code: "ISO 21001", name: "Management Systems for EOPs", progress: 100, status: "Active" },
            { code: "NAQAAE", name: "National Quality Assurance", progress: 45, status: "In Progress" },
            { code: "ABET", name: "Computing Accreditation", progress: 12, status: "Setup" },
          ].map((std, i) => (
            <div key={i} className="border border-border/50 rounded-xl p-3 bg-muted/5 hover:bg-muted/10 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs border border-blue-500/20">
                    {std.code.split(' ')[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{std.code}</div>
                    <div className="text-[10px] text-muted-foreground">{std.name}</div>
                  </div>
                </div>
                {std.progress === 100 ? (
                  <div className="text-emerald-500"><CheckCircle2 className="w-4 h-4" /></div>
                ) : (
                  <div className="text-[10px] font-mono font-bold text-muted-foreground">{std.progress}%</div>
                )}
              </div>
              {/* Clauses mini-viz */}
              <div className="flex gap-0.5 pt-1">
                {Array.from({ length: 8 }).map((_, j) => (
                  <div
                    key={j}
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      (j / 8) * 100 < std.progress
                        ? "bg-blue-500"
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

export function FeatureShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const reduceMotion = useReducedMotion()
  const activeFeature = features[activeIndex]
  const activeFeatureIndex = useMemo(() => activeIndex, [activeIndex])
  const executionStage = executionStageByFeature[activeFeature.id] ?? 1

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [])

  return (
    <section id="features" className="relative py-[calc(var(--spacing-section)-1rem)] px-[var(--spacing-content)] bg-muted/10 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,hsl(var(--primary)/0.10),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,hsl(var(--primary)/0.08),transparent_50%)]" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 30, 0], y: [0, -20, 0], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-[var(--brand)]/10 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, -25, 0], y: [0, 15, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand)]/10 border border-[var(--brand)]/20 text-[var(--brand)] text-xs font-medium mb-4">
            <Layers className="w-3.5 h-3.5" />
            Platform Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Horus AI in
            <span className="text-[var(--brand)]"> Real Workflow</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real platform flow from question to action across evidence, standards, and compliance operations.
          </p>
        </motion.div>

        <div className="mb-7 overflow-x-auto">
          <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 rounded-full border border-border/60 bg-card/80 p-1 shadow-[var(--glass-shadow)]">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const isActive = index === activeIndex
              return (
                <motion.button
                  key={feature.id}
                  onClick={() => setActiveIndex(index)}
                  whileHover={reduceMotion ? undefined : { y: -1 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeDockBg"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={panelTransition}
                    />
                  )}
                  <Icon className="relative z-10 h-3.5 w-3.5" />
                  <span className="relative z-10 whitespace-nowrap">{feature.title}</span>
                </motion.button>
              )
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8 items-start">
          <div className="rounded-2xl border border-border/60 bg-card/75 backdrop-blur-[12px] shadow-[var(--glass-shadow)] overflow-hidden">
            <div className="border-b border-border/60 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">Live Platform View</p>
                <h3 className="text-sm md:text-base font-semibold text-foreground">{activeFeature.title}</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                <CircleDot className="w-3 h-3" />
                Stage {executionStage}/4
              </span>
            </div>
            <div className="p-3">
              <div className="relative">
                <div
                  className={cn(
                    "absolute -inset-1 rounded-2xl bg-gradient-to-r opacity-25 blur-xl",
                    activeFeature.color
                  )}
                />
                <div className="relative rounded-xl border border-border/60 bg-card/90 p-1 overflow-hidden min-h-[330px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`preview-${activeFeature.id}`}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.99 }}
                      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {activeFeature.screenshot ? (
                        <Image
                          src={activeFeature.screenshot}
                          alt={`${activeFeature.title} screenshot`}
                          width={1280}
                          height={720}
                          className="h-[330px] w-full rounded-lg object-cover"
                        />
                      ) : (
                        activeFeature.preview
                      )}
                    </motion.div>
                  </AnimatePresence>
                  {!reduceMotion && (
                    <motion.div
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
                      animate={{ x: ["0%", "420%"] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.4 }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card/75 backdrop-blur-[12px] shadow-[var(--glass-shadow)] p-4">
              <h4 className="font-semibold text-foreground mb-2">From Ask To Action</h4>
              <p className="text-sm text-muted-foreground mb-4">{activeFeature.description}</p>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Execution Flow</p>
                <p className="text-[11px] font-medium text-muted-foreground">Module {activeFeatureIndex + 1} of {features.length}</p>
              </div>
              <div className="relative mb-4">
                <div className="absolute left-4 right-4 top-[18px] h-px bg-border" />
                <motion.div
                  key={`flow-progress-${activeFeature.id}`}
                  className={cn("absolute left-4 top-[18px] h-px bg-gradient-to-r", activeFeature.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `calc(${(executionStage / flowSteps.length) * 100}% - 1rem)` }}
                  transition={panelTransition}
                />
                <div className="grid grid-cols-4 gap-2">
                  {flowSteps.map((step, stepIndex) => {
                    const StepIcon = step.icon
                    const isDone = stepIndex < executionStage - 1
                    const isCurrent = stepIndex === executionStage - 1
                    return (
                      <div key={step.label} className="relative pt-8 text-center">
                        <div className={cn("mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full border text-[10px]", isDone ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" : isCurrent ? "border-primary/30 bg-primary/12 text-primary" : "border-border bg-muted/50 text-muted-foreground")}>
                          <StepIcon className="h-3.5 w-3.5" />
                        </div>
                        <p className={cn("text-[11px] font-semibold", isCurrent ? "text-foreground" : "text-muted-foreground")}>{step.label}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
              <motion.ul
                variants={benefitListVariants}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {activeFeature.benefits.map((benefit, i) => (
                  <motion.li
                    key={i}
                    variants={benefitItemVariants}
                    className="flex items-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{benefit}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                <p className="text-[11px] uppercase text-muted-foreground font-semibold">Mapped Evidence</p>
                <p className="text-xl font-bold text-foreground mt-1">2.3K+</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                <p className="text-[11px] uppercase text-muted-foreground font-semibold">Active Standards</p>
                <p className="text-xl font-bold text-foreground mt-1">14</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                <p className="text-[11px] uppercase text-muted-foreground font-semibold">Agent Actions</p>
                <p className="text-xl font-bold text-foreground mt-1">87%</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Link href="/platform/horus-ai">
                <Button className="w-full gap-2">
                  Open Horus AI
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/platform/dashboard">
                <Button variant="outline" className="w-full">
                  View Platform
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
