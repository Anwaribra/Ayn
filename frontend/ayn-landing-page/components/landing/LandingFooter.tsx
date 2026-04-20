"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Github, Twitter, Linkedin, Mail, ArrowRight } from "lucide-react"
import { toast } from "sonner"

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
    <footer className="relative bg-[#050810] overflow-hidden">
      
      {/* Subtle Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 pt-24 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-16 mb-20">
          
          {/* Brand & Newsletter Column */}
          <div className="lg:col-span-3">
            <Link href="/" className="inline-block mb-6 group">
              <span className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-primary/80 transition-all duration-300">
                Ayn.
              </span>
            </Link>
            
            <p className="text-white/50 text-[15px] leading-relaxed max-w-md mb-8 font-light">
              AI-powered quality assurance and compliance platform for educational institutions. 
              Map evidence, identify gaps, and execute actions with minimal effort.
            </p>

            {/* Newsletter Input */}
            <div className="max-w-sm mb-10">
              <h4 className="text-white/90 text-sm font-medium mb-3">Stay in the loop</h4>
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  const form = e.target as HTMLFormElement
                  const email = (form.elements.namedItem("email") as HTMLInputElement).value
                  if (email) {
                    toast.success("Subscribed successfully!", {
                      description: "You've been added to our mailing list.",
                    })
                    form.reset()
                  }
                }}
                className="flex items-center p-1 rounded-[1.25rem] bg-white/[0.03] border border-white/10 focus-within:border-primary/50 focus-within:bg-white/[0.05] transition-all duration-300"
              >
                <input 
                  type="email" 
                  name="email"
                  required
                  placeholder="Enter your email address" 
                  className="bg-transparent border-none outline-none text-sm text-white px-4 py-2 w-full placeholder:text-white/30"
                />
                <button type="submit" className="bg-white text-black hover:bg-white/90 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  Subscribe
                </button>
              </form>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2">
              {social.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label} href={href} aria-label={label}
                  whileHover={{ y: -3, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/40 transition-all duration-300 hover:text-white hover:bg-white/10 hover:border-white/20"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {Object.entries(links).map(([category, items]) => (
              <div key={category} className="flex flex-col">
                <h4 className="text-white/90 text-[13px] font-semibold mb-6 tracking-wide">
                  {category}
                </h4>
                <ul className="space-y-4 flex-1">
                  {items.map(({ label, href }) => (
                    <li key={label}>
                      {href === "#" ? (
                        <span className="text-white/40 flex items-center gap-2 text-sm cursor-not-allowed group">
                          {label}
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 opacity-50 transition-opacity">Soon</span>
                        </span>
                      ) : (
                        <Link
                          href={href}
                          className="text-white/50 text-sm transition-colors duration-300 hover:text-white font-light flex items-center group"
                        >
                          <span className="relative">
                            {label}
                            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white/30 transition-all duration-300 group-hover:w-full" />
                          </span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
          <p className="text-white/40 text-[13px] font-light">
            © {new Date().getFullYear()} Ayn Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[13px] font-light text-white/40">
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
            <Link href="/security" className="transition-colors hover:text-white">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
