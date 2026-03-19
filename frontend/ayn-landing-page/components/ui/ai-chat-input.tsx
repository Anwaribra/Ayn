"use client"

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react"
import { Plus, Send, StopCircle, Image, FileText, Brain, Check, Mic, MicOff } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const SpeechRecognition = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const DEFAULT_PLACEHOLDER = "Ask Horus…"
const DRAFT_KEY = "horus-chat-draft"

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
  /** Key for draft persistence (e.g. chatId). If not set, uses default. */
  draftKey?: string
  /** When input is empty and user presses Up, fill with this (last user message) */
  lastUserMessage?: string
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
}: AIChatInputProps) => {
  const [isActive, setIsActive] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const recognitionRef = useRef<any>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const storageKey = draftKey ? `${DRAFT_KEY}:${draftKey}` : DRAFT_KEY

  // Draft persistence: load on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setInputValue(saved)
    } catch (_) {}
  }, [storageKey])

  // Draft persistence: save on change (debounced)
  useEffect(() => {
    if (!inputValue) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, inputValue)
      } catch (_) {}
    }, 300)
    return () => clearTimeout(t)
  }, [inputValue, storageKey])

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
    try {
      localStorage.removeItem(storageKey)
    } catch (_) {}
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
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
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported. Use Chrome or Edge for best results.")
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      setInterimTranscript("")
      return
    }
    try {
      // Request microphone permission first — surfaces permission errors clearly
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
    } catch (permErr: any) {
      if (permErr?.name === "NotAllowedError" || permErr?.name === "PermissionDeniedError") {
        toast.error("Microphone access denied. Allow microphone in your browser settings and try again.")
      } else {
        toast.error("Could not access microphone. Check your device settings.")
      }
      return
    }
    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"
      recognition.onresult = (e: any) => {
        let final = ""
        let interim = ""
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript
          if (e.results[i].isFinal) {
            final += transcript
          } else {
            interim += transcript
          }
        }
        if (final) setInputValue((prev) => (prev ? prev + " " + final : final).trim())
        setInterimTranscript(interim)
      }
      recognition.onerror = (e: any) => {
        const err = e?.error || "unknown"
        if (err === "aborted") return
        if (err === "no-speech") {
          // User didn't speak — don't show error, just stop
          return
        }
        if (err === "not-allowed" || err === "service-not-allowed") {
          toast.error("Microphone access denied. Allow microphone and try again.")
        } else if (err === "network") {
          toast.error("Voice recognition requires an internet connection. Brave browser may not support it — try Chrome or Edge.")
        } else if (err === "audio-capture") {
          toast.error("No microphone detected. Connect a microphone and try again.")
        } else {
          toast.error("Voice recognition error. Try Chrome or Edge if the problem persists.")
        }
        setIsListening(false)
        setInterimTranscript("")
      }
      recognition.onend = () => setIsListening(false)
      recognition.start()
      recognitionRef.current = recognition
      setIsListening(true)
      setPlusMenuOpen(false)
    } catch (err) {
      toast.error("Could not start voice input. Try Chrome or Edge.")
    }
  }, [isListening])

  const stopVoiceInput = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
    setInterimTranscript("")
  }, [])

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
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
        style={{ overflow: "hidden" }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "horus-input-shell relative w-full max-w-[900px] overflow-hidden rounded-2xl sm:rounded-3xl",
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
                Listening…
              </div>
            )}
            <textarea
              value={inputValue + (interimTranscript ? (inputValue ? " " : "") + interimTranscript : "")}
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

          </div>

          {/* Bottom toolbar */}
          <div className="flex min-h-[48px] items-center justify-between gap-3 border-t border-[var(--border-subtle)]/60 px-3 py-2.5 sm:px-4">
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
                    onClick={startVoiceInput}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none hover:bg-accent"
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4 shrink-0 text-destructive" />
                    ) : (
                      <Mic className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span>{isListening ? "Stop listening" : "Voice input"}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground/70"></span>
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
