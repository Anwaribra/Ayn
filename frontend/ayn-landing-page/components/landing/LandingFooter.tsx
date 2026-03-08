"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Github, Twitter, Linkedin, Mail } from "lucide-react"

const DARK_BG = "#050810"

const links = {
  Product: [
    { label: "Horus AI",      href: "/#horus-intelligence" },
    { label: "Features",      href: "/#how-it-works"       },
    { label: "Get Started",   href: "/signup"             },
  ],
  Standards: [
    { label: "ISO 21001",         href: "#" },
    { label: "NCAAA",             href: "#" },
    { label: "MOE Frameworks",    href: "#" },
    { label: "Custom Frameworks", href: "#" },
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
  { icon: Twitter,  href: "#",                         label: "Twitter"  },
  { icon: Linkedin, href: "#",                         label: "LinkedIn" },
  { icon: Github,   href: "#",                         label: "GitHub"   },
  { icon: Mail,     href: "mailto:hello@ayn-edu.com",  label: "Email"    },
]

export function LandingFooter() {
  return (
    /* ── Dark rounded card — mirrors the hero and core-features cards ── */
    <footer
      className="relative overflow-hidden rounded-[1.75rem]"
      style={{
        backgroundColor: DARK_BG,
        boxShadow: "0 10px 60px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
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
            <p className="text-sm text-white/45 leading-relaxed max-w-xs mb-6">
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
                  className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/35 hover:text-white hover:border-white/25 hover:bg-white/8 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-white/45 hover:text-white transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>


        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/8">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} Ayn Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/25">
            <Link href="#" className="hover:text-white/50 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white/50 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white/50 transition-colors">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
