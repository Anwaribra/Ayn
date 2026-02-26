"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowUpIcon,
  X,
  Expand,
  Loader2,
  Brain,
  Activity,
  ChevronRight,
  Globe,
  ShieldCheck,
  Terminal,
  Target,
  ListChecks,
  FileText,
  FileSearch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { LucideIcon } from "lucide-react"

type MiniMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  isSystem?: boolean
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
    sessionStorage.setItem(MINI_MESSAGES_KEY, JSON.stringify(messages.slice(-18)))
  } catch {
    // ignore storage errors
  }
}

function getPageContext(pathname: string | null) {
  if (!pathname) return ""
  if (pathname.includes("/gap-analysis")) {
    return "User is in Gap Analysis. Prioritize remediation, evidence linking, and risk reduction."
  }
  if (pathname.includes("/evidence")) {
    return "User is in Evidence Library. Prioritize evidence quality, mapping, and missing files."
  }
  if (pathname.includes("/standards")) {
    return "User is in Standards workspace. Prioritize clause mapping and coverage guidance."
  }
  if (pathname.includes("/dashboard") || pathname.includes("/overview")) {
    return "User is in Dashboard. Prioritize high-impact blockers and fast actions."
  }
  return "User is in platform workspace. Provide concise actionable guidance."
}

function getQuickActions(pathname: string | null): Array<{ label: string; prompt: string; icon: LucideIcon }> {
  if (!pathname) {
    return [
      { label: "Top risks", prompt: "What are the top compliance risks I should fix first?", icon: Target },
      { label: "Summary", prompt: "Summarize current platform status and immediate priorities.", icon: FileSearch },
      { label: "Action plan", prompt: "Create a short action plan for today.", icon: ListChecks },
    ]
  }
  if (pathname.includes("/gap-analysis")) {
    return [
      { label: "Prioritize", prompt: "Prioritize critical gaps and suggest first 3 remediation actions.", icon: Target },
      { label: "Draft fix", prompt: "Draft a remediation plan template for the most severe gap.", icon: ListChecks },
      { label: "Evidence", prompt: "What evidence should I link first to reduce risk quickly?", icon: FileText },
    ]
  }
  if (pathname.includes("/evidence")) {
    return [
      { label: "Missing", prompt: "Which important evidence types are missing right now?", icon: FileSearch },
      { label: "Quality", prompt: "Give me a quick quality checklist for uploaded evidence.", icon: ListChecks },
      { label: "Next upload", prompt: "What is the single best next file to upload?", icon: FileText },
    ]
  }
  if (pathname.includes("/standards")) {
    return [
      { label: "Coverage", prompt: "Show standards coverage gaps and priority clauses to map.", icon: FileSearch },
      { label: "Mapping", prompt: "Create a step-by-step mapping plan for this standard.", icon: ListChecks },
      { label: "Readiness", prompt: "How ready are we for this standard and why?", icon: Target },
    ]
  }
  return [
    { label: "Top risks", prompt: "What are the top compliance blockers right now?", icon: Target },
    { label: "Action plan", prompt: "Build a short practical action plan for this page.", icon: ListChecks },
    { label: "Summary", prompt: "Summarize what I should do next in 3 bullets.", icon: FileSearch },
  ]
}

