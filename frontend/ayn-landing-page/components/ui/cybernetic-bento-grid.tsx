"use client"

import React, { useEffect, useRef } from "react"
import { useState } from "react"
import { ArrowRight, Brain, SendHorizontal } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type BentoItemProps = {
  className?: string
  children: React.ReactNode
}

function BentoItem({ className = "", children }: BentoItemProps) {
  const itemRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const item = itemRef.current
    if (!item) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = item.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      item.style.setProperty("--mouse-x", `${x}px`)
      item.style.setProperty("--mouse-y", `${y}px`)
    }

    item.addEventListener("mousemove", handleMouseMove)
    return () => item.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div ref={itemRef} className={`bento-item ${className}`}>
      {children}
    </div>
  )
}

type MiniMessage = {
  id: string
  role: "user" | "assistant"
  text: string
}

function HorusMiniChat() {
  const [messages, setMessages] = useState<MiniMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi, I am Horus Support. Tell me what you want to do and I will guide you step by step.",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const user: MiniMessage = { id: crypto.randomUUID(), role: "user", text }
    const assistantId = crypto.randomUUID()
    const newMessages = [...messages, user]
    setMessages([...newMessages, { id: assistantId, role: "assistant", text: "" }])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api-local/horus/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.text })),
        }),
      })
      if (!response.ok || !response.body) {
        throw new Error("Failed to connect with Horus.")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let done = false

      while (!done) {
        const chunk = await reader.read()
        done = chunk.done
        if (!chunk.value) continue
        const textChunk = decoder.decode(chunk.value, { stream: true })
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + textChunk } : m))
        )
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, text: "Failed to connect. Check GEMINI_API_KEY and try again." }
            : m
        )
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 flex h-56 flex-col rounded-lg border border-border/70 bg-card/80">
      <div className="flex items-center justify-between border-b border-border/70 px-2.5 py-1.5">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Brain className="h-3 w-3" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Horus AI</span>
        </div>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Live</span>
      </div>
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-2.5">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-1.5`}>
            {m.role === "assistant" && (
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                <Brain className="h-3 w-3" />
              </div>
            )}
            <div
              className={`max-w-[82%] break-words whitespace-pre-line px-2.5 py-2 text-xs leading-5 ${
                m.role === "user"
                  ? "rounded-xl rounded-tr-sm border border-blue-300/30 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_6px_18px_rgba(37,99,235,0.35)]"
                  : "rounded-xl rounded-tl-sm border border-border/70 bg-background/70 text-foreground"
              }`}
            >
              {m.text || (loading && m.role === "assistant" ? "Thinking..." : "")}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border/70 p-2">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                void send()
              }
            }}
            placeholder="Ask Horus..."
            className="h-8 flex-1 rounded-md border border-border bg-background px-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendHorizontal className="h-3 w-3" />
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export function CyberneticBentoGrid() {
  return (
    <section id="features" className="main-container scroll-mt-24">
      <div className="w-full max-w-6xl z-10">
        <h1 className="mb-8 text-center text-4xl font-bold text-foreground sm:text-5xl">Core Features</h1>
        <div className="bento-grid">
          <BentoItem className="col-span-2 row-span-2 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Horus AI Agent</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask real questions and get live responses from Horus inside the Bento card.
              </p>
            </div>
            <HorusMiniChat />
          </BentoItem>

          <BentoItem>
            <h2 className="text-xl font-bold text-foreground">Evidence Vault</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload files once and auto-map every document to the right criterion.
            </p>
            <div className="mt-3 inline-flex rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Mapping Active
            </div>
          </BentoItem>

          <BentoItem>
            <h2 className="text-xl font-bold text-foreground">Standards Hub</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Navigate ISO, NCAAA, and custom frameworks in one unified view.
            </p>
            <div className="mt-3 flex gap-1.5 text-[10px]">
              <span className="rounded border border-border bg-background/70 px-1.5 py-0.5 text-muted-foreground">ISO</span>
              <span className="rounded border border-border bg-background/70 px-1.5 py-0.5 text-muted-foreground">NCAAA</span>
              <span className="rounded border border-border bg-background/70 px-1.5 py-0.5 text-muted-foreground">MOE</span>
            </div>
          </BentoItem>

          <BentoItem className="row-span-2">
            <h2 className="text-xl font-bold text-foreground">Gap Analysis</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Detect compliance gaps, risk priority, and remediation status in real time.
            </p>
            <div className="mt-4 space-y-2 text-[11px] text-muted-foreground">
              <div className="rounded border border-border bg-background/70 px-2.5 py-2">
                Prioritized remediation roadmap generated.
              </div>
              <div className="rounded border border-border bg-background/70 px-2.5 py-2">
                Progress tracking synced with workflow actions.
              </div>
            </div>
          </BentoItem>

          <BentoItem className="col-span-2">
            <h2 className="text-xl font-bold text-foreground">Workflow Engine</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Turn recommendations into approved actions with traceable execution steps.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <div className="rounded border border-border bg-background/70 px-2 py-1 text-muted-foreground">Assigned</div>
              <div className="rounded border border-border bg-background/70 px-2 py-1 text-muted-foreground">In Review</div>
              <div className="rounded border border-border bg-background/70 px-2 py-1 text-muted-foreground">Done</div>
            </div>
          </BentoItem>

          <BentoItem>
            <h2 className="text-xl font-bold text-foreground">Analytics</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Track readiness, evidence coverage, and action velocity from one panel.
            </p>
          </BentoItem>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/platform/horus-ai">
            <Button className="w-full gap-2">
              Open Horus AI
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/platform/dashboard">
            <Button variant="outline" className="w-full">
              View Platform
            </Button>
          </Link>
        </div>
      </div>

      <style jsx global>{`
        .main-container {
          width: 100%;
          padding: 2rem 1rem;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.08), transparent 35%),
            radial-gradient(circle at 85% 80%, rgba(14, 165, 233, 0.07), transparent 42%);
        }

        .bento-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .bento-item {
          position: relative;
          overflow: hidden;
          border-radius: 1rem;
          padding: 1.25rem;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.58));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
          --mouse-x: 50%;
          --mouse-y: 50%;
        }

        .bento-item::before {
          content: "";
          position: absolute;
          left: var(--mouse-x);
          top: var(--mouse-y);
          width: 220px;
          height: 220px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(96, 165, 250, 0.22), rgba(96, 165, 250, 0) 70%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 220ms ease;
        }

        .bento-item:hover {
          transform: translateY(-2px);
          border-color: rgba(96, 165, 250, 0.28);
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
        }

        .bento-item:hover::before {
          opacity: 1;
        }

        .dark .main-container {
          background:
            radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.16), transparent 35%),
            radial-gradient(circle at 85% 80%, rgba(14, 165, 233, 0.14), transparent 42%);
        }

        .dark .bento-item {
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.025));
        }

        .dark .bento-item:hover {
          border-color: rgba(96, 165, 250, 0.38);
          box-shadow: 0 12px 38px rgba(2, 8, 23, 0.5);
        }

        @media (max-width: 1024px) {
          .bento-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .bento-grid {
            grid-template-columns: 1fr;
          }

          .bento-grid > .col-span-2,
          .bento-grid > .row-span-2 {
            grid-column: auto;
            grid-row: auto;
          }
        }
      `}</style>
    </section>
  )
}
