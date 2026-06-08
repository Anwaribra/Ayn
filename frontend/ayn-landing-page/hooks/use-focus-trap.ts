import { useEffect, useRef } from "react"

export function useFocusTrap(active: boolean, onClose?: () => void) {
  const containerRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) {
      // Restore focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
        previousFocusRef.current = null
      }
      return
    }

    // Save current focus
    if (typeof document !== "undefined") {
      previousFocusRef.current = document.activeElement as HTMLElement
    }

    const container = containerRef.current
    if (!container) return

    // Find all focusable elements
    const getFocusableElements = () => {
      return Array.from(
        container.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        )
      ).filter((el) => {
        // Filter out hidden elements
        const style = window.getComputedStyle(el)
        return style.display !== "none" && style.visibility !== "hidden"
      }) as HTMLElement[]
    }

    // Focus first focusable element or the container
    const focusable = getFocusableElements()
    if (focusable.length > 0) {
      // Small timeout to prevent immediate keypress triggering on newly focused element
      setTimeout(() => {
        focusable[0].focus()
      }, 50)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose()
        return
      }

      if (e.key !== "Tab") return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        e.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement as HTMLElement

      if (e.shiftKey) {
        // Shift + Tab
        if (activeElement === firstElement || !container.contains(activeElement)) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        // Tab
        if (activeElement === lastElement || !container.contains(activeElement)) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [active])

  return containerRef
}
