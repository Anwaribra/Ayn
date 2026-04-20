"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { Brain, FolderLock, GitCompare, ShieldCheck, Sparkles } from "lucide-react"
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
          {/* Clean ambient shadow rather than heavy neon glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-br from-primary/20 to-primary/5 rounded-[2rem] opacity-30 group-hover:opacity-50 transition-opacity duration-700" />

          {/* Center card — Premium Structure */}
          <div className="relative rounded-[2rem] border border-border/60 bg-background/80 backdrop-blur-3xl p-12 shadow-sm transition-all duration-500">
            <div className="relative w-28 h-28 mx-auto rounded-3xl bg-primary/[0.03] border border-primary/10 flex items-center justify-center mb-8">
              <Brain className="w-14 h-14 text-primary" />
              {/* Subtle pulsing rings, non-glowing */}
              <div className="absolute inset-0 rounded-3xl border border-primary/20 animate-ping opacity-10" />
            </div>
            <div className="relative z-10 text-center">
              <h3 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight text-foreground">
                Horus AI
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xs mx-auto font-medium">
                The central operating intelligence
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Side nodes — Clean Minimal Lift */
        <div className="relative rounded-3xl border border-border/40 bg-background/60 backdrop-blur-2xl p-7 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-primary/20 transition-all duration-500 group overflow-hidden">
          {/* Subtle hover gradient inside */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="w-12 h-12 rounded-xl bg-primary/[0.03] border border-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/[0.06] transition-colors duration-500">
            <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
          </div>
          <div className="relative z-10">
            <h4 className="text-base font-bold text-foreground mb-2">
              {title}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
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
      className="relative py-[var(--spacing-section-lg)] px-[var(--spacing-content)] overflow-hidden"
    >

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
            className="inline-flex items-center px-3 py-1 rounded-full bg-primary/8 border border-primary/20 text-primary text-xs font-medium mb-4 tracking-[0.11em] uppercase"
          >
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
            analysis, and insights operate as one connected system. From insight to
            action, Horus can execute guided multi-step compliance workflows.
          </motion.p>
        </motion.div>

        {/* Animated connection diagram - Desktop */}
        <div ref={containerRef} className="hidden md:block relative">
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
                icon={Brain}
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
        <div className="block md:hidden space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-[1px] bg-gradient-to-br from-primary/20 to-primary/5 rounded-[1.5rem] opacity-30" />
            <div className="relative rounded-[1.5rem] border border-border/60 bg-background/80 backdrop-blur-3xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-xl bg-primary/[0.03] border border-primary/10 flex items-center justify-center">
                  <Brain className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-1">
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
                <div className="relative h-full rounded-[1.5rem] border border-border/40 bg-background/60 backdrop-blur-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-primary/20 transition-all duration-500 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 w-10 h-10 rounded-xl bg-primary/[0.03] border border-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/[0.06] transition-colors duration-500">
                    <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-sm font-bold text-foreground mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
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
          <p className="glass-text-secondary text-sm">
            Every upload, every assessment, every insight flows through Horus
          </p>
        </motion.div>
      </div>
    </section>
  )
}
