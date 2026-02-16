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
        "missing-evidence": "For ISO 21001, you'll typically need: Educational Policy Documents, Curriculum Frameworks, Staff Qualification Records, Student Assessment Procedures, and Quality Management Records. Upload these to your Evidence Library and I'll map them automatically.",
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
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center",
          "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/30",
          "hover:scale-110 active:scale-95 transition-all border border-[var(--border-light)]"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Brain className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
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
            <div className="glass rounded-3xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Horus AI</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Neural Link Active</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="h-[320px] overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "flex-row-reverse" : ""
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      msg.role === "assistant"
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600"
                        : "bg-zinc-700"
                    )}>
                      {msg.role === "assistant" ? (
                        <Brain className="w-4 h-4 text-white" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed",
                      msg.role === "assistant"
                        ? "bg-white/40 backdrop-blur-md border border-white/20 text-foreground rounded-tl-sm shadow-sm dark:bg-white/10 dark:border-white/10 dark:text-zinc-200"
                        : "bg-blue-600/80 backdrop-blur-md text-white border border-blue-500/30 rounded-tr-sm shadow-sm"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-[var(--surface)] rounded-2xl rounded-tl-sm p-4 flex items-center gap-1">
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                {/* Starter Suggestions (only show initially) */}
                {messages.length === 1 && !isTyping && (
                  <div className="pt-4 space-y-2">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-3">Starter Suggestions</p>
                    <div className="grid grid-cols-1 gap-2">
                      {starterSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSend(suggestion.prompt)}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-[var(--border-subtle)] hover:border-blue-500/30 transition-all text-left group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <suggestion.icon className="w-4 h-4 text-blue-400" />
                          </div>
                          <span className="text-xs text-zinc-300 group-hover:text-white flex-1">{suggestion.label}</span>
                          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[var(--border-subtle)] bg-white/[0.02]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                    placeholder="Ask Horus anything..."
                    className="flex-1 h-10 px-4 rounded-xl bg-white/5 border border-[var(--border-light)] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <Button
                    size="icon"
                    onClick={() => handleSend(input)}
                    disabled={!input.trim() || isTyping}
                    className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleSend(reply)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-[var(--border-subtle)] text-[10px] text-zinc-400 hover:text-white transition-all"
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
    active: {
      color: "bg-emerald-400",
      text: "Active",
      subtext: "Neural Link Established",
      pulse: true,
    },
    syncing: {
      color: "bg-blue-400",
      text: "Syncing",
      subtext: "Processing Updates",
      pulse: true,
    },
    idle: {
      color: "bg-zinc-500",
      text: "Idle",
      subtext: "Waiting for Input",
      pulse: false,
    },
  }

  const current = statusConfig[status]
  const textColorClass = current.color.replace("bg-", "text-")

  return (
    <div className="glass-panel rounded-2xl p-4 border-[var(--border-subtle)]">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <span className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-deep)]",
            current.color,
            current.pulse && "animate-pulse"
          )} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Horus Neural Link</span>
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", textColorClass)}>
              {current.text}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500">{current.subtext}</p>
        </div>
        <Zap className="w-4 h-4 text-amber-400" />
      </div>
    </div>
  )
}

