"use client"

import { cn } from "@/lib/utils"
import { memo, useRef, useEffect, useCallback } from "react"
import type { BufferAttribute } from "three"

type OrbState = "idle" | "searching" | "generating" | "error"

interface AgentOrbProps {
  state: OrbState
  size?: "sm" | "md" | "lg" | "hero"
  className?: string
}

const STATE_CONFIG: Record<OrbState, {
  speed: number; spikes: number; processing: number
  color: number; emissive: number; emissiveIntensity: number; specular: number
  particleSpeed: number; radialPull: number; breathStrength: number
  ringSpeed: number; ringOpacity: number; particleOpacity: number
}> = {
  idle: {
    speed: 10, spikes: 0.45, processing: 0.8,
    color: 0x6d28d9, emissive: 0x3b82f6, emissiveIntensity: 0.2, specular: 0x93c5fd,
    particleSpeed: 0.15, radialPull: 0, breathStrength: 0.03,
    ringSpeed: 0.2, ringOpacity: 0.45, particleOpacity: 0.55,
  },
  searching: {
    speed: 25, spikes: 0.7, processing: 1.1,
    color: 0x5b21b6, emissive: 0x2563eb, emissiveIntensity: 0.3, specular: 0x93c5fd,
    particleSpeed: 0.5, radialPull: 0.1, breathStrength: 0.06,
    ringSpeed: 0.6, ringOpacity: 0.6, particleOpacity: 0.7,
  },
  generating: {
    speed: 40, spikes: 1.0, processing: 1.35,
    color: 0x7c3aed, emissive: 0x0ea5e9, emissiveIntensity: 0.35, specular: 0x38bdf8,
    particleSpeed: 0.8, radialPull: -0.06, breathStrength: 0.05,
    ringSpeed: 1.2, ringOpacity: 0.75, particleOpacity: 0.85,
  },
  error: {
    speed: 18, spikes: 0.55, processing: 1.0,
    color: 0xfca5a5, emissive: 0x991b1b, emissiveIntensity: 0.2, specular: 0xfca5a5,
    particleSpeed: 0.2, radialPull: 0.04, breathStrength: 0.08,
    ringSpeed: 0.15, ringOpacity: 0.2, particleOpacity: 0.4,
  },
}

const CANVAS_SIZES: Record<string, number> = { sm: 56, md: 80, lg: 160, hero: 400 }
const CANVAS_SIZES_MOBILE: Record<string, number> = { sm: 56, md: 80, lg: 120, hero: 300 }

function useCanvasSize(size: string) {
  const sizeRef = useRef(
    typeof window !== "undefined" && window.innerWidth < 640
      ? (CANVAS_SIZES_MOBILE[size] ?? 200)
      : (CANVAS_SIZES[size] ?? 280)
  )
  return sizeRef.current
}

// ─── ThreeOrb ───────────────────────────────────────────────────────────────
// Core: MeshPhongMaterial + simplex noise vertex displacement (proven).
// Nebula: PointsMaterial with canvas-generated soft circle texture.
// Rings: PointsMaterial particle rings at different tilts.

