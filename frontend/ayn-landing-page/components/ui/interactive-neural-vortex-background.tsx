"use client"

import { useEffect, useRef, type CSSProperties } from "react"
import { cn } from "@/lib/utils"

/**
 * WebGL neural vortex (same shader family as the ImmersiaVR demo).
 * - `animated`: time-based motion
 * - `interactive`: pointer follows cursor inside the container
 * - `variant="sidebar"`: Ayn blue/purple wisps biased to bottom-start
 */

const DEFAULT_FROZEN_TIME_MS = 6200
const DEFAULT_FROZEN_POINTER: [number, number] = [0.5, 0.5]
const DEFAULT_INTENSITY = 0.52

export type NeuralVortexBackgroundProps = {
  className?: string
  style?: CSSProperties
  opacity?: number
  /** 0–1 shader brightness */
  intensity?: number
  /** Darken center for readable overlaid text */
  textVignette?: boolean
  /** Animate shader time (rAF) */
  animated?: boolean
  /** Pointer reacts to mouse/touch within bounds */
  interactive?: boolean
  /** `sidebar` = narrow strip, glow from bottom-left */
  variant?: "default" | "sidebar"
  /** `mono` = black/dark gray instead of purple/blue */
  colorScheme?: "default" | "mono"
  frozenPointer?: [number, number]
  frozenTime?: number
  scrollProgress?: number
}

