"use client"

import { useState, useEffect, useCallback } from "react"

interface UseTypewriterOptions {
  text: string
  speed?: number // ms per character
  delay?: number // ms before starting
  loop?: boolean
  loopDelay?: number // ms between loops
  deleteSpeed?: number // ms per character when deleting
  pauseAtEnd?: number // ms to pause at end before deleting
}

export function useTypewriter({
  text,
  speed = 50,
  delay = 500,
  loop = false,
  loopDelay = 2000,
  deleteSpeed = 30,
  pauseAtEnd = 1000,
}: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [loopCount, setLoopCount] = useState(0)

  const startTyping = useCallback(() => {
    setIsTyping(true)
    setIsDeleting(false)
    setIsComplete(false)
    setDisplayedText("")
  }, [])

  const reset = useCallback(() => {
    setDisplayedText("")
    setIsTyping(false)
    setIsDeleting(false)
    setIsComplete(false)
    setLoopCount(0)
  }, [])

  useEffect(() => {
    let timeout: NodeJS.Timeout

    const type = () => {
      if (!isTyping && !isDeleting) {
        // Initial delay before starting
        timeout = setTimeout(() => {
          setIsTyping(true)
        }, delay)
        return
      }

      if (isTyping && !isDeleting) {
        if (displayedText.length < text.length) {
          // Still typing
          timeout = setTimeout(() => {
            setDisplayedText(text.slice(0, displayedText.length + 1))
          }, speed)
        } else {
          // Finished typing
          setIsTyping(false)
          setIsComplete(true)
          
          if (loop) {
            timeout = setTimeout(() => {
              setIsDeleting(true)
              setIsComplete(false)
            }, pauseAtEnd)
          }
        }
      }

      if (isDeleting) {
        if (displayedText.length > 0) {
          // Still deleting
          timeout = setTimeout(() => {
            setDisplayedText(text.slice(0, displayedText.length - 1))
          }, deleteSpeed)
        } else {
          // Finished deleting
          setIsDeleting(false)
          setLoopCount((prev) => prev + 1)
          
          if (loop) {
            timeout = setTimeout(() => {
              setIsTyping(true)
            }, loopDelay)
          }
        }
      }
    }

    type()

    return () => clearTimeout(timeout)
  }, [
    text,
    speed,
    delay,
    loop,
    loopDelay,
    deleteSpeed,
    pauseAtEnd,
    displayedText,
    isTyping,
    isDeleting,
  ])

  return {
    displayedText,
    isTyping,
    isDeleting,
    isComplete,
    loopCount,
    startTyping,
    reset,
  }
}

// Hook for multiple rotating texts
interface UseRotatingTypewriterOptions {
  texts: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseAtEnd?: number
  pauseBetween?: number
}

export function useRotatingTypewriter({
  texts,
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseAtEnd = 1500,
  pauseBetween = 500,
}: UseRotatingTypewriterOptions) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout
    const currentText = texts[currentIndex]

    const type = () => {
      if (isPaused) {
        timeout = setTimeout(() => {
          setIsPaused(false)
          setIsDeleting(true)
        }, pauseAtEnd)
        return
      }

      if (!isTyping && !isDeleting && !isPaused) {
        // Start typing
        setIsTyping(true)
        return
      }

      if (isTyping) {
        if (displayedText.length < currentText.length) {
          // Continue typing
          timeout = setTimeout(() => {
            setDisplayedText(currentText.slice(0, displayedText.length + 1))
          }, typingSpeed)
        } else {
          // Done typing, pause
          setIsTyping(false)
          setIsPaused(true)
        }
      }

      if (isDeleting) {
        if (displayedText.length > 0) {
          // Continue deleting
          timeout = setTimeout(() => {
            setDisplayedText(currentText.slice(0, displayedText.length - 1))
          }, deletingSpeed)
        } else {
          // Done deleting, move to next
          setIsDeleting(false)
          timeout = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % texts.length)
          }, pauseBetween)
        }
      }
    }

    type()

    return () => clearTimeout(timeout)
  }, [
    texts,
    currentIndex,
    displayedText,
    isTyping,
    isDeleting,
    isPaused,
    typingSpeed,
    deletingSpeed,
    pauseAtEnd,
    pauseBetween,
  ])

  return {
    displayedText,
    currentText: texts[currentIndex],
    currentIndex,
    isTyping,
    isDeleting,
    isPaused,
  }
}
