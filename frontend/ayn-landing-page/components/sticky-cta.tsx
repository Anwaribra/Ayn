"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight
      setIsVisible(window.scrollY > heroHeight && !isDismissed)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isDismissed])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500",
        !isVisible && "animate-out fade-out slide-out-to-bottom-4",
      )}
    >
      <div className="relative flex items-center gap-3 p-4 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 shadow-2xl">
        <Button asChild className="bg-zinc-100 text-black hover:bg-white transition-all duration-300 group">
          <Link href="/signup">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
        <button
          onClick={() => setIsDismissed(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors duration-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
