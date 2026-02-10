"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { Brain, FileText, BarChart3, Shield, Sparkles } from "lucide-react"
import { AnimatedBeam } from "@/components/ui/animated-beam"
import { cn } from "@/lib/utils"

const NodeCard = ({
  ref,
  icon: Icon,
  title,
  description,
  position,
}: {
  ref: React.RefObject<HTMLDivElement | null>
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  position: "left" | "right" | "center"
}) => {
  const isCenter = position === "center"

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      className={cn(
        "relative",
        isCenter && "col-span-2 row-span-2 flex items-center justify-center"
      )}
    >
      {/* Horus AI - The Brain */}
      {isCenter ? (
        <motion.div
          animate={{
            scale: [1, 1.01, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          {/* Subtle single glow layer */}
          <div className="absolute -inset-2 bg-gradient-to-br from-[#00D9FF]/8 to-[#7B68EE]/8 rounded-2xl blur-xl" />

          <div className="relative rounded-2xl border-2 border-[#00D9FF]/40 bg-gradient-to-br from-card via-card to-card/95 p-12 shadow-xl">
            {/* Solid icon container */}
            <div className="relative w-24 h-24 mx-auto rounded-xl bg-gradient-to-br from-[#00D9FF]/15 to-[#7B68EE]/15 border-2 border-[#00D9FF]/50 flex items-center justify-center mb-6 shadow-lg">
              <Brain className="w-12 h-12 text-[#00D9FF] drop-shadow-sm" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center">
              <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-[#00D9FF] to-[#7B68EE] bg-clip-text text-transparent">
                Horus AI
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                The central operating intelligence
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Side nodes - secondary but readable */
        <div className="relative rounded-xl border border-border bg-card/80 p-5">
          {/* Simple icon */}
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
            <Icon className="w-5 h-5 text-foreground/60" />
          </div>

          {/* Content */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">
              {title}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export function HorusIntelligenceSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const leftTop = useRef<HTMLDivElement>(null)
  const leftBottom = useRef<HTMLDivElement>(null)
  const rightTop = useRef<HTMLDivElement>(null)
  const rightBottom = useRef<HTMLDivElement>(null)

  return (
    <section className="relative py-[var(--spacing-section-lg)] px-[var(--spacing-content)] overflow-hidden">
      {/* Calm, subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_50%_50%,hsl(var(--muted))_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand)]/10 border border-[var(--brand)]/20 text-[var(--brand)] text-xs font-medium mb-4"
          >
            <Brain className="w-3.5 h-3.5" />
            Central Intelligence
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
          >
            One System.{" "}
            <span className="bg-gradient-to-r from-[var(--brand)] via-primary to-purple-500 bg-clip-text text-transparent">
              One Intelligence.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto leading-relaxed"
          >
            Horus AI understands the full quality ecosystem. Evidence, standards,
            analysis, and insights operate as one connected system — not isolated tools.
          </motion.p>
        </motion.div>

        {/* Animated connection diagram - Desktop */}
        <div ref={containerRef} className="hidden lg:block relative">
          {/* Clear animated beams - ALL flow TOWARDS Horus AI */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={leftTop}
            toRef={centerRef}
            curvature={30}
            duration={3.5}
            delay={0}
            gradientStartColor="#00D9FF"
            gradientStopColor="#7B68EE"
            pathWidth={3}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={leftBottom}
            toRef={centerRef}
            curvature={-30}
            duration={3.5}
            delay={0.3}
            gradientStartColor="#00D9FF"
            gradientStopColor="#7B68EE"
            pathWidth={3}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={rightTop}
            toRef={centerRef}
            curvature={-30}
            duration={3.5}
            delay={0.6}
            gradientStartColor="#00D9FF"
            gradientStopColor="#7B68EE"
            pathWidth={3}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={rightBottom}
            toRef={centerRef}
            curvature={30}
            duration={3.5}
            delay={0.9}
            gradientStartColor="#00D9FF"
            gradientStopColor="#7B68EE"
            pathWidth={3}
          />

          {/* Grid layout */}
          <div className="grid grid-cols-4 grid-rows-2 gap-8 relative z-10">
            {/* Left column */}
            <div className="col-start-1 row-start-1">
              <NodeCard
                ref={leftTop}
                icon={FileText}
                title="Evidence"
                description="Documents, policies, and records"
                position="left"
              />
            </div>
            <div className="col-start-1 row-start-2">
              <NodeCard
                ref={leftBottom}
                icon={Shield}
                title="Standards"
                description="Compliance frameworks and criteria"
                position="left"
              />
            </div>

            {/* Center - Horus AI */}
            <div className="col-start-2 col-span-2 row-start-1 row-span-2 flex items-center justify-center">
              <NodeCard
                ref={centerRef}
                icon={Brain}
                title="Horus AI"
                description=""
                position="center"
              />
            </div>

            {/* Right column */}
            <div className="col-start-4 row-start-1">
              <NodeCard
                ref={rightTop}
                icon={BarChart3}
                title="Gap Analysis"
                description="Identify compliance gaps and risks"
                position="right"
              />
            </div>
            <div className="col-start-4 row-start-2">
              <NodeCard
                ref={rightBottom}
                icon={Sparkles}
                title="Insights"
                description="Actionable recommendations and reports"
                position="right"
              />
            </div>
          </div>
        </div>

        {/* Mobile/Tablet fallback - No beams */}
        <div className="lg:hidden space-y-6">
          {/* Center card first on mobile - Horus AI dominates */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Subtle glow for mobile */}
            <div className="absolute -inset-2 bg-gradient-to-br from-[#00D9FF]/10 to-[#7B68EE]/10 rounded-2xl blur-lg" />
            
            <div className="relative rounded-2xl border-2 border-[#00D9FF]/40 bg-card p-6 shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#00D9FF]/15 to-[#7B68EE]/15 border-2 border-[#00D9FF]/50 flex items-center justify-center shadow-lg">
                  <Brain className="w-8 h-8 text-[#00D9FF] drop-shadow-sm" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-[#00D9FF] to-[#7B68EE] bg-clip-text text-transparent mb-1">
                    Horus AI
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Central Intelligence
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Other cards in grid - secondary but readable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="h-full rounded-xl border border-border bg-card/80 p-4">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4 text-foreground/60" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Evidence</h4>
                <p className="text-xs text-muted-foreground">
                  Documents, policies, and records
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="h-full rounded-xl border border-border bg-card/80 p-4">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-2">
                  <Shield className="w-4 h-4 text-foreground/60" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  Standards
                </h4>
                <p className="text-xs text-muted-foreground">
                  Compliance frameworks and criteria
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="h-full rounded-xl border border-border bg-card/80 p-4">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-2">
                  <BarChart3 className="w-4 h-4 text-foreground/60" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  Gap Analysis
                </h4>
                <p className="text-xs text-muted-foreground">
                  Identify compliance gaps and risks
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <div className="h-full rounded-xl border border-border bg-card/80 p-4">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-2">
                  <Sparkles className="w-4 h-4 text-foreground/60" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Insights</h4>
                <p className="text-xs text-muted-foreground">
                  Actionable recommendations and reports
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-foreground/80">
            Every upload, every assessment, every insight flows through Horus
          </p>
        </motion.div>
      </div>
    </section>
  )
}
