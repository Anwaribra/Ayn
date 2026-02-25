"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Play, Send, Loader2, Target, ShieldCheck, Scale, Sparkles } from "lucide-react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

export default function MockAuditPage() {
  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-56px)] flex flex-col p-4 max-w-5xl mx-auto w-full">
        <MockAuditChat />
      </div>
    </ProtectedRoute>
  )
}

function MockAuditChat() {
  const { user } = useAuth()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleStartAudit = async () => {
    if (!user?.institutionId) {
      toast.error("Institution not found. Cannot start audit.")
      return
    }

    setIsStarting(true)
    try {
      const res = await api.startMockAudit(user.institutionId)
      setSessionId(res.session_id)
      setMessages([{ role: "assistant", content: res.initial_message }])
      toast.success("Mock Audit Session Started")
    } catch (e: any) {
      toast.error(e.message || "Failed to start mock audit")
    } finally {
      setIsStarting(false)
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || !sessionId || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const res = await api.sendMockAuditMessage(sessionId, userMessage)
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }])
    } catch (e: any) {
      toast.error(e.message || "Failed to send message")
      // Remove the optimistic user message on failure
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  if (!sessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
        <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-8 border border-primary/20">
          <ShieldCheck className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl font-black italic text-[var(--text-primary)] mb-4">
          Virtual <span className="text-[var(--text-tertiary)] not-italic font-light">Auditor</span>
        </h1>
        <p className="max-w-xl text-[var(--text-secondary)] text-lg mb-10 leading-relaxed font-medium">
          Simulate a strict external accreditation audit. Horus will intelligently review your currently uploaded evidence and cross-examine you on compliance gaps.
        </p>

        <button
          onClick={handleStartAudit}
          disabled={isStarting}
          className="group relative flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
          {isStarting ? (
            <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Play className="w-5 h-5 fill-current" />
          )}
          <span className="relative">Begin Session</span>
        </button>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
          <div className="glass-panel p-6 rounded-2xl text-left border-[var(--border-subtle)]">
            <Target className="w-6 h-6 text-[var(--text-tertiary)] mb-4" />
            <h3 className="font-bold text-[var(--text-primary)] mb-2">Targeted Scrutiny</h3>
            <p className="text-xs text-[var(--text-secondary)]">Questions dynamically adapt to your actual uploaded policies and procedures.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl text-left border-[var(--border-subtle)]">
            <Sparkles className="w-6 h-6 text-primary mb-4" />
            <h3 className="font-bold text-[var(--text-primary)] mb-2">Real Scenarios</h3>
            <p className="text-xs text-[var(--text-secondary)]">Simulates the stress and detail required during a physical NAQAAE or ISO visit.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl text-left border-[var(--border-subtle)]">
            <Scale className="w-6 h-6 text-green-500 mb-4" />
            <h3 className="font-bold text-[var(--text-primary)] mb-2">Gap Discovery</h3>
            <p className="text-xs text-[var(--text-secondary)]">Uncovers logical flaws in your arguments before the real auditors arrive.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--surface-modal)] border border-[var(--border-light)] rounded-[2.5rem] overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="h-16 border-b border-[var(--border-subtle)] bg-[var(--surface)]/50 backdrop-blur-md flex items-center px-6 gap-4 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-[var(--text-primary)]">Horus External Auditor</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Simulated Session Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 w-full overflow-y-auto px-6 py-8 custom-scrollbar flex flex-col items-center">
        <div className="flex-1 w-full max-w-[760px] flex flex-col gap-10 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className="w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
              {msg.role === "user" ? (
                <div className="w-full py-4 space-y-2">
                   {/* Using a subtle background pill or text style for user */}
                   <div className="text-[14px] text-muted-foreground whitespace-pre-wrap font-medium">
                     {msg.content}
                   </div>
                </div>
              ) : (
                <div className="w-full py-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-primary/20 text-primary text-[10px] font-bold flex-shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Horus Auditor</span>
                  </div>
                  <div className="text-foreground text-[15px] leading-relaxed w-full prose prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="w-full py-4 animate-in fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-primary/20 text-primary text-[10px] font-bold flex-shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-bold text-foreground">Horus Auditor</span>
              </div>
              <div className="text-muted-foreground text-[15px] leading-relaxed flex items-center gap-3">
                <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span>Auditor is reviewing evidence...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-t from-[var(--layer-0)] via-[var(--layer-0)] to-transparent border-t border-[var(--border-subtle)] flex flex-col items-center w-full z-20">
        <div className="w-full max-w-[760px] mx-auto">
          <form onSubmit={handleSendMessage} className="relative w-full">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Respond to the auditor..."
            className="w-full bg-[var(--surface-modal)] text-[var(--text-primary)] border border-[var(--border-light)] rounded-2xl pl-6 pr-16 py-4 min-h-[60px] max-h-32 resize-none focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-3 bottom-3 aspect-square bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:hover:scale-100 shadow-md"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-[var(--text-secondary)] font-medium">Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  )
}
