"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Bot, Pause, Play, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStreamingText, useCursorBlink } from "@/hooks/use-streaming-text"
import { MarkdownContent } from "./horus/ayn-ai-chat"

interface AIStreamingMessageProps {
  content: string
  speed?: number
  className?: string
  onComplete?: () => void
}

export function AIStreamingMessage({
  content,
  speed = 40,
  className,
  onComplete,
}: AIStreamingMessageProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [showControls, setShowControls] = useState(false)

  const {
    displayedText,
    isStreaming,
    isComplete,
    stopStreaming,
    reset,
    startStreaming,
  } = useStreamingText({
    text: content,
    speed,
    enabled: !isPaused,
    onComplete,
  })

  const cursorVisible = useCursorBlink(isStreaming && !isPaused)

  const handlePauseToggle = useCallback(() => {
    setIsPaused((prev) => !prev)
    if (isPaused) {
      startStreaming()
    }
  }, [isPaused, startStreaming])

  const handleStop = useCallback(() => {
    stopStreaming()
    setIsPaused(false)
  }, [stopStreaming])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("group flex w-full gap-3 py-2", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Avatar */}
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand)]/15 to-[var(--brand)]/5 ring-1 ring-[var(--brand)]/10">
        <Bot className="h-4 w-4 text-[var(--brand)]" />
      </div>

      {/* Content */}
      <div className="flex max-w-[80%] flex-col gap-1">
        <div className="rounded-2xl rounded-bl-md border border-white/[0.06] bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm">
          <div className="relative">
            <MarkdownContent content={displayedText} />
            {isStreaming && !isComplete && (
              <span
                className={cn(
                  "inline-block w-[2px] h-[1.2em] bg-[var(--brand)] ml-0.5 align-middle transition-opacity duration-100",
                  cursorVisible ? "opacity-100" : "opacity-0"
                )}
              />
            )}
          </div>
        </div>

        {/* Controls */}
        <div
          className={cn(
            "flex items-center gap-1 pl-1 transition-opacity duration-200",
            (showControls || isStreaming) && !isComplete
              ? "opacity-100"
              : "opacity-0"
          )}
        >
          {isStreaming && !isComplete && (
            <>
              <button
                onClick={handlePauseToggle}
                className="rounded-md p-1 text-muted-foreground/50 hover:bg-accent/50 hover:text-muted-foreground transition-colors"
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? (
                  <Play className="h-3 w-3" />
                ) : (
                  <Pause className="h-3 w-3" />
                )}
              </button>
              <button
                onClick={handleStop}
                className="rounded-md p-1 text-muted-foreground/50 hover:bg-accent/50 hover:text-muted-foreground transition-colors"
                title="Stop"
              >
                <Square className="h-3 w-3" />
              </button>
            </>
          )}
          <span className="text-[10px] text-muted-foreground/40">
            {isStreaming ? "Typing..." : isComplete ? "Done" : ""}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// Simple non-streaming version for static content
export function AIMessage({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("flex w-full gap-3 py-2", className)}
    >
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand)]/15 to-[var(--brand)]/5 ring-1 ring-[var(--brand)]/10">
        <Bot className="h-4 w-4 text-[var(--brand)]" />
      </div>
      <div className="flex max-w-[80%] flex-col gap-1">
        <div className="rounded-2xl rounded-bl-md border border-white/[0.06] bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm">
          <MarkdownContent content={content} />
        </div>
      </div>
    </motion.div>
  )
}
