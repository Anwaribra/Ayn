"use client"

import React, { useState, useRef, useEffect, useCallback, memo } from "react"
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
    return "User is in Evidence Vault. Prioritize evidence quality, mapping, and missing files."
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

const FloatingAIBarComponent = () => {
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
            className="glass-flyout glass-text-secondary rounded-xl px-3 py-2 text-xs"
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
            className="glass-surface-strong glass-text-primary relative w-[448px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-96px)] overflow-hidden rounded-[32px] shadow-[0_28px_80px_-40px_rgba(15,23,42,0.45)] will-change-transform"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(59,111,217,0.45),transparent)]" />
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(59,111,217,0.14),transparent_70%)] blur-2xl" />

            <div className="flex items-start justify-between p-6 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-[18px] border border-[var(--glass-border)] bg-[linear-gradient(180deg,rgba(59,111,217,0.12),rgba(59,111,217,0.04))] shadow-[0_16px_34px_-22px_rgba(37,99,235,0.55)]">
                  <div className="absolute inset-[3px] rounded-[14px] bg-[linear-gradient(180deg,rgba(255,255,255,0.35),transparent_65%)] opacity-60" />
                  <Brain className="relative z-10 h-5 w-5 text-primary" strokeWidth={2.2} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-[var(--glass-strong-bg)] bg-[var(--status-success)]" />
                </div>
                <div>
                  <h3 className="glass-text-primary text-lg font-bold tracking-tight">Horus Bridge</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--status-success)] shadow-[0_0_10px_rgba(13,150,104,0.5)]" />
                    <p className="glass-text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Neural Link Active</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="glass-button glass-text-secondary h-8 w-8 rounded-xl hover:text-[var(--glass-text-primary)]"
                  onClick={handleOpenFull}
                  title="Open full Horus"
                >
                  <Expand className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="glass-button glass-text-secondary h-8 w-8 rounded-xl hover:text-[var(--glass-text-primary)]"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="px-6 pb-4">
              <div className="glass-panel flex items-center justify-between rounded-[18px] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-primary/80" />
                  <span className="glass-text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Global Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--status-success)]/80" />
                  <span className="glass-text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Audit Ready</span>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[320px] px-6">
              <div className="space-y-5 pb-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[90%]", msg.role === "user" ? "text-right" : "text-left")}>
                      {msg.isSystem && (
                        <div className="mb-1.5 flex items-center gap-1.5 text-primary/70">
                          <Terminal className="w-3 h-3" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Protocol</span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 text-[13px] leading-relaxed",
                          msg.role === "user"
                            ? "horus-user-bubble shadow-[0_16px_34px_-26px_rgba(37,99,235,0.55)]"
                            : "glass-bubble glass-text-primary border border-[var(--glass-border-subtle)] shadow-[0_12px_30px_-24px_rgba(15,23,42,0.28)]",
                        )}
                      >
                        <InlineText content={msg.content || (isLoading ? "Thinking..." : "")} />
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="glass-pill glass-text-secondary flex w-fit items-center gap-2 px-3 py-2 shadow-[0_10px_24px_-18px_rgba(37,99,235,0.35)]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span className="text-[11px]">Synchronizing...</span>
                  </div>
                )}

                <div ref={scrollAnchorRef} />
              </div>
            </ScrollArea>

            <div className="px-6 pb-4">
              <div className="glass-panel rounded-[22px] p-4 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.35)]">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-3.5 h-3.5 text-primary/80" />
                  <span className="glass-text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Quick Actions</span>
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
                      className="glass-button glass-text-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border-subtle)] transition-all hover:-translate-y-0.5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <item.icon className="w-4 h-4" />
                    </button>
                  ))}
                  <ChevronRight className="glass-text-secondary ml-auto h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="relative rounded-[24px] border border-[var(--glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-1.5 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.35)]">
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
                  className="glass-input glass-text-primary h-14 w-full rounded-[18px] border-0 bg-transparent pl-4 pr-14 text-sm placeholder:text-[var(--glass-text-secondary)] focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!query.trim() || isLoading}
                  className="glass-button absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[14px] bg-primary/90 text-primary-foreground shadow-[0_16px_30px_-18px_rgba(37,99,235,0.65)] transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:bg-[var(--glass-input-bg)] disabled:text-muted-foreground"
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
        className="glass-surface-strong group relative flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-[22px] border border-[var(--glass-border)] text-primary shadow-[0_24px_46px_-26px_rgba(37,99,235,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95"
        aria-label="Toggle Horus assistant"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,111,217,0.18),transparent_55%)]" />
        <div className="absolute inset-[3px] rounded-[18px] bg-[linear-gradient(180deg,rgba(255,255,255,0.42),transparent_68%)] opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] transition-transform duration-1000 group-hover:translate-x-[100%]" />
        <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-[16px] border border-[var(--glass-border-subtle)] bg-[linear-gradient(180deg,rgba(59,111,217,0.14),rgba(59,111,217,0.04))]">
          <Brain className="h-6 w-6" strokeWidth={2.2} />
        </div>
      </button>
    </div>
  )
}

export default memo(FloatingAIBarComponent)
