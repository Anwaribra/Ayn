"use client"

import { useEffect, useRef, useState } from "react"

const SCROLL_CONTAINER_SELECTOR = ".content-scroll-area"
const SCROLL_DELTA_THRESHOLD = 8
const TOP_RESET_THRESHOLD = 28

export function useScrollCollapse() {
  const [collapsed, setCollapsed] = useState(false)
  const lastScrollTop = useRef(0)

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(SCROLL_CONTAINER_SELECTOR)
    if (!container) return

    lastScrollTop.current = container.scrollTop

    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true

      requestAnimationFrame(() => {
        const scrollTop = container.scrollTop
        const delta = scrollTop - lastScrollTop.current

        if (scrollTop <= TOP_RESET_THRESHOLD) {
          setCollapsed(false)
        } else if (delta > SCROLL_DELTA_THRESHOLD) {
          setCollapsed(true)
        } else if (delta < -SCROLL_DELTA_THRESHOLD) {
          setCollapsed(false)
        }

        lastScrollTop.current = scrollTop
        ticking = false
      })
    }

    container.addEventListener("scroll", onScroll, { passive: true })
    return () => container.removeEventListener("scroll", onScroll)
  }, [])

  return collapsed
}
