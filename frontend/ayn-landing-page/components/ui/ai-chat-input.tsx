"use client"

import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from "react"
import { Plus, ArrowUp, Square, Mic, MicOff, FileText, Brain, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getAIProviderFetchHeaders } from "@/lib/ai-provider-preference"
import { useUiLanguage } from "@/lib/ui-language-context"

const DEFAULT_PLACEHOLDER = "Ask anything…"
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
  responseMode?: "ask" | "think" | "agent"
  draftKey?: string
  lastUserMessage?: string
  quickPrompts?: { label: string; prompt: string }[]
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
  responseMode = "ask",
  draftKey,
  lastUserMessage,
  quickPrompts = [],
  agentCommands = [],
  header,
}: AIChatInputProps) => {
  const [inputValue, setInputValue] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashFilter, setSlashFilter] = useState("")
  const [slashSelectedIdx, setSlashSelectedIdx] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaChunksRef = useRef<BlobPart[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    if ((!inputValue.trim() && !hasFiles) || isLoading) return
    onSend(inputValue.trim())
    setInputValue("")
    setSlashMenuOpen(false)
  }, [inputValue, hasFiles, isLoading, onSend])

  // Keybinds: Ctrl+Enter or Cmd+Enter to send, Ctrl+/ to attach
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        handleSend()
      }
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault()
        documentInputRef.current?.click()
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [handleSend])

  const filteredCommands = useMemo(() => {
    const cmds = agentCommands.map(c => ({ id: c.command, name: c.command, description: c.description }))
    const prompts = quickPrompts.map(q => ({ id: q.label, name: q.label, description: q.prompt }))
    const all = [...cmds, ...prompts]
    if (!slashFilter) return all
    return all.filter(c => c.name.toLowerCase().includes(slashFilter.toLowerCase()))
  }, [agentCommands, quickPrompts, slashFilter])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (slashMenuOpen && filteredCommands.length > 0) {
        const selected = filteredCommands[slashSelectedIdx]
        if (selected) {
          setSlashMenuOpen(false)
          setSlashFilter("")
          setSlashSelectedIdx(0)
          
          // If it's a command, append/send it.
          const isCommand = agentCommands.some(c => c.command === selected.name)
          if (isCommand) {
            onSend(selected.description)
          } else {
            setInputValue(selected.description)
            requestAnimationFrame(() => textareaRef.current?.focus())
          }
        }
        return
      }
      handleSend()
    }
    if (e.key === "Escape") {
      if (slashMenuOpen) {
        e.preventDefault()
        setSlashMenuOpen(false)
        setSlashSelectedIdx(0)
      }
    }
    if (slashMenuOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault()
      setSlashSelectedIdx((prev) => {
        if (e.key === "ArrowDown") return Math.min(prev + 1, filteredCommands.length - 1)
        return Math.max(prev - 1, 0)
      })
    }
    if (e.key === "ArrowUp" && !inputValue.trim() && lastUserMessage) {
      e.preventDefault()
      setInputValue(lastUserMessage)
    }
  }

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  useEffect(() => {
    autoResize()
  }, [inputValue])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onFileAttach) onFileAttach(file)
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) {
      const file = e.dataTransfer.files[0]
      if (isAcceptedFile(file) && onFileAttach) {
        onFileAttach(file)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

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

  const startVoiceInput = useCallback(async () => {
    if (isTranscribing) return
    if (isListening) {
      mediaRecorderRef.current?.stop()
      setIsListening(false)
      return
    }
    if (typeof window !== "undefined" && !window.isSecureContext && location.hostname !== "localhost") {
      toast.error("Voice input requires HTTPS.")
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
          formData.append("audio", file)
          const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
          const res = await fetch("/api/horus/stt", {
            method: "POST",
            body: formData,
            credentials: "include",
            headers: {
              ...getAIProviderFetchHeaders(),
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          })
          if (!res.ok) throw new Error("STT Request failed")
          const data = await res.json()
          const text = (data?.text || "").trim()
          if (text) {
            setInputValue((prev) => (prev ? prev + " " + text : text))
            requestAnimationFrame(() => textareaRef.current?.focus())
          }
        } catch {
          toast.error("Voice transcription failed.")
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start()
      setIsListening(true)
    } catch {
      toast.error("Could not access microphone.")
      setIsListening(false)
    }
  }, [isListening, isTranscribing])

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop()
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const { isArabic } = useUiLanguage()
  const hasDraft = !!inputValue.trim() || hasFiles

  return (
    <div className="relative flex w-full flex-col items-stretch pb-1 pt-1 sm:pb-2">
      {header && <div className="mb-2 px-1">{header}</div>}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border border-[var(--chat-input-border)] rounded-xl px-3 py-2.5 flex items-end gap-2 bg-[var(--chat-input-bg)] transition-all duration-200 shadow-[var(--chat-input-shadow)] focus-within:bg-[var(--chat-input-bg-focus)] focus-within:border-[var(--chat-input-border-focus)] focus-within:shadow-[var(--chat-input-shadow-focus)]",
          isDragging && "border-primary/50 bg-primary/5"
        )}
      >
        {/* Attach Button */}
        <button
          onClick={() => documentInputRef.current?.click()}
          className="w-7 h-7 rounded-md border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors duration-150 flex-shrink-0 mb-[1px]"
          title={isArabic ? "إرفاق ملف (Ctrl+/)" : "Attach File (Ctrl+/)"}
          aria-label={isArabic ? "إرفاق ملف" : "Attach File"}
          type="button"
        >
          <Plus className="w-4 h-4" />
        </button>
        <input
          ref={documentInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.txt,image/*"
          onChange={handleFileChange}
          aria-label={isArabic ? "إرفاق ملف" : "File upload"}
        />

        {/* Text Area */}
        <div className="flex-1 relative overflow-visible">
          {slashMenuOpen && filteredCommands.length > 0 && (
            <div id="slash-command-menu" role="listbox" className="absolute bottom-full left-0 right-0 mb-3 border border-border/60 rounded-xl bg-background overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200 z-[60] max-h-[220px] overflow-y-auto">
              {filteredCommands.map((cmd, idx) => (
                <button
                  key={cmd.id}
                  id={`slash-command-${cmd.id}`}
                  role="option"
                  aria-selected={idx === slashSelectedIdx}
                  type="button"
                  onClick={() => {
                    setSlashMenuOpen(false)
                    setSlashFilter("")
                    setSlashSelectedIdx(0)
                    const isCommand = agentCommands.some(c => c.command === cmd.name)
                    if (isCommand) {
                      onSend(cmd.description)
                    } else {
                      setInputValue(cmd.description)
                      requestAnimationFrame(() => textareaRef.current?.focus())
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-2 text-left transition-colors duration-100",
                    idx === slashSelectedIdx ? "bg-muted" : "hover:bg-muted/50"
                  )}
                >
                  <span className="text-xs font-mono text-muted-foreground w-20">/{cmd.name}</span>
                  <span className="text-xs text-foreground truncate">{cmd.description}</span>
                </button>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            dir="auto"
            value={inputValue}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={slashMenuOpen}
            aria-controls={slashMenuOpen ? "slash-command-menu" : undefined}
            aria-activedescendant={slashMenuOpen && filteredCommands.length > 0 ? `slash-command-${filteredCommands[slashSelectedIdx]?.id}` : undefined}
            placeholder={isArabic ? "اسأل عن أي شيء..." : "Ask anything…"}
            onChange={(e) => {
              const val = e.target.value
              setInputValue(val)
              const trimmedLeft = val.trimStart()
              if (trimmedLeft.startsWith("/")) {
                setSlashMenuOpen(true)
                setSlashFilter(trimmedLeft.slice(1))
                setSlashSelectedIdx(0)
              } else {
                setSlashMenuOpen(false)
                setSlashFilter("")
              }
              if (onChange) onChange(val)
            }}
            className="w-full bg-transparent text-sm resize-none outline-none text-foreground placeholder:text-muted-foreground/60 min-h-[24px] max-h-[160px] leading-relaxed border-0 p-0 focus:ring-0"
            rows={1}
          />
        </div>

        {/* Voice and Send Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 mb-[1px]">
          <button
            onClick={startVoiceInput}
            className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors duration-150",
              isListening && "bg-destructive/10 text-destructive hover:bg-destructive/20 animate-pulse"
            )}
            title={
              isTranscribing
                ? (isArabic ? "جاري النسخ..." : "Transcribing...")
                : isListening
                ? (isArabic ? "إيقاف التسجيل" : "Stop recording")
                : (isArabic ? "إدخال صوتي" : "Voice input")
            }
            aria-label={
              isTranscribing
                ? (isArabic ? "جاري النسخ..." : "Transcribing...")
                : isListening
                ? (isArabic ? "إيقاف التسجيل" : "Stop recording")
                : (isArabic ? "إدخال صوتي" : "Voice input")
            }
            type="button"
            disabled={isTranscribing}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {isLoading ? (
            <button
              onClick={onStop}
              className="w-7 h-7 rounded-full border border-border/60 flex items-center justify-center hover:bg-muted/50 transition-all duration-150 text-destructive"
              type="button"
              title={isArabic ? "إيقاف الإنشاء" : "Stop generation"}
              aria-label={isArabic ? "إيقاف الإنشاء" : "Stop generation"}
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          ) : (
            <button
              disabled={!hasDraft || isLoading}
              onClick={handleSend}
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150",
                hasDraft
                  ? "bg-foreground text-background hover:opacity-90 active:scale-95"
                  : "bg-muted/50 text-muted-foreground opacity-40"
              )}
              type="button"
              title={isArabic ? "إرسال" : "Send"}
              aria-label={isArabic ? "إرسال" : "Send"}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {footer && <div className="mt-2">{footer}</div>}
    </div>
  )
}