export function NeuralVortexBackground({
  className,
  style,
  opacity = 0.72,
  intensity = DEFAULT_INTENSITY,
  textVignette = true,
  animated = false,
  interactive = false,
  variant = "default",
  frozenPointer,
  frozenTime,
  scrollProgress = 0,
  colorScheme = "default",
}: NeuralVortexBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intensityRef = useRef(intensity)
  const pointerRef = useRef({ x: 0.5, y: 0.5, tX: 0.5, tY: 0.5 })
  const animationRef = useRef<number | null>(null)

  intensityRef.current = intensity

  const isSidebar = variant === "sidebar"
  const defaultPointer: [number, number] = isSidebar ? [0.22, 0.88] : DEFAULT_FROZEN_POINTER
  const resolvedFrozenPointer = frozenPointer ?? defaultPointer
  const resolvedFrozenTime = frozenTime ?? DEFAULT_FROZEN_TIME_MS

  useEffect(() => {
    pointerRef.current.x = resolvedFrozenPointer[0]
    pointerRef.current.y = resolvedFrozenPointer[1]
    pointerRef.current.tX = resolvedFrozenPointer[0]
    pointerRef.current.tY = resolvedFrozenPointer[1]
  }, [resolvedFrozenPointer[0], resolvedFrozenPointer[1]])

  useEffect(() => {
    const root = rootRef.current
    const canvasEl = canvasRef.current
    if (!root || !canvasEl) return

    const gl =
      canvasEl.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true }) ??
      (canvasEl.getContext("experimental-webgl", { alpha: true }) as WebGLRenderingContext | null)

    if (!gl) {
      console.warn("WebGL not supported — neural vortex background disabled")
      return
    }

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const vsSource = `
      precision mediump float;
      attribute vec2 a_position;
      varying vec2 vUv;
      void main() {
        vUv = .5 * (a_position + 1.);
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    const fsSource = `
      precision mediump float;
      varying vec2 vUv;
      uniform float u_time;
      uniform float u_ratio;
      uniform vec2 u_pointer_position;
      uniform float u_scroll_progress;
      uniform float u_intensity;
      uniform float u_sidebar;
      uniform float u_mono;

      vec2 rotate(vec2 uv, float th) {
        return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
      }

      float neuro_shape(vec2 uv, float t, float p) {
        vec2 sine_acc = vec2(0.);
        vec2 res = vec2(0.);
        float scale = 8.;
        for (int j = 0; j < 15; j++) {
          uv = rotate(uv, 1.);
          sine_acc = rotate(sine_acc, 1.);
          vec2 layer = uv * scale + float(j) + sine_acc - t;
          sine_acc += sin(layer) + 2.4 * p;
          res += (.5 + .5 * cos(layer)) / scale;
          scale *= 1.2;
        }
        return res.x + res.y;
      }

      void main() {
        vec2 uv = .5 * vUv;
        uv.x *= u_ratio;

        if (u_sidebar > 0.5) {
          uv.x += 0.15;
          uv.y -= 0.10;
        }

        vec2 pointer = vUv - u_pointer_position;
        pointer.x *= u_ratio;
        float p = clamp(length(pointer), 0., 1.);
        p = .5 * pow(1. - p, 2.);
        float t = .001 * u_time;
        float noise = neuro_shape(uv, t, p);
        noise = 1.0 * pow(noise, 3.);
        noise += 0.35 * pow(noise, 10.);

        if (u_sidebar > 0.5) {
          noise = max(0., noise - 0.18);
        } else {
          noise = max(0., noise - 0.56);
        }

        noise *= (1. - length(vUv - .5));
        if (u_sidebar > 0.5) {
          float edgeFade = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
          noise *= edgeFade;
        }
        noise *= u_intensity;

        vec3 color;
        if (u_mono > 0.5) {
          color = vec3(0.0, 0.0, 0.0);
          color = mix(color, vec3(0.08, 0.08, 0.12), 0.32 + 0.16 * sin(2.0 * u_scroll_progress + 1.2));
          color += vec3(0.06, 0.06, 0.1) * sin(2.0 * u_scroll_progress + 1.5);
        } else {
          color = vec3(0.5, 0.15, 0.65);
          if (u_sidebar > 0.5) {
            color = mix(vec3(0.08, 0.22, 0.95), vec3(0.42, 0.12, 0.72), 0.55);
            color = mix(color, vec3(0.02, 0.55, 0.92), 0.28 + 0.12 * sin(t * 2.5));
          } else {
            color = mix(color, vec3(0.02, 0.7, 0.9), 0.32 + 0.16 * sin(2.0 * u_scroll_progress + 1.2));
            color += vec3(0.15, 0.0, 0.6) * sin(2.0 * u_scroll_progress + 1.5);
          }
        }
        color *= noise;
        gl_FragColor = vec4(color, noise);
      }
    `

    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader error:", gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertexShader = compileShader(vsSource, gl.VERTEX_SHADER)
    const fragmentShader = compileShader(fsSource, gl.FRAGMENT_SHADER)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(program, "a_position")
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(program, "u_time")
    const uRatio = gl.getUniformLocation(program, "u_ratio")
    const uPointerPosition = gl.getUniformLocation(program, "u_pointer_position")
    const uScrollProgress = gl.getUniformLocation(program, "u_scroll_progress")
    const uIntensity = gl.getUniformLocation(program, "u_intensity")
    const uSidebar = gl.getUniformLocation(program, "u_sidebar")
    const uMono = gl.getUniformLocation(program, "u_mono")

    const drawFrame = (timeMs: number) => {
      const rect = root.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) return

      const dpr = Math.min(window.devicePixelRatio, animated ? 2 : 1.75)
      const w = Math.floor(rect.width * dpr)
      const h = Math.floor(rect.height * dpr)
      if (canvasEl.width !== w || canvasEl.height !== h) {
        canvasEl.width = w
        canvasEl.height = h
      }
      gl.viewport(0, 0, w, h)

      const ptr = pointerRef.current
      if (interactive) {
        ptr.x += (ptr.tX - ptr.x) * 0.12
        ptr.y += (ptr.tY - ptr.y) * 0.12
      }

      gl.uniform1f(uRatio, w / h)
      gl.uniform1f(uTime, animated ? timeMs : resolvedFrozenTime)
      gl.uniform2f(
        uPointerPosition,
        interactive ? ptr.x : resolvedFrozenPointer[0],
        interactive ? ptr.y : resolvedFrozenPointer[1],
      )
      gl.uniform1f(uScrollProgress, scrollProgress)
      gl.uniform1f(uIntensity, intensityRef.current)
      gl.uniform1f(uSidebar, isSidebar ? 1 : 0)
      gl.uniform1f(uMono, colorScheme === "mono" ? 1 : 0)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    const render = (now: number) => {
      if (document.visibilityState === "visible") {
        drawFrame(now)
      }
      if (animated) {
        animationRef.current = requestAnimationFrame(render)
      }
    }

    const ro = new ResizeObserver(() => {
      drawFrame(animated ? performance.now() : resolvedFrozenTime)
    })
    ro.observe(root)

    if (animated) {
      animationRef.current = requestAnimationFrame(render)
    } else {
      drawFrame(resolvedFrozenTime)
    }

    const setPointerFromClient = (clientX: number, clientY: number) => {
      const rect = root.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) return
      pointerRef.current.tX = (clientX - rect.left) / rect.width
      pointerRef.current.tY = 1 - (clientY - rect.top) / rect.height
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!interactive) return
      setPointerFromClient(e.clientX, e.clientY)
      if (!animated) drawFrame(performance.now())
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!interactive || !e.touches[0]) return
      setPointerFromClient(e.touches[0].clientX, e.touches[0].clientY)
      if (!animated) drawFrame(performance.now())
    }

    if (interactive) {
      window.addEventListener("pointermove", onPointerMove, { passive: true })
      window.addEventListener("touchmove", onTouchMove, { passive: true })
    }

    return () => {
      ro.disconnect()
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (interactive) {
        window.removeEventListener("pointermove", onPointerMove)
        window.removeEventListener("touchmove", onTouchMove)
      }
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
    }
  }, [
    animated,
    interactive,
    isSidebar,
    resolvedFrozenPointer[0],
    resolvedFrozenPointer[1],
    resolvedFrozenTime,
    scrollProgress,
  ])

  const vignetteStyle: CSSProperties | undefined = textVignette
    ? {
        background: isSidebar
          ? "linear-gradient(to inline-end, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 28%, transparent 55%), radial-gradient(ellipse 90% 80% at 15% 95%, rgba(0,0,0,0.5) 0%, transparent 65%)"
          : "radial-gradient(ellipse 85% 70% at 50% 42%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.22) 45%, transparent 78%)",
      }
    : undefined

  return (
    <div
      ref={rootRef}
      className={cn("neural-vortex-layer pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={style}
      aria-hidden
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ opacity }} />
      {textVignette && vignetteStyle ? <div className="absolute inset-0" style={vignetteStyle} /> : null}
    </div>
  )
}

export const InteractiveNeuralVortexBackground = NeuralVortexBackground
export default NeuralVortexBackground
