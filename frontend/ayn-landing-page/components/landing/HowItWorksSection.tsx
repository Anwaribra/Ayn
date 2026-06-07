"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Database, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    number: "01",
    title: "Upload evidence",
    description:
      "Drag in policies, course files, and records. Ayn auto-organises and tags every document to the right compliance criterion.",
  },
  {
    number: "02",
    title: "Horus maps gaps",
    description:
      "Horus reads across your evidence, maps gaps to ISO, NCAAA, and global frameworks, and surfaces prioritised insights.",
  },
  {
    number: "03",
    title: "Execute actions",
    description:
      "Turn recommendations into traceable workflow steps. Assign, review, and close compliance actions from one unified view.",
  },
  {
    number: "04",
    title: "Stay audit-ready",
    description:
      "Live readiness dashboards and exportable reports keep your team aligned long before formal accreditation visits.",
  },
]

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section id="how-it-works" className="relative overflow-hidden px-6 py-16 md:py-24 scroll-mt-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 max-w-2xl md:mb-16"
        >
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            How it works
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            From evidence to audit-ready{" "}
            <span className="text-muted-foreground">in four steps.</span>
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Whether it&apos;s a single policy or a full institutional review cycle — the same workflow applies.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-4">
            {STEPS.map((step, idx) => {
              const isActive = activeStep === idx
              return (
                <button
                  key={step.number}
                  type="button"
                  onMouseEnter={() => setActiveStep(idx)}
                  onFocus={() => setActiveStep(idx)}
                  onClick={() => setActiveStep(idx)}
                  className={cn(
                    "flex w-full gap-5 rounded-2xl border p-5 text-left transition-all duration-300",
                    isActive
                      ? "border-border/80 bg-card/70 shadow-[0_12px_40px_rgba(0,0,0,0.04)]"
                      : "border-transparent bg-transparent hover:border-border/50 hover:bg-card/40"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 font-mono text-sm font-bold transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground/50"
                    )}
                  >
                    {step.number}
                  </span>
                  <span>
                    <h3
                      className={cn(
                        "mb-2 text-base font-bold transition-colors",
                        isActive ? "text-foreground" : "text-foreground/75"
                      )}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={cn(
                        "text-sm leading-relaxed transition-colors",
                        isActive ? "text-muted-foreground" : "text-muted-foreground/70"
                      )}
                    >
                      {step.description}
                    </p>
                  </span>
                </button>
              )
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="relative flex min-h-[420px] items-center justify-center lg:min-h-[480px]"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage: "radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                maskImage: "radial-gradient(circle at center, black 30%, transparent 72%)",
                WebkitMaskImage: "radial-gradient(circle at center, black 30%, transparent 72%)",
              }}
            />

            <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6">
              <div
                className={cn(
                  "light-card relative w-full rounded-2xl border px-6 py-4 text-center transition-all duration-500",
                  activeStep === 0
                    ? "border-foreground/20 bg-card/80 shadow-lg"
                    : "border-border/60 bg-card/50"
                )}
              >
                <span className="text-sm font-bold text-foreground">Evidence Vault</span>
                <span className="mt-0.5 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Upload · Auto-tag
                </span>
                <Database
                  className={cn(
                    "absolute -right-2 -top-2 h-6 w-6 transition-all",
                    activeStep === 0 ? "text-foreground" : "text-muted-foreground/30"
                  )}
                />
              </div>

              <div className={cn("h-8 w-px transition-colors", activeStep >= 1 ? "bg-foreground/30" : "bg-border")} />

              <div
                className={cn(
                  "light-card relative w-full rounded-2xl border px-6 py-4 text-center transition-all duration-500",
                  activeStep === 1
                    ? "border-foreground/20 bg-card/80 shadow-lg"
                    : "border-border/60 bg-card/50"
                )}
              >
                <span className="text-sm font-bold text-foreground">Horus AI</span>
                <span className="mt-0.5 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Analyze · Map gaps
                </span>
                <Brain
                  className={cn(
                    "absolute -left-2 top-1/2 h-6 w-6 -translate-y-1/2 transition-all",
                    activeStep === 1 ? "text-foreground" : "text-muted-foreground/30"
                  )}
                />
              </div>

              <div className={cn("h-8 w-px transition-colors", activeStep >= 2 ? "bg-foreground/30" : "bg-border")} />

              <div className="flex w-[88%] justify-between gap-3">
                {["Workflows", "Reports"].map((label, i) => (
                  <div
                    key={label}
                    className={cn(
                      "light-card flex-1 rounded-xl border px-3 py-3 text-center transition-all duration-500",
                      activeStep >= 2 + i
                        ? "border-foreground/20 bg-card/80 shadow-md"
                        : "border-border/60 bg-card/50"
                    )}
                  >
                    <span className="text-xs font-bold text-foreground">{label}</span>
                  </div>
                ))}
              </div>

              <p
                className={cn(
                  "text-center text-[11px] font-mono uppercase tracking-[0.16em] transition-colors",
                  activeStep === 3 ? "font-semibold text-foreground" : "text-muted-foreground/50"
                )}
              >
                Traceable · Audit-ready
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