function ThreeOrb({ state, canvasSize }: { state: OrbState; canvasSize: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(state)
  const internalsRef = useRef<{ dispose: () => void } | null>(null)

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
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const isLarge = canvasSize > 120

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(canvasSize, canvasSize)
    renderer.setPixelRatio(dpr)
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    camera.position.z = 5

    // ── Lights ──

    const lightTop = new THREE.DirectionalLight(0xe0e7ff, 0.8)
    lightTop.position.set(0, 500, 200)
    scene.add(lightTop)

    const lightBottom = new THREE.DirectionalLight(0x38bdf8, 0.4)
    lightBottom.position.set(0, -500, 400)
    scene.add(lightBottom)

    const lightSide = new THREE.DirectionalLight(0xa78bfa, 0.35)
    lightSide.position.set(-400, 100, 300)
    scene.add(lightSide)

    scene.add(new THREE.AmbientLight(0x6366f1, 0.3))

    // ── Core sphere ──

    const coreRadius = isLarge ? 0.8 : 1.0
    const segments = canvasSize <= 80 ? 48 : canvasSize <= 160 ? 64 : 128
    const geometry = new THREE.SphereGeometry(coreRadius, segments, segments)

    const startCfg = STATE_CONFIG[stateRef.current]
    const material = new THREE.MeshPhongMaterial({
      color: startCfg.color,
      shininess: 150,
      emissive: startCfg.emissive,
      emissiveIntensity: startCfg.emissiveIntensity,
      specular: startCfg.specular,
    })

    const sphere = new THREE.Mesh(geometry, material)
    scene.add(sphere)

    const posAttr = geometry.getAttribute("position") as BufferAttribute
    const basePositions = new Float32Array(posAttr.array.length)
    basePositions.set(posAttr.array)

    const vertex = new THREE.Vector3()
    const targetColor = new THREE.Color()
    const targetEmissive = new THREE.Color()
    const targetSpecular = new THREE.Color()

    // ── Soft circle texture for particles ──

    let pointTexture: InstanceType<typeof THREE.CanvasTexture> | null = null
    if (isLarge) {
      const tc = document.createElement("canvas")
      tc.width = 64
      tc.height = 64
      const ctx = tc.getContext("2d")!
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
      grad.addColorStop(0, "rgba(255,255,255,1)")
      grad.addColorStop(0.15, "rgba(255,255,255,0.85)")
      grad.addColorStop(0.4, "rgba(255,255,255,0.35)")
      grad.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 64, 64)
      pointTexture = new THREE.CanvasTexture(tc)
    }

    // ── Particle nebula ──

    let pPositions: Float32Array | null = null
    let pPosAttr: BufferAttribute | null = null
    let pMat: InstanceType<typeof THREE.PointsMaterial> | null = null
    let pThetas: Float32Array | null = null
    let pPhis: Float32Array | null = null
    let pRadii: Float32Array | null = null
    let pPhases: Float32Array | null = null

    if (isLarge && pointTexture) {
      const count = canvasSize > 280 ? 900 : 300
      pPositions = new Float32Array(count * 3)
      pThetas = new Float32Array(count)
      pPhis = new Float32Array(count)
      pRadii = new Float32Array(count)
      pPhases = new Float32Array(count)

      for (let i = 0; i < count; i++) {
        pThetas[i] = Math.random() * Math.PI * 2
        pPhis[i] = Math.acos(2 * Math.random() - 1)
        pRadii[i] = 1.15 + Math.random() * 0.65
        pPhases[i] = Math.random()
        const r = pRadii[i]
        pPositions[i * 3] = r * Math.sin(pPhis[i]) * Math.cos(pThetas[i])
        pPositions[i * 3 + 1] = r * Math.cos(pPhis[i])
        pPositions[i * 3 + 2] = r * Math.sin(pPhis[i]) * Math.sin(pThetas[i])
      }

      const pGeo = new THREE.BufferGeometry()
      pPosAttr = new THREE.Float32BufferAttribute(pPositions, 3)
      pGeo.setAttribute("position", pPosAttr)

      pMat = new THREE.PointsMaterial({
        color: 0xc4b5fd,
        size: 0.09,
        map: pointTexture,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      })

      scene.add(new THREE.Points(pGeo, pMat))
    }

    // ── Orbital particle rings ──

    const ringGroups: InstanceType<typeof THREE.Points>[] = []
    const ringMats: InstanceType<typeof THREE.PointsMaterial>[] = []

    if (isLarge && pointTexture) {
      const ringCount = canvasSize > 280 ? 60 : 30

      function makeRing(radius: number, color: number, tiltX: number, tiltZ: number) {
        const positions = new Float32Array(ringCount * 3)
        for (let i = 0; i < ringCount; i++) {
          const angle = (i / ringCount) * Math.PI * 2
          positions[i * 3] = Math.cos(angle) * radius
          positions[i * 3 + 1] = 0
          positions[i * 3 + 2] = Math.sin(angle) * radius
        }
        const geo = new THREE.BufferGeometry()
        geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
        const mat = new THREE.PointsMaterial({
          color,
          size: 0.055,
          map: pointTexture!,
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        })
        const pts = new THREE.Points(geo, mat)
        pts.rotation.x = tiltX
        pts.rotation.z = tiltZ
        scene.add(pts)
        ringGroups.push(pts)
        ringMats.push(mat)
      }

      makeRing(1.55, 0xa78bfa, Math.PI * 0.3, Math.PI * 0.08)
      makeRing(1.75, 0x38bdf8, -Math.PI * 0.22, Math.PI * 0.15)
    }

    // ── Animation loop ──

    const live = {
      speed: startCfg.speed,
      spikes: startCfg.spikes,
      processing: startCfg.processing,
      particleSpeed: startCfg.particleSpeed,
      radialPull: startCfg.radialPull,
      breathStrength: startCfg.breathStrength,
      ringSpeed: startCfg.ringSpeed,
      ringOpacity: startCfg.ringOpacity,
      particleOpacity: startCfg.particleOpacity,
    }

    let animId = 0

    function tick() {
      if (disposed) return

      const target = STATE_CONFIG[stateRef.current]
      const L = 0.04

      live.speed += (target.speed - live.speed) * L
      live.spikes += (target.spikes - live.spikes) * L
      live.processing += (target.processing - live.processing) * L
      live.particleSpeed += (target.particleSpeed - live.particleSpeed) * L
      live.radialPull += (target.radialPull - live.radialPull) * L
      live.breathStrength += (target.breathStrength - live.breathStrength) * L
      live.ringSpeed += (target.ringSpeed - live.ringSpeed) * L
      live.ringOpacity += (target.ringOpacity - live.ringOpacity) * L
      live.particleOpacity += (target.particleOpacity - live.particleOpacity) * L

      // Core material colors
      targetColor.set(target.color)
      material.color.lerp(targetColor, 0.035)
      targetEmissive.set(target.emissive)
      material.emissive.lerp(targetEmissive, 0.035)
      targetSpecular.set(target.specular)
      material.specular.lerp(targetSpecular, 0.035)
      material.emissiveIntensity += (target.emissiveIntensity - material.emissiveIntensity) * L

      // Core vertex displacement via simplex noise
      const time = performance.now() * 0.00001 * live.speed * Math.pow(live.processing, 3)
      const spikes = live.spikes * live.processing

      for (let i = 0; i < posAttr.count; i++) {
        const ix = i * 3
        vertex.set(basePositions[ix], basePositions[ix + 1], basePositions[ix + 2])
        vertex.normalize()
        const n = noise3D(vertex.x * spikes, vertex.y * spikes, vertex.z * spikes + time)
        vertex.multiplyScalar(coreRadius * (1 + 0.3 * n))
        ;(posAttr.array as Float32Array)[ix] = vertex.x
        ;(posAttr.array as Float32Array)[ix + 1] = vertex.y
        ;(posAttr.array as Float32Array)[ix + 2] = vertex.z
      }
      posAttr.needsUpdate = true
      geometry.computeVertexNormals()

      // Particle orbital animation
      if (pPositions && pThetas && pPhis && pRadii && pPhases && pPosAttr) {
        const t = performance.now() * 0.001
        const count = pThetas.length
        for (let i = 0; i < count; i++) {
          const phase = pPhases[i]
          const theta = pThetas[i] + t * live.particleSpeed * (0.1 + phase * 0.15)
          const phi = pPhis[i] + Math.sin(t * 0.05 + phase * 6.28) * 0.08
          const r = pRadii[i]
            * (1 + Math.sin(t * 1.5 + phase * 6.28) * live.breathStrength)
            + live.radialPull * (0.5 + phase)

          pPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
          pPositions[i * 3 + 1] = r * Math.cos(phi)
          pPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
        }
        pPosAttr.needsUpdate = true
      }

      if (pMat) pMat.opacity = live.particleOpacity

      // Ring rotation & opacity
      for (let i = 0; i < ringGroups.length; i++) {
        ringGroups[i].rotation.y += 0.003 * live.ringSpeed * (i === 0 ? 1 : -1)
        ringMats[i].opacity = live.ringOpacity * (i === 0 ? 1 : 0.7)
      }

      renderer.render(scene, camera)
      animId = requestAnimationFrame(tick)
    }

    tick()

    internalsRef.current = {
      dispose() {
        disposed = true
        cancelAnimationFrame(animId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scene.traverse((obj: any) => {
          obj.geometry?.dispose()
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m: { dispose: () => void }) => m.dispose())
            else obj.material.dispose()
          }
        })
        pointTexture?.dispose()
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

// ─── AgentOrb ─────────────────────────────────────────────────────────────────

function AgentOrbInner({ state, size = "hero", className }: AgentOrbProps) {
  const canvasSize = useCanvasSize(size)
  const isActive = state === "generating" || state === "searching"

  return (
    <div className={cn("relative flex items-center justify-center select-none", className)}>
      <div
        className={cn(
          "absolute rounded-full transition-all duration-700 pointer-events-none",
          isActive ? "opacity-35 scale-110" : "opacity-20 scale-100",
        )}
        style={{
          width: canvasSize * 1.5,
          height: canvasSize * 1.5,
          background: state === "error"
            ? "radial-gradient(circle, rgba(239,68,68,0.35) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(124,58,237,0.35) 0%, rgba(14,165,233,0.15) 40%, rgba(59,130,246,0.08) 60%, transparent 75%)",
          filter: "blur(40px)",
        }}
      />
      <ThreeOrb state={state} canvasSize={canvasSize} />
    </div>
  )
}

export const AgentOrb = memo(AgentOrbInner)

// ─── MiniOrb — CSS-only for inline message headers ──────────────────────────

function MiniOrbInner({ state, className }: { state: OrbState; className?: string }) {
  const isActive = state === "generating" || state === "searching"
  const isError = state === "error"

  return (
    <div className={cn("relative w-7 h-7 flex items-center justify-center flex-shrink-0", className)}>
      {isActive && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 0%, rgba(124,58,237,0.4) 25%, transparent 50%, rgba(56,189,248,0.35) 75%, transparent 100%)",
            animation: "orbRingRotate 2.5s linear infinite",
          }}
        />
      )}
      <div
        className="absolute inset-[3px] rounded-full"
        style={{
          background: isError
            ? "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(124,58,237,0.12) 0%, rgba(56,189,248,0.08) 50%, transparent 70%)",
          animation: isActive ? "orbBreathe 2s ease-in-out infinite" : "orbBreathe 4s ease-in-out infinite",
        }}
      />
      <div
        className="w-3 h-3 rounded-full"
        style={{
          background: isError
            ? "radial-gradient(circle at 35% 35%, rgba(252,165,165,0.9) 0%, rgba(239,68,68,0.6) 60%, rgba(127,29,29,0.4) 100%)"
            : "radial-gradient(circle at 35% 35%, rgba(196,181,253,0.9) 0%, rgba(124,58,237,0.6) 60%, rgba(30,17,69,0.4) 100%)",
          boxShadow: isError
            ? "0 0 8px rgba(239,68,68,0.3)"
            : isActive
              ? "0 0 10px rgba(124,58,237,0.4), 0 0 4px rgba(56,189,248,0.2)"
              : "0 0 6px rgba(124,58,237,0.15)",
          animation: isActive ? "orbGlowPulse 1.5s ease-in-out infinite" : "none",
        }}
      />
    </div>
  )
}

export const MiniOrb = memo(MiniOrbInner)
