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
import { useUiLanguage } from "@/lib/ui-language-context"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { LucideIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

type MiniMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  isSystem?: boolean
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
  if (pathname.includes("/analytics")) {
    return "User is in Analytics. Explain metrics with evidence coverage, mappings, gaps, report trends, and tenant-scoped traceability."
  }
  return "User is in platform workspace. Provide concise actionable guidance."
}

function getQuickActions(pathname: string | null, isArabic: boolean): Array<{ label: string; prompt: string; icon: LucideIcon }> {
  if (isArabic) {
    if (!pathname) {
      return [
        { label: "المخاطر الرئيسية", prompt: "ما هي أهم مخاطر الامتثال التي يجب إصلاحها أولاً؟", icon: Target },
        { label: "ملخص", prompt: "لخص حالة المنصة الحالية والأولويات العاجلة.", icon: FileSearch },
        { label: "خطة العمل", prompt: "أنشئ خطة عمل مختصرة لليوم.", icon: ListChecks },
      ]
    }
    if (pathname.includes("/gap-analysis")) {
      return [
        { label: "تحديد الأولويات", prompt: "حدد أولويات الثغرات الحرجة واقترح أول 3 إجراءات تصحيحية.", icon: Target },
        { label: "مسودة الإصلاح", prompt: "اكتب نموذج خطة تصحيحية لأخطر ثغرة.", icon: ListChecks },
        { label: "الأدلة", prompt: "ما الأدلة التي يجب ربطها أولاً لتقليل المخاطر بسرعة؟", icon: FileText },
      ]
    }
    if (pathname.includes("/evidence")) {
      return [
        { label: "المفقود", prompt: "ما أنواع الأدلة المهمة المفقودة حالياً؟", icon: FileSearch },
        { label: "الجودة", prompt: "أعطني قائمة مراجعة سريعة لجودة الأدلة المرفوعة.", icon: ListChecks },
        { label: "الرفع التالي", prompt: "ما هو أفضل ملف لرفعه بعد ذلك؟", icon: FileText },
      ]
    }
    if (pathname.includes("/standards")) {
      return [
        { label: "التغطية", prompt: "اعرض ثغرات تغطية المعايير والبنود ذات الأولوية للتخطيط.", icon: FileSearch },
        { label: "التخطيط", prompt: "أنشئ خطة تخطيط خطوة بخطوة لهذا المعيار.", icon: ListChecks },
        { label: "الجاهزية", prompt: "ما مدى جاهزيتنا لهذا المعيار ولماذا؟", icon: Target },
      ]
    }
    if (pathname.includes("/analytics")) {
      return [
        { label: "المخاطر", prompt: "ما أهم مخاطر التحليلات والسجلات المرتبطة بها؟", icon: Target },
        { label: "التغطية", prompt: "اشرح تغطية الأدلة والمعايير غير المغطاة.", icon: FileSearch },
        { label: "التالي", prompt: "ما هي الإجراءات الثلاثة التالية من التحليلات؟", icon: ListChecks },
      ]
    }
    return [
      { label: "المخاطر الرئيسية", prompt: "ما هي أهم معوقات الامتثال حالياً؟", icon: Target },
      { label: "خطة العمل", prompt: "أنشئ خطة عمل عملية مختصرة لهذه الصفحة.", icon: ListChecks },
      { label: "ملخص", prompt: "لخص ما يجب فعله بعد ذلك في 3 نقاط.", icon: FileSearch },
    ]
  }
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
  if (pathname.includes("/analytics")) {
    return [
      { label: "Risks", prompt: "What are the top analytics risks and the records behind them?", icon: Target },
      { label: "Coverage", prompt: "Explain evidence coverage and uncovered criteria.", icon: FileSearch },
      { label: "Next", prompt: "What are the next 3 actions from analytics?", icon: ListChecks },
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

  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const scrollAnchorRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const { isArabic } = useUiLanguage()
  const isHorusPage = pathname?.includes("/horus-ai")
  const quickActions = getQuickActions(pathname, isArabic)
  const { user } = useAuth()

  // Hide if user doesn't have Horus access
  const hasAccess = user?.horusAccess || user?.role === "ADMIN"
  if (!hasAccess) return null

  useEffect(() => {
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          isArabic
            ? "تم إنشاء الاتصال. يمكنني شرح هذه الصفحة باستخدام الأدلة والخرائط والثغرات والتقارير الحالية."
            : "Bridge established. I can explain this page using current tenant-scoped evidence, mappings, gaps, and reports.",
        isSystem: true,
      },
    ])
  }, [])

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
        e.preventDefault()
        if (isHorusPage) return
        setIsOpen(true)
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
          undefined,
          (chunk: string) => {
            if (chunk.startsWith("__CHAT_ID__:")) return
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
                ? { ...m, content: isArabic ? "لم يتم استلام رد بعد. حاول مرة أخرى أو افتح حورس كاملاً." : "No response received yet. Try again or open full Horus." }
                : m,
            ),
          )
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          toast.error(err instanceof Error ? err.message : "Horus request failed")
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: isArabic ? "فشل الاتصال. إعادة الاتصال..." : "Bridge failed. Reconnecting..." } : m,
            ),
          )
        }
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [isLoading, pathname],
  )

  const handleSend = useCallback(async () => {
    const text = query
    setQuery("")
    await send(text)
  }, [query, send])

  const handleOpenFull = useCallback(() => {
    router.push("/platform/horus-ai")
    setIsOpen(false)
  }, [router])

  const handleToggle = () => {
    setIsOpen((v) => !v)
    if (!isOpen) setTimeout(() => inputRef.current?.focus(), 80)
  }

  if (isHorusPage) return null

  return (
    <div
      ref={panelRef}
      dir={isArabic ? "rtl" : "ltr"}
      className={cn(
        "fixed z-40 flex flex-col items-end gap-3 transition-all duration-300",
        // Desktop positioning
        "lg:end-6 lg:bottom-6 lg:top-auto lg:translate-y-0",
        // Mobile positioning: vertically centered on the screen edge
        "end-0 top-[45%] -translate-y-1/2 bottom-auto",
        isArabic && "font-arabic"
      )}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 24, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            role="dialog"
            aria-label={isArabic ? "مساعد حورس الذكي" : "Horus AI Assistant"}
            className={cn(
              "glass-surface-strong glass-text-primary overflow-hidden rounded-[24px] shadow-[0_22px_64px_-38px_rgba(15,23,42,0.42)] z-50",
              // Desktop layout (relative inside flex container)
              "lg:relative lg:w-[448px] lg:max-h-[calc(100vh-96px)]",
              // Mobile layout (fixed at the bottom-right/left, above nav bar)
              "max-lg:fixed max-lg:bottom-24 max-lg:end-4 max-lg:w-[calc(100vw-32px)] max-lg:max-h-[calc(100vh-140px)]"
            )}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(59,111,217,0.45),transparent)]" />
            <div className="pointer-events-none absolute end-0 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(59,111,217,0.14),transparent_70%)] blur-2xl" />

            <div className="flex items-start justify-between p-6 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-[18px] border border-[var(--glass-border)] bg-[linear-gradient(180deg,rgba(59,111,217,0.12),rgba(59,111,217,0.04))] shadow-[0_16px_34px_-22px_rgba(37,99,235,0.55)]">
                  <div className="absolute inset-[3px] rounded-[14px] bg-[linear-gradient(180deg,rgba(255,255,255,0.35),transparent_65%)] opacity-60" />
                  <Brain className="relative z-10 h-5 w-5 text-primary" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="glass-text-primary text-lg font-bold tracking-tight">{isArabic ? "حورس" : "Horus"}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--status-success)]" />
                    <p className="glass-text-secondary text-[10px] font-bold uppercase tracking-[0.18em]">{isArabic ? "جاهز" : "Ready"}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="glass-button glass-text-secondary h-8 w-8 rounded-xl hover:text-[var(--glass-text-primary)]"
                  onClick={handleOpenFull}
                  title={isArabic ? "فتح حورس بالكامل" : "Open full Horus"}
                  aria-label={isArabic ? "فتح حورس بالكامل" : "Open full Horus"}
                >
                  <Expand className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="glass-button glass-text-secondary h-8 w-8 rounded-xl hover:text-[var(--glass-text-primary)]"
                  onClick={() => setIsOpen(false)}
                  aria-label={isArabic ? "إغلاق" : "Close"}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="px-6 pb-4">
              <div className="glass-panel flex items-center justify-between rounded-[18px] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-primary/80" />
                  <span className="glass-text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">{isArabic ? "المزامنة العامة" : "Global Sync"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--status-success)]/80" />
                  <span className="glass-text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">{isArabic ? "التدقيق جاهز" : "Audit Ready"}</span>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[320px] px-6">
              <div className="space-y-5 pb-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[90%]", msg.role === "user" ? "text-end" : "text-start")}>
                      {msg.isSystem && (
                        <div className="mb-1.5 flex items-center gap-1.5 text-primary/70">
                          <Terminal className="w-3 h-3" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">{isArabic ? "بروتوكول" : "Protocol"}</span>
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
                        <InlineText content={msg.content || (isLoading ? (isArabic ? "جارٍ التفكير..." : "Thinking...") : "")} />
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="glass-pill glass-text-secondary flex w-fit items-center gap-2 px-3 py-2 shadow-[0_10px_24px_-18px_rgba(37,99,235,0.35)]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span className="text-[11px]">{isArabic ? "جارٍ التزامن..." : "Synchronizing..."}</span>
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
                      className="glass-button glass-text-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border-subtle)] transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <item.icon className="w-4 h-4" />
                    </button>
                  ))}
                  <ChevronRight className="glass-text-secondary ms-auto h-3.5 w-3.5" />
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
                  className="glass-input glass-text-primary h-14 w-full rounded-[18px] border-0 bg-transparent ps-4 pe-14 text-sm placeholder:text-[var(--glass-text-secondary)] focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!query.trim() || isLoading}
                  aria-label={isArabic ? "إرسال" : "Send message"}
                  className="glass-button absolute end-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[14px] bg-primary/90 text-primary-foreground shadow-[0_16px_30px_-18px_rgba(37,99,235,0.65)] transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:bg-[var(--glass-input-bg)] disabled:text-muted-foreground"
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
        className={cn(
          "group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border shadow-lg transition-all duration-300 active:scale-95 cursor-pointer",
          // Style: High-contrast premium glassmorphism
          "bg-white/80 dark:bg-zinc-900/80 border-black/10 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:text-primary hover:bg-white/90 dark:hover:bg-zinc-800/90 backdrop-blur-lg",
          // Mobile tucked-in positioning (50% translated off-screen, with start padding to keep the icon visible)
          isArabic 
            ? "max-lg:-translate-x-1/2 max-lg:hover:translate-x-0 max-lg:justify-start max-lg:ps-3" 
            : "max-lg:translate-x-1/2 max-lg:hover:translate-x-0 max-lg:justify-start max-lg:ps-3"
        )}
        aria-label="Toggle Horus assistant"
      >
        <Brain className="h-6 w-6 relative z-10 transition-transform duration-300 group-hover:scale-105" strokeWidth={1.8} />
      </button>
    </div>
  )
}

export default memo(FloatingAIBarComponent)
