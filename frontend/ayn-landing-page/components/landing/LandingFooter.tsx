"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Github, Twitter, Linkedin, Mail } from "lucide-react"

const links = {
  Product: [
    { label: "Horus AI",      href: "/#horus-intelligence" },
    { label: "Features",      href: "/#how-it-works"       },
    { label: "Get Started",   href: "/signup"             },
  ],
  Standards: [
    { label: "ISO 21001",         href: "/faq#standards" },
    { label: "NCAAA",             href: "/faq#standards" },
    { label: "MOE Frameworks",    href: "/faq#standards" },
    { label: "Custom Frameworks", href: "/faq#standards" },
  ],
  Company: [
    { label: "About",   href: "/#about"                 },
    { label: "FAQ",     href: "/faq"                    },
    { label: "Contact", href: "mailto:hello@ayn-edu.com" },
    { label: "Log in",  href: "/login"                  },
    { label: "Sign up", href: "/signup"                 },
  ],
}

const social = [
  { icon: Twitter,  href: "https://x.com",              label: "Twitter"  },
  { icon: Linkedin, href: "https://linkedin.com",       label: "LinkedIn" },
  { icon: Github,   href: "https://github.com",         label: "GitHub"   },
  { icon: Mail,     href: "mailto:hello@ayn-edu.com",   label: "Email"    },
]

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden rounded-3xl bg-transparent">
      {/* Subtle primary radial glow (top-left) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 0% 0%, rgba(37,99,235,0.12), transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-8 pt-16 pb-8">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-3xl font-bold tracking-tight text-white">Ayn</span>
            </Link>
            <p className="glass-text-secondary text-sm leading-relaxed max-w-xs mb-6">
              AI-powered quality assurance and compliance platform for educational institutions.
              Map evidence. Identify gaps. Execute actions.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {social.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label} href={href} aria-label={label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="glass-button flex h-8 w-8 items-center justify-center rounded-lg text-white/58 transition-colors hover:text-white"
                >
                  <Icon className="w-3.5 h-3.5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="glass-text-secondary text-xs font-semibold uppercase tracking-widest mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    {href === "#" ? (
                      <span className="glass-text-secondary flex items-center gap-2 text-sm cursor-not-allowed group" title="Coming Soon">
                        {label}
                        <span className="glass-pill text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded opacity-50 group-hover:opacity-100 transition-opacity">Soon</span>
                      </span>
                    ) : (
                      <Link
                        href={href}
                        className="glass-text-secondary text-sm transition-colors duration-200 hover:text-white/86"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>


        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/8">
          <p className="glass-text-secondary text-xs">
            © {new Date().getFullYear()} Ayn Platform. All rights reserved.
          </p>
          <div className="glass-text-secondary flex items-center gap-4 text-xs">
            <Link href="/privacy" className="transition-colors hover:text-white/86">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-white/86">Terms of Service</Link>
            <Link href="/security" className="transition-colors hover:text-white/86">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
