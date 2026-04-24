"use client"

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react"
import { Plus, Send, StopCircle, Image, FileText, Brain, Check, Mic, MicOff, ShieldCheck, BarChart2, AlertTriangle, Link, Download, Search, Sparkles, Wrench } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const DEFAULT_PLACEHOLDER = "Ask Horus…"
const ACCEPTED_DOC_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]

function isAcceptedFile(file: File): boolean {
  return file.type.startsWith("image/") || ACCEPTED_DOC_TYPES.includes(file.type)
}

interface AIChatInputProps {
  onSend: (message: string) => void
  onStop?: () => void
  onFileAttach?: (file: File) => void
  onChange?: (value: string) => void
  isLoading?: boolean
  disabled?: boolean
  hasFiles?: boolean
  footer?: ReactNode
  onThinkingSelect?: () => void
  responseMode?: "ask" | "think" | "agent"
  /** Key for draft persistence (unused; draft persistence is disabled). */
  draftKey?: string
  /** When input is empty and user presses Up, fill with this (last user message) */
  lastUserMessage?: string
  quickPrompts?: { label: string; prompt: string }[]
  /** Full agent tool commands for the slash palette */
  agentCommands?: { command: string; label: string; description: string; icon: string; category?: string }[]
  header?: ReactNode
}

