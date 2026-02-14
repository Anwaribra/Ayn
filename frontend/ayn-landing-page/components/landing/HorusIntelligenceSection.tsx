"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { Brain, FileText, BarChart3, Shield, Sparkles } from "lucide-react"
import { AnimatedBeam } from "@/components/ui/animated-beam"
import { cn } from "@/lib/utils"

const NodeCard = ({
  nodeRef,
  icon: Icon,
  title,
  description,
  position,
}: {
  nodeRef: React.RefObject<HTMLDivElement | null>
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  position: "left" | "right" | "center"
}) => {
  const isCenter = position === "center"

  return (
    <motion.div
      ref={nodeRef as React.RefObject<HTMLDivElement>}
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
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          {/* Enhanced multi-layer glow */}
          <div className="absolute -inset-4 bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] blur-2xl" />
          <div className="absolute -inset-[1px] bg-gradient-to-br from-indigo-500 to-sky-500 rounded-3xl opacity-30" />

          {/* Card Body */}
          <div className="relative rounded-3xl bg-[#0B0F1A] p-12 shadow-2xl border border-white/10 backdrop-blur-xl">
            {/* Solid icon container */}
            <div className="relative w-28 h-28 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/10 to-sky-500/10 border border-indigo-500/30 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(99,102,241,0.15)] group">
              <Brain className="w-14 h-14 text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]" />

              {/* Internal pulse */}
              <div className="absolute inset-0 rounded-2xl border border-indigo-500/20 animate-ping opacity-20" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center">
              <h3 className="text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 via-white to-sky-400 bg-clip-text text-transparent drop-shadow-sm">
                Horus AI
              </h3>
              <p className="text-lg text-slate-400 leading-relaxed max-w-xs mx-auto font-medium">
                The central operating intelligence
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Side nodes - Glassmorphism */
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md hover:bg-white/10 transition-all duration-500 group">
          {/* Hover glow */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Simple icon */}
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 border border-white/5 group-hover:border-white/20 transition-colors">
            <Icon className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
          </div>

          {/* Content */}
          <div>
            <h4 className="text-base font-bold text-white mb-1.5 transition-colors">
              {title}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
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
    <section
      id="horus-intelligence"
      className="relative py-[var(--spacing-section-lg)] px-[var(--spacing-content)] overflow-hidden bg-background"
    >
      {/* Mesh Gradient and subtle grid */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(circle_at_top_left,rgba(30,41,59,0.5)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-[600px] bg-[radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.5)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_40px] opacity-20 pointer-events-none" />

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
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
          >
            <Brain className="w-3.5 h-3.5" />
            Central Intelligence
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-white"
          >
            One System.{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-white to-sky-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              One Intelligence.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 text-base md:text-lg max-w-3xl mx-auto leading-relaxed"
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
            duration={3}
            delay={0}
            gradientStartColor="#6366f1" // Indigo
            gradientStopColor="#38bdf8" // Sky
            pathWidth={2}
            pathOpacity={0.2}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={leftBottom}
            toRef={centerRef}
            curvature={-30}
            duration={3}
            delay={0.5}
            gradientStartColor="#6366f1"
            gradientStopColor="#38bdf8"
            pathWidth={2}
            pathOpacity={0.2}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={rightTop}
            toRef={centerRef}
            curvature={-30}
            duration={3}
            delay={1}
            gradientStartColor="#6366f1"
            gradientStopColor="#38bdf8"
            pathWidth={2}
            pathOpacity={0.2}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={rightBottom}
            toRef={centerRef}
            curvature={30}
            duration={3}
            delay={1.5}
            gradientStartColor="#6366f1"
            gradientStopColor="#38bdf8"
            pathWidth={2}
            pathOpacity={0.2}
          />

          {/* Grid layout */}
          <div className="grid grid-cols-4 grid-rows-2 gap-8 relative z-10">
            {/* Left column */}
            <div className="col-start-1 row-start-1">
              <NodeCard
                nodeRef={leftTop}
                icon={FileText}
                title="Evidence"
                description="Documents, policies, and records"
                position="left"
              />
            </div>
            <div className="col-start-1 row-start-2">
              <NodeCard
                nodeRef={leftBottom}
                icon={Shield}
                title="Standards"
                description="Compliance frameworks and criteria"
                position="left"
              />
            </div>

            {/* Center - Horus AI */}
            <div className="col-start-2 col-span-2 row-start-1 row-span-2 flex items-center justify-center">
              <NodeCard
                nodeRef={centerRef}
                icon={Brain}
                title="Horus AI"
                description=""
                position="center"
              />
            </div>

            {/* Right column */}
            <div className="col-start-4 row-start-1">
              <NodeCard
                nodeRef={rightTop}
                icon={BarChart3}
                title="Gap Analysis"
                description="Identify compliance gaps and risks"
                position="right"
              />
            </div>
            <div className="col-start-4 row-start-2">
              <NodeCard
                nodeRef={rightBottom}
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
            <div className="absolute -inset-2 bg-gradient-to-br from-indigo-500/20 to-sky-500/20 rounded-2xl blur-lg" />

            <div className="relative rounded-2xl border border-white/10 bg-[#0B0F1A]/90 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500/10 to-sky-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  <Brain className="w-8 h-8 text-indigo-400 drop-shadow-sm" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-sky-500 bg-clip-text text-transparent mb-1">
                    Horus AI
                  </h3>
                  <p className="text-sm text-slate-400">
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
              <div className="h-full rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4 text-slate-300" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Evidence</h4>
                <p className="text-xs text-slate-400">
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
              <div className="h-full rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center mb-2">
                  <Shield className="w-4 h-4 text-slate-300" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  Standards
                </h4>
                <p className="text-xs text-slate-400">
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
              <div className="h-full rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center mb-2">
                  <BarChart3 className="w-4 h-4 text-slate-300" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  Gap Analysis
                </h4>
                <p className="text-xs text-slate-400">
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
              <div className="h-full rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center mb-2">
                  <Sparkles className="w-4 h-4 text-slate-300" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Insights</h4>
                <p className="text-xs text-slate-400">
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
          <p className="text-sm text-slate-400">
            Every upload, every assessment, every insight flows through Horus
          </p>
        </motion.div>
      </div>
    </section>
  )
}
