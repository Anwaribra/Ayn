"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, LogOut, LayoutDashboard, ChevronDown, ArrowRight } from "lucide-react"
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

export function LandingNavbar() {
  const pathname = usePathname()
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

  const faqNavHref = pathname === "/" ? "/#landing-faq" : "/faq/"

  /* nav items */
  const navItems = [
    { label: "Platform", href: "/#main-content"       },
    { label: "Horus",    href: "/#horus-intelligence" },
    { label: "Features", href: "/#how-it-works"       },
    { label: "Pricing",  href: "/#pricing"            },
    { label: "About",    href: "/#about"              },
    { label: "FAQ",      href: faqNavHref             },
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
            className={cn(
              "text-[1.6rem] font-bold tracking-tight select-none pointer-events-auto bg-clip-text text-transparent bg-gradient-to-r",
              isOverDark 
                ? "from-white via-white/90 to-primary/100" 
                : "from-black via-black/90 to-primary/100 drop-shadow-sm" 
            )}
          >
            Ayn
          </motion.span>
        </Link>

        {/* ── CENTRE: Nav Links ── */}
        <nav
          className={cn(
            "hidden md:flex items-center gap-1 rounded-full transition-all duration-300 backdrop-blur-md px-6 py-2 shadow-sm border",
            isOverDark
              ? "border-white/10 bg-[rgba(10,12,18,0.58)] shadow-[0_18px_45px_-24px_rgba(0,0,0,0.65)]"
              : "glass-surface-strong border-black/10"
          )}
        >
          {navItems.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150",
                isOverDark 
                  ? "text-white/72 hover:text-white hover:bg-white/8" 
                  : "text-black/75 hover:text-black hover:bg-black/5"
              )}
            >
              {label}
            </Link>
          ))}

          {/* separator */}
          <div className={cn("w-px h-4 mx-2 shrink-0 transition-colors duration-300", isOverDark ? "bg-white/20" : "bg-black/12")} />

          {/* Log in ─ inside pill */}
          {!user && (
            <Link
              href="/login"
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150",
                isOverDark 
                  ? "text-white/72 hover:text-white hover:bg-white/8" 
                  : "text-black/75 hover:text-black hover:bg-black/5"
              )}
            >
              Log in
            </Link>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("h-8 px-2 rounded-full gap-1.5 transition-colors duration-300", isOverDark ? "hover:bg-white/8" : "hover:bg-black/5")}>
                  <span className={cn("h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors duration-300", isOverDark ? "bg-white/10 text-white" : "bg-primary/15 text-primary")}>
                    {getInitials(user.name)}
                  </span>
                  <ChevronDown className={cn("h-3 w-3 transition-colors duration-300", isOverDark ? "text-white/60" : "text-black/50")} />
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
                "md:hidden h-9 w-9 rounded-full transition-colors duration-300 pointer-events-auto",
                isOverDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"
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
                "hidden md:inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] pointer-events-auto shadow-sm",
                isOverDark ? "bg-white text-black hover:bg-white/90" : "border border-black/90 bg-black text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.45)] hover:bg-black/92"
              )}
            >
              Platform
            </Link>
          ) : (
            <Link
              href="/signup"
              className={cn(
                "group hidden md:inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_14px_32px_-18px_hsl(var(--primary)/0.45)] transition-all duration-300 hover:scale-[1.02] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 pointer-events-auto",
                isOverDark && "shadow-[0_14px_36px_-16px_hsl(var(--primary)/0.55)]"
              )}
            >
              Get Started
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
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
              className={cn(
                "fixed left-4 right-4 top-[68px] z-50 rounded-2xl p-3 shadow-2xl md:hidden",
                isOverDark
                  ? "border border-white/10 bg-[rgba(10,12,18,0.82)] text-white backdrop-blur-xl"
                  : "glass-surface-strong border-black/8"
              )}
            >
              <div className="flex flex-col gap-0.5">
                {navItems.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={closeMobile}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isOverDark
                        ? "text-white/75 hover:bg-white/8 hover:text-white"
                        : "text-foreground/75 hover:text-foreground hover:bg-black/5"
                    )}
                  >
                    {label}
                  </Link>
                ))}
                <div className={cn("my-2 border-t", isOverDark ? "border-white/10" : "border-black/8")} />
                {user ? (
                  <>
                    <div className={cn("px-4 py-1.5 text-xs", isOverDark ? "text-white/45" : "text-muted-foreground")}>{user.name}</div>
                    <Link href="/platform/dashboard" onClick={closeMobile}
                      className="rounded-xl border border-black/90 bg-black px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.45)] hover:bg-black/92">
                      Go to Platform
                    </Link>
                    <button onClick={async () => { closeMobile(); await handleLogout() }}
                      className={cn(
                        "px-4 py-3 rounded-xl text-left text-sm",
                        isOverDark
                          ? "text-white/60 hover:bg-white/8 hover:text-red-300"
                          : "text-muted-foreground hover:text-destructive hover:bg-destructive/8"
                      )}>
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={closeMobile}
                      className={cn(
                        "px-4 py-3 rounded-xl text-sm",
                        isOverDark
                          ? "text-white/70 hover:bg-white/8 hover:text-white"
                          : "text-foreground/70 hover:text-foreground hover:bg-black/5"
                      )}>
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={closeMobile}
                      className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-[0_14px_32px_-18px_hsl(var(--primary)/0.4)] hover:bg-primary/90"
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
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
