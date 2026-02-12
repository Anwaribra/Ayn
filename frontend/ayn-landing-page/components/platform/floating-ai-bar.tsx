"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bot, ArrowUpIcon, X, Expand, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"

// ─── Simple inline markdown renderer ────────────────────────────────────────────
function InlineMarkdown({ content }: { content: string }) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === "") {
      elements.push(<div key={`br-${i}`} className="h-1.5" />)
      continue
    }
    if (line.startsWith("### ")) {
      elements.push(
        <p key={`h-${i}`} className="mt-2 mb-1 text-xs font-semibold text-foreground">
          {renderBold(line.slice(4))}
        </p>,
      )
      continue
    }
    if (line.startsWith("## ")) {
      elements.push(
        <p key={`h-${i}`} className="mt-2 mb-1 text-sm font-semibold text-foreground">
          {renderBold(line.slice(3))}
        </p>,
      )
      continue
    }
    if (/^[\s]*[-•*]\s/.test(line)) {
      const itemContent = line.replace(/^[\s]*[-•*]\s/, "")
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-1.5 my-0.5">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--brand)]" />
          <span>{renderBold(itemContent)}</span>
        </div>,
      )
      continue
    }
    if (/^\s*\d+[.)]\s/.test(line)) {
      const match = line.match(/^(\s*)(\d+)[.)]\s(.*)$/)
      if (match) {
        elements.push(
          <div key={`ol-${i}`} className="flex items-start gap-1.5 my-0.5">
            <span className="shrink-0 text-[10px] font-bold text-[var(--brand)]">
              {match[2]}.
            </span>
            <span>{renderBold(match[3])}</span>
          </div>,
        )
        continue
      }
    }
    elements.push(
      <p key={`p-${i}`} className="my-0.5 leading-relaxed">
        {renderBold(line)}
      </p>,
    )
  }

  return <div className="text-xs text-foreground/80 leading-relaxed">{elements}</div>
}

function renderBold(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0
  while (remaining.length > 0) {
    const match = remaining.match(/^([\s\S]*?)\*\*(.+?)\*\*([\s\S]*)$/)
    if (match) {
      if (match[1]) parts.push(<span key={key++}>{match[1]}</span>)
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {match[2]}
        </strong>,
      )
      remaining = match[3]
      continue
    }
    parts.push(<span key={key++}>{remaining}</span>)
    break
  }
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

// ─── Floating AI Bar ────────────────────────────────────────────────────────────
export default function FloatingAIBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [answer, setAnswer] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  // Don't show on the Horus AI page (it has its own full chat)
  const isHorusPage = pathname?.includes("/horus-ai")
  
  // Ctrl+I shortcut to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault()
        if (isHorusPage) {
          // On Horus AI page, just focus the main chat input
          return
        }
        inputRef.current?.focus()
        setIsFocused(true)
      }
      // Escape to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
        setAnswer("")
        inputRef.current?.blur()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isHorusPage, isOpen])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        if (!isLoading) {
          setIsFocused(false)
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isLoading])

  const handleSend = useCallback(async () => {
    const trimmed = query.trim()
    if (!trimmed || isLoading) return

    setIsLoading(true)
    setIsOpen(true)
    setAnswer("")

    try {
      const response = await api.chat([
        { role: "user", content: trimmed },
      ])
      setAnswer(response.result || "No response.")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to get response",
      )
      setAnswer("Sorry, I couldn't process that. Please try again or use the full Horus AI chat.")
    } finally {
      setIsLoading(false)
    }
  }, [query, isLoading])

  const handleOpenFull = () => {
    // Navigate to full Horus AI page with the query pre-filled
    router.push("/platform/horus-ai")
    setIsOpen(false)
    setAnswer("")
    setQuery("")
  }

  if (isHorusPage) return null

  return (
    <div
      ref={barRef}
      className="fixed bottom-5 left-1/2 z-30 w-full max-w-xl -translate-x-1/2 px-4"
    >
      <AnimatePresence>
        {isOpen && answer && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mb-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-card/95 shadow-2xl shadow-black/20 backdrop-blur-xl"
          >
            {/* Response header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--brand)]/10">
                  <Bot className="h-3 w-3 text-[var(--brand)]" />
                </div>
                <span className="text-xs font-medium text-foreground/70">
                  Horus AI
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md text-muted-foreground/50 hover:text-foreground"
                  onClick={handleOpenFull}
                  title="Open full chat"
                >
                  <Expand className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md text-muted-foreground/50 hover:text-foreground"
                  onClick={() => {
                    setIsOpen(false)
                    setAnswer("")
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Response body */}
            <ScrollArea className="max-h-[280px]">
              <div className="px-4 py-3">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin text-[var(--brand)]" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <InlineMarkdown content={answer} />
                )}
              </div>
            </ScrollArea>

            {/* Response footer */}
            <div className="border-t border-white/[0.06] px-4 py-2">
              <button
                onClick={handleOpenFull}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1 text-[10px] text-muted-foreground/60 transition-colors hover:text-[var(--brand)]"
              >
                <Expand className="h-2.5 w-2.5" />
                Continue in full Horus AI chat
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <motion.div
        layout
        className={cn(
          "flex items-center gap-2 rounded-2xl border bg-card/80 px-4 py-2.5 shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-300",
          isFocused || isOpen
            ? "border-[var(--brand)]/30 shadow-xl shadow-[var(--brand)]/5 ring-1 ring-[var(--brand)]/10"
            : "border-white/[0.08]",
        )}
      >
        {/* Bot icon */}
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
            isFocused || isOpen
              ? "bg-[var(--brand)]/15"
              : "bg-muted/50",
          )}
        >
          <Sparkles
            className={cn(
              "h-3.5 w-3.5 transition-colors",
              isFocused || isOpen
                ? "text-[var(--brand)]"
                : "text-muted-foreground/60",
            )}
          />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Ask Horus AI a question..."
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          disabled={isLoading}
        />

        {/* Shortcut hint or send button */}
        <div className="flex shrink-0 items-center gap-2">
          {!isFocused && !query && (
            <kbd className="pointer-events-none hidden items-center gap-0.5 rounded-md border border-border/50 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/50 sm:flex">
              <span className="text-[10px]">Ctrl</span>+I
            </kbd>
          )}
          {(query.trim() || isFocused) && (
            <Button
              type="button"
              onClick={handleSend}
              disabled={!query.trim() || isLoading}
              size="icon"
              className={cn(
                "h-7 w-7 rounded-lg transition-all",
                query.trim() && !isLoading
                  ? "bg-[var(--brand)] text-[var(--brand-foreground)] shadow-sm hover:bg-[var(--brand)]/90"
                  : "bg-muted/50 text-muted-foreground/40",
              )}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowUpIcon className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
