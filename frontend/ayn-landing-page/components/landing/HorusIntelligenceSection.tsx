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
        "relative group",
        isCenter && "col-span-2 row-span-2 flex items-center justify-center"
      )}
    >
      <div
        className={cn(
          "relative rounded-2xl border transition-all duration-500",
          isCenter
            ? "border-[var(--brand)]/30 bg-gradient-to-br from-[var(--brand)]/10 via-[var(--brand)]/5 to-transparent p-8 shadow-2xl shadow-[var(--brand)]/10 hover:shadow-[var(--brand)]/20"
            : "border-border bg-card/50 backdrop-blur-sm p-6 hover:border-[var(--brand)]/20 hover:shadow-lg hover:-translate-y-1"
        )}
      >
        {/* Glow effect for center */}
        {isCenter && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--brand)]/20 via-transparent to-purple-500/10 opacity-50 blur-xl" />
        )}

        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.05, rotate: isCenter ? 0 : 5 }}
          transition={{ type: "spring", stiffness: 400 }}
          className={cn(
            "relative rounded-xl flex items-center justify-center mb-4",
            isCenter
              ? "w-20 h-20 bg-[var(--brand)]/20 border-2 border-[var(--brand)]/30 shadow-lg"
              : "w-12 h-12 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"
          )}
        >
          <Icon
            className={cn(
              isCenter ? "w-10 h-10 text-[var(--brand)]" : "w-6 h-6 text-primary"
            )}
          />
          {isCenter && (
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-xl bg-[var(--brand)]/20 blur-md"
            />
          )}
        </motion.div>

        {/* Content */}
        <div className="relative z-10">
          <h3
            className={cn(
              "font-bold mb-2",
              isCenter
                ? "text-2xl text-foreground"
                : "text-base text-foreground group-hover:text-[var(--brand)] transition-colors"
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "text-muted-foreground leading-relaxed",
              isCenter ? "text-base" : "text-sm"
            )}
          >
            {description}
          </p>
        </div>

        {/* Sparkle indicator for center */}
        {isCenter && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-6 h-6 text-[var(--brand)]" />
          </motion.div>
        )}
      </div>
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
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-[var(--brand)]/5 to-background pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,var(--brand)_0.05,transparent_60%)] pointer-events-none" />

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
            Horus AI doesn't just answer questions—it understands your entire
            quality ecosystem. Evidence, compliance, insights, and documentation
            work together through unified intelligence, not isolated tools.
          </motion.p>
        </motion.div>

        {/* Animated connection diagram - Desktop */}
        <div ref={containerRef} className="hidden lg:block relative">
          {/* Animated Beams */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={leftTop}
            toRef={centerRef}
            curvature={30}
            duration={3}
            delay={0}
            gradientStartColor="#3b82f6"
            gradientStopColor="#8b5cf6"
            pathWidth={2}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={leftBottom}
            toRef={centerRef}
            curvature={-30}
            duration={3}
            delay={0.3}
            gradientStartColor="#3b82f6"
            gradientStopColor="#8b5cf6"
            pathWidth={2}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={centerRef}
            toRef={rightTop}
            curvature={30}
            duration={3}
            delay={0.6}
            gradientStartColor="#8b5cf6"
            gradientStopColor="#ec4899"
            pathWidth={2}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={centerRef}
            toRef={rightBottom}
            curvature={-30}
            duration={3}
            delay={0.9}
            gradientStartColor="#8b5cf6"
            gradientStopColor="#ec4899"
            pathWidth={2}
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
                description="Your unified quality intelligence that connects, analyzes, and guides across every module"
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
          {/* Center card first on mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-2xl border border-[var(--brand)]/30 bg-gradient-to-br from-[var(--brand)]/10 via-[var(--brand)]/5 to-transparent p-6 shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-[var(--brand)]/20 border-2 border-[var(--brand)]/30 flex items-center justify-center">
                  <Brain className="w-7 h-7 text-[var(--brand)]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    Horus AI
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Central Intelligence
                  </p>
                </div>
                <Sparkles className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your unified quality intelligence that connects, analyzes, and
                guides across every module
              </p>
            </div>
          </motion.div>

          {/* Other cards in grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="h-full rounded-xl border border-border bg-card/50 p-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Evidence</h4>
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
              <div className="h-full rounded-xl border border-border bg-card/50 p-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">
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
              <div className="h-full rounded-xl border border-border bg-card/50 p-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 flex items-center justify-center mb-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">
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
              <div className="h-full rounded-xl border border-border bg-card/50 p-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Insights</h4>
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
