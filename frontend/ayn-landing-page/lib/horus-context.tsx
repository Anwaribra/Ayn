"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"

interface AttachmentPreview {
    name: string
    type: "image" | "document"
    preview?: string
}

type HorusResponseMode = "ask" | "think" | "agent"

export type CitationSource = {
    document_id: string
    title: string | null
    excerpt?: string
    similarity?: number
}

export interface Message {
    id: string
    role: "user" | "assistant" | "system"
    content: string
    timestamp: number
    attachments?: AttachmentPreview[]
    /** Client-side response mode used for this message (Ask/Think/Agent) */
    responseMode?: HorusResponseMode
    structuredResult?: { type: string; payload: any } | null
    /** Per-message thinking steps (from __THINKING__ protocol) */
    thinkingSteps?: string[]
    /** Per-message tool execution steps (from __TOOL_STEP__ protocol) */
    toolSteps?: ToolStep[]
    /** Per-message file names being processed (from __FILE__/__FILE_STATUS__) */
    activeFiles?: string[]
    /** Per-message file status map (from __FILE_STATUS__) */
    fileStatuses?: Record<string, FileStatus>
    pendingConfirmation?: {
        id: string
        tool: string
        title: string
        description: string
    } | null
    /** RAG sources for citation UI (from __CITATION__ protocol) */
    citations?: CitationSource[]
}

type HorusStatus = "idle" | "searching" | "generating" | "error"

export type ToolStep = {
    step: number
    total: number
    tool: string
    title?: string
    status: "running" | "done" | "error"
    result_type?: string
}

export type FileStatus = "uploading" | "extracting" | "analyzing" | "done" | "error"

interface HorusContextValue {
    messages: Message[]
    currentChatId: string | null
    status: HorusStatus
    streamError: string | null
    sendMessage: (
        text?: string,
        files?: File[],
        opts?: {
            visibleText?: string
            responseMode?: HorusResponseMode
            attachments?: AttachmentPreview[]
        }
    ) => Promise<void>
    resolveActionConfirmation: (id: string, decision: "confirm" | "cancel") => Promise<void>
    retryLastMessage: () => Promise<void>
    stopGeneration: () => void
    newChat: () => void
    loadChat: (chatId: string) => Promise<void>
    appendMessages: (nextMessages: Message[]) => void
}

const HorusContext = createContext<HorusContextValue | undefined>(undefined)