function InlineText({ content }: { content: string }) {
  const lines = content.split("\n")
  return (
    <div className="text-[13px] leading-relaxed space-y-1 whitespace-pre-wrap break-words">
      {lines.map((line, i) => (
        <p key={`${i}-${line.slice(0, 8)}`}>{line || "\u00a0"}</p>
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
  const scrollAnchorRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const isHorusPage = pathname?.includes("/horus-ai")
  const quickActions = getQuickActions(pathname)

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
          content:
            "Bridge established. I am Horus, your platform integration layer. How can I help now?",
          isSystem: true,
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
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  useEffect(() => {
    const seen = sessionStorage.getItem("horus-mini-seen")
    if (!seen && !isHorusPage) {
      const timer = setTimeout(() => {
        setShowTooltip(true)
        sessionStorage.setItem("horus-mini-seen", "1")
        setTimeout(() => setShowTooltip(false), 3200)
      }, 1000)
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
        if (isLoading && abortControllerRef.current) abortControllerRef.current.abort()
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

  const send = useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim()
      if (!trimmed || isLoading) return

      const userMsg: MiniMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      }
      const assistantId = crypto.randomUUID()

      setMessages((prev) => [...prev.slice(-17), userMsg, { id: assistantId, role: "assistant", content: "" }])
      setIsOpen(true)
      setIsLoading(true)

      const payload = `[Page Context]\n${getPageContext(pathname)}\n\n[User]\n${trimmed}`
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
                ? { ...m, content: "No response received yet. Try again or open full Horus." }
                : m,
            ),
          )
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          toast.error(err instanceof Error ? err.message : "Horus request failed")
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: "Bridge failed. Reconnecting..." } : m,
            ),
          )
        }
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [isLoading, pathname, currentChatId],
  )

  const handleSend = useCallback(async () => {
    const text = query
    setQuery("")
    await send(text)
  }, [query, send])

  const handleOpenFull = useCallback(() => {
    const target = currentChatId
      ? `/platform/horus-ai?chat=${encodeURIComponent(currentChatId)}`
      : "/platform/horus-ai"
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
    <div ref={panelRef} className="fixed right-6 bottom-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, x: 8 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 8, x: 8 }}
            className="rounded-xl glass-layer-3 border border-white/10 px-3 py-2 text-xs text-foreground/80 shadow-lg"
          >
            <span className="font-bold text-blue-400">Horus</span> ready to sync
            <span className="ml-2 font-mono text-[10px] opacity-60">Ctrl+I</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 24, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-[440px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-96px)] overflow-hidden rounded-[34px] bg-[var(--surface-modal)]/95 border border-[var(--border-subtle)] shadow-2xl backdrop-blur-2xl"
          >
            <div className="p-6 pb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center relative">
                  <Brain className="w-5 h-5 text-primary" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--status-success)] border-2 border-[var(--surface-modal)] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Horus Bridge</h3>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.2em] font-bold">Neural Link Active</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
                  onClick={handleOpenFull}
                  title="Open full Horus"
                >
                  <Expand className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="px-6 pb-4">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/80 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-primary/80" />
                  <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-[0.2em]">Global Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--status-success)]/80" />
                  <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-[0.2em]">Audit Ready</span>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[320px] px-6">
              <div className="space-y-5 pb-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[90%]", msg.role === "user" ? "text-right" : "text-left")}>
                      {msg.isSystem && (
                        <div className="flex items-center gap-1.5 text-primary/70 mb-1.5">
                          <Terminal className="w-3 h-3" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Protocol</span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-[26px] px-4 py-3 text-[13px] leading-relaxed",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]",
                        )}
                      >
                        <InlineText content={msg.content || (isLoading ? "Thinking..." : "")} />
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] w-fit">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span className="text-[11px] text-[var(--text-secondary)]">Synchronizing...</span>
                  </div>
                )}

                <div ref={scrollAnchorRef} />
              </div>
            </ScrollArea>

            <div className="px-6 pb-4">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/80 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-3.5 h-3.5 text-primary/80" />
                  <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-[0.2em]">Quick Actions</span>
                </div>
                <div className="flex items-center gap-2">
                  {quickActions.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => send(item.prompt)}
                      disabled={isLoading}
                      title={item.label}
                      aria-label={item.label}
                      className="h-8 w-8 shrink-0 rounded-lg bg-[var(--surface-modal)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-primary hover:border-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <item.icon className="w-4 h-4" />
                    </button>
                  ))}
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] ml-auto" />
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="relative">
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
                  placeholder="Synchronize with Horus..."
                  className="w-full h-14 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] pl-4 pr-14 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-primary/40"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!query.trim() || isLoading}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-colors"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleToggle}
        className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_30px_rgba(37,99,235,0.35)] hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
        aria-label="Toggle Horus assistant"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
        <Brain className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--status-success)] border-2 border-[var(--surface)]" />
      </button>
    </div>
  )
}
