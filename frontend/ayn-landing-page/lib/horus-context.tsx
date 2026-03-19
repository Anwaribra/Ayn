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

interface Message {
    id: string
    role: "user" | "assistant" | "system"
    content: string
    timestamp: number
    attachments?: AttachmentPreview[]
    structuredResult?: { type: string; payload: any } | null
    pendingConfirmation?: {
        id: string
        tool: string
        title: string
        description: string
    } | null
}

type HorusStatus = "idle" | "searching" | "generating" | "error"
type HorusResponseMode = "ask" | "think" | "agent"

interface HorusContextValue {
    messages: Message[]
    currentChatId: string | null
    status: HorusStatus
    thinkingSteps: string[]
    /** File names being processed (from __FILE__ protocol) */
    activeFiles: string[]
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
}

const HorusContext = createContext<HorusContextValue | undefined>(undefined)

export const HorusProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [currentChatId, setCurrentChatId] = useState<string | null>(null)
    const [status, setStatus] = useState<HorusStatus>("idle")
    const [thinkingSteps, setThinkingSteps] = useState<string[]>([])
    const [activeFiles, setActiveFiles] = useState<string[]>([])
    const [streamError, setStreamError] = useState<string | null>(null)
    const lastUserMessageRef = useRef<{ text: string; files?: File[]; responseMode?: HorusResponseMode } | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

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
        opts?: { appendUser?: boolean; visibleUserText?: string; attachments?: AttachmentPreview[] }
    ) => {
        const appendUser = opts?.appendUser ?? true
        const visibleUserText = opts?.visibleUserText ?? modelText
        if ((!modelText && (!files || files.length === 0)) || status !== "idle") return

        setThinkingSteps([])
        setActiveFiles([])
        setStreamError(null)

        if (appendUser) {
            const userMsg: Message = {
                id: crypto.randomUUID(),
                role: "user",
                content: visibleUserText || "📎 Attached files for analysis",
                timestamp: Date.now(),
                attachments: opts?.attachments,
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
        }])

        abortControllerRef.current = new AbortController()
        let fullContent = ""

        try {
            await api.horusChatStream(
                modelText || "Analyze these files.",
                files,
                currentChatId || undefined,
                (chunk) => {
                    if (chunk.startsWith("__CHAT_ID__:")) {
                        const newId = chunk.split(":")[1].trim()
                        setCurrentChatId(newId)
                        return
                    }

                    if (chunk.startsWith("__THINKING__:")) {
                        const rest = chunk.slice("__THINKING__:".length)
                        const nlIdx = rest.indexOf("\n")
                        const stepText = (nlIdx >= 0 ? rest.slice(0, nlIdx) : rest).trim()
                        const remainder = nlIdx >= 0 ? rest.slice(nlIdx + 1) : ""
                        if (stepText) setThinkingSteps(prev => [...prev, stepText])
                        if (remainder) {
                            fullContent += remainder
                            setMessages(prev => prev.map(m =>
                                m.id === assistantMsgId ? { ...m, content: fullContent } : m
                            ))
                        }
                        return
                    }

                    if (chunk.startsWith("__FILE__:")) {
                        const filename = chunk.slice("__FILE__:".length).trim()
                        if (filename) setActiveFiles(prev => [...prev, filename])
                        return
                    }

                    if (chunk.startsWith("__ACTION_CONFIRM__:")) {
                        try {
                            const jsonStr = chunk.slice("__ACTION_CONFIRM__:".length).trim()
                            const parsed = JSON.parse(jsonStr)
                            setMessages(prev => prev.map(m =>
                                m.id === assistantMsgId ? { ...m, pendingConfirmation: parsed } : m
                            ))
                        } catch (e) {
                            console.error("[Horus] Failed to parse action confirmation:", e)
                        }
                        return
                    }

                    if (chunk.startsWith("__ACTION_RESULT__:")) {
                        try {
                            const rest = chunk.slice("__ACTION_RESULT__:".length)
                            const nl = rest.indexOf("\n")
                            const jsonStr = (nl >= 0 ? rest.slice(0, nl) : rest).trim()
                            const parsed = JSON.parse(jsonStr)
                            setMessages(prev => prev.map(m =>
                                m.id === assistantMsgId ? { ...m, structuredResult: parsed, pendingConfirmation: null } : m
                            ))
                            if (nl >= 0) {
                                const narrative = rest.slice(nl + 1).trimStart()
                                if (narrative) {
                                    fullContent += narrative
                                    setMessages(prev => prev.map(m =>
                                        m.id === assistantMsgId ? { ...m, content: fullContent } : m
                                    ))
                                }
                            }
                        } catch (e) {
                            console.error("[Horus] Failed to parse action result:", e)
                        }
                        return
                    }

                    if (chunk.startsWith("__STREAM_ERROR__:")) {
                        const errorMsg = chunk.slice("__STREAM_ERROR__:".length).trim()
                        setStreamError(errorMsg || "Connection interrupted. Please try again.")
                        return
                    }

                    fullContent += chunk
                    setMessages(prev => prev.map(m =>
                        m.id === assistantMsgId ? { ...m, content: fullContent } : m
                    ))
                },
                abortControllerRef.current.signal
            )
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                toast.error("Horus connection interrupted. Please try again.")
                setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId
                        ? { ...m, content: m.content || "Connection was interrupted. Please try sending your message again." }
                        : m
                ))
            }
        } finally {
            setStatus("idle")
            abortControllerRef.current = null
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
                    : `📎 ${files!.length} file${files!.length > 1 ? "s" : ""} attached for analysis`)
                : (normalizedText || "📎 Attached files for analysis")
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
        setThinkingSteps([])
        setActiveFiles([])
        setStreamError(null)
    }

    const loadChat = async (chatId: string) => {
        stopGeneration()
        setThinkingSteps([])
        setActiveFiles([])
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
            })))
        } catch (err) {
            toast.error("Failed to load chat history.")
        }
    }

    return (
        <HorusContext.Provider value={{ messages, currentChatId, status, thinkingSteps, activeFiles, streamError, sendMessage, resolveActionConfirmation, retryLastMessage, stopGeneration, newChat, loadChat }}>
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
