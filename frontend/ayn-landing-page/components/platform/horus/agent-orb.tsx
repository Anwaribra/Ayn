"use client"

import { cn } from "@/lib/utils"
import { memo } from "react"

type OrbState = "idle" | "searching" | "generating" | "error"

interface AgentOrbProps {
  state: OrbState
  size?: "sm" | "md" | "lg" | "hero"
  actionLabel?: string | null
  className?: string
}

const SIZE_MAP = {
  sm: { container: "w-7 h-7", orb: "w-5 h-5", ring: "w-7 h-7", particles: false, label: false },
  md: { container: "w-10 h-10", orb: "w-7 h-7", ring: "w-10 h-10", particles: false, label: false },
  lg: { container: "w-20 h-20", orb: "w-14 h-14", ring: "w-20 h-20", particles: true, label: true },
  hero: { container: "w-36 h-36 sm:w-44 sm:h-44", orb: "w-24 h-24 sm:w-32 sm:h-32", ring: "w-36 h-36 sm:w-44 sm:h-44", particles: true, label: true },
} as const

/**
 * AgentOrb — dynamic visualization of the AI agent's state.
 *
 * Uses pure CSS animations (no framer-motion per-frame) for performance.
 * The morphing blob is achieved via animating border-radius through keyframes.
 * All animations are GPU-composited (transform, opacity, box-shadow).
 */
function AgentOrbInner({ state, size = "hero", actionLabel, className }: AgentOrbProps) {
  const s = SIZE_MAP[size]
  const isActive = state === "generating" || state === "searching"

  return (
    <div className={cn("relative flex items-center justify-center", s.container, className)}>
      {/* Outer rotating ring — only active states */}
      {isActive && (
        <div
          className={cn("absolute inset-0 rounded-full opacity-60", s.ring)}
          style={{
            background: "conic-gradient(from 0deg, transparent 0%, rgba(59,130,246,0.3) 20%, transparent 40%, rgba(56,189,248,0.25) 60%, transparent 80%)",
            animation: "orbRingRotate 4s linear infinite",
          }}
        />
      )}

      {/* Secondary glow layer — softer outer halo */}
      <div
        className={cn(
          "absolute rounded-full transition-all duration-700",
          s.orb,
          isActive ? "scale-[1.6] opacity-20" : "scale-[1.3] opacity-10"
        )}
        style={{
          background: state === "error"
            ? "radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)",
        }}
      />

      {/* The core orb — morphing blob when active, gentle breathe when idle */}
      <div
        className={cn("relative rounded-full transition-colors duration-500", s.orb)}
        style={{
          background: state === "error"
            ? "linear-gradient(135deg, rgba(239,68,68,0.4) 0%, rgba(190,18,60,0.3) 50%, rgba(239,68,68,0.2) 100%)"
            : "linear-gradient(135deg, rgba(59,130,246,0.35) 0%, rgba(56,189,248,0.25) 40%, rgba(99,102,241,0.3) 70%, rgba(59,130,246,0.2) 100%)",
          animation: isActive
            ? "orbMorph 6s ease-in-out infinite, orbGlowActive 2s ease-in-out infinite"
            : "orbBreathe 4s ease-in-out infinite, orbGlowPulse 4s ease-in-out infinite",
          backdropFilter: "blur(1px)",
        }}
      >
        {/* Inner luminous core */}
        <div
          className="absolute inset-[25%] rounded-full"
          style={{
            background: state === "error"
              ? "radial-gradient(circle, rgba(239,68,68,0.5) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(147,197,253,0.5) 0%, rgba(59,130,246,0.15) 50%, transparent 70%)",
            animation: isActive ? "orbBreathe 2s ease-in-out infinite" : "orbBreathe 5s ease-in-out infinite",
          }}
        />
      </div>

      {/* Orbiting particles — only on larger sizes when active */}
      {s.particles && isActive && (
        <>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                animation: `orbRingRotate ${3 + i * 1.5}s linear infinite`,
                animationDelay: `${i * -1.2}s`,
              }}
            >
              <div
                className="absolute w-1.5 h-1.5 rounded-full bg-primary/60"
                style={{
                  top: i === 0 ? "4%" : i === 1 ? "12%" : "8%",
                  left: "50%",
                  animation: "orbFadeFloat 2s ease-in-out infinite",
                  animationDelay: `${i * 0.7}s`,
                }}
              />
            </div>
          ))}
        </>
      )}

      {/* Action label badge — floats below the orb */}
      {s.label && actionLabel && (
        <div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
          style={{ animation: "orbFadeFloat 3s ease-in-out infinite" }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold tracking-wide backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {actionLabel}
          </span>
        </div>
      )}
    </div>
  )
}

export const AgentOrb = memo(AgentOrbInner)

/**
 * MiniOrb — compact inline version for message headers.
 * Uses the same visual language but at 28px with no particles.
 */
function MiniOrbInner({ state, className }: { state: OrbState; className?: string }) {
  const isActive = state === "generating" || state === "searching"

  return (
    <div className={cn("relative w-7 h-7 flex items-center justify-center flex-shrink-0", className)}>
      {isActive && (
        <div
          className="absolute inset-[-2px] rounded-lg opacity-50"
          style={{
            background: "conic-gradient(from 0deg, transparent 0%, rgba(59,130,246,0.35) 25%, transparent 50%, rgba(56,189,248,0.3) 75%, transparent 100%)",
            animation: "orbRingRotate 3s linear infinite",
          }}
        />
      )}
      <div
        className="w-5 h-5 rounded-lg relative"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(56,189,248,0.2) 50%, rgba(99,102,241,0.25) 100%)",
          animation: isActive
            ? "orbMorph 5s ease-in-out infinite, orbGlowActive 2s ease-in-out infinite"
            : "orbBreathe 4s ease-in-out infinite",
        }}
      >
        <div
          className="absolute inset-[20%] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(147,197,253,0.6) 0%, transparent 70%)",
            animation: isActive ? "orbBreathe 1.5s ease-in-out infinite" : "none",
          }}
        />
      </div>
    </div>
  )
}

export const MiniOrb = memo(MiniOrbInner)
