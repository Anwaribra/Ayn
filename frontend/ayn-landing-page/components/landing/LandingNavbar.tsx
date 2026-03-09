"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, LogOut, LayoutDashboard, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

/**
 * Navbar — three-column: Logo | Pill | CTA
 *
 * Since the page background is now always off-white, the pill and logo
 * are always dark-on-light. No adaptive colour switching needed.
 *
 * Behaviour:
 * Behaviour:
 *  • At the very top → transparent
 *  • After scrolls down → full width backdrop-blur-md glassmorphism border
 *  • No floating pill layout anymore.
 */
export function LandingNavbar() {
  const { user, logout } = useAuth()
  const [scrolled, setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isOverDark, setIsOverDark] = useState(false)
  
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 20)

      // Check if navbar intersects with a dark section
      let overDark = false
      const headerCenterY = 32 // Approximately half height + 16px padding
      const darkSections = document.querySelectorAll('[data-section-theme="dark"]')
      
      darkSections.forEach(section => {
        const rect = section.getBoundingClientRect()
        // If the checking point (headerCenterY) falls between the top and bottom of the element
        if (rect.top <= headerCenterY && rect.bottom >= headerCenterY) {
          overDark = true
        }
      })
      
      setIsOverDark(overDark)
    }
    
    // Initial check
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* focus trap for mobile menu */
  useEffect(() => {
    if (!mobileOpen) return
    const dialog    = dialogRef.current
    if (!dialog) return
    const menuBtn   = menuButtonRef.current
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"))
    if (focusable[0]) requestAnimationFrame(() => focusable[0].focus())
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      const idx = focusable.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey && idx === 0)                { e.preventDefault(); focusable[focusable.length - 1].focus() }
      else if (!e.shiftKey && idx === focusable.length - 1) { e.preventDefault(); focusable[0].focus() }
    }
    dialog.addEventListener("keydown", trap)
    return () => { dialog.removeEventListener("keydown", trap); menuBtn?.focus() }
  }, [mobileOpen])

  const closeMobile  = () => setMobileOpen(false)
  const handleLogout = async () => { await logout(); window.location.href = "/" }

  /* nav items */
  const navItems = [
    { label: "Platform", href: "/#main-content"       },
    { label: "Horus",    href: "/#horus-intelligence" },
    { label: "Features", href: "/#how-it-works"       },
    { label: "About",    href: "/#about"              },
    { label: "FAQ",      href: "/faq"                 },
  ]

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="sticky top-0 left-0 right-0 z-50 px-5 pt-4 pb-4 transition-all duration-300 bg-transparent"
    >
      {/* Three-column: Logo │ Links │ CTA */}
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">

        {/* ── LEFT: Logo ── */}
        <Link href="/" aria-label="Ayn home" className="shrink-0 group z-50">
          <motion.span
            whileHover={{ scale: 1.04 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="text-[1.6rem] font-bold tracking-tight select-none transition-colors duration-300 pointer-events-auto mix-blend-difference text-white"
          >
            Ayn
          </motion.span>
        </Link>

        {/* ── CENTRE: Nav Links ── */}
        <nav
          className="hidden md:flex items-center gap-1 rounded-full transition-all duration-300 bg-white/60 dark:bg-black/60 backdrop-blur-md border border-black/5 dark:border-white/10 px-6 py-2 shadow-sm"
        >
          {navItems.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 text-foreground/75 dark:text-gray-200 hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
            >
              {label}
            </Link>
          ))}

          {/* separator */}
          <div className="w-px h-4 mx-2 shrink-0 bg-black/12 dark:bg-white/20 transition-colors" />

          {/* Log in ─ inside pill */}
          {!user && (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 text-foreground/75 dark:text-gray-200 hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
            >
              Log in
            </Link>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 px-2 rounded-full gap-1.5 hover:bg-black/5 dark:hover:bg-white/10">
                  <span className="h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors bg-primary/15 text-primary dark:bg-white/15 dark:text-white">
                    {getInitials(user.name)}
                  </span>
                  <ChevronDown className="h-3 w-3 text-foreground/50 dark:text-white/60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52" sideOffset={10}>
                <DropdownMenuLabel className="font-normal">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/platform/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" /> Go to Platform
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* ── RIGHT: CTA button ── */}
        <div className="flex items-center gap-3 shrink-0 z-50">
          {/* Mobile hamburger */}
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            className={cn(
              "md:hidden h-9 w-9 rounded-full transition-colors pointer-events-auto",
              scrolled ? "text-black hover:bg-black/5" : (isOverDark ? "text-white hover:bg-white/20" : "text-black hover:bg-black/5")
            )}
            onClick={() => setMobileOpen(p => !p)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          {/* Desktop CTA */}
          {user ? (
            <Link
              href="/platform/dashboard"
              className={cn(
                "hidden md:inline-flex items-center text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:scale-[1.02] pointer-events-auto shadow-sm",
                scrolled ? "bg-[#111] text-white" : (isOverDark ? "bg-white text-black" : "bg-[#111] text-white")
              )}
            >
              Platform
            </Link>
          ) : (
             <Link
              href="/signup"
              className={cn(
                "hidden md:inline-flex items-center text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:scale-[1.02] pointer-events-auto shadow-sm",
                scrolled ? "bg-[#111] text-white" : (isOverDark ? "bg-white text-black" : "bg-[#111] text-white")
              )}
            >
              Get Started
            </Link>
          )}
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 top-16 z-40 bg-black/20 backdrop-blur-sm md:hidden"
              onClick={closeMobile}
            />
            <motion.div
              key="panel"
              ref={dialogRef}
              role="dialog" aria-modal="true" aria-label="Mobile menu"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="fixed left-4 right-4 top-[68px] z-50 md:hidden rounded-2xl border border-black/8 bg-white/98 backdrop-blur-2xl shadow-2xl p-3"
            >
              <div className="flex flex-col gap-0.5">
                {navItems.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={closeMobile}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-foreground/75 hover:text-foreground hover:bg-black/5 transition-all"
                  >
                    {label}
                  </Link>
                ))}
                <div className="my-2 border-t border-black/8" />
                {user ? (
                  <>
                    <div className="px-4 py-1.5 text-xs text-muted-foreground">{user.name}</div>
                    <Link href="/platform/dashboard" onClick={closeMobile}
                      className="px-4 py-3 rounded-xl text-sm font-semibold text-center"
                      style={{ background: "#111", color: "#fff" }}>
                      Go to Platform
                    </Link>
                    <button onClick={async () => { closeMobile(); await handleLogout() }}
                      className="px-4 py-3 rounded-xl text-sm text-left text-muted-foreground hover:text-destructive hover:bg-destructive/8">
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={closeMobile}
                      className="px-4 py-3 rounded-xl text-sm text-foreground/70 hover:text-foreground hover:bg-black/5">
                      Log in
                    </Link>
                    <Link href="/signup" onClick={closeMobile}
                      className="px-4 py-3 rounded-xl text-sm font-semibold text-center mt-1"
                      style={{ background: "#111", color: "#fff" }}>
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
