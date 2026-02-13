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
}

interface HorusContextType {
    messages: Message[]
    currentChatId: string | null
    isLoading: boolean
    sendMessage: (text: string, files?: File[]) => Promise<void>
    newChat: () => void
    loadChat: (chatId: string) => Promise<void>
}

const HorusContext = createContext<HorusContextType | undefined>(undefined)

export function HorusProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [currentChatId, setCurrentChatId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const isInitialized = useRef(false)

    // 1. Auto-Resume Last Session on mount
    useEffect(() => {
        if (!user || isInitialized.current) return

        const resumeSession = async () => {
            try {
                const lastChat = await api.getLastChat()
                if (lastChat) {
                    setCurrentChatId(lastChat.id)
                    setMessages(lastChat.messages.map((m: any) => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        timestamp: new Date(m.timestamp).getTime()
                    })))
                }
            } catch (err) {
                console.error("Horus auto-resume failed:", err)
            } finally {
                isInitialized.current = true
            }
        }
        resumeSession()
    }, [user])

    // 2. Persistent SSE Event Listener
    useEffect(() => {
        if (!user) return

        const eventSource = new EventSource("/api/horus/events")

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

    const sendMessage = async (text: string, files?: File[]) => {
        if ((!text && (!files || files.length === 0)) || isLoading) return

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: text || "📎 Attached files for analysis",
            timestamp: Date.now(),
        }

        setMessages(prev => [...prev, userMsg])
        setIsLoading(true)

        const assistantMsgId = crypto.randomUUID()
        setMessages(prev => [...prev, {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            timestamp: Date.now()
        }])

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

                    fullContent += chunk
                    setMessages(prev => prev.map(m =>
                        m.id === assistantMsgId ? { ...m, content: fullContent } : m
                    ))
                }
            )
        } catch (err) {
            toast.error("Horus connection interrupted.")
            setMessages(prev => prev.filter(m => m.id !== assistantMsgId))
        } finally {
            setIsLoading(false)
        }
    }

    const newChat = () => {
        setCurrentChatId(null)
        setMessages([])
    }

    const loadChat = async (chatId: string) => {
        setIsLoading(true)
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
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <HorusContext.Provider value={{ messages, currentChatId, isLoading, sendMessage, newChat, loadChat }}>
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
