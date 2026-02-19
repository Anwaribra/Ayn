"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { BrainCircuit, FolderLock, GitCompare, ShieldCheck, Sparkles } from "lucide-react"
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
      {isCenter ? (
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          {/* Adaptive glow using CSS var primary */}
          <div className="absolute -inset-4 bg-[radial-gradient(circle,hsl(var(--primary)/0.12)_0%,transparent_70%)] blur-2xl" />
          <div className="absolute -inset-[1px] bg-gradient-to-br from-primary/25 to-primary/10 rounded-3xl opacity-50" />

          {/* Center card — Liquid Glass */}
          <div className="relative rounded-3xl bg-white/60 backdrop-blur-[16px] border border-white/40 shadow-lg p-12">
            <div className="relative w-28 h-28 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 group">
              <BrainCircuit className="w-14 h-14 text-primary" style={{ filter: "drop-shadow(0 0 10px hsl(var(--primary)/0.4))" }} />
              <div className="absolute inset-0 rounded-2xl border border-primary/30 animate-ping opacity-20" />
            </div>
            <div className="relative z-10 text-center">
              <h3 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-foreground to-primary/70 bg-clip-text text-transparent">
                Horus AI
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xs mx-auto font-medium">
                The central operating intelligence
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Side nodes — Liquid Glass */
        <div className="relative rounded-2xl bg-white/60 backdrop-blur-[16px] border border-white/40 shadow-lg p-6 hover:shadow-xl hover:border-primary/30 hover:scale-[1.01] transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-4 border border-primary/10 group-hover:scale-110 transition-transform">
            <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <h4 className="text-base font-bold text-foreground mb-1.5 transition-colors">
              {title}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed group-hover:text-muted-foreground/80 transition-colors">
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
      className="relative py-[var(--spacing-section-lg)] px-[var(--spacing-content)] overflow-hidden bg-muted/5"
    >
      {/* Adaptive gradient orbs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-[600px] bg-[radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.04)_0%,transparent_50%)] pointer-events-none" />

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
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            Central Intelligence
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-foreground"
          >
            One System.{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
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
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={leftTop}
            toRef={centerRef}
            curvature={30}
            duration={3}
            delay={0}
            gradientStartColor="hsl(var(--primary))"
            gradientStopColor="hsl(var(--primary)/0.4)"
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
            gradientStartColor="hsl(var(--primary))"
            gradientStopColor="hsl(var(--primary)/0.4)"
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
            gradientStartColor="hsl(var(--primary))"
            gradientStopColor="hsl(var(--primary)/0.4)"
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
            gradientStartColor="hsl(var(--primary))"
            gradientStopColor="hsl(var(--primary)/0.4)"
            pathWidth={2}
            pathOpacity={0.2}
          />

          {/* Grid layout */}
          <div className="grid grid-cols-4 grid-rows-2 gap-8 relative z-10">
            <div className="col-start-1 row-start-1">
              <NodeCard
                nodeRef={leftTop}
                icon={FolderLock}
                title="Evidence"
                description="Documents, policies, and records"
                position="left"
              />
            </div>
            <div className="col-start-1 row-start-2">
              <NodeCard
                nodeRef={leftBottom}
                icon={ShieldCheck}
                title="Standards"
                description="Compliance frameworks and criteria"
                position="left"
              />
            </div>

            {/* Center - Horus AI */}
            <div className="col-start-2 col-span-2 row-start-1 row-span-2 flex items-center justify-center">
              <NodeCard
                nodeRef={centerRef}
                icon={BrainCircuit}
                title="Horus AI"
                description=""
                position="center"
              />
            </div>

            <div className="col-start-4 row-start-1">
              <NodeCard
                nodeRef={rightTop}
                icon={GitCompare}
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

        {/* Mobile fallback */}
        <div className="lg:hidden space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-2 bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl blur-lg" />
            <div className="relative rounded-2xl bg-white/60 backdrop-blur-[16px] border border-white/40 shadow-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <BrainCircuit className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-1">
                    Horus AI
                  </h3>
                  <p className="text-sm text-muted-foreground">Central Intelligence</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: FolderLock, title: "Evidence", desc: "Documents, policies, and records" },
              { icon: ShieldCheck, title: "Standards", desc: "Compliance frameworks and criteria" },
              { icon: GitCompare, title: "Gap Analysis", desc: "Identify compliance gaps and risks" },
              { icon: Sparkles, title: "Insights", desc: "Actionable recommendations and reports" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="h-full rounded-xl bg-white/60 backdrop-blur-[16px] border border-white/40 shadow-lg p-4 hover:shadow-xl hover:scale-[1.01] transition-all">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
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
