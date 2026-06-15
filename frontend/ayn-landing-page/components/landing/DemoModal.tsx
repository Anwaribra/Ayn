"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, CheckCircle2, Loader2, ArrowRight, ChevronDown, Check, ShieldCheck, Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
  defaultType?: "demo" | "pricing"
}

const ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "faculty", label: "Faculty Dean" },
  { value: "compliance", label: "Compliance Officer" },
  { value: "consultant", label: "Consultant" },
  { value: "other", label: "Other Role" },
] as const

const REQUEST_TYPES = [
  { value: "demo" as const, label: "Live demo" },
  { value: "pricing" as const, label: "Pricing details" },
]

const fieldClass =
  "h-11 w-full rounded-xl border border-zinc-800 bg-transparent px-4 text-sm text-zinc-100 shadow-sm outline-none [color-scheme:dark] transition-all duration-200 placeholder:text-zinc-600 hover:border-zinc-700 hover:bg-zinc-900/50 focus:border-zinc-500 focus:bg-transparent focus:ring-1 focus:ring-zinc-500"

function FieldSelect<T extends string>({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  id: string
  label: string
  value: T | ""
  placeholder: string
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [open])

  return (
    <div ref={rootRef} className="relative space-y-2">
      <Label htmlFor={id} className="text-[13px] font-semibold text-white/80">
        {label}
      </Label>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(fieldClass, "flex items-center justify-between gap-2 text-left")}
      >
        <span className={cn("truncate", selected ? "text-white" : "text-white/35")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-white/40 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-zinc-800 bg-[#111] p-1 shadow-2xl"
        >
          {options.map((opt) => (
            <li key={opt.value} role="option" aria-selected={value === opt.value}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-[10px] px-3.5 py-2.5 text-left text-sm transition-colors",
                  value === opt.value
                    ? "bg-zinc-800/80 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white",
                )}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
              >
                {opt.label}
                {value === opt.value ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function DemoModal({
  isOpen,
  onClose,
  defaultType = "demo",
}: DemoModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    institution: "",
    role: "" as "" | (typeof ROLES)[number]["value"],
    type: defaultType,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [mounted, setMounted] = useState(false)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({ ...prev, type: defaultType }))
    }
  }, [defaultType, isOpen])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const getFocusables = useCallback(() => {
    const el = panelRef.current
    if (!el) return []
    const selector = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    return Array.from(el.querySelectorAll<HTMLElement>(selector)).filter(
      (n) => !n.hasAttribute("disabled") && n.getAttribute("aria-hidden") !== "true",
    )
  }, [])

  useEffect(() => {
    if (!isOpen) return

    previousActiveElement.current = document.activeElement as HTMLElement
    const list = getFocusables()
    if (list[0]) requestAnimationFrame(() => list[0].focus())

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        previousActiveElement.current?.focus()
        onClose()
        return
      }
      if (e.key !== "Tab") return
      const all = getFocusables()
      const idx = all.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey && idx === 0) {
        e.preventDefault()
        all[all.length - 1]?.focus()
      } else if (!e.shiftKey && idx === all.length - 1) {
        e.preventDefault()
        all[0]?.focus()
      }
    }

    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, onClose, getFocusables])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim() || !formData.institution.trim() || !formData.role) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          institution: formData.institution.trim(),
          role: formData.role,
          type: formData.type,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const detail =
          typeof payload.detail === "string"
            ? payload.detail
            : payload.message || "Failed to submit request"
        throw new Error(detail)
      }

      setIsSubmitted(true)
      if (payload.email_sent === false) {
        toast.success("Request saved", {
          description: "We received your details and will follow up shortly.",
        })
      } else {
        toast.success("Request sent!", {
          description: "Check your inbox — our team will reply soon.",
        })
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not reach the server. Try again."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    previousActiveElement.current?.focus()
    onClose()
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({
        name: "",
        email: "",
        institution: "",
        role: "",
        type: defaultType,
      })
    }, 300)
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Close dialog backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#05070b]/70 backdrop-blur-md"
            onClick={handleClose}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-title"
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-[201] flex flex-col max-h-[90dvh] w-full overflow-hidden rounded-t-[20px] border border-zinc-800 bg-[#0A0A0A] shadow-2xl sm:grid sm:max-h-[calc(100dvh-2rem)] sm:max-w-[760px] sm:grid-cols-[280px_minmax(0,1fr)] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" aria-hidden />

            <aside className="relative hidden overflow-hidden border-r border-zinc-800 bg-[#111] p-7 text-zinc-100 sm:block">
              <div
                className="absolute inset-0 opacity-90"
                style={{
                  background:
                    "radial-gradient(circle at 20% 18%, rgba(0,122,255,0.22), transparent 32%), radial-gradient(circle at 88% 78%, rgba(20,184,166,0.16), transparent 36%)",
                }}
                aria-hidden
              />
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/12 shadow-[0_0_36px_rgba(0,122,255,0.18)]">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                    Ayn readiness
                  </p>
                  <h3 className="text-3xl font-bold leading-[1.05] tracking-tight text-white">
                    See the audit room before you join.
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-zinc-400">
                    A short walkthrough tailored to your institution, standards, and evidence workflow.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 rounded-xl border border-zinc-800/50 bg-[#1A1A1A]/50 px-4 py-2.5">
                    <Clock3 className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-zinc-300">15-minute product tour</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-zinc-800/50 bg-[#1A1A1A]/50 px-4 py-2.5">
                    <ShieldCheck className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-zinc-300">Human-approved AI actions</span>
                  </div>
                </div>
              </div>
            </aside>

            <div className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-6 pb-12 sm:px-7 sm:py-7" style={{ WebkitOverflowScrolling: 'touch' }}>
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>

              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="mb-6 pr-10 sm:mb-8 flex-shrink-0">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/25 bg-primary/12 sm:hidden">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">
                        {formData.type === "pricing" ? "Institution plan" : "Guided walkthrough"}
                      </p>
                      <h3 id="demo-title" className="text-2xl font-semibold tracking-tight text-white">
                        {formData.type === "pricing" ? "Request pricing" : "Request a demo"}
                      </h3>
                      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                        {formData.type === "pricing"
                          ? "Tell us about your institution — we'll send tailored plan options."
                          : "See how Horus AI maps evidence to quality standards in minutes."}
                      </p>
                    </div>

                    <form
                      onSubmit={handleSubmit}
                      className="grid gap-4 sm:gap-5 text-left sm:grid-cols-2"
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor="demo-name" className="text-[13px] font-semibold text-zinc-300">
                          Full name
                        </Label>
                        <Input
                          id="demo-name"
                          name="ayn-demo-name"
                          type="text"
                          autoComplete="off"
                          placeholder="Your full name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={fieldClass}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="demo-email" className="text-[13px] font-semibold text-zinc-300">
                          Work email
                        </Label>
                        <Input
                          id="demo-email"
                          name="ayn-demo-email"
                          type="email"
                          autoComplete="off"
                          placeholder="you@institution.edu"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={fieldClass}
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="demo-institution" className="text-[13px] font-semibold text-zinc-300">
                          Institution name
                        </Label>
                        <Input
                          id="demo-institution"
                          name="ayn-demo-institution"
                          type="text"
                          autoComplete="off"
                          placeholder="Your institution"
                          required
                          value={formData.institution}
                          onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                          className={fieldClass}
                        />
                      </div>

                      <FieldSelect
                        id="demo-role"
                        label="Your role"
                        value={formData.role}
                        placeholder="Select role"
                        options={ROLES}
                        onChange={(role) => setFormData({ ...formData, role })}
                      />

                      <FieldSelect
                        id="demo-type"
                        label="Request type"
                        value={formData.type}
                        placeholder="Select type"
                        options={REQUEST_TYPES}
                        onChange={(type) => setFormData({ ...formData, type })}
                      />

                      <div className="pt-3 sm:col-span-2">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="group flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black shadow-sm transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Sending…
                            </>
                          ) : (
                            <>
                              Submit request
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </>
                          )}
                        </Button>
                        <p className="mt-3 text-center text-[12px] leading-relaxed text-zinc-500">
                          We&apos;ll reply within 1–2 business days.
                        </p>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex min-h-[390px] flex-col items-center justify-center px-2 py-8 text-center"
                  >
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-500/25 bg-emerald-500/12 shadow-[0_0_42px_rgba(16,185,129,0.16)]">
                      <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                    </div>

                    <h3 className="mb-2 text-2xl font-bold text-white">Request received</h3>
                    <p className="mb-7 max-w-sm text-sm leading-6 text-white/54">
                      Thanks, <span className="font-medium text-white">{formData.name}</span>. We&apos;ll contact you at{" "}
                      <span className="font-medium text-primary">{formData.email}</span> about your{" "}
                      {formData.type === "pricing" ? "pricing" : "demo"} request for{" "}
                      <span className="font-medium text-white">{formData.institution}</span>.
                    </p>

                    <Button
                      type="button"
                      onClick={handleClose}
                      className="h-11 cursor-pointer rounded-[14px] bg-white px-9 text-sm font-bold text-black hover:bg-white/90"
                    >
                      Done
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