export const AIChatInput = ({
  onSend,
  onStop,
  onFileAttach,
  onChange,
  isLoading = false,
  disabled = false,
  hasFiles = false,
  footer,
  onThinkingSelect,
  responseMode = "ask",
  draftKey,
  lastUserMessage,
  quickPrompts = [],
  agentCommands = [],
  header,
}: AIChatInputProps) => {
  const [isActive, setIsActive] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashFilter, setSlashFilter] = useState("")
  const [slashSelectedIdx, setSlashSelectedIdx] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaChunksRef = useRef<BlobPart[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!quickPrompts.length && !agentCommands.length && slashMenuOpen) setSlashMenuOpen(false)
  }, [quickPrompts.length, agentCommands.length, slashMenuOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (!inputValue) setIsActive(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [inputValue])

  const sendRef = useRef<() => void>(() => {})

  // Keyboard shortcuts: Ctrl+Enter send, Ctrl+/ open plus menu
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault()
        sendRef.current()
      }
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault()
        setPlusMenuOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [])

  const handleActivate = () => setIsActive(true)

  const handleSend = () => {
    if ((!inputValue.trim() && !hasFiles) || isLoading) return
    onSend(inputValue.trim())
    setInputValue("")
    setIsActive(false)
    setSlashMenuOpen(false)
  }

  // Build the combined slash items list for filtering/keyboard navigation
  const SLASH_ICON_MAP: Record<string, React.ElementType> = {
    "shield-check": ShieldCheck,
    "bar-chart-2": BarChart2,
    "alert-triangle": AlertTriangle,
    "link": Link,
    "download": Download,
    "search": Search,
    "sparkles": Sparkles,
    "wrench": Wrench,
    "file-text": FileText,
    "brain": Brain,
  }

  const filteredAgentCommands = agentCommands.filter((cmd) =>
    !slashFilter ||
    cmd.command.toLowerCase().includes(slashFilter.toLowerCase()) ||
    cmd.label.toLowerCase().includes(slashFilter.toLowerCase())
  )

  const filteredQuickPrompts = quickPrompts.filter((qp) =>
    !slashFilter || qp.label.toLowerCase().includes(slashFilter.toLowerCase())
  )

  const totalSlashItems = filteredAgentCommands.length + filteredQuickPrompts.length

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (slashMenuOpen && totalSlashItems > 0) {
        // Select the highlighted slash item
        if (slashSelectedIdx < filteredAgentCommands.length) {
          const cmd = filteredAgentCommands[slashSelectedIdx]
          setSlashMenuOpen(false)
          setSlashFilter("")
          setSlashSelectedIdx(0)
          setInputValue(cmd.label)
          onSend(cmd.label)
          setInputValue("")
          setIsActive(false)
        } else {
          const qpIdx = slashSelectedIdx - filteredAgentCommands.length
          const qp = filteredQuickPrompts[qpIdx]
          if (qp) {
            setSlashMenuOpen(false)
            setSlashFilter("")
            setSlashSelectedIdx(0)
            setInputValue(qp.prompt)
            requestAnimationFrame(() => textareaRef.current?.focus())
          }
        }
        return
      }
      handleSend()
    }
    if (e.key === "/" && !inputValue.trim() && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault()
      e.stopPropagation()
      setSlashMenuOpen(true)
      setSlashFilter("")
      setSlashSelectedIdx(0)
      setIsActive(true)
      return
    }
    if (e.key === "Escape") {
      if (slashMenuOpen) {
        e.preventDefault()
        setSlashMenuOpen(false)
        setSlashFilter("")
        setSlashSelectedIdx(0)
        return
      }
    }
    // Arrow key navigation in slash menu
    if (slashMenuOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault()
      setSlashSelectedIdx((prev) => {
        if (e.key === "ArrowDown") return Math.min(prev + 1, totalSlashItems - 1)
        return Math.max(prev - 1, 0)
      })
      return
    }
    if (e.key === "ArrowUp" && !inputValue.trim() && lastUserMessage) {
      e.preventDefault()
      setInputValue(lastUserMessage)
    }
    // If typing while slash menu is open, filter
    if (slashMenuOpen && e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      setSlashFilter((prev) => prev + e.key)
      setSlashSelectedIdx(0)
      e.preventDefault()
      return
    }
    if (slashMenuOpen && e.key === "Backspace") {
      if (slashFilter) {
        setSlashFilter((prev) => prev.slice(0, -1))
        setSlashSelectedIdx(0)
      } else {
        setSlashMenuOpen(false)
      }
      e.preventDefault()
      return
    }
  }

  const resizeTextarea = useCallback((value: string) => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    const next = Math.min(el.scrollHeight, 140)
    el.style.height = `${Math.max(next, 44)}px`
  }, [])

  useEffect(() => {
    resizeTextarea(inputValue)
  }, [inputValue, resizeTextarea])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, _type: "photo" | "document") => {
    const file = e.target.files?.[0]
    if (file && onFileAttach) onFileAttach(file)
    e.target.value = ""
  }

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files)
      list.filter(isAcceptedFile).forEach((f) => onFileAttach?.(f))
    },
    [onFileAttach]
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!wrapperRef.current?.contains(e.relatedTarget as Node)) setIsDragging(false)
  }

  const startVoiceInput = useCallback(async () => {
    if (isTranscribing) return
    if (isListening) {
      mediaRecorderRef.current?.stop()
      setIsListening(false)
      return
    }
    if (typeof window !== "undefined" && !window.isSecureContext && location.hostname !== "localhost") {
      toast.error("Voice input requires HTTPS. Open this page over HTTPS to enable it.")
      return
    }
    if (typeof MediaRecorder === "undefined") {
      toast.error("Voice input isn't supported in this browser.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeCandidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"]
      const mimeType = mimeCandidates.find((t) => MediaRecorder.isTypeSupported(t)) || ""
      mediaChunksRef.current = []
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaStreamRef.current = stream
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) mediaChunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        setIsListening(false)
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
        const blob = new Blob(mediaChunksRef.current, { type: mimeType || "audio/webm" })
        mediaChunksRef.current = []
        if (blob.size === 0) return
        setIsTranscribing(true)
        try {
          const formData = new FormData()
          const file = new File([blob], "voice.webm", { type: blob.type })
          const lang = typeof document !== "undefined" ? document.documentElement.lang : ""
          formData.append("audio", file)
          if (lang) formData.append("language", lang === "ar" ? "ar" : "en")
          const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
          const res = await fetch("/api/horus/stt", {
            method: "POST",
            body: formData,
            credentials: "include",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          })
          if (!res.ok) {
            const errData = await res.json().catch(() => null)
            const detail = errData?.detail || "Voice input failed. Please try again."
            throw new Error(detail)
          }
          const data = await res.json()
          const text = (data?.text || "").trim()
          if (text) {
            setInputValue((prev) => (prev ? prev + " " + text : text))
            requestAnimationFrame(() => textareaRef.current?.focus())
          }
        } catch (err: any) {
          toast.error(err?.message || "Voice input failed. Please try again.")
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start()
      setIsListening(true)
      setPlusMenuOpen(false)
    } catch (err: any) {
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        toast.error("Microphone access denied. Allow microphone and try again.")
      } else {
        toast.error("Could not access microphone.")
      }
      setIsListening(false)
    }
  }, [isListening, isTranscribing])

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop()
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile()
        if (file && onFileAttach) {
          e.preventDefault()
          onFileAttach(file)
          break
        }
      }
    }
  }

  sendRef.current = handleSend

  return (
    <div className="flex w-full flex-col items-center justify-center pb-3 pt-1 sm:pb-6 sm:pt-2">
      <div
        ref={wrapperRef}
        style={{ overflow: "visible" }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "horus-input-shell relative w-full max-w-[920px] overflow-visible rounded-[28px]",
          "border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] backdrop-blur-xl",
          "shadow-[0_24px_60px_-36px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.04)]",
          "transition-all duration-200",
          (isActive || inputValue) && "border-primary/25 shadow-[0_28px_70px_-40px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.05)]",
          isDragging && "ring-2 ring-primary/40 border-primary/50 bg-primary/5",
          isLoading && "horus-input-shimmer"
        )}
        onClick={handleActivate}
      >
        <div className="flex h-full w-full flex-col items-stretch">
          {header && (
            <div className="border-b border-white/8 px-4 py-2.5 sm:px-5">
              {header}
            </div>
          )}
          {/* Text area */}
          <div className="relative w-full px-4 pb-2 pt-4 sm:px-5 sm:pb-3 sm:pt-[18px]">
            {isDragging && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[24px] bg-primary/10 text-sm font-medium text-primary">
                Drop files here
              </div>
            )}
            {isListening && (
              <div className="absolute bottom-2 left-4 z-10 flex items-center gap-1 rounded-full border border-primary/15 bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary">
                <span className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-primary animate-pulse"
                      style={{ height: "6px", animationDelay: `${i * 100}ms`, animationDuration: "0.6s" }}
                    />
                  ))}
                </span>
                Recording…
              </div>
            )}
            <div className="relative">
            <textarea
              value={inputValue}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              disabled={disabled}
              placeholder={DEFAULT_PLACEHOLDER}
              onChange={(e) => {
                setInputValue(e.target.value)
                resizeTextarea(e.target.value)
                if (onChange) onChange(e.target.value)
              }}
              className={cn(
                "horus-input-field w-full min-h-[48px] resize-none border-none bg-transparent pe-4 text-[14px] font-medium tracking-[0.01em] outline-none focus:border-none focus:outline-none focus:ring-0 sm:text-[15px] md:text-[16px]",
                "text-foreground placeholder:text-muted-foreground/55"
              )}
              style={{
                position: "relative",
                zIndex: 1,
                color: "var(--foreground)",
                WebkitTextFillColor: "var(--foreground)",
                caretColor: "var(--foreground)",
              }}
              onFocus={handleActivate}
              ref={textareaRef}
              rows={1}
            />
            {slashMenuOpen && (filteredAgentCommands.length > 0 || filteredQuickPrompts.length > 0) && (
              <div className="absolute bottom-full left-0 z-50 mb-2 w-full max-w-[420px] rounded-2xl border border-white/10 bg-[rgba(11,14,22,0.97)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/8 px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 text-primary">
                      <Sparkles className="h-3 w-3" />
                    </span>
                    <span className="text-[12px] font-semibold text-foreground">Agent Commands</span>
                  </div>
                  {slashFilter && (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      /{slashFilter}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground/60">↑↓ navigate · Enter select · Esc close</span>
                </div>

                <div className="max-h-[320px] overflow-y-auto p-1.5 custom-scrollbar">
                  {/* Agent Commands */}
                  {filteredAgentCommands.length > 0 && (
                    <div className="mb-1">
                      {filteredAgentCommands.map((cmd, idx) => {
                        const CmdIcon = SLASH_ICON_MAP[cmd.icon] ?? Wrench
                        const isSelected = idx === slashSelectedIdx
                        return (
                          <button
                            key={cmd.command}
                            type="button"
                            onClick={() => {
                              setSlashMenuOpen(false)
                              setSlashFilter("")
                              setSlashSelectedIdx(0)
                              setInputValue(cmd.label)
                              onSend(cmd.label)
                              setInputValue("")
                              setIsActive(false)
                            }}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                              isSelected
                                ? "bg-primary/10 border border-primary/20"
                                : "hover:bg-white/[0.04] border border-transparent"
                            )}
                          >
                            <span className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                              isSelected
                                ? "border-primary/25 bg-primary/15 text-primary"
                                : "border-white/10 bg-white/[0.04] text-muted-foreground"
                            )}>
                              <CmdIcon className="h-4 w-4" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-semibold text-foreground">{cmd.label}</span>
                                <span className="rounded-full border border-white/8 bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground/70">/{cmd.command}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground/80 mt-0.5 line-clamp-1">{cmd.description}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Quick Prompts */}
                  {filteredQuickPrompts.length > 0 && (
                    <>
                      {filteredAgentCommands.length > 0 && (
                        <div className="mx-2 my-1 h-px bg-white/8" />
                      )}
                      <div className="px-2 py-1">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 mb-1">Quick prompts</p>
                      </div>
                      {filteredQuickPrompts.map((item, idx) => {
                        const globalIdx = filteredAgentCommands.length + idx
                        const isSelected = globalIdx === slashSelectedIdx
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => {
                              setSlashMenuOpen(false)
                              setSlashFilter("")
                              setSlashSelectedIdx(0)
                              setInputValue(item.prompt)
                              requestAnimationFrame(() => textareaRef.current?.focus())
                            }}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors",
                              isSelected
                                ? "bg-primary/10 text-foreground"
                                : "text-foreground hover:bg-white/[0.04]"
                            )}
                          >
                            <span className="text-[13px]">{item.label}</span>
                            <span className="text-[10px] text-muted-foreground/60">/{item.label}</span>
                          </button>
                        )
                      })}
                    </>
                  )}

                  {totalSlashItems === 0 && (
                    <div className="px-3 py-6 text-center">
                      <p className="text-[12px] text-muted-foreground">No commands match "/{slashFilter}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>

          </div>

          {/* Bottom toolbar */}
          <div className="flex min-h-[54px] items-center justify-between gap-3 border-t border-white/8 px-3 py-2.5 sm:px-4">
            <div className="flex items-center gap-1">
              <DropdownMenu open={plusMenuOpen} onOpenChange={setPlusMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/80 transition-colors hover:bg-[var(--border-subtle)]/50 hover:text-foreground"
                    title="Add attachment or switch mode (Ctrl+/)"
                    type="button"
                    tabIndex={-1}
                  >
                    <Plus size={20} strokeWidth={2} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="min-w-[220px] p-1.5">
                  <DropdownMenuItem
                    onClick={() => photoInputRef.current?.click()}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none hover:bg-accent"
                  >
                    <Image className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>Upload image</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => documentInputRef.current?.click()}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none hover:bg-accent"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>Upload document</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onThinkingSelect?.()}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none hover:bg-accent"
                  >
                    <Brain className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>Thinking mode</span>
                    {responseMode === "think" && (
                      <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={startVoiceInput}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  isListening
                    ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                    : "text-muted-foreground/80 hover:bg-[var(--border-subtle)]/50 hover:text-foreground"
                )}
                title={
                  isTranscribing
                    ? "Transcribing..."
                    : isListening
                      ? "Stop recording"
                      : "Voice input"
                }
                type="button"
                tabIndex={-1}
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
                disabled={isTranscribing}
              >
                {isListening ? <MicOff size={20} strokeWidth={2} /> : <Mic size={20} strokeWidth={2} />}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "photo")}
              />
              <input
                ref={documentInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => handleFileChange(e, "document")}
              />
            </div>

            <div className="min-w-0 flex-1 flex items-center justify-center text-muted-foreground">
              {footer}
            </div>

            {!isLoading ? (
              <button
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold transition-all disabled:cursor-not-allowed disabled:opacity-30",
                  (inputValue.trim() || hasFiles)
                    ? "bg-primary text-primary-foreground shadow-[0_12px_26px_-12px_rgba(59,130,246,0.6)] hover:bg-primary/90 hover:shadow-[0_16px_30px_-12px_rgba(59,130,246,0.65)]"
                    : "border border-white/8 bg-white/[0.04] text-muted-foreground"
                )}
                title="Send (Ctrl+Enter)"
                type="button"
                disabled={!inputValue.trim() && !hasFiles}
                onClick={handleSend}
                tabIndex={-1}
              >
                <Send size={18} className="ml-0.5 rotate-[-45deg]" />
              </button>
            ) : (
              <button
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-destructive/20 bg-destructive/15 text-destructive hover:bg-destructive/25"
                onClick={onStop}
                type="button"
              >
                <StopCircle size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
