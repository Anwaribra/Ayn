"use client"

import { motion } from "framer-motion"

// Simple SVG logos for standards and integrations
const integrations = [
  {
    name: "ISO 21001",
    icon: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <rect x="4" y="4" width="40" height="40" rx="8" fill="currentColor" opacity="0.1"/>
        <text x="24" y="28" textAnchor="middle" className="text-[10px] font-bold" fill="currentColor">ISO</text>
        <text x="24" y="36" textAnchor="middle" className="text-[8px]" fill="currentColor">21001</text>
      </svg>
    ),
  },
  {
    name: "ISO 9001",
    icon: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <rect x="4" y="4" width="40" height="40" rx="8" fill="currentColor" opacity="0.1"/>
        <text x="24" y="28" textAnchor="middle" className="text-[10px] font-bold" fill="currentColor">ISO</text>
        <text x="24" y="36" textAnchor="middle" className="text-[8px]" fill="currentColor">9001</text>
      </svg>
    ),
  },
  {
    name: "NAQAAE",
    icon: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <circle cx="24" cy="24" r="20" fill="currentColor" opacity="0.1"/>
        <text x="24" y="28" textAnchor="middle" className="text-[11px] font-bold" fill="currentColor">N</text>
      </svg>
    ),
  },
  {
    name: "Google",
    icon: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <path d="M24 4c11 0 20 9 20 20s-9 20-20 20S4 35 4 24 13 4 24 4z" fill="currentColor" opacity="0.1"/>
        <path d="M32 24c0-.7-.1-1.4-.2-2H24v4h4.5c-.2 1.1-.8 2-1.7 2.6v2.2h2.7c1.6-1.5 2.5-3.7 2.5-6.8z" fill="currentColor"/>
        <path d="M24 34c2.4 0 4.5-.8 6-2.2l-2.7-2.2c-.8.5-1.8.9-3.3.9-2.5 0-4.6-1.7-5.4-4h-2.8v2.3C15.4 31.4 19.3 34 24 34z" fill="currentColor" opacity="0.8"/>
        <path d="M18.6 25.5c-.2-.7-.3-1.4-.3-2.1s.1-1.5.3-2.1v-2.3h-2.8c-.6 1.3-.9 2.7-.9 4.4s.3 3.1.9 4.4l2.2-1.7 1.4-1.1-.8-.7z" fill="currentColor" opacity="0.6"/>
        <path d="M24 17.4c1.4 0 2.7.5 3.7 1.4l2.8-2.8C28.5 14.3 26.4 13.5 24 13.5c-4.7 0-8.6 2.6-10.8 6.4l2.8 2.2c.8-2.3 2.9-4.7 6-4.7z" fill="currentColor" opacity="0.4"/>
      </svg>
    ),
  },
  {
    name: "Microsoft",
    icon: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <rect x="4" y="4" width="40" height="40" fill="currentColor" opacity="0.1"/>
        <rect x="8" y="8" width="14" height="14" fill="currentColor" opacity="0.9"/>
        <rect x="26" y="8" width="14" height="14" fill="currentColor" opacity="0.7"/>
        <rect x="8" y="26" width="14" height="14" fill="currentColor" opacity="0.5"/>
        <rect x="26" y="26" width="14" height="14" fill="currentColor" opacity="0.3"/>
      </svg>
    ),
  },
  {
    name: "Slack",
    icon: (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <rect x="4" y="4" width="40" height="40" rx="8" fill="currentColor" opacity="0.1"/>
        <circle cx="18" cy="18" r="4" fill="currentColor" opacity="0.9"/>
        <circle cx="30" cy="18" r="4" fill="currentColor" opacity="0.7"/>
        <circle cx="18" cy="30" r="4" fill="currentColor" opacity="0.5"/>
        <circle cx="30" cy="30" r="4" fill="currentColor" opacity="0.3"/>
      </svg>
    ),
  },
]

// Double the array for seamless loop
const duplicatedIntegrations = [...integrations, ...integrations]

export function IntegrationLogos() {
  return (
    <section className="py-16 overflow-hidden border-y border-border/50 bg-muted/30">
      <div className="max-w-7xl mx-auto px-[var(--spacing-content)] mb-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground"
        >
          Built on trusted standards and integrates with your favorite tools
        </motion.p>
      </div>

      {/* Scrolling logos */}
      <div className="relative">
        {/* Gradient masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Scrolling container */}
        <motion.div
          className="flex gap-12 items-center"
          animate={{
            x: [0, -50 * integrations.length * 1.2],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear",
            },
          }}
        >
          {duplicatedIntegrations.map((integration, index) => (
            <div
              key={`${integration.name}-${index}`}
              className="flex items-center gap-3 shrink-0 group"
            >
              <div className="w-10 h-10 text-muted-foreground/60 group-hover:text-foreground transition-colors duration-300">
                {integration.icon}
              </div>
              <span className="text-sm font-medium text-muted-foreground/60 group-hover:text-foreground transition-colors duration-300 whitespace-nowrap">
                {integration.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Second row - reverse direction */}
      <div className="relative mt-8">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-12 items-center"
          animate={{
            x: [-50 * integrations.length * 1.2, 0],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 35,
              ease: "linear",
            },
          }}
        >
          {[...duplicatedIntegrations].reverse().map((integration, index) => (
            <div
              key={`${integration.name}-reverse-${index}`}
              className="flex items-center gap-3 shrink-0 group"
            >
              <div className="w-10 h-10 text-muted-foreground/60 group-hover:text-foreground transition-colors duration-300">
                {integration.icon}
              </div>
              <span className="text-sm font-medium text-muted-foreground/60 group-hover:text-foreground transition-colors duration-300 whitespace-nowrap">
                {integration.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
