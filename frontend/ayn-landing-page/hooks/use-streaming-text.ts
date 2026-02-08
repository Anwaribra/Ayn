"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseStreamingTextOptions {
  text: string
  speed?: number // Characters per second
  enabled?: boolean
  onComplete?: () => void
}

export function useStreamingText({
  text,
  speed = 40,
  enabled = true,
  onComplete,
}: UseStreamingTextOptions) {
  const [displayedText, setDisplayedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const indexRef = useRef(0)

  const startStreaming = useCallback(() => {
    if (!enabled || !text) {
      setDisplayedText(text)
      setIsComplete(true)
      return
    }

    setIsStreaming(true)
    setIsComplete(false)
    setDisplayedText("")
    indexRef.current = 0

    const interval = 1000 / speed // Convert speed to ms per character

    const stream = () => {
      if (indexRef.current < text.length) {
        // Get next chunk (handle emoji and multi-byte characters)
        const nextChar = text[indexRef.current]
        setDisplayedText((prev) => prev + nextChar)
        indexRef.current++

        // Variable speed for more natural feel (punctuation pauses)
        const char = text[indexRef.current - 1]
        const delay = [".", "!", "?", "\n"].includes(char)
          ? interval * 3
          : [",", ";", ":"].includes(char)
            ? interval * 1.5
            : interval

        timeoutRef.current = setTimeout(stream, delay)
      } else {
        setIsStreaming(false)
        setIsComplete(true)
        onComplete?.()
      }
    }

    // Small initial delay for better UX
    timeoutRef.current = setTimeout(stream, 50)
  }, [text, speed, enabled, onComplete])

  const stopStreaming = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setDisplayedText(text)
    setIsStreaming(false)
    setIsComplete(true)
  }, [text])

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setDisplayedText("")
    setIsComplete(false)
    setIsStreaming(false)
    indexRef.current = 0
  }, [])

  // Auto-start when enabled changes
  useEffect(() => {
    if (enabled && text && !isStreaming && !isComplete) {
      startStreaming()
    }
  }, [enabled, text, isStreaming, isComplete, startStreaming])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    displayedText,
    isStreaming,
    isComplete,
    startStreaming,
    stopStreaming,
    reset,
  }
}

// Hook for cursor blink effect
export function useCursorBlink(enabled: boolean = true) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!enabled) {
      setVisible(false)
      return
    }

    const interval = setInterval(() => {
      setVisible((v) => !v)
    }, 530) // Standard cursor blink rate

    return () => clearInterval(interval)
  }, [enabled])

  return visible
}
