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
      <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-[var(--brand)]" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="bg-muted/50 rounded-lg p-2.5 text-xs text-foreground/80">
              What evidence do I need for our quality review?
            </div>
            <div className="bg-[var(--brand)]/10 rounded-lg p-2.5 text-xs text-foreground/80">
              Based on your institution's profile, you'll need policies, procedures, and records for leadership, planning, and stakeholder communication...
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-8 rounded-lg border border-border/50 bg-background/50" />
          <div className="w-8 h-8 rounded-lg bg-[var(--brand)] flex items-center justify-center">
            <Zap className="w-4 h-4 text-[var(--brand-foreground)]" />
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
      <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">Evidence Files</span>
          </div>
          <span className="text-xs text-muted-foreground">12 uploaded</span>
        </div>
        <div className="space-y-2">
          {["Quality Manual v2.1.pdf", "Training Records.xlsx", "Policy Document.pdf"].map((file, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="flex-1">{file}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
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
      <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Compliance Score</span>
          <span className="text-lg font-bold text-amber-500">72%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-[72%] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <div className="text-lg font-bold text-emerald-500">24</div>
            <div className="text-[10px] text-muted-foreground">Met</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10">
            <div className="text-lg font-bold text-amber-500">8</div>
            <div className="text-[10px] text-muted-foreground">Partial</div>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10">
            <div className="text-lg font-bold text-red-500">3</div>
            <div className="text-[10px] text-muted-foreground">Gap</div>
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
      <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">Quality Standards</span>
        </div>
        <div className="space-y-2">
          {["4. Context of the organization", "5. Leadership", "6. Planning", "7. Support"].map((clause, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-medium text-blue-500">
                {i + 4}
              </div>
              <span className="flex-1">{clause}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
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
                      ? "border-[var(--brand)]/30 bg-[var(--brand)]/5 shadow-sm"
                      : "border-border/50 hover:border-border hover:bg-accent/50"
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
                  <div className="relative bg-background rounded-xl p-1">
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