export const HorusProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [currentChatId, setCurrentChatId] = useState<string | null>(null)
    const [status, setStatus] = useState<HorusStatus>("idle")
    const [streamError, setStreamError] = useState<string | null>(null)
    const lastUserMessageRef = useRef<{ text: string; files?: File[]; responseMode?: HorusResponseMode } | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const streamRemainderRef = useRef("")

    const prefersArabicUi = () => {
        if (typeof window === "undefined") return false
        return (window.navigator.language || "").toLowerCase().startsWith("ar")
    }

    const buildAttachmentOnlyLabel = (attachments?: AttachmentPreview[]) => {
        const useArabic = prefersArabicUi()
        const hasImages = !!attachments?.some((item) => item.type === "image")
        const hasDocs = !!attachments?.some((item) => item.type === "document")
        const count = attachments?.length ?? 0

        if (useArabic) {
            if (hasImages && hasDocs) return count > 1 ? `تم إرفاق ${count} ملفات للتحليل` : "تم إرفاق ملف للتحليل"
            if (hasImages) return count > 1 ? `تم إرفاق ${count} صور للتحليل` : "تم إرفاق صورة للتحليل"
            if (hasDocs) return count > 1 ? `تم إرفاق ${count} مستندات للتحليل` : "تم إرفاق مستند للتحليل"
            return count > 1 ? `تم إرفاق ${count} ملفات` : "تم إرفاق ملف"
        }

        if (hasImages && hasDocs) return count > 1 ? `${count} attachments added for analysis` : "Attachment added for analysis"
        if (hasImages) return count > 1 ? `${count} images added for analysis` : "Image added for analysis"
        if (hasDocs) return count > 1 ? `${count} documents added for analysis` : "Document added for analysis"
        return count > 1 ? `${count} files attached` : "File attached"
    }

    // 1. Auto-Resume Last Session on mount
    // 1. (Auto-Resume functionality removed, chat should start empty on refresh)
    useEffect(() => {
        // isInitialized.current = true // Removed as per instruction
    }, [])

    // 2. Persistent SSE Event Listener with reconnection
    useEffect(() => {
        if (!user) return

        let eventSource: EventSource | null = null
        let retryCount = 0
        let retryTimer: ReturnType<typeof setTimeout> | null = null
        const MAX_RETRIES = 10

        function connect() {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const sseUrl = `/api/horus/events${token ? `?token=${token}` : ''}`;
            eventSource = new EventSource(sseUrl)

            eventSource.onopen = () => {
                retryCount = 0
            }

            eventSource.onmessage = (e) => {
                try {
                    const event = JSON.parse(e.data)
                    if (event.type === "activity") {
                        const sysMsg: Message = {
                            id: `sys-${event.data.id}-${Date.now()}`,
                            role: "system",
                            content: `Event: ${event.data.title}. ${event.data.description || ""}`,
                            timestamp: Date.now()
                        }
                        setMessages(prev => [...prev, sysMsg])

                        toast(event.data.title, {
                            description: event.data.description,
                            icon: "🧠"
                        })
                    }
                } catch (err) {
                    console.error("Global Horus SSE Error:", err)
                }
            }

            eventSource.onerror = () => {
                eventSource?.close()
                if (retryCount < MAX_RETRIES) {
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)
                    retryCount++
                    retryTimer = setTimeout(connect, delay)
                }
            }
        }

        connect()

        return () => {
            eventSource?.close()
            if (retryTimer) clearTimeout(retryTimer)
        }
    }, [user])

    // 3. Cleanup effect to stop phantom streams on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    const stopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
            setStatus("idle")
            toast.info("Generation stopped")
        }
    }

    const buildModelMessage = (text: string, files?: File[]) => {
        const normalizedText = text?.trim() || ""
        const hasFiles = !!files && files.length > 0
        const hasImages = !!files?.some((f) => f.type?.startsWith("image/"))

        if (hasImages) {
            if (normalizedText) {
                return `${normalizedText}\n\nAnalyze the attached image(s) and respond in plain language. Do not return JSON or code.`
            }
            return "Please analyze the attached image(s). Describe what you see in plain language. If it's a screenshot, summarize the key UI/content. Do not return JSON or code."
        }

        if (hasFiles && !normalizedText) {
            return "Please analyze the attached file(s) and summarize the key points in plain language."
        }

        if (hasFiles && normalizedText) {
            return `${normalizedText}\n\nUse the attached file(s) as context. Respond in plain language.`
        }

        return normalizedText || " "
    }

    const streamRequest = async (
        modelText: string,
        files?: File[],
        opts?: { appendUser?: boolean; visibleUserText?: string; attachments?: AttachmentPreview[]; responseMode?: Message["responseMode"] }
    ) => {
        const appendUser = opts?.appendUser ?? true
        const visibleUserText = opts?.visibleUserText ?? modelText
        if ((!modelText && (!files || files.length === 0)) || status !== "idle") return

        setStreamError(null)

        if (appendUser) {
            const userMsg: Message = {
                id: crypto.randomUUID(),
                role: "user",
                content: visibleUserText || buildAttachmentOnlyLabel(opts?.attachments),
                timestamp: Date.now(),
                attachments: opts?.attachments,
                responseMode: opts?.responseMode,
            }
            setMessages(prev => [...prev, userMsg])
        }

        setStatus("generating")
        const assistantMsgId = crypto.randomUUID()
        setMessages(prev => [...prev, {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            timestamp: Date.now(),
            pendingConfirmation: null,
            thinkingSteps: [],
            toolSteps: [],
            activeFiles: [],
            fileStatuses: {},
        }])

        abortControllerRef.current = new AbortController()
        streamRemainderRef.current = ""
        let fullContent = ""

        try {
            await api.horusChatStream(
                modelText || "Analyze these files.",
                files,
                currentChatId || undefined,
                (chunk) => {
                    const combinedChunk = streamRemainderRef.current + chunk
                    const parts = combinedChunk.split("\n")
                    const hasTrailingPartialProtocol = combinedChunk.startsWith("__") || combinedChunk.includes("\n__")
                    streamRemainderRef.current = ""

                    if (hasTrailingPartialProtocol && !combinedChunk.endsWith("\n")) {
                        const lastPart = parts.pop() ?? ""
                        if (lastPart.startsWith("__")) {
                            streamRemainderRef.current = lastPart
                        } else if (parts.length === 0) {
                            fullContent += lastPart
                            setMessages(prev => prev.map(m =>
                                m.id === assistantMsgId ? { ...m, content: fullContent } : m
                            ))
                        } else {
                            parts.push(lastPart)
                        }
                    }

                    const processProtocolLine = (line: string): boolean => {
                        if (line.startsWith("__CHAT_ID__:")) {
                            const newId = line.split(":")[1]?.trim()
                            if (newId) setCurrentChatId(newId)
                            return true
                        }

                        if (line.startsWith("__THINKING__:")) {
                            const stepText = line.slice("__THINKING__:".length).trim()
                            if (stepText) {
                                setMessages(prev => prev.map(m =>
                                    m.id === assistantMsgId
                                        ? { ...m, thinkingSteps: [...(m.thinkingSteps ?? []), stepText] }
                                        : m
                                ))
                            }
                            return true
                        }

                        if (line.startsWith("__FILE_STATUS__:")) {
                            try {
                                const jsonStr = line.slice("__FILE_STATUS__:".length).trim()
                                const parsed = JSON.parse(jsonStr)
                                const fn = parsed?.filename
                                const st = parsed?.status
                                if (fn && st) {
                                    setMessages(prev => prev.map(m => {
                                        if (m.id !== assistantMsgId) return m
                                        const nextStatuses = { ...(m.fileStatuses ?? {}), [fn]: st }
                                        const nextActive = (st === "uploading" || st === "analyzing")
                                            ? Array.from(new Set([...(m.activeFiles ?? []), fn]))
                                            : (m.activeFiles ?? [])
                                        return { ...m, fileStatuses: nextStatuses, activeFiles: nextActive }
                                    }))
                                }
                            } catch (e) {
                                console.error("[Horus] Failed to parse file status:", e)
                            }
                            return true
                        }

                        if (line.startsWith("__FILE__:")) {
                            const filename = line.slice("__FILE__:".length).trim()
                            if (filename) {
                                setMessages(prev => prev.map(m =>
                                    m.id === assistantMsgId
                                        ? { ...m, activeFiles: Array.from(new Set([...(m.activeFiles ?? []), filename])) }
                                        : m
                                ))
                            }
                            return true
                        }

                        if (line.startsWith("__CITATION__:")) {
                            try {
                                const jsonStr = line.slice("__CITATION__:".length).trim()
                                const parsed = JSON.parse(jsonStr) as CitationSource[]
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    setMessages(prev => prev.map(m =>
                                        m.id === assistantMsgId ? { ...m, citations: parsed } : m
                                    ))
                                }
                            } catch (e) {
                                console.error("[Horus] Failed to parse citation:", e)
                            }
                            return true
                        }

                        if (line.startsWith("__TOOL_STEP__:")) {
                            try {
                                const jsonStr = line.slice("__TOOL_STEP__:".length).trim()
                                const parsed = JSON.parse(jsonStr)
                                setMessages(prev => prev.map(m => {
                                    if (m.id !== assistantMsgId) return m
                                    const prevSteps = m.toolSteps ?? []
                                    const without = prevSteps.filter(t => t.step !== parsed.step)
                                    const nextSteps = [...without, parsed].sort((a, b) => a.step - b.step)
                                    return { ...m, toolSteps: nextSteps }
                                }))
                            } catch (e) {
                                console.error("[Horus] Failed to parse tool step:", e)
                            }
                            return true
                        }

                        if (line.startsWith("__ACTION_CONFIRM__:")) {
                            try {
                                const jsonStr = line.slice("__ACTION_CONFIRM__:".length).trim()
                                const parsed = JSON.parse(jsonStr)
                                setMessages(prev => prev.map(m =>
                                    m.id === assistantMsgId ? { ...m, pendingConfirmation: parsed } : m
                                ))
                            } catch (e) {
                                console.error("[Horus] Failed to parse action confirmation:", e)
                            }
                            return true
                        }

                        if (line.startsWith("__ACTION_RESULT__:")) {
                            try {
                                const rest = line.slice("__ACTION_RESULT__:".length)
                                const parsed = JSON.parse(rest.trim())
                                setMessages(prev => prev.map(m =>
                                    m.id === assistantMsgId ? { ...m, structuredResult: parsed, pendingConfirmation: null } : m
                                ))
                            } catch (e) {
                                console.error("[Horus] Failed to parse action result:", e)
                            }
                            return true
                        }

                        if (line.startsWith("__STREAM_ERROR__:")) {
                            const errorMsg = line.slice("__STREAM_ERROR__:".length).trim()
                            setStreamError(errorMsg || "Connection interrupted. Please try again.")
                            return true
                        }

                        return false
                    }

                    parts.forEach((part, index) => {
                        if (!part) return
                        if (processProtocolLine(part)) return
                        const needsNewline = index < parts.length - 1 || combinedChunk.endsWith("\n")
                        fullContent += part + (needsNewline ? "\n" : "")
                        setMessages(prev => prev.map(m =>
                            m.id === assistantMsgId ? { ...m, content: fullContent } : m
                        ))
                    })
                },
                abortControllerRef.current.signal
            )
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                const msg = err?.message || ""
                const isNetwork = /fetch|network|failed to fetch|load failed/i.test(msg)
                const toastMsg = isNetwork
                    ? "Backend unreachable. The server may be starting — try again in a few seconds."
                    : "Horus connection interrupted. Please try again."
                if (process.env.NODE_ENV === "development") {
                    console.error("[Horus stream error]", err)
                }
                toast.error(toastMsg)
                setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId
                        ? { ...m, content: m.content || (isNetwork ? "Server is starting up. Please try again in a moment." : "Connection was interrupted. Please try sending your message again.") }
                        : m
                ))
            }
        } finally {
            setStatus("idle")
            abortControllerRef.current = null
            streamRemainderRef.current = ""
        }
    }

    const getModeHint = (mode?: HorusResponseMode) => {
        if (mode === "think") {
            return "Think step by step before answering. Be thorough, structured, and explicit about reasoning when useful."
        }
        if (mode === "agent") {
            return "Act as an execution agent. Prefer concrete actions, checks, and next steps. When the user asks to analyze a file they attached: analyze it directly and provide the result. Do NOT propose a plan or ask for confirmation—just analyze."
        }
        return ""
    }

    const sendMessage = async (
        text = "",
        files?: File[],
        opts?: {
            visibleText?: string
            responseMode?: HorusResponseMode
            attachments?: AttachmentPreview[]
        }
    ) => {
        lastUserMessageRef.current = { text, files, responseMode: opts?.responseMode }
        const hasFiles = !!files && files.length > 0
        const normalizedText = text?.trim() || ""
        const visibleUserText = opts?.visibleText ?? (
            hasFiles
                ? (normalizedText
                    ? `${normalizedText}\n📎 ${files!.length} file${files!.length > 1 ? "s" : ""} attached`
                    : buildAttachmentOnlyLabel(opts?.attachments))
                : (normalizedText || buildAttachmentOnlyLabel(opts?.attachments))
        )

        let base = buildModelMessage(text, files)
        const modeHint = getModeHint(opts?.responseMode)
        const modeDirective = opts?.responseMode ? `__MODE__:${opts.responseMode}\n` : ""
        const modelText = `${modeDirective}${modeHint ? `${base}\n\n${modeHint}` : base}`
        await streamRequest(modelText, files, { appendUser: true, visibleUserText, attachments: opts?.attachments })
    }

    const retryLastMessage = async () => {
        const last = lastUserMessageRef.current
        if (!last) return
        setStreamError(null)
        setMessages(prev => {
            const lastAssistantIdx = prev.findLastIndex(m => m.role === "assistant")
            const lastUserIdx = prev.findLastIndex(m => m.role === "user")
            let filtered = prev
            if (lastAssistantIdx >= 0 && lastAssistantIdx > lastUserIdx) {
                filtered = prev.filter((_, i) => i !== lastAssistantIdx)
            }
            return filtered
        })
        const base = buildModelMessage(last.text, last.files)
        const modeHint = getModeHint(last.responseMode)
        const modeDirective = last.responseMode ? `__MODE__:${last.responseMode}\n` : ""
        const modelText = `${modeDirective}${modeHint ? `${base}\n\n${modeHint}` : base}`
        await streamRequest(modelText, last.files, { appendUser: false })
    }

    const resolveActionConfirmation = async (id: string, decision: "confirm" | "cancel") => {
        // Optimistically clear the existing confirmation card to avoid duplicate stale controls.
        setMessages(prev => prev.map(m =>
            m.pendingConfirmation?.id === id ? { ...m, pendingConfirmation: null } : m
        ))
        const controlMessage = decision === "confirm"
            ? `__CONFIRM_ACTION__:${id}`
            : `__CANCEL_ACTION__:${id}`
        await streamRequest(controlMessage, undefined, { appendUser: false })
    }

    const newChat = () => {
        stopGeneration()
        setCurrentChatId(null)
        setMessages([])
        setStreamError(null)
    }

    const appendMessages = (nextMessages: Message[]) => {
        if (!nextMessages.length) return
        setMessages(prev => [...prev, ...nextMessages])
    }

    const loadChat = async (chatId: string) => {
        stopGeneration()
        setStreamError(null)
        try {
            const chat = await api.getChatMessages(chatId)
            setCurrentChatId(chat.id)
            setMessages(chat.messages.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.timestamp).getTime(),
                structuredResult: m.metadata?.structuredResult || null,
                citations: m.metadata?.citations || undefined,
                responseMode: m.metadata?.responseMode || undefined,
            })))
        } catch (err) {
            toast.error("Failed to load chat history.")
        }
    }

    return (
        <HorusContext.Provider value={{ messages, currentChatId, status, streamError, sendMessage, resolveActionConfirmation, retryLastMessage, stopGeneration, newChat, loadChat, appendMessages }}>
            {children}
        </HorusContext.Provider>
    )
}

export function useHorus() {
    const context = useContext(HorusContext)
    if (context === undefined) {
        throw new Error("useHorus must be used within a HorusProvider")
    }
    return context
}
