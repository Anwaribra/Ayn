"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ArrowUpIcon, X, Expand, Loader2, BrainCircuit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"

type MiniMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

const MINI_MESSAGES_KEY = "horus-mini-messages-v1"
const MINI_CHAT_ID_KEY = "horus-mini-chat-id-v1"

function loadMiniMessages(): MiniMessage[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(MINI_MESSAGES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((m) => m?.role && typeof m.content === "string")
  } catch {
    return []
  }
}

function saveMiniMessages(messages: MiniMessage[]) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(MINI_MESSAGES_KEY, JSON.stringify(messages.slice(-14)))
  } catch {
    // ignore storage errors
  }
}

function getPageContext(pathname: string | null) {
  if (!pathname) return ""
  if (pathname.includes("/gap-analysis")) {
    return "User is in Gap Analysis. Prioritize actions around remediation, evidence linking, and risk reduction."
  }
  if (pathname.includes("/evidence")) {
    return "User is in Evidence Library. Prioritize evidence quality, mapping, and missing documents."
  }
  if (pathname.includes("/standards")) {
    return "User is in Standards workspace. Prioritize clause mapping and compliance coverage guidance."
  }
  if (pathname.includes("/dashboard") || pathname.includes("/overview")) {
    return "User is in Dashboard. Prioritize high-impact blockers and quick actions."
  }
  return "User is in Platform workspace. Provide concise operational guidance and actionable next steps."
}

function InlineMarkdown({ content }: { content: string }) {
  const lines = content.split("\n")
  return (
    <div className="text-xs text-foreground/85 leading-relaxed space-y-1">
      {lines.map((line, i) => (
        <p key={`${i}-${line.slice(0, 8)}`} className="whitespace-pre-wrap break-words">
          {line || "\u00a0"}
        </p>
      ))}
    </div>
  )
}

export default function FloatingAIBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<MiniMessage[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const isHorusPage = pathname?.includes("/horus-ai")

  useEffect(() => {
    const storedMessages = loadMiniMessages()
    const storedChatId = sessionStorage.getItem(MINI_CHAT_ID_KEY)

    if (storedMessages.length > 0) {
      setMessages(storedMessages)
    } else {
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I am Horus. Ask me anything about this page and I will help with the next action.",
        },
      ])
    }

    if (storedChatId) setCurrentChatId(storedChatId)
  }, [])

  useEffect(() => {
    if (messages.length > 0) saveMiniMessages(messages)
  }, [messages])

  useEffect(() => {
    if (!currentChatId || typeof window === "undefined") return
    sessionStorage.setItem(MINI_CHAT_ID_KEY, currentChatId)
  }, [currentChatId])

  useEffect(() => {
    const seen = sessionStorage.getItem("horus-mini-seen")
    if (!seen && !isHorusPage) {
      const timer = setTimeout(() => {
        setShowTooltip(true)
        sessionStorage.setItem("horus-mini-seen", "1")
        setTimeout(() => setShowTooltip(false), 3500)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [isHorusPage])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
        e.preventDefault()
        if (isHorusPage) return
        setIsOpen(true)
        setShowTooltip(false)
        setTimeout(() => inputRef.current?.focus(), 80)
      }
      if (e.key === "Escape") {
        if (isLoading && abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isHorusPage, isLoading])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current) return
      if (!panelRef.current.contains(e.target as Node) && !isLoading) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [isLoading])

  const handleSend = useCallback(async () => {
    const trimmed = query.trim()
    if (!trimmed || isLoading) return

    const userMsg: MiniMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    }
    const assistantId = crypto.randomUUID()

    setMessages((prev) => [...prev.slice(-13), userMsg, { id: assistantId, role: "assistant", content: "" }])
    setQuery("")
    setIsOpen(true)
    setIsLoading(true)

    const contextHint = getPageContext(pathname)
    const payload = contextHint
      ? `[Page Context]\n${contextHint}\n\n[User]\n${trimmed}`
      : trimmed

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      let accumulated = ""
      await api.horusChatStream(
        payload,
        undefined,
        currentChatId || undefined,
        (chunk: string) => {
          if (chunk.startsWith("__CHAT_ID__:")) {
            const id = chunk.split(":")[1]?.trim()
            if (id) setCurrentChatId(id)
            return
          }
          if (chunk.startsWith("__")) return

          accumulated += chunk
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m)),
          )
        },
        controller.signal,
      )

      if (!accumulated.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "I could not generate a response yet. Try again or continue in full Horus AI.",
                }
              : m,
          ),
        )
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        toast.error(err instanceof Error ? err.message : "Horus request failed")
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Connection interrupted. Please retry." }
              : m,
          ),
        )
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [query, isLoading, pathname, currentChatId])

  const handleOpenFull = useCallback(() => {
    const target = currentChatId ? `/platform/horus-ai?chat=${encodeURIComponent(currentChatId)}` : "/platform/horus-ai"
    router.push(target)
    setIsOpen(false)
  }, [router, currentChatId])

  const handleToggle = () => {
    setIsOpen((v) => !v)
    setShowTooltip(false)
    if (!isOpen) setTimeout(() => inputRef.current?.focus(), 80)
  }

  if (isHorusPage) return null

  return (
    <div ref={panelRef} className="fixed right-5 bottom-5 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, x: 8 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 8, x: 8 }}
            className="rounded-xl glass-layer-3 border border-border px-3 py-2 text-xs text-foreground/80 shadow-lg"
          >
            <span className="font-bold text-[var(--brand)]">Horus</span> is live here
            <span className="ml-2 font-mono text-[10px] opacity-60">Ctrl+I</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, x: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, x: 20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-[360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl glass-layer-3"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand)]/10">
                  <BrainCircuit className="h-4 w-4 text-[var(--brand)]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground/90">Horus Assistant</p>
                  <p className="text-[10px] text-muted-foreground">Page-aware mini chat</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md text-muted-foreground/70 hover:text-foreground"
                  onClick={handleOpenFull}
                  title="Open full Horus"
                >
                  <Expand className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md text-muted-foreground/70 hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <ScrollArea className="max-h-[320px]">
              <div className="space-y-2 px-3 py-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                        msg.role === "user"
                          ? "bg-[var(--brand)] text-[var(--brand-foreground)]"
                          : "bg-muted/60 text-foreground/90 border border-border",
                      )}
                    >
                      <InlineMarkdown content={msg.content || (isLoading ? "Thinking..." : "")} />
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
                    <Loader2 className="h-3 w-3 animate-spin text-[var(--brand)]" />
                    Horus is thinking...
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-white/[0.08] p-2.5">
              <div className="mb-2 rounded-lg bg-muted/40 px-2.5 py-1 text-[10px] text-muted-foreground">
                Context: {getPageContext(pathname)}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Ask Horus about this page..."
                  className="min-w-0 flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  onClick={handleSend}
                  disabled={!query.trim() || isLoading}
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-lg",
                    query.trim() && !isLoading
                      ? "bg-[var(--brand)] text-[var(--brand-foreground)] hover:bg-[var(--brand)]/90"
                      : "bg-muted/50 text-muted-foreground/50",
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleToggle}
        className="group relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-[var(--brand)] text-[var(--brand-foreground)] shadow-xl transition-transform hover:scale-105 active:scale-95"
        aria-label="Toggle Horus assistant"
      >
        <BrainCircuit className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
      </button>
    </div>
  )
}
