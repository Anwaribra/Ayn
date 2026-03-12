"use client"

import { cn } from "@/lib/utils"
import { memo, useRef, useEffect, useCallback } from "react"
import type { BufferAttribute } from "three"

type OrbState = "idle" | "searching" | "generating" | "error"

interface AgentOrbProps {
  state: OrbState
  size?: "sm" | "md" | "lg" | "hero"
  actionLabel?: string | null
  className?: string
}

const STATE_PARAMS: Record<OrbState, { speed: number; spikes: number; processing: number; color: number; emissive: number; emissiveIntensity: number }> = {
  idle:       { speed: 10,  spikes: 0.45, processing: 0.8,  color: 0xE4ECFA, emissive: 0x1a3a5c, emissiveIntensity: 0.1 },
  searching:  { speed: 25,  spikes: 0.75, processing: 1.15, color: 0xBDD4FF, emissive: 0x1e40af, emissiveIntensity: 0.2 },
  generating: { speed: 40,  spikes: 1.0,  processing: 1.35, color: 0x93B4FF, emissive: 0x2563eb, emissiveIntensity: 0.25 },
  error:      { speed: 18,  spikes: 0.55, processing: 1.0,  color: 0xFCA5A5, emissive: 0x991b1b, emissiveIntensity: 0.2 },
}

const CANVAS_SIZES: Record<string, number> = { sm: 56, md: 80, lg: 160, hero: 280 }
const CANVAS_SIZES_MOBILE: Record<string, number> = { sm: 56, md: 80, lg: 120, hero: 200 }

function useCanvasSize(size: string) {
  const sizeRef = useRef(
    typeof window !== "undefined" && window.innerWidth < 640
      ? (CANVAS_SIZES_MOBILE[size] ?? 200)
      : (CANVAS_SIZES[size] ?? 280)
  )
  return sizeRef.current
}

/**
 * ThreeOrb — the core Three.js canvas orb.
 * Dynamically imports `three` and `simplex-noise` to keep the bundle
 * SSR-safe and code-split away from the main chat chunk.
 *
 * Animation loop runs entirely on the GPU via MeshPhongMaterial + vertex
 * displacement. State transitions (color, speed, spikes) are smoothly
 * interpolated with lerp each frame so there is never a hard visual cut.
 */
