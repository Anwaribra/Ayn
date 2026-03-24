"use client"

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react"
import { Plus, Send, StopCircle, Image, FileText, Brain, Check, Mic, MicOff } from "lucide-react"
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
}: AIChatInputProps) => {
  const [isActive, setIsActive] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
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
    if (!quickPrompts.length && slashMenuOpen) setSlashMenuOpen(false)
  }, [quickPrompts.length, slashMenuOpen])

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault()
      e.stopPropagation()
      setSlashMenuOpen(true)
      setIsActive(true)
      return
    }
    if (e.key === "Escape" && slashMenuOpen) {
      e.preventDefault()
      setSlashMenuOpen(false)
      return
    }
    if (e.key === "ArrowUp" && !inputValue.trim() && lastUserMessage) {
      e.preventDefault()
      setInputValue(lastUserMessage)
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
          const res = await fetch("/api/horus/stt", {
            method: "POST",
            body: formData,
            credentials: "include",
          })
          if (!res.ok) throw new Error("stt_failed")
          const data = await res.json()
          const text = (data?.text || "").trim()
          if (text) {
            setInputValue((prev) => (prev ? prev + " " + text : text))
            requestAnimationFrame(() => textareaRef.current?.focus())
          }
        } catch {
          toast.error("Voice input failed. Please try again.")
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
          "horus-input-shell relative w-full max-w-[900px] overflow-visible rounded-2xl sm:rounded-3xl",
          "border border-[var(--border-subtle)] bg-[var(--glass-panel)]/90 backdrop-blur-sm",
          "shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.25)]",
          "transition-all duration-200",
          (isActive || inputValue) && "ring-2 ring-primary/20 border-primary/30",
          isDragging && "ring-2 ring-primary border-primary/50 bg-primary/5",
          isLoading && "horus-input-shimmer"
        )}
        onClick={handleActivate}
      >
        <div className="flex h-full w-full flex-col items-stretch">
          {/* Text area */}
          <div className="relative w-full px-4 pb-2 pt-4 sm:px-5 sm:pb-3 sm:pt-5">
            {isDragging && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-primary/10 text-sm font-medium text-primary">
                Drop files here
              </div>
            )}
            {isListening && (
              <div className="absolute bottom-2 left-4 z-10 flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary">
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
                "horus-input-field w-full min-h-[44px] resize-none bg-transparent border-none pr-4 text-[14px] font-medium tracking-[0.01em] outline-none focus:border-none focus:outline-none focus:ring-0 sm:text-[15px] md:text-[16px]",
                "text-foreground placeholder:text-muted-foreground/60"
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
            {slashMenuOpen && quickPrompts.length > 0 && (
              <div className="absolute left-0 bottom-full z-50 mb-2 w-full max-w-[360px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--glass-panel)]/95 p-2 shadow-2xl">
                {quickPrompts.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setSlashMenuOpen(false)
                      setInputValue(item.prompt)
                      requestAnimationFrame(() => textareaRef.current?.focus())
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-foreground hover:bg-[var(--border-subtle)]/50"
                  >
                    <span>{item.label}</span>
                    <span className="text-[11px] text-muted-foreground">/{item.label}</span>
                  </button>
                ))}
              </div>
            )}
            </div>

          </div>

          {/* Bottom toolbar */}
          <div className="flex min-h-[48px] items-center justify-between gap-3 border-t border-[var(--border-subtle)]/40 px-3 py-2.5 sm:px-4">
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
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold transition-all disabled:cursor-not-allowed disabled:opacity-30",
                  (inputValue.trim() || hasFiles)
                    ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(59,130,246,0.35)] hover:bg-primary/90 hover:shadow-[0_0_16px_rgba(59,130,246,0.45)]"
                    : "bg-muted/40 text-muted-foreground"
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
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive hover:bg-destructive/25"
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
