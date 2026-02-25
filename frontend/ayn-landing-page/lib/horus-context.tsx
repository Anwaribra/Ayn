"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"

interface Message {
    id: string
    role: "user" | "assistant" | "system"
    content: string
    timestamp: number
    structuredResult?: { type: string; payload: any } | null
}

type HorusStatus = "idle" | "searching" | "generating" | "error"

interface HorusContextValue {
    messages: Message[]
    currentChatId: string | null
    status: HorusStatus
    thinkingSteps: string[]          // Real steps pushed by __THINKING__: events
    sendMessage: (text: string, files?: File[]) => Promise<void>
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
    const abortControllerRef = useRef<AbortController | null>(null)

    // 1. Auto-Resume Last Session on mount
    // 1. (Auto-Resume functionality removed, chat should start empty on refresh)
    useEffect(() => {
        // isInitialized.current = true // Removed as per instruction
    }, [])

    // 2. Persistent SSE Event Listener
    useEffect(() => {
        if (!user) return

        // Establish SSE Connection for real-time events
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const sseUrl = `/api/horus/events${token ? `?token=${token}` : ''}`;
        const eventSource = new EventSource(sseUrl)

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

                    // Background Notification
                    toast(event.data.title, {
                        description: event.data.description,
                        icon: "🧠"
                    })
                }
            } catch (err) {
                console.error("Global Horus SSE Error:", err)
            }
        }

        return () => eventSource.close()
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

    const sendMessage = async (text: string, files?: File[]) => {
        if ((!text && (!files || files.length === 0)) || status !== "idle") return

        setThinkingSteps([])  // Reset thinking steps for new request

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: text || "📎 Attached files for analysis",
            timestamp: Date.now(),
        }

        setMessages(prev => [...prev, userMsg])
        setStatus("generating")
        const assistantMsgId = crypto.randomUUID()
        setMessages(prev => [...prev, {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            timestamp: Date.now()
        }])

        // 2. Stream Generation
        abortControllerRef.current = new AbortController()
        let fullContent = ""

        try {
            await api.horusChatStream(
                text || "Analyze these files.",
                files,
                currentChatId || undefined,
                (chunk) => {
                    if (chunk.startsWith("__CHAT_ID__:")) {
                        const newId = chunk.split(":")[1].trim()
                        setCurrentChatId(newId)
                        return
                    }

                    // Real thinking step from backend — push to thinkingSteps
                    if (chunk.startsWith("__THINKING__:")) {
                        const stepText = chunk.slice("__THINKING__:".length).trim()
                        if (stepText) setThinkingSteps(prev => [...prev, stepText])
                        return
                    }

                    // Agent structured result — parse and attach to message, don't stream as text
                    if (chunk.startsWith("__ACTION_RESULT__:")) {
                        try {
                            const jsonStr = chunk.slice("__ACTION_RESULT__:".length).trim()
                            const parsed = JSON.parse(jsonStr)
                            setMessages(prev => prev.map(m =>
                                m.id === assistantMsgId ? { ...m, structuredResult: parsed } : m
                            ))
                        } catch (e) {
                            console.error("[Horus] Failed to parse action result:", e)
                        }
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
                toast.error("Horus connection interrupted.")
                setMessages(prev => prev.filter(m => m.id !== assistantMsgId)) // Remove empty message on error
            }
        } finally {
            setStatus("idle")
            abortControllerRef.current = null
        }
    }

    const newChat = () => {
        stopGeneration()
        setCurrentChatId(null)
        setMessages([])
        setThinkingSteps([])
    }

    const loadChat = async (chatId: string) => {
        stopGeneration()
        setThinkingSteps([]) // Clear thinking steps when loading a new chat
        try {
            const chat = await api.getChatMessages(chatId)
            setCurrentChatId(chat.id)
            setMessages(chat.messages.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.timestamp).getTime()
            })))
        } catch (err) {
            toast.error("Failed to load chat history.")
        }
    }

    return (
        <HorusContext.Provider value={{ messages, currentChatId, status, thinkingSteps, sendMessage, stopGeneration, newChat, loadChat }}>
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