function ThreeOrb({ state, canvasSize }: { state: OrbState; canvasSize: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(state)
  const internalsRef = useRef<{
    dispose: () => void
    currentParams: { speed: number; spikes: number; processing: number }
  } | null>(null)

  useEffect(() => { stateRef.current = state }, [state])

  const init = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const [THREE, { createNoise3D }] = await Promise.all([
      import("three"),
      import("simplex-noise"),
    ])

    const noise3D = createNoise3D()
    let disposed = false

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    renderer.setSize(canvasSize, canvasSize)
    renderer.setPixelRatio(dpr)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    camera.position.z = 5

    const segments = canvasSize <= 80 ? 48 : canvasSize <= 160 ? 64 : 128
    const geometry = new THREE.SphereGeometry(1, segments, segments)

    const startParams = STATE_PARAMS[stateRef.current]
    const material = new THREE.MeshPhongMaterial({
      color: startParams.color,
      shininess: 100,
      emissive: startParams.emissive,
      emissiveIntensity: startParams.emissiveIntensity,
    })

    const lightTop = new THREE.DirectionalLight(0xFFFFFF, 0.7)
    lightTop.position.set(0, 500, 200)
    scene.add(lightTop)

    const lightBottom = new THREE.DirectionalLight(0xFFFFFF, 0.25)
    lightBottom.position.set(0, -500, 400)
    scene.add(lightBottom)

    const ambientLight = new THREE.AmbientLight(0x798296)
    scene.add(ambientLight)

    const sphere = new THREE.Mesh(geometry, material)
    scene.add(sphere)

    const posAttr = geometry.getAttribute("position") as BufferAttribute
    const basePositions = new Float32Array(posAttr.array.length)
    basePositions.set(posAttr.array)

    const vertex = new THREE.Vector3()
    const targetColor = new THREE.Color()
    const targetEmissive = new THREE.Color()

    const live = {
      speed: startParams.speed,
      spikes: startParams.spikes,
      processing: startParams.processing,
    }

    let animId = 0

    function tick() {
      if (disposed) return

      const target = STATE_PARAMS[stateRef.current]
      live.speed      += (target.speed      - live.speed)      * 0.04
      live.spikes     += (target.spikes     - live.spikes)     * 0.04
      live.processing += (target.processing - live.processing) * 0.04

      targetColor.set(target.color)
      material.color.lerp(targetColor, 0.035)
      targetEmissive.set(target.emissive)
      material.emissive.lerp(targetEmissive, 0.035)
      material.emissiveIntensity += (target.emissiveIntensity - material.emissiveIntensity) * 0.04

      const time = performance.now() * 0.00001 * live.speed * Math.pow(live.processing, 3)
      const spikes = live.spikes * live.processing

      for (let i = 0; i < posAttr.count; i++) {
        const ix = i * 3
        vertex.set(basePositions[ix], basePositions[ix + 1], basePositions[ix + 2])
        vertex.normalize()

        const n = noise3D(vertex.x * spikes, vertex.y * spikes, vertex.z * spikes + time)
        vertex.multiplyScalar(1 + 0.3 * n)

        ;(posAttr.array as Float32Array)[ix]     = vertex.x
        ;(posAttr.array as Float32Array)[ix + 1] = vertex.y
        ;(posAttr.array as Float32Array)[ix + 2] = vertex.z
      }

      posAttr.needsUpdate = true
      geometry.computeVertexNormals()

      renderer.render(scene, camera)
      animId = requestAnimationFrame(tick)
    }

    tick()

    internalsRef.current = {
      currentParams: live,
      dispose() {
        disposed = true
        cancelAnimationFrame(animId)
        geometry.dispose()
        material.dispose()
        renderer.dispose()
      },
    }
  }, [canvasSize])

  useEffect(() => {
    init()
    return () => { internalsRef.current?.dispose() }
  }, [init])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: canvasSize, height: canvasSize }}
      className="pointer-events-none"
    />
  )
}

// ─── Main AgentOrb ────────────────────────────────────────────────────────────

function AgentOrbInner({ state, size = "hero", actionLabel, className }: AgentOrbProps) {
  const canvasSize = useCanvasSize(size)
  const isActive = state === "generating" || state === "searching"

  return (
    <div className={cn("relative flex items-center justify-center select-none", className)}>
      {/* Ambient glow halo behind the 3D orb */}
      <div
        className={cn(
          "absolute rounded-full transition-all duration-700 pointer-events-none",
          isActive ? "opacity-30 scale-110" : "opacity-15 scale-100",
        )}
        style={{
          width: canvasSize * 1.4,
          height: canvasSize * 1.4,
          background: state === "error"
            ? "radial-gradient(circle, rgba(239,68,68,0.35) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(56,189,248,0.15) 40%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      {/* The Three.js canvas */}
      <ThreeOrb state={state} canvasSize={canvasSize} />

      {/* Action label badge — floats below the orb (lg/hero only) */}
      {(size === "lg" || size === "hero") && actionLabel && (
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

// ─── MiniOrb — lightweight CSS-only version for inline message headers ───────
// Using WebGL at 28px would be wasteful. This mirrors the 3D orb's color
// language with pure CSS animations from globals.css.

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
          background: state === "error"
            ? "linear-gradient(135deg, rgba(239,68,68,0.4) 0%, rgba(190,18,60,0.3) 50%, rgba(239,68,68,0.2) 100%)"
            : "linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(56,189,248,0.2) 50%, rgba(99,102,241,0.25) 100%)",
          animation: isActive
            ? "orbMorph 5s ease-in-out infinite, orbGlowActive 2s ease-in-out infinite"
            : "orbBreathe 4s ease-in-out infinite",
        }}
      >
        <div
          className="absolute inset-[20%] rounded-full"
          style={{
            background: state === "error"
              ? "radial-gradient(circle, rgba(239,68,68,0.5) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(147,197,253,0.6) 0%, transparent 70%)",
            animation: isActive ? "orbBreathe 1.5s ease-in-out infinite" : "none",
          }}
        />
      </div>
    </div>
  )
}

export const MiniOrb = memo(MiniOrbInner)
