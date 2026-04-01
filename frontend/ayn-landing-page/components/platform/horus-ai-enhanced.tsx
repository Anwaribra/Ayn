"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Brain,
  Send,
  Sparkles,
  MessageSquare,
  X,
  HelpCircle,
  FileText,
  Target,
  Lightbulb,
  Cpu,
  Zap,
  ChevronRight,
} from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const starterSuggestions = [
  {
    id: "start-audit",
    icon: Target,
    label: "How do I start an audit?",
    prompt: "Walk me through starting my first compliance audit with Horus AI.",
  },
  {
    id: "missing-evidence",
    icon: FileText,
    label: "What evidence is missing for ISO 21001?",
    prompt: "What evidence documents are typically required for ISO 21001 compliance?",
  },
  {
    id: "draft-policy",
    icon: Sparkles,
    label: "Draft a quality policy",
    prompt: "Help me draft a comprehensive quality policy for my educational institution.",
  },
  {
    id: "gap-analysis",
    icon: Lightbulb,
    label: "Explain gap analysis",
    prompt: "What is a gap analysis and how does Horus AI use it?",
  },
]

const quickReplies = [
  "Upload evidence",
  "View standards",
  "Run audit",
  "Get report",
]

export function HorusAIWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Greetings. I am Horus, your AI compliance assistant. How can I help you navigate the quality framework today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSend = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: "user",
      content,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        "start-audit": "To begin an audit, navigate to the Gap Analysis section. I'll analyze your uploaded evidence against mapped standards and identify compliance gaps. Would you like me to guide you through uploading your first documents?",
        "missing-evidence": "For ISO 21001, you'll typically need: Educational Policy Documents, Curriculum Frameworks, Staff Qualification Records, Student Assessment Procedures, and Quality Management Records. Upload these to your Evidence Vault and I'll map them automatically.",
        "draft-policy": "I'll help you create a comprehensive quality policy. To get started, I need to know: 1) Your institution type (university/college/school), 2) Primary accreditation goals, 3) Current compliance framework. Can you share these details?",
        "gap-analysis": "A gap analysis compares your current practices against required standards. I scan your evidence, identify missing components, and create a prioritized remediation roadmap. It's the foundation of your compliance strategy.",
      }

      const suggestionId = starterSuggestions.find(s => s.prompt === content)?.id
      const response = suggestionId && responses[suggestionId]
        ? responses[suggestionId]
        : "I understand. Let me analyze that for you. Based on your current evidence library and mapped standards, I can provide specific guidance. Would you like me to check your current compliance status first?"

      const aiMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          "glass-surface-strong fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl text-primary transition-all hover:scale-110 active:scale-95"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Brain className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[var(--status-success)] animate-pulse" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)]"
          >
            <div className="glass-surface-strong glass-text-primary overflow-hidden rounded-3xl">
              {/* Header */}
              <div className="glass-border flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-3">
                  <div className="horus-ai-icon flex h-10 w-10 items-center justify-center rounded-xl">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Horus AI</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-success)] animate-pulse" />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--status-success)]">Neural Link Active</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="glass-button glass-text-secondary rounded-lg p-2 transition-colors hover:text-[var(--glass-text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="h-[320px] space-y-4 overflow-y-auto p-4 custom-scrollbar">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "flex-row-reverse" : ""
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
                      msg.role === "assistant"
                        ? "glass-panel"
                        : "glass-panel"
                    )}>
                      {msg.role === "assistant" ? (
                        <Brain className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-[75%] rounded-2xl p-3 text-sm leading-relaxed",
                      msg.role === "assistant"
                        ? "glass-bubble glass-text-primary rounded-tl-sm"
                        : "horus-user-bubble rounded-tr-sm"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="glass-panel flex h-8 w-8 items-center justify-center rounded-lg">
                      <Brain className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="glass-bubble flex items-center gap-1 rounded-2xl rounded-tl-sm p-4">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                {/* Starter Suggestions */}
                {messages.length === 1 && !isTyping && (
                  <div className="pt-4 space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-3">Starter Suggestions</p>
                    <div className="grid grid-cols-1 gap-2">
                      {starterSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSend(suggestion.prompt)}
                          className="horus-quick-action flex items-center gap-3 rounded-xl p-3 text-left transition-all group hover:border-primary/30"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <suggestion.icon className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-xs text-muted-foreground group-hover:text-foreground flex-1 transition-colors">{suggestion.label}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="glass-border border-t p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                    placeholder="Ask Horus anything..."
                    className="glass-input glass-text-primary h-10 flex-1 rounded-xl px-4 text-sm placeholder:text-[var(--glass-text-secondary)] focus:outline-none"
                  />
                  <Button
                    size="icon"
                    onClick={() => handleSend(input)}
                    disabled={!input.trim() || isTyping}
                    className="glass-button h-10 w-10 rounded-xl bg-primary/90 text-primary-foreground transition-colors hover:bg-primary disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleSend(reply)}
                      className="glass-button glass-text-secondary rounded-lg px-3 py-1.5 text-[10px] transition-all hover:text-[var(--glass-text-primary)]"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function SystemStatusWidget() {
  const [status, setStatus] = useState<"active" | "syncing" | "idle">("active")

  useEffect(() => {
    // Simulate status changes
    const interval = setInterval(() => {
      const rand = Math.random()
      if (rand > 0.9) setStatus("syncing")
      else if (rand > 0.7) setStatus("idle")
      else setStatus("active")
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const statusConfig = {
    active: { token: "var(--status-success)", text: "Active", subtext: "Neural Link Established", pulse: true },
    syncing: { token: "var(--status-info)", text: "Syncing", subtext: "Processing Updates", pulse: true },
    idle: { token: "var(--muted-foreground)", text: "Idle", subtext: "Waiting for Input", pulse: false },
  }

  const current = statusConfig[status]

  return (
    <div className="glass-panel rounded-2xl p-4 border-[var(--border-subtle)]">
      <div className="flex items-center gap-3">
        <div className="relative">
            <div className="horus-ai-icon flex h-10 w-10 items-center justify-center rounded-xl">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--glass-strong-bg)]",
              current.pulse && "animate-pulse"
            )}
            style={{ backgroundColor: current.token }}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">Horus Neural Link</span>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: current.token }}>
              {current.text}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">{current.subtext}</p>
        </div>
        <Zap className="w-4 h-4 text-[var(--status-warning)]" />
      </div>
    </div>
  )
}
