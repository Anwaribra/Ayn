"use client"

import { useState } from "react"
import { Send } from "lucide-react"

export default function HorusPage() {
  const [message, setMessage] = useState("")

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-background">
      {/* Glow background */}
      <div className="absolute w-[900px] h-[900px] bg-purple-600/20 blur-[200px] rounded-full -z-10" />

      <div className="w-full max-w-3xl px-6 text-center space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-4xl font-bold">Horus AI</h1>
          <p className="text-muted-foreground mt-2">
            Upload evidence and let Horus analyze your compliance instantly
          </p>
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 bg-muted/40 border rounded-2xl p-3 shadow-lg">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask Horus anything..."
            className="flex-1 bg-transparent outline-none text-sm"
          />

          <button className="p-2 rounded-xl bg-primary text-primary-foreground">
            <Send size={18} />
          </button>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            "Analyze my ISO documents",
            "Upload evidence",
            "Run gap analysis",
            "Check compliance status",
          ].map((item) => (
            <button
              key={item}
              className="px-4 py-2 text-sm rounded-full border hover:bg-muted transition"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
