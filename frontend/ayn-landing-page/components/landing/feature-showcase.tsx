"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bot,
  FileText,
  BarChart3,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Feature {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  benefits: string[]
  color: string
  preview: React.ReactNode
}

const features: Feature[] = [
  {
    id: "ai",
    icon: Bot,
    title: "Horus AI",
    description: "Your central intelligence for education quality. Horus AI understands your entire institution—evidence, compliance, gaps, and progress—providing insights across every module.",
    benefits: [
      "Context-aware answers about your institution's status",
      "Automated document analysis and classification",
      "Cross-module insights and recommendations",
      "Multi-language support including Arabic",
    ],
    color: "from-violet-500 to-purple-600",
    preview: (
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[320px]">
        {/* Chat Header */}
        <div className="bg-muted/30 border-b border-border/50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[var(--brand)]/10 flex items-center justify-center border border-[var(--brand)]/20">
                <Bot className="w-4 h-4 text-[var(--brand)]" />
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
              <Bot className="w-3 h-3" />
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
                  <Zap className="w-3 h-3 text-amber-500" />
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
    icon: FileText,
    title: "Evidence Management",
    description: "Upload documents and let Horus AI organize them. Ask questions like 'What evidence do I need for communication policies?' and get instant guidance.",
    benefits: [
      "AI-powered document analysis and categorization",
      "Automatic evidence-to-criteria mapping",
      "Version control and audit trails",
      "Conversational evidence search",
    ],
    color: "from-emerald-500 to-teal-600",
    preview: (
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[320px]">
        {/* Toolbar */}
        <div className="p-3 border-b border-border/50 flex justify-between items-center bg-muted/20">
          <div className="text-xs font-bold text-foreground flex items-center gap-2">
            <div className="p-1 bg-emerald-500/10 rounded-md text-emerald-500"><FileText className="w-3.5 h-3.5" /></div>
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
    icon: BarChart3,
    title: "Gap Analysis",
    description: "Ask Horus AI 'Where are my compliance gaps?' and get detailed analysis with prioritized recommendations for every standard.",
    benefits: [
      "Conversational gap discovery",
      "AI-generated risk scoring",
      "Actionable remediation steps",
      "Real-time progress tracking",
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
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500"><Zap className="w-3.5 h-3.5" /></div>
              <span className="text-[10px] font-bold text-red-500 uppercase">Critical</span>
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">3</div>
              <div className="text-[10px] text-muted-foreground">Immediate action</div>
            </div>
          </div>

          <div className="bg-card border border-border/50 p-3 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500"><Shield className="w-3.5 h-3.5" /></div>
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
    icon: Shield,
    title: "Standards Hub",
    description: "Ask Horus AI about any quality standard or accreditation requirement. Get guidance and implementation steps in plain language — no technical jargon.",
    benefits: [
      "Natural language standard queries",
      "AI-explained compliance in plain language",
      "Implementation roadmaps on demand",
      "Multi-framework support",
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
  const [activeFeature, setActiveFeature] = useState(features[0])

  return (
    <section id="features" className="py-[var(--spacing-section)] px-[var(--spacing-content)]">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand)]/10 border border-[var(--brand)]/20 text-[var(--brand)] text-xs font-medium mb-4">
            <Zap className="w-3.5 h-3.5" />
            Platform Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Horus AI Powers
            <span className="text-[var(--brand)]"> Every Module</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            One conversational interface controls evidence, standards, reporting, and compliance analysis
          </p>
        </motion.div>

        {/* Feature tabs */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Tabs list */}
          <div className="space-y-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const isActive = activeFeature.id === feature.id

              return (
                <motion.button
                  key={feature.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveFeature(feature)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all duration-300",
                    isActive
                      ? "border-[var(--brand)]/30 bg-[var(--brand)]/5 shadow-sm glass-card"
                      : "border-border/50 hover:border-border hover:bg-accent/50 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        isActive ? "bg-[var(--brand)]/10" : "bg-muted"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5 transition-colors",
                          isActive ? "text-[var(--brand)]" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={cn(
                            "font-semibold transition-colors",
                            isActive ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {feature.title}
                        </h3>
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]"
                          />
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-sm line-clamp-2 transition-colors",
                          isActive ? "text-muted-foreground" : "text-muted-foreground/60"
                        )}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Preview panel */}
          <div className="lg:sticky lg:top-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Preview card */}
                <div className="relative">
                  <div
                    className={cn(
                      "absolute -inset-1 rounded-2xl bg-gradient-to-r opacity-20 blur-xl",
                      activeFeature.color
                    )}
                  />
                  <div className="relative glass-card rounded-xl p-1 border border-[var(--glass-border)]">
                    {activeFeature.preview}
                  </div>
                </div>

                {/* Benefits list */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Key Benefits
                  </h4>
                  <ul className="space-y-2">
                    {activeFeature.benefits.map((benefit, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{benefit}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <Link href="/login">
                  <Button className="w-full gap-2">
                    Try {activeFeature.title}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
