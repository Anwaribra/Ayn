"use client"

import { cn } from "@/lib/utils"
import { memo, useRef, useEffect, useCallback } from "react"

type OrbState = "idle" | "searching" | "generating" | "error"

interface AgentOrbProps {
  state: OrbState
  size?: "sm" | "md" | "lg" | "hero"
  className?: string
}

type StateParams = {
  speed: number
  coreDistortion: number
  coreGlow: number
  particleSpeed: number
  radialPull: number
  breathStrength: number
  turbulence: number
  ringSpeed: number
  ringOpacity: number
}

const STATE_PARAMS: Record<OrbState, StateParams> = {
  idle:       { speed: 0.3, coreDistortion: 0.12, coreGlow: 0.25, particleSpeed: 0.2, radialPull: 0,     breathStrength: 0.04, turbulence: 0.02, ringSpeed: 0.3, ringOpacity: 0.35 },
  searching:  { speed: 0.8, coreDistortion: 0.20, coreGlow: 0.45, particleSpeed: 0.6, radialPull: 0.12,  breathStrength: 0.08, turbulence: 0.05, ringSpeed: 0.8, ringOpacity: 0.55 },
  generating: { speed: 1.2, coreDistortion: 0.30, coreGlow: 0.65, particleSpeed: 1.0, radialPull: -0.08, breathStrength: 0.06, turbulence: 0.08, ringSpeed: 1.5, ringOpacity: 0.7  },
  error:      { speed: 0.5, coreDistortion: 0.15, coreGlow: 0.35, particleSpeed: 0.3, radialPull: 0.05,  breathStrength: 0.10, turbulence: 0.12, ringSpeed: 0.2, ringOpacity: 0.2  },
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

// ─── GLSL Shaders ───────────────────────────────────────────────────────────

const CORE_VS = /* glsl */ `
uniform float uTime;
uniform float uDistortion;
varying vec3 vNormal;
varying vec3 vViewPos;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  float t = uTime;
  float d = sin(p.x*3.0+t)*cos(p.y*4.0+t*1.3)*sin(p.z*3.5+t*0.7)
          + sin(p.x*5.0+t*1.5)*cos(p.z*4.5+t*0.9)*0.5
          + cos(p.y*6.0+t*0.8)*sin(p.x*2.0+t*1.1)*0.25;
  p += normal * d * uDistortion;
  vNormal = normalMatrix * normal;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vViewPos = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`

const CORE_FS = /* glsl */ `
uniform float uTime;
uniform float uGlow;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uGlowColor;
varying vec3 vNormal;
varying vec3 vViewPos;
varying vec2 vUv;
void main() {
  vec3 v = normalize(vViewPos);
  vec3 n = normalize(vNormal);
  float fresnel = pow(1.0 - abs(dot(v, n)), 3.2);
  float shift = dot(v, n) * 0.5 + 0.5 + sin(uTime * 0.4) * 0.1;
  vec3 col = mix(uColor1, uColor2, shift);
  float irid = sin(dot(v, n) * 6.0 + uTime * 0.6) * 0.5 + 0.5;
  col = mix(col, uGlowColor * 0.6, irid * 0.1);
  float flow = sin(vUv.x * 14.0 + uTime * 0.7) * cos(vUv.y * 14.0 + uTime * 0.5) * 0.025;
  col += flow * uGlowColor;
  col = mix(col, uGlowColor, fresnel * uGlow * 0.5);
  vec3 h = normalize(v + normalize(vec3(0.3, 1.0, 0.5)));
  col += pow(max(dot(n, h), 0.0), 80.0) * 0.12 * uGlowColor;
  gl_FragColor = vec4(col, 0.9);
}
`

const PARTICLE_VS = /* glsl */ `
attribute float aPhase;
attribute float aSize;
attribute float aOpacity;
uniform float uTime;
uniform float uSpeed;
uniform float uRadialPull;
uniform float uBreathStrength;
uniform float uTurbulence;
uniform float uDpr;
varying float vOpacity;
void main() {
  vOpacity = aOpacity;
  float t = uTime * uSpeed;
  float ph = aPhase * 6.2832;
  vec3 pos = position;
  float a = t * (0.08 + aPhase * 0.15) + ph;
  float ca = cos(a);
  float sa = sin(a);
  pos = vec3(ca*pos.x + sa*pos.z, pos.y, -sa*pos.x + ca*pos.z);
  float b = t * 0.05 + ph * 0.5;
  float cb = cos(b);
  float sb = sin(b);
  pos = vec3(pos.x, cb*pos.y - sb*pos.z, sb*pos.y + cb*pos.z);
  pos *= 1.0 + sin(t * 1.5 + ph) * uBreathStrength;
  pos += normalize(pos + vec3(0.0001)) * uRadialPull * (0.5 + aPhase);
  pos.x += sin(t*0.7 + pos.y*3.0 + ph) * uTurbulence;
  pos.y += cos(t*0.5 + pos.z*3.0 + ph) * uTurbulence;
  pos.z += sin(t*0.6 + pos.x*3.0 + ph) * uTurbulence;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aSize * uDpr * (300.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`

const PARTICLE_FS = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uCoreColor;
varying float vOpacity;
void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float core = smoothstep(0.12, 0.0, d);
  float glow = smoothstep(0.5, 0.0, d) * 0.35;
  float alpha = (core + glow) * vOpacity;
  vec3 col = mix(uColor, uCoreColor, core * 0.6);
  gl_FragColor = vec4(col, alpha);
}
`

const RING_VS = /* glsl */ `
attribute float aOpacity;
attribute float aSize;
uniform float uDpr;
varying float vOpacity;
void main() {
  vOpacity = aOpacity;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uDpr * (200.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`

const RING_FS = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vOpacity;
void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vOpacity * uOpacity);
}
`

// ─── ThreeOrb ───────────────────────────────────────────────────────────────
// Dual-layer orb: iridescent shader core + particle nebula halo + orbital rings.
// All state transitions are smoothly interpolated via lerp each frame.

function ThreeOrb({ state, canvasSize }: { state: OrbState; canvasSize: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(state)
  const internalsRef = useRef<{ dispose: () => void } | null>(null)

  useEffect(() => { stateRef.current = state }, [state])

  const init = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const THREE = await import("three")
    let disposed = false
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const isLarge = canvasSize > 120

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(canvasSize, canvasSize)
    renderer.setPixelRatio(dpr)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.z = 4.5

    // ── Core sphere (small when particles present, larger when standalone) ──

    const coreRadius = isLarge ? 0.4 : 0.85
    const segments = canvasSize <= 80 ? 36 : canvasSize <= 160 ? 48 : 72
    const coreGeo = new THREE.SphereGeometry(coreRadius, segments, segments)

    const coreUniforms = {
      uTime: { value: 0 },
      uDistortion: { value: 0.12 },
      uGlow: { value: 0.3 },
      uColor1: { value: new THREE.Color(0x1e1145) },
      uColor2: { value: new THREE.Color(0x7c3aed) },
      uGlowColor: { value: new THREE.Color(0x38bdf8) },
    }

    const coreMat = new THREE.ShaderMaterial({
      vertexShader: CORE_VS,
      fragmentShader: CORE_FS,
      uniforms: coreUniforms,
      transparent: true,
    })

    const core = new THREE.Mesh(coreGeo, coreMat)
    scene.add(core)

    // ── Inner glow halo ──

    const glowGeo = new THREE.SphereGeometry(coreRadius * 1.6, 16, 16)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    })
    const glowMesh = new THREE.Mesh(glowGeo, glowMat)
    scene.add(glowMesh)

    // ── Particle nebula (large sizes only) ──

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let particleMat: any = null

    if (isLarge) {
      const count = canvasSize > 280 ? 1200 : 400
      const positions = new Float32Array(count * 3)
      const phases = new Float32Array(count)
      const sizes = new Float32Array(count)
      const opacities = new Float32Array(count)

      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const r = 0.55 + Math.random() * 0.8
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = r * Math.cos(phi)
        phases[i] = Math.random()
        sizes[i] = 2.5 + Math.random() * 4.5
        opacities[i] = 0.25 + Math.random() * 0.6
      }

      const pGeo = new THREE.BufferGeometry()
      pGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
      pGeo.setAttribute("aPhase", new THREE.Float32BufferAttribute(phases, 1))
      pGeo.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1))
      pGeo.setAttribute("aOpacity", new THREE.Float32BufferAttribute(opacities, 1))

      particleMat = new THREE.ShaderMaterial({
        vertexShader: PARTICLE_VS,
        fragmentShader: PARTICLE_FS,
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: 0.2 },
          uRadialPull: { value: 0 },
          uBreathStrength: { value: 0.04 },
          uTurbulence: { value: 0.02 },
          uDpr: { value: dpr },
          uColor: { value: new THREE.Color(0xc4b5fd) },
          uCoreColor: { value: new THREE.Color(0x38bdf8) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })

      scene.add(new THREE.Points(pGeo, particleMat))
    }

    // ── Orbital particle rings (large sizes only) ──

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ringMats: any[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ringGroups: any[] = []

    if (isLarge) {
      const ringCount = canvasSize > 280 ? 80 : 40

      function makeRing(radius: number, color: number, tiltX: number, tiltZ: number) {
        const pos = new Float32Array(ringCount * 3)
        const op = new Float32Array(ringCount)
        const sz = new Float32Array(ringCount)
        for (let i = 0; i < ringCount; i++) {
          const angle = (i / ringCount) * Math.PI * 2
          pos[i * 3] = Math.cos(angle) * radius
          pos[i * 3 + 1] = 0
          pos[i * 3 + 2] = Math.sin(angle) * radius
          op[i] = 0.4 + Math.random() * 0.5
          sz[i] = 2.5 + Math.random() * 3.0
        }
        const geo = new THREE.BufferGeometry()
        geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
        geo.setAttribute("aOpacity", new THREE.Float32BufferAttribute(op, 1))
        geo.setAttribute("aSize", new THREE.Float32BufferAttribute(sz, 1))
        const mat = new THREE.ShaderMaterial({
          vertexShader: RING_VS,
          fragmentShader: RING_FS,
          uniforms: {
            uColor: { value: new THREE.Color(color) },
            uOpacity: { value: 0.15 },
            uDpr: { value: dpr },
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
        const pts = new THREE.Points(geo, mat)
        pts.rotation.x = tiltX
        pts.rotation.z = tiltZ
        scene.add(pts)
        ringMats.push(mat)
        ringGroups.push(pts)
      }

      makeRing(1.5, 0x7c3aed, Math.PI * 0.3, Math.PI * 0.08)
      makeRing(1.65, 0x38bdf8, -Math.PI * 0.22, Math.PI * 0.15)
    }

    // ── Animation loop ──

    const live: StateParams = { ...STATE_PARAMS[stateRef.current] }
    const LERP = 0.03
    const normalColors = [new THREE.Color(0x1e1145), new THREE.Color(0x7c3aed), new THREE.Color(0x38bdf8)]
    const errorColors = [new THREE.Color(0x450a0a), new THREE.Color(0xef4444), new THREE.Color(0xfca5a5)]
    let animId = 0

    function tick() {
      if (disposed) return

      const target = STATE_PARAMS[stateRef.current]
      for (const k of Object.keys(live) as (keyof StateParams)[]) {
        live[k] += (target[k] - live[k]) * LERP
      }

      const t = performance.now() * 0.001

      coreUniforms.uTime.value = t * live.speed
      coreUniforms.uDistortion.value = live.coreDistortion
      coreUniforms.uGlow.value = live.coreGlow

      const tc = stateRef.current === "error" ? errorColors : normalColors
      coreUniforms.uColor1.value.lerp(tc[0], LERP)
      coreUniforms.uColor2.value.lerp(tc[1], LERP)
      coreUniforms.uGlowColor.value.lerp(tc[2], LERP)

      core.rotation.y += 0.003 * live.speed
      core.rotation.x = Math.sin(t * 0.25) * 0.12

      const pulse = 1 + Math.sin(t * 1.5 * live.speed) * 0.04
      glowMesh.scale.setScalar(pulse)
      glowMat.opacity = 0.04 + live.coreGlow * 0.06

      if (particleMat) {
        const u = particleMat.uniforms
        u.uTime.value = t
        u.uSpeed.value = live.particleSpeed
        u.uRadialPull.value = live.radialPull
        u.uBreathStrength.value = live.breathStrength
        u.uTurbulence.value = live.turbulence
      }

      for (let i = 0; i < ringGroups.length; i++) {
        const dir = i === 0 ? 1 : -1
        ringGroups[i].rotation.y += 0.004 * live.ringSpeed * dir
        const targetOp = live.ringOpacity * (i === 0 ? 1 : 0.7)
        ringMats[i].uniforms.uOpacity.value += (targetOp - ringMats[i].uniforms.uOpacity.value) * LERP
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
          isActive ? "opacity-40 scale-110" : "opacity-20 scale-100",
        )}
        style={{
          width: canvasSize * 1.5,
          height: canvasSize * 1.5,
          background: state === "error"
            ? "radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(124,58,237,0.3) 0%, rgba(56,189,248,0.12) 35%, rgba(99,102,241,0.06) 55%, transparent 72%)",
          filter: "blur(45px)",
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
