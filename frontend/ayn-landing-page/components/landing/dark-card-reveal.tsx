"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { DarkCardNeuralBg } from "@/components/landing/dark-card-neural-bg"

const SCALE_MIN = 0.88
const SCALE_RANGE = 1 - SCALE_MIN
const Y_ENTER_PX = 50
const OPACITY_MIN = 0.7
const OPACITY_RANGE = 1 - OPACITY_MIN

/**
 * Openship-style scroll reveal: dark card scales 0.88→1 while entering the viewport.
 * Outer: opacity + translateY + margin compensation. Inner: scale + rounded shell.
 */
export function DarkCardReveal({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const heightRef = useRef(0)

  useEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const mobile = window.matchMedia("(max-width: 768px)").matches

    const ro = new ResizeObserver(([entry]) => {
      heightRef.current = entry.contentRect.height
    })
    ro.observe(inner)

    const resetStyles = () => {
      inner.style.transform = ""
      inner.style.willChange = ""
      outer.style.opacity = ""
      outer.style.transform = ""
      outer.style.marginBottom = ""
      outer.style.willChange = ""
    }

    if (reducedMotion || mobile) {
      resetStyles()
      ro.disconnect()
      return
    }

    inner.style.transformOrigin = "top center"
    outer.style.marginTop = "-1rem"
    outer.style.willChange = "transform, opacity"
    inner.style.willChange = "transform"

    let scaleIn = SCALE_MIN
    let scaleOut = 1
    let opacityIn = OPACITY_MIN
    let opacityOut = 1
    let yIn = Y_ENTER_PX

    const apply = () => {
      const scale = Math.min(scaleIn, scaleOut)
      const opacity = Math.min(opacityIn, opacityOut)
      inner.style.transform = `scale(${scale})`
      outer.style.opacity = String(opacity)
      outer.style.transform = `translateY(${yIn}px)`
      outer.style.marginBottom = `${-(heightRef.current * (1 - scale))}px`
    }

    heightRef.current = inner.offsetHeight
    apply()

    const onScroll = () => {
      const rect = outer.getBoundingClientRect()
      const vh = window.innerHeight

      // Enter: top of block moves from bottom of viewport → top of viewport
      const enterStart = vh
      const enterEnd = 0
      const enterProgress =
        rect.top >= enterStart
          ? 0
          : rect.top <= enterEnd
            ? 1
            : (enterStart - rect.top) / (enterStart - enterEnd)

      const pIn = Math.min(1, Math.max(0, enterProgress))
      scaleIn = pIn < 0.7 ? SCALE_MIN + (pIn / 0.7) * SCALE_RANGE : 1
      opacityIn = pIn < 0.3 ? OPACITY_MIN + (pIn / 0.3) * OPACITY_RANGE : 1
      yIn = Y_ENTER_PX * (1 - pIn)

      // Exit: bottom of block moves from bottom of viewport → top of viewport
      const exitStart = vh
      const exitEnd = 0
      const exitProgress =
        rect.bottom >= exitStart
          ? 0
          : rect.bottom <= exitEnd
            ? 1
            : (exitStart - rect.bottom) / (exitStart - exitEnd)

      const pOut = Math.min(1, Math.max(0, exitProgress))
      scaleOut = 1 - pOut * SCALE_RANGE
      opacityOut = pOut < 0.7 ? 1 : 1 - ((pOut - 0.7) / 0.3) * OPACITY_RANGE

      apply()
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })

    return () => {
      ro.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      resetStyles()
    }
  }, [])

  return (
    <div ref={outerRef} className="dark-section-outer relative z-20">
      <div ref={innerRef} className="dark-card-base dark-card-base--neural">
        <DarkCardNeuralBg />
        <div className="dark-card-edge-glow" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}
