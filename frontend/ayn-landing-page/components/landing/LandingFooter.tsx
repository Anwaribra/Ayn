"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Loader2 } from "lucide-react"
import { toast } from "sonner"

const CONTACT_EMAIL = "anwarmousa100@gmail.com"

const links = {
  Product: [
    { label: "Horus AI", href: "/#horus-intelligence" },
    { label: "Features", href: "/#features" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Compare", href: "/#comparison" },
    { label: "Get Started", href: "/signup" },
  ],
  Standards: [
    { label: "ISO 21001", href: "/faq#standards" },
    { label: "NCAAA", href: "/faq#standards" },
    { label: "MOE Frameworks", href: "/faq#standards" },
    { label: "Custom Frameworks", href: "/faq#standards" },
  ],
  Company: [
    { label: "About", href: "/#about" },
    { label: "Security", href: "/#security" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: `mailto:${CONTACT_EMAIL}` },
    { label: "Log in", href: "/login" },
    { label: "Sign up", href: "/signup" },
  ],
}

export function LandingFooter({
  onOpenDemo,
}: {
  onOpenDemo?: (type: "demo" | "pricing") => void
}) {
  const [newsletterLoading, setNewsletterLoading] = useState(false)

  const handleNewsletter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim()
    if (!email) return

    setNewsletterLoading(true)
    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Newsletter",
          email,
          institution: "Mailing list",
          role: "Subscriber",
          type: "demo",
        }),
      })
      if (!res.ok) throw new Error("Request failed")
      toast.success("You're on the list", {
        description: "We'll share product updates at that address.",
      })
      form.reset()
    } catch {
      toast.error("Couldn't subscribe right now", {
        description: `Email us at ${CONTACT_EMAIL} and we'll add you manually.`,
      })
    } finally {
      setNewsletterLoading(false)
    }
  }

  return (
    <footer className="relative overflow-hidden bg-transparent">
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-32 md:pb-12 pt-24 md:px-8">
        <div className="mb-20 grid grid-cols-1 gap-16 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-3">
            <Link href="/" className="group mb-6 inline-block transition-opacity hover:opacity-90">
              <span className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-primary/80">
                Ayn.
              </span>
            </Link>

            <p className="mb-8 max-w-md text-[15px] font-light leading-relaxed text-white/50">
              AI-powered quality assurance and compliance platform for educational institutions.
              Map evidence, identify gaps, and execute actions with minimal effort.
            </p>

            <div className="mb-10 max-w-sm">
              <h4 className="mb-1 text-sm font-medium text-white/90">Stay in the loop</h4>
              <p className="mb-3 text-xs font-light text-white/40">Product updates and pilot announcements.</p>
              <form
                onSubmit={handleNewsletter}
                className="flex items-center rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-1 transition-all duration-300 focus-within:border-primary/50 focus-within:bg-white/[0.05]"
              >
                <input
                  type="email"
                  name="email"
                  required
                  disabled={newsletterLoading}
                  placeholder="you@institution.edu"
                  className="w-full border-none bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-white/30 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={newsletterLoading}
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-colors hover:bg-white/90 disabled:opacity-70"
                >
                  {newsletterLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
                </button>
              </form>
              <button
                type="button"
                onClick={() => onOpenDemo?.("demo")}
                className="mt-3 text-xs font-medium text-white/50 transition-colors hover:text-white"
              >
                Prefer a walkthrough? Book a demo →
              </button>
            </div>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              aria-label="Email Ayn"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-white/40 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-3">
            {Object.entries(links).map(([category, items]) => (
              <div key={category} className="flex flex-col">
                <h4 className="mb-6 text-[13px] font-semibold tracking-wide text-white/90">{category}</h4>
                <ul className="flex-1 space-y-4">
                  {items.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="group flex items-center text-sm font-light text-white/50 transition-colors duration-300 hover:text-white"
                      >
                        <span className="relative">
                          {label}
                          <span className="absolute -bottom-1 left-0 h-px w-0 bg-white/30 transition-all duration-300 group-hover:w-full" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-[13px] font-light text-white/40">
            © {new Date().getFullYear()} Ayn Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[13px] font-light text-white/40">
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
            <Link href="/security" className="transition-colors hover:text-white">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
